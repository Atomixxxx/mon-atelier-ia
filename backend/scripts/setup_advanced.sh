#!/bin/bash

echo "🚀 Configuration Avancée Mon Atelier IA"
echo "========================================"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier Python
print_status "Vérification Python..."
if ! python3 --version &> /dev/null; then
    print_error "Python 3 requis"
    exit 1
fi
print_success "Python détecté: $(python3 --version)"

# Créer l'environnement virtuel
print_status "Configuration environnement virtuel..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    print_success "Environnement virtuel créé"
else
    print_warning "Environnement virtuel existant"
fi

# Activer l'environnement
source .venv/bin/activate
print_success "Environnement virtuel activé"

# Mettre à jour pip
print_status "Mise à jour pip..."
pip install --upgrade pip --quiet

# Installer les dépendances avancées
print_status "Installation dépendances avancées..."
pip install --quiet \
    fastapi \
    uvicorn[standard] \
    httpx \
    pydantic \
    python-multipart \
    aiofiles \
    python-dotenv \
    pytest \
    pytest-asyncio

print_success "Dépendances installées"

# Configuration .env
print_status "Configuration environnement..."
if [ ! -f .env ]; then
    cat > .env << EOF
# Configuration Mon Atelier IA - Avancée
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
EOF
    print_success "Fichier .env créé"
else
    print_warning "Fichier .env existant"
fi

# Créer structure de dossiers
print_status "Création structure de dossiers..."
mkdir -p data/{projects,conversations,workflows,backups}
mkdir -p logs
mkdir -p uploads
print_success "Structure créée"

# Vérifier Ollama
print_status "Vérification Ollama..."
if command -v ollama &> /dev/null; then
    print_success "Ollama CLI détecté"
    
    # Vérifier le service
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_success "Service Ollama actif"
        
        # Configuration automatique des modèles
        print_status "Configuration automatique des modèles..."
        python3 -c "
import asyncio
import sys
sys.path.append('.')
from app.services.setup_ollama import setup_mvp_quick

async def setup():
    success = await setup_mvp_quick()
    return success

result = asyncio.run(setup())
exit(0 if result else 1)
"
        
        if [ $? -eq 0 ]; then
            print_success "Modèles configurés automatiquement"
        else
            print_warning "Configuration manuelle requise"
            print_status "Lancer: python -m app.services.setup_ollama install_mvp"
        fi
        
    else
        print_warning "Service Ollama non actif"
        print_status "Démarrage automatique..."
        
        # Essayer de démarrer Ollama
        nohup ollama serve > /dev/null 2>&1 &
        sleep 3
        
        if curl -s http://localhost:11434/api/tags &> /dev/null; then
            print_success "Service Ollama démarré"
        else
            print_warning "Démarrage manuel requis: ollama serve"
        fi
    fi
else
    print_error "Ollama non installé"
    print_status "Instructions d'installation:"
    echo "  1. Visitez: https://ollama.ai"
    echo "  2. Installez pour votre système"
    echo "  3. Relancez ce script"
fi

# Tests de validation
print_status "Tests de validation..."
python3 -c "
import asyncio
import sys
sys.path.append('.')

async def quick_test():
    try:
        from app.services.storage_service import storage_service
        from app.services.ollama_service import ollama_service
        
        # Test stockage
        stats = storage_service.get_storage_stats()
        print(f'✅ Stockage: {stats}')
        
        # Test Ollama
        available = await ollama_service.is_available()
        print(f'✅ Ollama: {\"Disponible\" if available else \"Non disponible\"}')
        
        return True
    except Exception as e:
        print(f'❌ Erreur: {e}')
        return False

success = asyncio.run(quick_test())
" 2>/dev/null

print_success "Configuration avancée terminée !"
echo ""
echo "🎯 Prochaines étapes:"
echo "  1. Démarrer: ./scripts/dev.sh"
echo "  2. Tester: ./scripts/test_mvp.sh"
echo "  3. Statut: python -m app.services.setup_ollama status"
echo ""
echo "📖 Documentation: http://localhost:8000/docs"