# 🚀 Mon Atelier IA - Frontend Moderne

Une interface utilisateur moderne et élégante pour votre plateforme de développement assisté par IA.

## ✨ Fonctionnalités

- 🎨 **Interface moderne** - Design sombre élégant avec animations fluides
- 💬 **Chat multi-agents** - Conversation en temps réel avec différents agents IA
- 📝 **Éditeur Monaco** - Éditeur de code avancé avec coloration syntaxique
- 🔄 **Workflows IA** - Exécution et suivi de workflows automatisés
- 📁 **Gestion de projets** - Organisation et navigation dans vos projets
- 🤝 **Collaboration** - Travail collaboratif avec les agents IA
- 📱 **Responsive** - Interface adaptée à tous les écrans

## 🛠️ Technologies

- **React 19** - Framework UI moderne
- **TypeScript** - Typage statique
- **Vite** - Build tool rapide
- **Tailwind CSS** - Framework CSS utilitaire
- **Monaco Editor** - Éditeur de code VS Code
- **Lucide React** - Icônes modernes

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Backend Mon Atelier IA démarré sur le port 8000

### Étapes

1. **Cloner et installer**
```bash
cd Frontend
npm install
```

2. **Configuration**
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Modifier les variables si nécessaire
# VITE_API_URL=http://localhost:8000
```

3. **Démarrer en développement**
```bash
npm run dev
```

4. **Construire pour la production**
```bash
npm run build
```

## 📂 Structure du Projet

```
src/
├── components/          # Composants React
│   ├── ui/             # Composants UI de base
│   ├── layout/         # Mise en page
│   ├── editor/         # Éditeur de code
│   ├── chat/           # Interface chat
│   ├── workflow/       # Gestion workflows
│   └── agents/         # Agents IA
├── hooks/              # Hooks personnalisés
├── store/              # Gestion d'état
├── utils/              # Utilitaires
├── types/              # Types TypeScript
└── styles/             # Styles globaux
```

## 🎯 Utilisation

### Chat avec les Agents
1. Sélectionnez un agent dans la sidebar
2. Tapez votre message
3. L'agent répond et peut exécuter des actions

### Workflows IA
1. Accédez au Studio de Workflows
2. Choisissez un type de workflow
3. Décrivez votre demande
4. Lancez l'exécution et suivez la progression

### Éditeur de Code
1. Créez ou ouvrez un fichier
2. Éditez avec la coloration syntaxique
3. Utilisez les raccourcis (Ctrl+S pour sauver)
4. Exécutez avec Ctrl+Enter

## ⚙️ Configuration

### Variables d'environnement
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
VITE_APP_NAME=Mon Atelier IA
```

### Personnalisation du thème
Modifiez `tailwind.config.js` pour personnaliser les couleurs et styles.

## 🔌 API Integration

Le frontend communique avec le backend via :
- **REST API** - Endpoints standard
- **WebSocket** - Temps réel pour les workflows
- **Server-Sent Events** - Notifications push

## 📱 Responsive Design

L'interface s'adapte automatiquement :
- **Desktop** - Interface complète avec sidebar
- **Tablet** - Sidebar collapsible
- **Mobile** - Navigation mobile optimisée

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📦 Déploiement

### Production locale
```bash
npm run build
npm run preview
```

### Docker
```bash
docker build -t mon-atelier-ia-frontend .
docker run -p 3000:3000 mon-atelier-ia-frontend
```

### Vercel/Netlify
1. Connectez votre repo GitHub
2. Configurez les variables d'environnement
3. Déployez automatiquement

## 🛡️ Sécurité

- Validation côté client des entrées
- Sanitisation des contenus
- CORS configuré
- Headers de sécurité

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir `LICENSE` pour plus de détails.

## 💡 Support

- 📧 Email: support@mon-atelier-ia.com
- 💬 Discord: [Lien vers Discord]
- 📖 Documentation: [Lien vers docs]

---

**Développé avec ❤️ pour la communauté des développeurs**