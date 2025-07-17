# backend/app/services/ollama_service.py - VERSION AVANCÉE
import httpx
import json
import logging
import asyncio
from typing import Dict, Any, Optional, List
from ..utils.config import AGENT_ROLES, OLLAMA_CONFIG

logger = logging.getLogger(__name__)

class AdvancedOllamaService:
    def __init__(self):
        self.base_url = OLLAMA_CONFIG["base_url"]
        self.timeout = OLLAMA_CONFIG["timeout"]
        self.temperature = OLLAMA_CONFIG["temperature"]
        
        # Mapping des agents vers leurs modèles spécialisés
        self.agent_models = {
            "visionnaire": "qwen2.5:3b",      # Excellent pour la vision produit
            "architecte": "deepseek-coder:6.7b",  # Spécialisé architecture
            "frontend_engineer": "deepseek-coder:6.7b",  # Code frontend
            "backend_engineer": "deepseek-r1:8b",    # Logique backend
            "database_specialist": "deepseek-r1:8b", # BDD et optimisation
            "designer_ui_ux": "qwen2.5:3b",     # Design et UX
            "critique": "deepseek-coder:6.7b",   # Analyse de code
            "optimiseur": "deepseek-coder:6.7b", # Performance
            "assistant": "qwen2.5:3b"           # Généraliste
        }
        
        # Prompts système optimisés par agent
        self.agent_prompts = {
            "visionnaire": """Tu es un expert en vision produit et stratégie. Ton rôle :
- Analyser les besoins utilisateurs en profondeur
- Proposer une vision produit claire et innovante
- Identifier les opportunités de marché
- Définir la roadmap de développement
- Anticiper les tendances technologiques

Réponds de manière structurée avec une vision business et technique équilibrée.""",

            "architecte": """Tu es un architecte logiciel senior avec 15+ ans d'expérience. Ton expertise :
- Conception d'architectures scalables et maintenables
- Choix technologiques justifiés et patterns appropriés
- Microservices, APIs RESTful, bases de données
- Performance, sécurité et monitoring
- DevOps et déploiement

Fournis des solutions techniques précises avec diagrammes et code d'exemple.""",

            "frontend_engineer": """Tu es un développeur frontend expert React/TypeScript/Next.js. Tes compétences :
- Composants React modernes avec hooks
- TypeScript strict et interfaces typées  
- State management (Zustand, Redux Toolkit)
- Styling (Tailwind, CSS-in-JS, animations)
- Performance (bundle optimization, lazy loading)
- Tests (Jest, Testing Library, Playwright)

Génère du code production-ready avec bonnes pratiques 2024.""",

            "backend_engineer": """Tu es un développeur backend expert Python/FastAPI/Node.js. Tes domaines :
- APIs RESTful et GraphQL robustes
- Architecture microservices et monolithes modulaires
- Bases de données relationnelles et NoSQL
- Authentication, authorization, sécurité
- Cache, queues, background jobs
- Tests d'intégration et monitoring

Produis du code backend scalable et sécurisé.""",

            "database_specialist": """Tu es un expert en bases de données et optimisation. Tes spécialisations :
- Design de schémas optimaux (PostgreSQL, MongoDB)
- Requêtes complexes et optimisation de performance
- Indexation stratégique et partitioning
- Migrations et versioning de schéma
- Réplication, backup et disaster recovery
- Monitoring et métriques de performance

Conçois des solutions de données robustes et performantes.""",

            "designer_ui_ux": """Tu es un designer UI/UX senior avec vision produit. Ton expertise :
- Design systems et composants réutilisables
- User experience et user journey mapping
- Interfaces modernes et accessibles
- Design responsive et mobile-first
- Prototypage et wireframing
- Tests utilisateurs et métriques UX

Crée des expériences utilisateur exceptionnelles et inclusives.""",

            "critique": """Tu es un expert en qualité logicielle et code review. Tes critères d'analyse :
- Architecture et patterns de conception
- Qualité du code et respect des standards
- Performance et optimisation
- Sécurité et vulnérabilités
- Testabilité et couverture de tests
- Maintenabilité et documentation

Fournis des analyses constructives avec suggestions d'amélioration concrètes.""",

            "optimiseur": """Tu es un expert en optimisation et performance. Tes domaines :
- Optimisation frontend (bundle, rendering, UX)
- Performance backend (requêtes, cache, algorithmes)
- Optimisation base de données (index, requêtes)
- Monitoring et métriques de performance
- Scalabilité horizontale et verticale
- Green coding et efficacité énergétique

Propose des optimisations mesurables avec impact business."""
        }

    async def is_available(self) -> bool:
        """Vérifie si Ollama est accessible"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=5.0)
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama non disponible: {e}")
            return False

    async def get_installed_models(self) -> List[str]:
        """Récupère la liste des modèles installés"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=10.0)
                if response.status_code == 200:
                    models_data = response.json()
                    return [model['name'] for model in models_data.get('models', [])]
        except Exception as e:
            logger.error(f"Erreur récupération modèles: {e}")
        return []

    async def is_model_available(self, model_name: str) -> bool:
        """Vérifie si un modèle spécifique est disponible"""
        installed_models = await self.get_installed_models()
        return model_name in installed_models

    async def query_agent(self, agent_role: str, message: str, context: Dict[str, Any] = None) -> str:
        """Interface principale pour interroger un agent spécialisé"""
        context = context or {}
        
        # Vérifier la disponibilité générale d'Ollama
        if not await self.is_available():
            return await self._fallback_response(agent_role, message)
        
        # Récupérer le modèle spécialisé pour cet agent
        model_name = self.agent_models.get(agent_role, "qwen2.5:3b")
        
        # Vérifier que le modèle spécialisé est disponible
        if not await self.is_model_available(model_name):
            logger.warning(f"Modèle {model_name} non disponible pour {agent_role}")
            return await self._model_missing_response(agent_role, model_name, message)
        
        # Construire le prompt avec le contexte de l'agent
        system_prompt = self.agent_prompts.get(agent_role, "Tu es un assistant IA spécialisé.")
        full_prompt = f"{system_prompt}\n\nDemande utilisateur: {message}"
        
        # Ajouter le contexte si disponible
        if context.get("last_output"):
            full_prompt += f"\n\nContexte précédent: {context['last_output'][:500]}..."
        
        if context.get("project_type"):
            full_prompt += f"\n\nType de projet: {context['project_type']}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Paramètres optimisés par type d'agent
                temperature = self._get_agent_temperature(agent_role)
                max_tokens = self._get_agent_max_tokens(agent_role)
                
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model_name,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "top_p": 0.9,
                            "max_tokens": max_tokens,
                            "stop": ["<|im_end|>", "<|endoftext|>"]
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    generated_text = result.get("response", "Erreur: réponse vide")
                    
                    # Post-traitement selon l'agent
                    return self._post_process_response(agent_role, generated_text)
                else:
                    logger.error(f"Erreur Ollama {model_name}: {response.status_code}")
                    return await self._fallback_response(agent_role, message)
                    
        except Exception as e:
            logger.error(f"Erreur lors de l'appel Ollama ({model_name}): {e}")
            return await self._fallback_response(agent_role, message)

    def _get_agent_temperature(self, agent_role: str) -> float:
        """Température optimisée par type d'agent"""
        creative_agents = ["visionnaire", "designer_ui_ux"]
        technical_agents = ["architecte", "backend_engineer", "database_specialist"]
        
        if agent_role in creative_agents:
            return 0.8  # Plus créatif
        elif agent_role in technical_agents:
            return 0.3  # Plus précis
        else:
            return 0.7  # Équilibré

    def _get_agent_max_tokens(self, agent_role: str) -> int:
        """Nombre de tokens optimisé par agent"""
        verbose_agents = ["architecte", "critique", "optimiseur"]
        if agent_role in verbose_agents:
            return 2000  # Réponses détaillées
        else:
            return 1200  # Réponses concises

    def _post_process_response(self, agent_role: str, response: str) -> str:
        """Post-traitement spécialisé par agent"""
        # Ajouter l'emoji et le nom de l'agent
        agent_info = AGENT_ROLES.get(agent_role, {})
        agent_name = agent_info.get("name", agent_role.title())
        
        # Emojis par agent
        emojis = {
            "visionnaire": "🔮",
            "architecte": "🏗️", 
            "frontend_engineer": "⚛️",
            "backend_engineer": "🔧",
            "database_specialist": "🗃️",
            "designer_ui_ux": "🎨",
            "critique": "🔍",
            "optimiseur": "⚡",
            "assistant": "🤖"
        }
        
        emoji = emojis.get(agent_role, "🤖")
        header = f"{emoji} **[{agent_name}]**\n\n"
        
        return header + response.strip()

    async def _fallback_response(self, agent_role: str, message: str) -> str:
        """Réponse de secours si Ollama n'est pas disponible"""
        return f"""⚠️ **[Mode Simulation - {agent_role.title()}]**

Ollama non disponible. Réponse simulée pour: "{message}"

**Pour activer l'IA réelle spécialisée:**
1. Installez Ollama: https://ollama.ai
2. Lancez: `ollama serve`
3. Installez les modèles: `python setup_ollama.py install`

**Modèle requis pour cet agent:** `{self.agent_models.get(agent_role, 'qwen2.5:3b')}`"""

    async def _model_missing_response(self, agent_role: str, model_name: str, message: str) -> str:
        """Réponse quand le modèle spécialisé est manquant"""
        return f"""⚠️ **[{agent_role.title()} - Modèle Manquant]**

Le modèle spécialisé `{model_name}` n'est pas installé.

**Pour installer ce modèle:**
```bash
ollama pull {model_name}
```

**Ou installer tous les modèles automatiquement:**
```bash
python setup_ollama.py install
```

Demande reçue: "{message}"
*Cet agent sera pleinement fonctionnel une fois le modèle installé.*"""

    async def get_agent_status(self) -> Dict[str, Any]:
        """Statut détaillé de tous les agents"""
        if not await self.is_available():
            return {"ollama_available": False, "agents": {}}
        
        installed_models = await self.get_installed_models()
        agent_status = {}
        
        for agent_role, model_name in self.agent_models.items():
            agent_status[agent_role] = {
                "model": model_name,
                "available": model_name in installed_models,
                "priority": AGENT_ROLES.get(agent_role, {}).get("priority", False)
            }
        
        return {
            "ollama_available": True,
            "installed_models": installed_models,
            "agents": agent_status,
            "total_agents": len(agent_status),
            "available_agents": sum(1 for status in agent_status.values() if status["available"])
        }

# Singleton global
ollama_service = AdvancedOllamaService()