import asyncio
import sys
sys.path.append('.')

async def test():
    print("🧪 Test Mon Atelier IA")
    print("=" * 30)
    
    try:
        from app.services.ai_service import query_agent, get_available_agents
        print("✅ Import réussi")
        
        agents = get_available_agents()
        print(f"✅ {len(agents)} agents disponibles")
        
        # Test d'un agent
        result = await query_agent("visionnaire", "Bonjour, teste-toi")
        print(f"✅ Agent testé: {len(result)} caractères")
        
        if "Mode Simulation" in result:
            print("⚠️ Ollama non configuré - Mode simulation actif")
        else:
            print("🎉 IA réelle fonctionne !")
        
        print("\n🚀 Prêt à démarrer le serveur !")
        print("Commande: uvicorn app.main:app --reload")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        print("Vérifiez que vous êtes dans le dossier backend/")

if __name__ == "__main__":
    asyncio.run(test())
    input("\nAppuyez sur Entrée pour continuer...")