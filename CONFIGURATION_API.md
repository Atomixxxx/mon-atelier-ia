# 🔑 Configuration API ChatGPT - Mon Atelier IA

## ✅ Configuration Permanente de la Clé API

### 📋 Étapes de Configuration

1. **Obtenir une clé API OpenAI**
   - Aller sur https://platform.openai.com/api-keys
   - Créer une nouvelle clé API secrète
   - Copier la clé (format: `sk-proj-...`)

2. **Configurer la clé de manière persistante**
   ```bash
   # Méthode 1: Via API (RECOMMANDÉ)
   curl -X POST http://localhost:8000/services/chatgpt/configure \
     -H "Content-Type: application/json" \
     -d '{"api_key": "VOTRE_CLE_ICI"}'
   
   # Méthode 2: Via interface web
   # Aller sur http://localhost:5173 > Configuration > API Keys
   ```

3. **Vérifier la configuration**
   ```bash
   curl http://localhost:8000/services/status
   ```

### 🔄 Système de Configuration Persistante

#### ✨ **Nouveau**: Plus besoin de reconfigurer à chaque redémarrage !

Le système sauvegarde automatiquement votre clé API dans :
- `backend/config/api_keys.json` (fichier principal)
- `backend/config/main_config.json` (configuration générale)
- `backend/config/agents_config.json` (configuration des agents)

#### 🔒 Sécurité
- Les fichiers de configuration sont exclus du Git (`.gitignore`)
- Clés chiffrées en local
- Fallback automatique sur `.env` pour compatibilité

### 🤖 Agents Compatible ChatGPT

Agents qui utilisent ChatGPT (configurés automatiquement) :
- **visionnaire** - Stratégie et planification
- **architecte** - Architecture système
- **critique** - Révision et qualité

Agents qui utilisent Ollama (local) :
- **frontend_engineer** - Développement React/TypeScript
- **backend_engineer** - Développement Python/FastAPI
- **designer_ui_ux** - Design et UX
- **database_specialist** - Bases de données
- **deployer_devops** - Déploiement et DevOps
- Et 9 autres agents spécialisés...

### 🚀 Test du Workflow Complet

Une fois configuré, testez le workflow :

```bash
# Test simple
curl -X POST http://localhost:8000/streaming/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Créer une page web simple avec un bouton",
    "agent_id": "frontend_engineer",
    "session_id": "test_session"
  }'
```

### 📊 Monitoring

Vérifiez le statut en temps réel :
```bash
# Statut général
curl http://localhost:8000/services/status

# Métriques détaillées
curl http://localhost:8000/streaming/metrics
```

### 🔧 Dépannage

#### Problème : "401 Unauthorized"
- Vérifiez que votre clé API est valide
- Vérifiez votre quota OpenAI
- Reconfigurez avec une nouvelle clé

#### Problème : "Connection failed"
- Vérifiez votre connexion internet
- Vérifiez les pare-feu
- Redémarrez le backend

#### Problème : Configuration perdue au redémarrage
- Vérifiez que le dossier `backend/config/` existe
- Vérifiez les permissions de fichier
- Consultez les logs: `tail -f backend/logs/app.log`

### 💡 Conseils d'Optimisation

1. **Utilisation efficace des agents**
   - Utilisez les agents ChatGPT pour la stratégie et critique
   - Utilisez les agents Ollama pour le développement

2. **Gestion des coûts**
   - Surveillez votre usage OpenAI
   - Configurez des limites si nécessaire

3. **Performance**
   - Les agents Ollama sont gratuits mais nécessitent Ollama local
   - Les agents ChatGPT sont payants mais plus rapides

---

🎯 **Objectif** : Plus jamais besoin de reconfigurer vos clés API !
✅ **Résultat** : Configuration persistante et workflow automatique fonctionnel