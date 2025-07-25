# 🚀 Mon Atelier IA - Interface Bolt-like

Une interface utilisateur moderne inspirée de Bolt.new pour votre plateforme de développement assisté par IA.

## ✨ Nouvelles Fonctionnalités

### 🎨 Interface Bolt-like
- **Écran de démarrage** - Page d'accueil élégante avec exemples de prompts
- **Chat IA en temps réel** - Interface de conversation fluide avec les agents IA
- **Éditeur Monaco intégré** - Éditeur de code VS Code directement dans le navigateur
- **Preview en direct** - Aperçu de votre application avec support responsive
- **Gestion de fichiers** - Explorateur de fichiers avec onglets
- **Console intégrée** - Terminal et logs pour le debugging

### 🤖 Agents IA Spécialisés
- **Visionnaire** - Planification et architecture
- **Frontend Engineer** - Développement React/TypeScript
- **Backend Engineer** - APIs et serveurs
- **Designer UI/UX** - Interface et expérience utilisateur
- **Database Specialist** - Bases de données
- **DevOps Engineer** - Déploiement et infrastructure
- **SEO Expert** - Optimisation pour les moteurs de recherche
- **Performance Optimizer** - Optimisation du code
- **Code Critic** - Revue et amélioration du code

## 🛠️ Technologies

- **React 19** - Framework UI moderne
- **TypeScript** - Typage statique
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS utilitaire
- **Monaco Editor** - Éditeur de code VS Code
- **Lucide React** - Icônes modernes
- **FastAPI Backend** - API Python avec agents IA

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Python 3.9+
- Backend Mon Atelier IA en cours d'exécution

### Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Démarrer en développement**
```bash
npm run dev
```

3. **Construire pour la production**
```bash
npm run build
npm run preview
```

## 📱 Interface Utilisateur

### Écran de Démarrage
- Page d'accueil inspirée de Bolt.new
- Exemples de prompts prêts à utiliser
- Input principal pour décrire votre projet

### Interface Principale
- **Chat Panel** (gauche) - Conversation avec l'IA
- **Éditeur** (centre) - Code avec Monaco Editor
- **Preview** (droite) - Aperçu en temps réel

### Workflow IA
1. Décrivez votre projet dans le chat
2. L'IA analyse et crée un plan d'action
3. Les agents spécialisés génèrent le code
4. Preview en temps réel de votre application

## 🎯 Exemples d'Utilisation

### Site Web Moderne
```
"Crée un site web moderne et responsive pour une agence de marketing digital avec une hero section, services, portfolio et contact. Utilise des animations fluides et un design épuré."
```

### Dashboard Admin
```
"Crée un dashboard administrateur moderne avec gestion des utilisateurs, analytiques, graphiques interactifs et système de notifications. Interface claire et intuitive."
```

### Application Mobile
```
"Développe une interface d'application mobile pour une app de fitness avec dashboard, suivi des exercices, calendrier et profil utilisateur. Design moderne avec thème sombre."
```

## ⚙️ Configuration

### Variables d'environnement
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
VITE_APP_NAME=Mon Atelier IA
```

### Proxy API
Le projet est configuré pour proxy les requêtes `/api/*` vers le backend sur `http://localhost:8000`

## 🔧 Développement

### Structure du Projet
```
src/
├── components/
│   ├── BoltInterface.tsx       # Interface principale
│   ├── StartScreen.tsx         # Écran de démarrage
│   ├── PreviewPanel.tsx        # Panel de preview
│   └── ...
├── hooks/                      # Hooks personnalisés
├── services/                   # Services API
├── types/                      # Types TypeScript
└── utils/                      # Utilitaires
```

### Scripts Disponibles
- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Preview du build
- `npm run lint` - Linting ESLint
- `npm run type-check` - Vérification TypeScript

## 🚀 Fonctionnalités Avancées

### Éditeur Monaco
- Coloration syntaxique
- IntelliSense et auto-complétion
- Support multi-langages
- Thèmes personnalisables

### Preview en Direct
- Rendu HTML/CSS/JS en temps réel
- Support responsive (Desktop/Tablet/Mobile)
- Console intégrée avec logs
- Gestion d'erreurs

### Gestion de Fichiers
- Explorateur de fichiers arborescent
- Onglets pour navigation
- Sauvegarde automatique
- Support multi-projets

## 🔌 Intégration Backend

L'interface communique avec le backend via :
- **REST API** - Endpoints pour agents et workflows
- **WebSocket** - Temps réel pour les workflows
- **Streaming** - Génération de code en direct

## 📱 Responsive Design

L'interface s'adapte automatiquement :
- **Desktop** - Interface complète 3 panneaux
- **Tablet** - Panneaux collapsibles
- **Mobile** - Navigation adaptative

## 🎨 Thèmes et Personnalisation

- Thème clair moderne (par défaut)
- Support thème sombre (à venir)
- Personnalisation via Tailwind CSS
- Variables CSS pour customisation

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir `LICENSE` pour plus de détails.

---

**Développé avec ❤️ pour une expérience de développement IA exceptionnelle**