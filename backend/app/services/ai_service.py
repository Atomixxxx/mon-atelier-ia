# backend/app/services/ai_service.py - VERSION SIMPLE QUI MARCHE
import asyncio
import httpx
from typing import Dict, List, Any
from ..utils.config import AGENT_ROLES

class SimpleOllamaService:
    def __init__(self):
        self.base_url = "http://localhost:11434"
        
        # Modèles spécialisés
        self.agent_models = {
            "visionnaire": "qwen2.5:3b",
            "architecte": "deepseek-coder:6.7b", 
            "frontend_engineer": "deepseek-coder:6.7b",
            "backend_engineer": "deepseek-r1:8b",
            "database_specialist": "deepseek-r1:8b",
            "designer_ui_ux": "qwen2.5:3b",
            "critique": "deepseek-coder:6.7b",
            "optimiseur": "deepseek-coder:6.7b",
            "assistant": "qwen2.5:3b"
        }

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=5.0)
                return response.status_code == 200
        except:
            return False

    async def query_agent(self, agent_role: str, message: str, context: Dict[str, Any] = None) -> str:
        context = context or {}
        
        if not await self.is_available():
            model_name = self.agent_models.get(agent_role, "qwen2.5:3b")
            return f"""⚠️ **[Mode Simulation - {agent_role.title()}]**

Ollama non disponible. Pour activer l'IA réelle:
1. Installez Ollama: https://ollama.ai
2. Lancez: ollama serve  
3. Installez: ollama pull {model_name}

Message: "{message}"
*Réponse simulée - sera remplacée par l'IA réelle*"""
        
        # IA réelle avec Ollama
        model_name = self.agent_models.get(agent_role, "qwen2.5:3b")
        prompt = f"Tu es un {agent_role} expert. {message}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model_name,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.7, "max_tokens": 1500}
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    generated_text = result.get("response", "Erreur: réponse vide")
                    emoji = {"visionnaire": "🔮", "architecte": "🏗️", "frontend_engineer": "⚛️"}.get(agent_role, "🤖")
                    return f"{emoji} **[{agent_role.title()}]**\n\n{generated_text}"
                    
        except Exception as e:
            pass
            
        return f"❌ Erreur avec {agent_role}: {model_name} non disponible"

# Instance globale
simple_ollama_service = SimpleOllamaService()

# Fonctions compatibles avec votre code existant
def get_available_agents() -> List[str]:
    return list(AGENT_ROLES.keys())

async def query_agent(agent_role: str, message: str, context: Dict[str, Any] = None) -> str:
    return await simple_ollama_service.query_agent(agent_role, message, context)

def get_agent_capabilities(agent_role: str) -> Dict[str, Any]:
    return AGENT_ROLES.get(agent_role, {})

def validate_agent_role(agent_role: str) -> bool:
    return agent_role in AGENT_ROLES