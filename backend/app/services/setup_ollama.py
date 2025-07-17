import logging
import httpx
import subprocess
import time
import json
import asyncio
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from ..utils.config import AGENT_ROLES, get_required_models, get_priority_models

logger = logging.getLogger("setup_ollama")

class IntegratedOllamaSetup:
    def __init__(self):
        self.ollama_host = "http://localhost:11434"
        self.required_models = get_required_models()
        self.priority_models = get_priority_models()
        
        # Tailles des modèles (estimation en GB)
        self.model_sizes = {
            "qwen2.5:3b": 2.0,
            "deepseek-coder:6.7b": 4.1,
            "deepseek-r1:8b": 4.8,
            "mistral:7b": 4.1,
            "llama3.2:3b": 2.0
        }

    async def check_ollama_installed(self) -> bool:
        """Vérifie si Ollama est installé"""
        try:
            result = subprocess.run(['ollama', '--version'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=10)
            if result.returncode == 0:
                version = result.stdout.strip()
                logger.info(f"✅ Ollama installé: {version}")
                return True
            else:
                logger.error("❌ Ollama non accessible")
                return False
        except (subprocess.TimeoutExpired, FileNotFoundError):
            logger.error("❌ Ollama non installé")
            return False

    async def check_ollama_running(self) -> bool:
        """Vérifie si le service Ollama fonctionne"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.ollama_host, timeout=5)
                if response.status_code == 200:
                    logger.info("✅ Service Ollama actif")
                    return True
                else:
                    logger.warning(f"⚠️ Service Ollama répond {response.status_code}")
                    return False
        except Exception as e:
            logger.warning(f"⚠️ Service Ollama non accessible: {e}")
            return False

    async def start_ollama_service(self) -> bool:
        """Démarre le service Ollama"""
        logger.info("🚀 Démarrage du service Ollama...")
        try:
            # Démarrer ollama serve en arrière-plan
            subprocess.Popen(['ollama', 'serve'], 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
            
            # Attendre le démarrage
            for i in range(10):
                await asyncio.sleep(1)
                if await self.check_ollama_running():
                    logger.info("✅ Service Ollama démarré avec succès")
                    return True
                logger.info(f"⏳ Attente démarrage... {i+1}/10")
            
            logger.error("❌ Échec démarrage service Ollama")
            return False
            
        except Exception as e:
            logger.error(f"❌ Erreur démarrage Ollama: {e}")
            return False

    async def get_installed_models(self) -> List[str]:
        """Récupère les modèles installés"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.ollama_host}/api/tags", timeout=10)
                if response.status_code == 200:
                    models_data = response.json()
                    models = [model['name'] for model in models_data.get('models', [])]
                    logger.info(f"📋 {len(models)} modèles installés")
                    return models
                else:
                    logger.error(f"❌ Erreur récupération modèles: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"❌ Erreur API modèles: {e}")
            return []

    async def pull_model_with_progress(self, model_name: str) -> bool:
        """Télécharge un modèle avec suivi de progression"""
        logger.info(f"📥 Téléchargement de {model_name}...")
        
        try:
            async with httpx.AsyncClient(timeout=600) as client:  # 10 minutes timeout
                async with client.stream(
                    "POST",
                    f"{self.ollama_host}/api/pull",
                    json={"name": model_name}
                ) as response:
                    
                    if response.status_code != 200:
                        logger.error(f"❌ Erreur téléchargement {model_name}: {response.status_code}")
                        return False
                    
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                status = data.get("status", "")
                                
                                if "downloading" in status.lower():
                                    completed = data.get("completed", 0)
                                    total = data.get("total", 1)
                                    percent = (completed / total) * 100 if total > 0 else 0
                                    logger.info(f"⏳ {model_name}: {percent:.1f}% ({completed}/{total} bytes)")
                                
                                elif "success" in status.lower():
                                    logger.info(f"✅ {model_name} téléchargé avec succès")
                                    return True
                                    
                            except json.JSONDecodeError:
                                continue
                    
                    logger.info(f"✅ {model_name} installé")
                    return True
                    
        except Exception as e:
            logger.error(f"❌ Erreur téléchargement {model_name}: {e}")
            return False

    async def install_priority_models(self) -> Tuple[bool, List[str]]:
        """Installe les modèles prioritaires pour le MVP"""
        logger.info("📦 Installation des modèles prioritaires...")
        
        installed_models = await self.get_installed_models()
        missing_priority = [
            model for model in self.priority_models 
            if model not in installed_models
        ]
        
        if not missing_priority:
            logger.info("✅ Tous les modèles prioritaires sont installés")
            return True, []
        
        logger.info(f"📥 Modèles prioritaires à installer: {missing_priority}")
        
        # Calculer l'espace requis
        total_size = sum(self.model_sizes.get(model, 5.0) for model in missing_priority)
        logger.info(f"💾 Espace requis: ~{total_size:.1f} GB")
        
        failed_models = []
        for model in missing_priority:
            logger.info(f"🔄 Installation de {model}...")
            if await self.pull_model_with_progress(model):
                logger.info(f"✅ {model} installé avec succès")
            else:
                logger.error(f"❌ Échec installation {model}")
                failed_models.append(model)
        
        success = len(failed_models) == 0
        return success, failed_models

    async def install_all_models(self) -> Tuple[bool, List[str]]:
        """Installe tous les modèles requis"""
        logger.info("📦 Installation complète des modèles...")
        
        installed_models = await self.get_installed_models()
        missing_models = [
            model for model in self.required_models 
            if model not in installed_models
        ]
        
        if not missing_models:
            logger.info("✅ Tous les modèles sont installés")
            return True, []
        
        # Calculer l'espace total requis
        total_size = sum(self.model_sizes.get(model, 5.0) for model in missing_models)
        logger.info(f"💾 Espace total requis: ~{total_size:.1f} GB")
        
        failed_models = []
        for model in missing_models:
            if await self.pull_model_with_progress(model):
                logger.info(f"✅ {model} installé")
            else:
                failed_models.append(model)
        
        success = len(failed_models) == 0
        return success, failed_models

    async def test_agent_models(self) -> Dict[str, bool]:
        """Teste tous les modèles d'agents"""
        logger.info("🧪 Test des modèles d'agents...")
        
        test_results = {}
        test_prompt = "Réponds juste 'OK' pour confirmer que tu fonctionnes."
        
        for agent_role, agent_info in AGENT_ROLES.items():
            model_name = agent_info["model"]
            logger.info(f"🔍 Test {agent_role} ({model_name})...")
            
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    response = await client.post(
                        f"{self.ollama_host}/api/generate",
                        json={
                            "model": model_name,
                            "prompt": test_prompt,
                            "stream": False
                        }
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get("response"):
                            test_results[agent_role] = True
                            logger.info(f"✅ {agent_role} fonctionne")
                        else:
                            test_results[agent_role] = False
                            logger.warning(f"⚠️ {agent_role} réponse vide")
                    else:
                        test_results[agent_role] = False
                        logger.error(f"❌ {agent_role} erreur {response.status_code}")
                        
            except Exception as e:
                test_results[agent_role] = False
                logger.error(f"❌ {agent_role} exception: {e}")
        
        working_agents = sum(test_results.values())
        total_agents = len(test_results)
        logger.info(f"📊 Agents fonctionnels: {working_agents}/{total_agents}")
        
        return test_results

    async def get_detailed_status(self) -> Dict:
        """Statut détaillé de la configuration"""
        status = {
            "ollama_installed": await self.check_ollama_installed(),
            "ollama_running": False,
            "installed_models": [],
            "required_models": self.required_models,
            "priority_models": self.priority_models,
            "missing_models": [],
            "missing_priority": [],
            "agents_status": {},
            "disk_usage_gb": 0,
            "setup_complete": False
        }
        
        if status["ollama_installed"]:
            status["ollama_running"] = await self.check_ollama_running()
            
            if status["ollama_running"]:
                status["installed_models"] = await self.get_installed_models()
                
                # Calculer les modèles manquants
                status["missing_models"] = [
                    model for model in self.required_models 
                    if model not in status["installed_models"]
                ]
                
                status["missing_priority"] = [
                    model for model in self.priority_models 
                    if model not in status["installed_models"]
                ]
                
                # Statut des agents
                for agent_role, agent_info in AGENT_ROLES.items():
                    model_name = agent_info["model"]
                    status["agents_status"][agent_role] = {
                        "model": model_name,
                        "available": model_name in status["installed_models"],
                        "priority": agent_info.get("priority", False)
                    }
                
                # Estimation usage disque
                status["disk_usage_gb"] = sum(
                    self.model_sizes.get(model, 5.0) 
                    for model in status["installed_models"]
                )
                
                # Setup complet si tous les modèles prioritaires sont présents
                status["setup_complete"] = len(status["missing_priority"]) == 0
        
        return status

    async def setup_mvp_complete(self) -> bool:
        """Configuration complète pour MVP"""
        logger.info("🚀 Configuration MVP Ollama - Démarrage")
        logger.info("=" * 50)
        
        # 1. Vérifier installation Ollama
        if not await self.check_ollama_installed():
            logger.error("❌ Ollama non installé")
            logger.info("📖 Instructions d'installation:")
            logger.info("   1. Visitez: https://ollama.ai")
            logger.info("   2. Suivez les instructions pour votre OS")
            logger.info("   3. Relancez ce script")
            return False
        
        # 2. Démarrer le service si nécessaire
        if not await self.check_ollama_running():
            if not await self.start_ollama_service():
                logger.error("❌ Impossible de démarrer le service Ollama")
                return False
        
        # 3. Installer les modèles prioritaires
        success, failed = await self.install_priority_models()
        if not success:
            logger.error(f"❌ Échec installation modèles: {failed}")
            return False
        
        # 4. Tester les agents prioritaires
        test_results = await self.test_agent_models()
        priority_agents = ["visionnaire", "architecte", "frontend_engineer"]
        priority_working = all(test_results.get(agent, False) for agent in priority_agents)
        
        if not priority_working:
            logger.error("❌ Certains agents prioritaires ne fonctionnent pas")
            return False
        
        logger.info("🎉 Configuration MVP terminée avec succès !")
        logger.info("✅ Agents prioritaires fonctionnels")
        return True

    def print_status_report(self, status: Dict):
        """Affiche un rapport de statut détaillé"""
        print("\n" + "=" * 60)
        print("🤖 RAPPORT STATUT OLLAMA - MON ATELIER IA")
        print("=" * 60)
        
        # Statut global
        print(f"📦 Ollama installé: {'✅' if status['ollama_installed'] else '❌'}")
        print(f"🚀 Service actif: {'✅' if status['ollama_running'] else '❌'}")
        print(f"💾 Usage disque: ~{status['disk_usage_gb']:.1f} GB")
        print(f"🎯 Setup MVP: {'✅ Complet' if status['setup_complete'] else '⚠️ Incomplet'}")
        
        # Modèles
        total_models = len(status['required_models'])
        installed_count = len(status['installed_models'])
        print(f"\n📊 Modèles: {installed_count}/{total_models} installés")
        
        if status['missing_priority']:
            print(f"❌ Modèles prioritaires manquants: {', '.join(status['missing_priority'])}")
        else:
            print("✅ Tous les modèles prioritaires installés")
        
        # Agents
        print(f"\n🤖 AGENTS ({len(status['agents_status'])} total):")
        for agent_role, agent_status in status['agents_status'].items():
            available_icon = "✅" if agent_status['available'] else "❌"
            priority_icon = "⭐" if agent_status['priority'] else "  "
            model_name = agent_status['model']
            print(f"   {available_icon} {priority_icon} {agent_role.ljust(20)} → {model_name}")
        
        if status['missing_models']:
            print(f"\n📥 Pour installer tous les modèles:")
            print(f"   python -m app.services.setup_ollama install_all")
        
        print("=" * 60)

# Fonctions utilitaires pour usage direct
async def setup_mvp_quick() -> bool:
    """Configuration rapide MVP"""
    setup = IntegratedOllamaSetup()
    return await setup.setup_mvp_complete()

async def check_status() -> Dict:
    """Vérification rapide du statut"""
    setup = IntegratedOllamaSetup()
    return await setup.get_detailed_status()

async def install_priority_only() -> bool:
    """Installer seulement les modèles prioritaires"""
    setup = IntegratedOllamaSetup()
    
    if not await setup.check_ollama_running():
        if not await setup.start_ollama_service():
            return False
    
    success, failed = await setup.install_priority_models()
    return success

# Script principal
async def main():
    import sys
    
    setup = IntegratedOllamaSetup()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "status":
            status = await setup.get_detailed_status()
            setup.print_status_report(status)
            
        elif command == "install_mvp":
            success = await setup.setup_mvp_complete()
            if success:
                print("🎉 Configuration MVP réussie !")
            else:
                print("❌ Échec configuration MVP")
                
        elif command == "install_all":
            success, failed = await setup.install_all_models()
            if success:
                print("🎉 Tous les modèles installés !")
            else:
                print(f"❌ Modèles échoués: {failed}")
                
        elif command == "test":
            results = await setup.test_agent_models()
            working = sum(results.values())
            total = len(results)
            print(f"🧪 Tests: {working}/{total} agents fonctionnels")
            
        else:
            print("Usage: python setup_ollama.py [status|install_mvp|install_all|test]")
    else:
        # Configuration par défaut
        await setup.setup_mvp_complete()

if __name__ == "__main__":
    asyncio.run(main())