# setup_advanced.ps1 - Configuration avancée Mon Atelier IA pour Windows
param(
    [switch]$Force,
    [switch]$SkipOllama
)

Write-Host "🚀 Configuration Avancée Mon Atelier IA - Windows" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Fonction pour afficher des messages colorés
function Write-Status {
    param($Message, $Color = "Cyan")
    Write-Host "ℹ️  $Message" -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "app")) {
    Write-Error "Lancez ce script depuis le dossier backend/"
    exit 1
}

Write-Status "Vérification de l'environnement..."

# Vérifier Python
try {
    $pythonVersion = python --version 2>&1
    Write-Success "Python détecté: $pythonVersion"
} catch {
    Write-Error "Python non trouvé. Installez Python 3.8+ depuis python.org"
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
} elseif (Test-Path ".venv/Scripts/Activate.ps1") {
    & "./.venv/Scripts/Activate.ps1"
} else {
    Write-Error "Impossible d'activer l'environnement virtuel"
    exit 1
}

Write-Success "Environnement virtuel activé"

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
# Configuration Mon Atelier IA - Avancée Windows
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Ollama Configuration Avancée
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

# Créer le fichier config.py mis à jour
Write-Status "Mise à jour de la configuration..."
$configContent = @'
# backend/app/utils/config.py - VERSION MISE À JOUR AVEC MODÈLES SPÉCIALISÉS
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
    "timeout": int(os.getenv("OLLAMA_TIMEOUT", "60")),
    "temperature": float(os.getenv("DEFAULT_TEMPERATURE", "0.7"))
}

# Configuration Storage
STORAGE_CONFIG = {
    "data_dir": os.getenv("DATA_DIR", "./data"),
    "backup_dir": os.getenv("BACKUP_DIR", "./backups"),
    "max_context_length": int(os.getenv("MAX_CONTEXT_LENGTH", "2000"))
}

# Agents prioritaires pour MVP
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
'@

# Sauvegarder l'ancien fichier config
if (Test-Path "app/utils/config.py") {
    Copy-Item "app/utils/config.py" "app/utils/config.py.backup" -Force
    Write-Warning "Ancien config.py sauvegardé comme config.py.backup"
}

$configContent | Out-File -FilePath "app/utils/config.py" -Encoding UTF8
Write-Success "Configuration mise à jour"

# Créer un script de test simple
Write-Status "Création du script de test..."
$testScript = @'
# test_quick.py - Test rapide pour vérifier la configuration
import asyncio
import sys
import os
sys.path.append('.')

async def quick_test():
    print("🧪 Test rapide de la configuration...")
    
    try:
        # Test import des modules
        from app.utils.config import AGENT_ROLES, get_required_models
        print(f"✅ Configuration chargée: {len(AGENT_ROLES)} agents")
        
        models = get_required_models()
        print(f"✅ Modèles requis: {models}")
        
        # Test storage
        from app.services.storage_service import storage_service
        stats = storage_service.get_storage_stats()
        print(f"✅ Stockage: {stats}")
        
        print("🎉 Configuration valide !")
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

# Vérifier Ollama (optionnel)
if (-not $SkipOllama) {
    Write-Status "Vérification d'Ollama..."
    
    try {
        $ollamaVersion = ollama --version 2>&1
        Write-Success "Ollama détecté: $ollamaVersion"
        
        # Test du service
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
            Write-Success "Service Ollama actif"
            
            $models = $response.models
            Write-Status "Modèles installés: $($models.Count)"
            
        } catch {
            Write-Warning "Service Ollama non actif. Lancez 'ollama serve' dans un autre terminal"
        }
        
    } catch {
        Write-Warning "Ollama non installé. Téléchargez depuis https://ollama.ai"
        Write-Status "Ollama est requis pour l'IA réelle, mais vous pouvez tester en mode simulation"
    }
}

# Test de la configuration
Write-Status "Test de la configuration..."
try {
    $result = python test_quick.py
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Configuration validée avec succès"
    } else {
        Write-Warning "Problèmes détectés dans la configuration"
    }
} catch {
    Write-Warning "Impossible de tester la configuration"
}

# Instructions finales
Write-Host "`n🎉 Configuration terminée !" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Démarrer le serveur:"
Write-Host "   uvicorn app.main:app --reload" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Tester la configuration:"
Write-Host "   python test_quick.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Interface web:"
Write-Host "   http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipOllama) {
    Write-Host "4. Pour l'IA réelle, installez les modèles:" -ForegroundColor Yellow
    Write-Host "   ollama pull qwen2.5:3b" -ForegroundColor Cyan
    Write-Host "   ollama pull deepseek-coder:6.7b" -ForegroundColor Cyan
}

Write-Host "`n📖 Guide complet: Consultez le fichier README-WINDOWS.md" -ForegroundColor Blue