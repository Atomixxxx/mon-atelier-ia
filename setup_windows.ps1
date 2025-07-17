# setup_windows_fixed.ps1 - Configuration Mon Atelier IA pour Windows (VERSION CORRIGÉE)
param(
    [switch]$Force,
    [switch]$SkipOllama
)

Write-Host "🚀 Configuration Avancée Mon Atelier IA - Windows" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Fonctions pour afficher des messages colorés
function Write-Status {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "app")) {
    Write-ErrorMsg "Lancez ce script depuis le dossier backend/"
    exit 1
}

Write-Status "Vérification de l'environnement..."

# Vérifier Python
try {
    $pythonVersion = python --version 2>&1
    Write-Success "Python détecté: $pythonVersion"
} catch {
    Write-ErrorMsg "Python non trouvé. Installez Python 3.8+ depuis python.org"
    exit 1
}

# Vérifier/créer l'environnement virtuel
if (-not (Test-Path "venv") -and -not (Test-Path ".venv")) {
    Write-Status "Création de l'environnement virtuel..."
    python -m venv venv
    Write-Success "Environnement virtuel créé"
} else {
    Write-Warning "Environnement virtuel existant détecté"
}

# Activer l'environnement virtuel
Write-Status "Activation de l'environnement virtuel..."
if (Test-Path "venv/Scripts/Activate.ps1") {
    & "./venv/Scripts/Activate.ps1"
    Write-Success "Environnement virtuel activé"
} elseif (Test-Path ".venv/Scripts/Activate.ps1") {
    & "./.venv/Scripts/Activate.ps1"
    Write-Success "Environnement virtuel activé"
} else {
    Write-ErrorMsg "Impossible d'activer l'environnement virtuel"
    exit 1
}

# Mettre à jour pip et installer les dépendances
Write-Status "Installation des dépendances..."
python -m pip install --upgrade pip --quiet
pip install fastapi uvicorn httpx pydantic python-multipart aiofiles python-dotenv pytest pytest-asyncio --quiet
Write-Success "Dépendances installées"

# Créer la structure de dossiers
Write-Status "Création de la structure de dossiers..."
$folders = @(
    "data/projects",
    "data/conversations", 
    "data/workflows",
    "data/backups",
    "logs",
    "uploads",
    "tests"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -Path $folder -ItemType Directory -Force | Out-Null
    }
}
Write-Success "Structure de dossiers créée"

# Créer/mettre à jour le fichier .env
Write-Status "Configuration du fichier .env..."
$envContent = @"
# Configuration Mon Atelier IA - Windows
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_TIMEOUT=60
DEFAULT_TEMPERATURE=0.7

# Storage
DATA_DIR=./data
BACKUP_DIR=./backups
MAX_CONTEXT_LENGTH=2000

# Agents
PRIORITY_AGENTS=visionnaire,architecte,frontend_engineer

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/app.log
"@

if (-not (Test-Path ".env") -or $Force) {
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Success "Fichier .env créé"
} else {
    Write-Warning "Fichier .env existant (utilisez -Force pour écraser)"
}

# Mise à jour du service AI
Write-Status "Mise à jour du service AI..."
$aiServiceContent = @'
# backend/app/services/ai_service.py - VERSION SIMPLE MISE À JOUR
"""
Service d'agents IA - Version améliorée avec modèles spécialisés
"""

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
        
        # Prompts spécialisés
        self.agent_prompts = {
            "visionnaire": "Tu es un expert en vision produit. Analyse la demande et propose une vision innovante avec technologies et roadmap.",
            "architecte": "Tu es un architecte logiciel senior. Conçois une architecture technique détaillée avec justifications.",
            "frontend_engineer": "Tu es un développeur React/TypeScript expert. Crée du code frontend moderne et fonctionnel.",
            "backend_engineer": "Tu es un développeur backend Python/FastAPI. Développe des APIs robustes et scalables.",
            "database_specialist": "Tu es un expert en bases de données. Optimise les schémas et requêtes pour la performance.",
            "designer_ui_ux": "Tu es un designer UI/UX. Crée des interfaces modernes et une expérience utilisateur exceptionnelle.",
            "critique": "Tu es un analyste code expert. Fournis une critique constructive avec suggestions d'amélioration.",
            "optimiseur": "Tu es un expert en optimisation. Améliore les performances et la qualité du code."
        }

    async def is_available(self) -> bool:
        """Vérifie si Ollama est accessible"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=5.0)
                return response.status_code == 200
        except:
            return False

    async def query_agent(self, agent_role: str, message: str, context: Dict[str, Any] = None) -> str:
        """Interface principale"""
        context = context or {}
        
        if not await self.is_available():
            return await self._fallback_response(agent_role, message)
        
        # Récupérer le modèle spécialisé
        model_name = self.agent_models.get(agent_role, "qwen2.5:3b")
        system_prompt = self.agent_prompts.get(agent_role, "Tu es un assistant IA spécialisé.")
        
        # Construire le prompt
        full_prompt = f"{system_prompt}\n\nDemande: {message}"
        if context.get("last_output"):
            full_prompt += f"\n\nContexte: {context['last_output'][:300]}..."

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model_name,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "max_tokens": 1500
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    generated_text = result.get("response", "Erreur: réponse vide")
                    
                    # Formatage simple
                    emoji = {"visionnaire": "🔮", "architecte": "🏗️", "frontend_engineer": "⚛️"}.get(agent_role, "🤖")
                    return f"{emoji} **[{agent_role.title()}]**\n\n{generated_text}"
                else:
                    return await self._fallback_response(agent_role, message)
                    
        except Exception as e:
            return await self._fallback_response(agent_role, message)

    async def _fallback_response(self, agent_role: str, message: str) -> str:
        """Réponse de simulation si Ollama indisponible"""
        model_name = self.agent_models.get(agent_role, "qwen2.5:3b")
        return f"""⚠️ **[Mode Simulation - {agent_role.title()}]**

