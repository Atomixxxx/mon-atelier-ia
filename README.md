# 🚀 Mon Atelier IA - Plateforme de Développement IA Révolutionnaire

Une plateforme complète de développement assisté par Intelligence Artificielle avec interface premium et agents conversationnels.

## ✨ Fonctionnalités Principales

### 🎯 Chef d'Orchestre IA Conversationnel
- **Conversation naturelle** - Dialogue intelligent pour comprendre vos besoins
- **Questions contextuelles** - Pose des questions pertinentes pour affiner votre projet
- **Mémoire de conversation** - Garde le contexte de tous les échanges
- **Transition automatique** - Lance le développement quand il a assez d'informations

### ⚛️ Agent Développeur IA Ultra-Avancé
- **React/TypeScript expert** - Génère du code moderne et fonctionnel
- **Architecture modulaire** - Code structuré et maintenable
- **Preview automatique** - Visualisation instantanée des applications créées
- **Streaming temps réel** - Suivi de la génération de code en direct

### 🎨 Interface Premium Moderne
- **Page d'accueil élégante** - Design minimaliste et professionnel
- **Éditeur Monaco intégré** - Éditeur de code VS Code dans le navigateur
- **Preview en temps réel** - Aperçu immédiat de vos applications
- **Gestionnaire de fichiers** - Exploration et édition des fichiers générés
- **Animations fluides** - Interface avec GPU acceleration

## 🛠️ Technologies

### Frontend
- **React 19** - Framework UI de dernière génération
- **TypeScript** - Typage statique pour plus de robustesse
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS utilitaire moderne
- **Framer Motion** - Animations fluides et performantes
- **Monaco Editor** - Éditeur de code professionnel
- **Lucide React** - Icônes modernes et cohérentes

### Backend
- **FastAPI** - Framework Python moderne et rapide
- **OpenAI GPT-4o** - Modèle IA de pointe pour les agents
- **WebSocket** - Communication temps réel
- **Pydantic** - Validation de données robuste
- **Uvicorn** - Serveur ASGI haute performance

## 🚀 Installation et Démarrage

### Prérequis
- **Node.js 18+** et npm/yarn
- **Python 3.9+** et pip
- **Clé API OpenAI** (GPT-4o)

### 1. Configuration du Backend

```bash
cd backend

# Installation des dépendances
pip install -r requirements.txt

# Configuration de la clé OpenAI
# Modifier la clé dans backend/app/ultra_simple_main.py
# ou définir OPENAI_API_KEY dans l'environnement

# Démarrage du serveur
python app/ultra_simple_main.py
```

Le backend sera disponible sur `http://localhost:8010`

### 2. Configuration du Frontend

```bash
cd frontend

# Installation des dépendances
npm install

# Démarrage en développement
npm run dev
```

Le frontend sera disponible sur `http://localhost:5173`

## 🎯 Guide d'Utilisation

### Flux de Travail Complet

1. **Page d'accueil** - Découvrez l'interface premium
2. **Cliquez "Démarrer la révolution"** - Accédez au chat
3. **Décrivez votre projet** - Le Chef d'Orchestre vous écoute
4. **Répondez aux questions** - Il pose 2-3 questions contextuelles
5. **Génération automatique** - L'Agent Développeur IA crée votre code
6. **Preview instantanée** - Visualisez votre application
7. **Édition et personnalisation** - Modifiez le code dans Monaco Editor

### Exemples de Projects

#### Application de Cuisine
```
"Je veux une application de cuisine qui génère des menus aléatoires"
```

#### Jeu Pong
```
"Crée-moi un jeu Pong avec effets sonores et score"
```

#### Dashboard Moderne
```
"Une application dashboard avec graphiques et statistiques"
```

#### Site E-commerce
```
"Un site de vente en ligne avec panier et checkout"
```

## 📂 Architecture du Projet

```
mon-atelier-ia/
├── backend/                    # API et agents IA
│   ├── app/
│   │   ├── ultra_simple_main.py   # Serveur principal
│   │   └── agents_modelfiles/     # Configuration des agents
│   └── requirements.txt
├── frontend/                   # Interface utilisateur
│   ├── src/
│   │   ├── components/
│   │   │   ├── TeslaApp.tsx       # Application principale
│   │   │   ├── TeslaInterface.tsx # Page d'accueil
│   │   │   └── TeslaWorkflowInterface.tsx # Interface de chat
│   │   ├── hooks/              # Hooks React personnalisés
│   │   ├── utils/              # Utilitaires
│   │   └── styles/             # Styles globaux
│   └── package.json
└── README.md
```

## ⚙️ Configuration Avancée

### Variables d'Environnement Backend
```env
OPENAI_API_KEY=your-openai-api-key
PORT=8010
```

### Configuration Frontend
Le frontend est configuré pour se connecter automatiquement au backend sur le port correct.

### Personnalisation des Agents

Les agents sont configurés dans `backend/app/ultra_simple_main.py` :
- **project_orchestrator** - Chef d'Orchestre conversationnel
- **quantum_developer** - Agent Développeur IA
- **ultra_designer** - Designer CSS moderne
- **code_architect** - Architecte de code

## 🎨 Fonctionnalités Avancées

### Streaming en Temps Réel
- Génération de code visible en direct
- WebSocket pour communication instantanée
- Debouncing optimisé pour fluidité

### Preview Intelligente
- Détection automatique du type de projet
- Rendu HTML/CSS/JS instantané
- Support responsive (Desktop/Mobile)
- Gestion d'erreurs intégrée

### Éditeur Monaco Professionnel
- Coloration syntaxique avancée
- IntelliSense et auto-complétion
- Support multi-langages
- Raccourcis clavier VS Code

### Interface Premium
- Design inspiré des meilleures interfaces modernes
- Animations GPU-accelerated
- Responsive design parfait
- Thème sombre élégant

## 🔧 Développement

### Scripts Frontend
```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Preview du build
npm run lint         # ESLint
npm run type-check   # Vérification TypeScript
```

### Scripts Backend
```bash
python app/ultra_simple_main.py  # Démarrage serveur
```

## 🚀 Déploiement

### Production Locale
```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend  
cd backend
pip install -r requirements.txt
python app/ultra_simple_main.py
```

### Docker (Optionnel)
```bash
# À venir - Configuration Docker pour déploiement simplifié
```

## 🔒 Sécurité

- Validation des entrées côté client et serveur
- Sanitisation du code généré
- CORS configuré correctement
- Gestion sécurisée des clés API

## 🧪 Tests

```bash
# Frontend
cd frontend
npm run test

# Backend - Tests à implémenter
cd backend
pytest
```

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir `LICENSE` pour plus de détails.

## 🆘 Support et FAQ

### Questions Fréquentes

**Q: L'Agent IA ne génère pas de code**
R: Vérifiez que votre clé OpenAI est configurée et que le backend est démarré

**Q: La preview ne s'affiche pas**
R: Assurez-vous que le code généré est valide et que les dépendances sont correctes

**Q: Interface lente ou saccadée**
R: L'interface utilise GPU acceleration - vérifiez les performances de votre navigateur

### Contact
- 🐛 **Issues**: [GitHub Issues]
- 💬 **Discussions**: [GitHub Discussions]
- 📧 **Email**: contact@mon-atelier-ia.com

---

**🎉 Développé avec passion pour révolutionner le développement web avec l'IA**

*Une expérience de développement assisté par IA comme vous n'en avez jamais vue !*