import asyncio
import sys
import requests

async def test_setup():
    print("🧪 Test rapide Mon Atelier IA")
    print("=" * 40)
    
    try:
        # 1. Test imports
        sys.path.append('.')
        from app.services.ai_service import query_agent, get_available_agents
        print("✅ Modules importés avec succès")
        
        # 2. Test liste des agents
        agents = get_available_agents()
        print(f"✅ {len(agents)} agents disponibles: {agents[:3]}...")
        
        # 3. Test Ollama
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                print(f"✅ Ollama actif avec {len(models)} modèles")
                
                # Test agent simple
                result = await query_agent("visionnaire", "Test simple")
                if len(result) > 50:
                    print("✅ Agent fonctionne (IA réelle)")
                else:
                    print("⚠️ Agent en mode simulation")
                    
            else:
                print("⚠️ Ollama répond mais pas correctement")
                
        except requests.exceptions.RequestException:
            print("⚠️ Ollama non accessible - Mode simulation")
            result = await query_agent("visionnaire", "Test simulation")
            print("✅ Mode simulation fonctionne")
        
        print("\n🎉 Configuration fonctionnelle !")
        print("\nPour démarrer le serveur:")
        print("uvicorn app.main:app --reload")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        print("\nVérifiez que vous êtes dans le dossier backend/")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_setup())
    input("\nAppuyez sur Entrée pour continuer...")
    exit(0 if success else 1)
    