Ollama non disponible. Pour activer l'IA réelle:

1. Installez Ollama: https://ollama.ai
2. Lancez: `ollama serve`  
3. Installez le modèle: `ollama pull {model_name}`

Message reçu: "{message}"

*Réponse simulée - sera remplacée par l'IA réelle une fois configurée.*"""

# Instance globale
simple_ollama_service = SimpleOllamaService()

# Fonctions compatibles avec le code existant
def get_available_agents() -> List[str]:
    """Retourne la liste des agents disponibles"""
    return list(AGENT_ROLES.keys())

async def query_agent(agent_role: str, message: str, context: Dict[str, Any] = None) -> str:
    """Interface principale - COMPATIBLE avec le code actuel"""
    return await simple_ollama_service.query_agent(agent_role, message, context)

def get_agent_capabilities(agent_role: str) -> Dict[str, Any]:
    """Retourne les capacités d'un agent"""
    return AGENT_ROLES.get(agent_role, {})

def validate_agent_role(agent_role: str) -> bool:
    """Valide qu'un rôle d'agent existe"""
    return agent_role in AGENT_ROLES
'@

# Sauvegarder l'ancien fichier
if (Test-Path "app/services/ai_service.py") {
    Copy-Item "app/services/ai_service.py" "app/services/ai_service.py.backup" -Force
    Write-Warning "Ancien ai_service.py sauvegardé"
}

$aiServiceContent | Out-File -FilePath "app/services/ai_service.py" -Encoding UTF8
Write-Success "Service AI mis à jour"

# Créer un script de test simple
Write-Status "Création du script de test..."
$testScript = @'
# test_quick.py - Test rapide
import asyncio
import sys
import requests

async def quick_test():
    print("🧪 Test rapide Mon Atelier IA")
    print("=" * 40)
    
    try:
        # Test imports
        sys.path.append('.')
        from app.services.ai_service import query_agent, get_available_agents
        print("✅ Modules importés avec succès")
        
        # Test liste des agents
        agents = get_available_agents()
        print(f"✅ {len(agents)} agents disponibles")
        
        # Test Ollama
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                print(f"✅ Ollama actif avec {len(models)} modèles")
                
                # Test agent
                result = await query_agent("visionnaire", "Test simple")
                if "Mode Simulation" in result:
                    print("⚠️ Agent en mode simulation")
                else:
                    print("✅ Agent fonctionne (IA réelle)")
                    
            else:
                print("⚠️ Ollama répond incorrectement")
                
        except requests.exceptions.RequestException:
            print("⚠️ Ollama non accessible - Mode simulation OK")
            result = await query_agent("visionnaire", "Test simulation")
            print("✅ Mode simulation fonctionne")
        
        print("\n🎉 Configuration fonctionnelle !")
        print("\nPour démarrer le serveur:")
        print("uvicorn app.main:app --reload")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(quick_test())
    exit(0 if success else 1)
'@

$testScript | Out-File -FilePath "test_quick.py" -Encoding UTF8
Write-Success "Script de test créé"

# Test de la configuration
Write-Status "Test de la configuration..."
try {
    python test_quick.py
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Configuration validée avec succès"
    } else {
        Write-Warning "Problèmes détectés dans la configuration"
    }
} catch {
    Write-Warning "Impossible de tester la configuration"
}

# Instructions finales
Write-Host ""
Write-Host "🎉 Configuration terminée !" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Démarrer le serveur:" -ForegroundColor White
Write-Host "   uvicorn app.main:app --reload" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Tester:" -ForegroundColor White
Write-Host "   python test_quick.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Interface web:" -ForegroundColor White
Write-Host "   http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipOllama) {
    Write-Host "4. Pour l'IA réelle, installez Ollama et les modèles:" -ForegroundColor Yellow
    Write-Host "   - Téléchargez Ollama: https://ollama.ai" -ForegroundColor Cyan
    Write-Host "   - Lancez: ollama serve" -ForegroundColor Cyan
    Write-Host "   - Installez: ollama pull qwen2.5:3b" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Prêt pour le développement !" -ForegroundColor Green