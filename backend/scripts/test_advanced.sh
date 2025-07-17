#!/bin/bash

echo "🧪 Tests Avancés Mon Atelier IA"
echo "==============================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier que le serveur est démarré
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Serveur non accessible sur localhost:8000${NC}"
    echo "Démarrez le serveur: ./scripts/dev.sh"
    exit 1
fi

echo -e "${GREEN}✅ Serveur détecté${NC}"

# Activer l'environnement virtuel
source .venv/bin/activate

# Installer les dépendances de test si nécessaire
pip install pytest pytest-asyncio httpx --quiet

# Vérifier le statut Ollama
echo -e "${YELLOW}🔍 Vérification statut Ollama...${NC}"
python3 -c "
import asyncio
import sys
sys.path.append('.')
from app.services.setup_ollama import check_status

async def check():
    status = await check_status()
    print(f'Ollama disponible: {status[\"ollama_running\"]}')
    print(f'Modèles installés: {len(status[\"installed_models\"])}/{len(status[\"required_models\"])}')
    print(f'Setup MVP complet: {status[\"setup_complete\"]}')
    
    if not status['setup_complete']:
        print('⚠️ Configuration incomplète - certains tests peuvent échouer')
    
    return status['setup_complete']

asyncio.run(check())
"

echo ""
echo -e "${YELLOW}🚀 Lancement des tests avancés...${NC}"

# Tests d'intégration complets
pytest tests/test_advanced_integration.py -v --tb=short

# Tests de performance simple
echo ""
echo -e "${YELLOW}⚡ Tests de performance...${NC}"
python3 -c "
import asyncio
import httpx
import time
import sys

async def performance_test():
    base_url = 'http://localhost:8000'
    
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        # Test vitesse API
        start = time.time()
        response = await client.get('/health')
        api_time = time.time() - start
        
        print(f'⚡ API Response: {api_time:.3f}s')
        
        # Test agent simple
        start = time.time()
        response = await client.post('/chat', json={
            'message': 'Bonjour, réponds en une phrase',
            'agent': 'visionnaire'
        })
        agent_time = time.time() - start
        
        if response.status_code == 200:
            response_length = len(response.json().get('response', ''))
            print(f'🤖 Agent Response: {agent_time:.3f}s ({response_length} chars)')
        else:
            print('❌ Erreur test agent')

asyncio.run(performance_test())
"

# Statistiques finales
echo ""
echo -e "${YELLOW}📊 Statistiques système...${NC}"
python3 -c "
import asyncio
import sys
sys.path.append('.')
from app.services.storage_service import storage_service
from app.services.setup_ollama import check_status

async def stats():
    # Stats stockage
    storage_stats = storage_service.get_storage_stats()
    print(f'💾 Stockage: {storage_stats[\"total_size_mb\"]} MB')
    print(f'📁 Projets: {storage_stats[\"projects\"]}')
    print(f'💬 Conversations: {storage_stats[\"conversations\"]}')
    print(f'🔄 Workflows: {storage_stats[\"workflows\"]}')
    
    # Stats Ollama
    ollama_status = await check_status()
    if ollama_status['ollama_running']:
        available_agents = sum(1 for agent in ollama_status['agents_status'].values() if agent['available'])
        total_agents = len(ollama_status['agents_status'])
        print(f'🤖 Agents: {available_agents}/{total_agents} fonctionnels')
        print(f'📦 Modèles: {len(ollama_status[\"installed_models\"])} installés')

asyncio.run(stats())
"

echo ""
echo -e "${GREEN}🎉 Tests avancés terminés !${NC}"
echo ""
echo "📖 Rapport complet disponible via:"
echo "   pytest tests/test_advanced_integration.py --html=report.html"
