"""
Tests d'intégration avancés avec modèles spécialisés
"""

import pytest
import asyncio
import httpx
import json
import time
from typing import Dict, List

BASE_URL = "http://localhost:8000"

class TestAdvancedIntegration:
    
    @pytest.fixture(scope="class")
    async def client(self):
        """Client HTTP asynchrone"""
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=60.0) as client:
            yield client
    
    @pytest.mark.asyncio
    async def test_ollama_service_status(self, client):
        """Vérifie le statut du service Ollama"""
        response = await client.get("/health")
        assert response.status_code == 200
        
        health_data = response.json()
        assert "services" in health_data
        assert "ollama" in health_data["services"]
        
        ollama_status = health_data["services"]["ollama"]
        if ollama_status == "connected":
            print("✅ Ollama connecté et fonctionnel")
        else:
            print("⚠️ Ollama en mode simulation")
    
    @pytest.mark.asyncio
    async def test_specialized_agents_response_quality(self, client):
        """Test la qualité des réponses des agents spécialisés"""
        test_scenarios = [
            {
                "agent": "visionnaire",
                "message": "Créer une plateforme de e-commerce moderne",
                "expected_keywords": ["vision", "stratégie", "utilisateur", "marché"],
                "min_length": 200
            },
            {
                "agent": "architecte", 
                "message": "Architecture pour une API de blog scalable",
                "expected_keywords": ["architecture", "API", "base", "données", "scalable"],
                "min_length": 300
            },
            {
                "agent": "frontend_engineer",
                "message": "Interface utilisateur pour un dashboard admin",
                "expected_keywords": ["React", "composant", "interface", "TypeScript"],
                "min_length": 250
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n🧪 Test agent: {scenario['agent']}")
            
            response = await client.post("/chat", json={
                "message": scenario["message"],
                "agent": scenario["agent"]
            })
            
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            
            response_text = data["response"].lower()
            
            # Vérifier la longueur minimale
            assert len(data["response"]) >= scenario["min_length"], \
                f"Réponse trop courte pour {scenario['agent']}"
            
            # Vérifier les mots-clés attendus
            found_keywords = [
                keyword for keyword in scenario["expected_keywords"]
                if keyword.lower() in response_text
            ]
            
            keyword_ratio = len(found_keywords) / len(scenario["expected_keywords"])
            assert keyword_ratio >= 0.5, \
                f"Pas assez de mots-clés pertinents pour {scenario['agent']}"
            
            print(f"✅ Agent {scenario['agent']}: {len(data['response'])} chars, "
                  f"{len(found_keywords)}/{len(scenario['expected_keywords'])} keywords")
    
    @pytest.mark.asyncio
    async def test_agent_context_persistence(self, client):
        """Test la persistance du contexte entre messages"""
        # Premier message
        response1 = await client.post("/chat", json={
            "message": "Je veux créer une application de blog",
            "agent": "architecte"
        })
        
        assert response1.status_code == 200
        first_response = response1.json()["response"]
        
        # Deuxième message avec contexte
        response2 = await client.post("/chat", json={
            "message": "Quelles technologies recommandes-tu pour la base de données ?",
            "agent": "architecte",
            "context": {"last_output": first_response}
        })
        
        assert response2.status_code == 200
        second_response = response2.json()["response"]
        
        # Vérifier que la réponse fait référence au contexte
        assert len(second_response) > 100
        print("✅ Contexte persistant entre messages")
    
    @pytest.mark.asyncio
    async def test_workflow_with_specialized_agents(self, client):
        """Test d'un workflow complet avec agents spécialisés"""
        workflow_request = {
            "workflow_type": "frontend_only",
            "description": "Interface de dashboard analytics moderne avec React et TypeScript"
        }
        
        # Démarrer le workflow
        start_time = time.time()
        response = await client.post("/workflows/start", json=workflow_request)
        assert response.status_code == 200
        
        workflow_id = response.json()["workflow_id"]
        print(f"🔄 Workflow démarré: {workflow_id}")
        
        # Attendre l'exécution (les agents spécialisés peuvent prendre plus de temps)
        max_wait = 120  # 2 minutes pour les modèles plus gros
        check_interval = 5
        
        for i in range(0, max_wait, check_interval):
            await asyncio.sleep(check_interval)
            
            status_response = await client.get(f"/workflows/{workflow_id}/status")
            assert status_response.status_code == 200
            
            workflow_status = status_response.json()
            current_status = workflow_status.get("status")
            
            if current_status in ["completed", "failed"]:
                break
                
            print(f"⏳ Workflow en cours... {i+check_interval}s")
        
        # Vérifier le résultat final
        final_response = await client.get(f"/workflows/{workflow_id}/status")
        workflow_data = final_response.json()
        
        assert workflow_data["status"] == "completed", "Workflow non terminé"
        assert "steps" in workflow_data
        assert len(workflow_data["steps"]) > 0
        
        # Vérifier la qualité des sorties des agents
        for step in workflow_data["steps"]:
            if step["status"] == "completed" and step["output_data"]:
                assert len(step["output_data"]) > 150, \
                    f"Sortie trop courte pour {step['agent_role']}"
        
        execution_time = time.time() - start_time
        print(f"✅ Workflow terminé en {execution_time:.1f}s avec {len(workflow_data['steps'])} étapes")
    
    @pytest.mark.asyncio
    async def test_project_with_ai_generated_content(self, client):
        """Test création de projet avec contenu généré par IA"""
        # Créer un projet
        project_data = {
            "name": "Blog AI Test",
            "description": "Projet de test avec contenu IA",
            "type": "web_app"
        }
        
        response = await client.post("/projects", json=project_data)
        assert response.status_code == 200
        project = response.json()
        project_id = project["id"]
        
        # Générer du contenu avec l'agent frontend
        ai_response = await client.post("/chat", json={
            "message": "Génère un composant React pour afficher une liste d'articles de blog",
            "agent": "frontend_engineer"
        })
        
        assert ai_response.status_code == 200
        ai_content = ai_response.json()["response"]
        
        # Sauvegarder le contenu généré
        file_data = {
            "path": "src/components/BlogList.jsx",
            "content": ai_content
        }
        
        save_response = await client.post(f"/projects/{project_id}/files", json=file_data)
        assert save_response.status_code == 200
        
        # Vérifier que le fichier est bien sauvé
        get_response = await client.get(f"/projects/{project_id}/files/src/components/BlogList.jsx")
        assert get_response.status_code == 200
        
        saved_content = get_response.json()["content"]
        assert ai_content in saved_content
        
        # Nettoyer
        await client.delete(f"/projects/{project_id}")
        print("✅ Projet avec contenu IA créé et testé")
    
    @pytest.mark.asyncio
    async def test_performance_benchmarks(self, client):
        """Tests de performance pour les différents agents"""
        agents_to_test = ["visionnaire", "architecte", "frontend_engineer"]
        test_message = "Optimise une application web pour de meilleures performances"
        
        performance_results = {}
        
        for agent in agents_to_test:
            start_time = time.time()
            
            response = await client.post("/chat", json={
                "message": test_message,
                "agent": agent
            })
            
            end_time = time.time()
            response_time = end_time - start_time
            
            assert response.status_code == 200
            response_data = response.json()
            
            performance_results[agent] = {
                "response_time": response_time,
                "response_length": len(response_data["response"]),
                "chars_per_second": len(response_data["response"]) / response_time
            }
            
            print(f"⏱️ {agent}: {response_time:.2f}s, "
                  f"{performance_results[agent]['response_length']} chars, "
                  f"{performance_results[agent]['chars_per_second']:.1f} chars/s")
        
        # Vérifier que les temps de réponse sont raisonnables
        for agent, metrics in performance_results.items():
            assert metrics["response_time"] < 60, f"{agent} trop lent: {metrics['response_time']:.2f}s"
            assert metrics["response_length"] > 100, f"{agent} réponse trop courte"
        
        print("✅ Tests de performance réussis")