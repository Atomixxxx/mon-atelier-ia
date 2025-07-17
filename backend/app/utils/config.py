import os
from typing import Dict, List

# Configuration des agents avec modèles spécialisés
AGENT_ROLES = {
    "assistant": {
        "name": "Assistant général polyvalent",
        "model": "qwen2.5:3b",
        "priority": False,
        "description": "Assistant IA généraliste pour toutes tâches"
    },
    "visionnaire": {
        "name": "Expert en vision produit et besoins utilisateurs",
        "model": "qwen2.5:3b",
        "priority": True,
        "description": "Analyse les besoins et propose une vision produit"
    },
    "architecte": {
        "name": "Architecte logiciel et conception système", 
        "model": "deepseek-coder:6.7b",
        "priority": True,
        "description": "Conçoit l'architecture technique et les patterns"
    },
    "frontend_engineer": {
        "name": "Développeur frontend React/TypeScript",
        "model": "deepseek-coder:6.7b",
        "priority": True,
        "description": "Développe les interfaces utilisateur modernes"
    },
    "backend_engineer": {
        "name": "Développeur backend Python/API",
        "model": "deepseek-r1:8b",
        "priority": False,
        "description": "Développe les APIs et la logique serveur"
    },
    "database_specialist": {
        "name": "Expert bases de données et optimisation",
        "model": "deepseek-r1:8b",
        "priority": False,
        "description": "Optimise et conçoit les bases de données"
    },
    "designer_ui_ux": {
        "name": "Designer d'interfaces et expérience utilisateur",
        "model": "qwen2.5:3b",
        "priority": False,
        "description": "Conçoit l'expérience et les interfaces"
    },
    "critique": {
        "name": "Analyste code et revue qualité",
        "model": "deepseek-coder:6.7b",
        "priority": False,
        "description": "Analyse et améliore la qualité du code"
    },
    "optimiseur": {
        "name": "Expert optimisation et performance",
        "model": "deepseek-coder:6.7b",
        "priority": False,
        "description": "Optimise les performances et la qualité"
    }
}

# Configuration Ollama avancée
OLLAMA_CONFIG = {
    "base_url": os.getenv("OLLAMA_URL", "http://localhost:11434"),
    "timeout": int(os.getenv("OLLAMA_TIMEOUT", "60")),  # Plus long pour les gros modèles
    "temperature": float(os.getenv("DEFAULT_TEMPERATURE", "0.7"))
}

# Configuration Storage
STORAGE_CONFIG = {
    "data_dir": os.getenv("DATA_DIR", "./data"),
    "backup_dir": os.getenv("BACKUP_DIR", "./backups"),
    "max_context_length": int(os.getenv("MAX_CONTEXT_LENGTH", "2000"))
}

# Agents prioritaires pour MVP (avec modèles plus légers)
PRIORITY_AGENTS = ["visionnaire", "architecte", "frontend_engineer"]

def get_required_models() -> List[str]:
    """Retourne la liste des modèles requis"""
    return list(set(agent["model"] for agent in AGENT_ROLES.values()))

def get_priority_models() -> List[str]:
    """Retourne les modèles pour agents prioritaires"""
    return [AGENT_ROLES[agent]["model"] for agent in PRIORITY_AGENTS]

def get_agent_model(agent_role: str) -> str:
    """Retourne le modèle spécialisé pour un agent"""
    return AGENT_ROLES.get(agent_role, {}).get("model", "qwen2.5:3b")

def is_priority_agent(agent_role: str) -> bool:
    """Vérifie si un agent est prioritaire"""
    return agent_role in PRIORITY_AGENTS