# 🔐 Configuration Optimale - Mon Atelier IA

## 🎯 **Configuration de Permissions Sécurisées**

### 📋 **Tableau des Permissions Recommandées**

| Type de Fichier | Permission | Numérique | Symbolic | Description |
|------------------|------------|-----------|----------|-------------|
| **🔑 Fichiers Sensibles** |
| `.env`, `secret_key.txt` | `600` | `rw-------` | Propriétaire seul | Clés API, secrets |
| `users.json`, `api_keys.json` | `600` | `rw-------` | Propriétaire seul | Données utilisateurs |
| Certificats SSL | `600` | `rw-------` | Propriétaire seul | Certificats privés |
| **📁 Dossiers Sensibles** |
| `config/secure/` | `700` | `rwx------` | Propriétaire seul | Configuration sensible |
| `backup/` | `700` | `rwx------` | Propriétaire seul | Sauvegardes |
| **💻 Fichiers de Code** |
| `*.py`, `*.ts`, `*.tsx` | `644` | `rw-r--r--` | Lecture publique | Code source |
| `*.json`, `*.md` | `644` | `rw-r--r--` | Lecture publique | Configuration générale |
| **⚙️ Scripts Exécutables** |
| `*.sh`, `*.bat` | `755` | `rwxr-xr-x` | Exécution autorisée | Scripts système |
| **📂 Dossiers Généraux** |
| `src/`, `app/` | `755` | `rwxr-xr-x` | Accès standard | Dossiers de code |
| `node_modules/` | `755` | `rwxr-xr-x` | Accès standard | Dépendances |

---

## 🛡️ **Configuration Sécurisée Immédiate**

### **1. Script d'Application Automatique**

```bash
#!/bin/bash
# secure_permissions.sh - Configuration sécurisée Mon Atelier IA

echo "🔐 Application des permissions sécurisées..."

# Dossier racine du projet
cd "C:\Users\Final\OneDrive\Bureau\mon-atelier-ia"

# FICHIERS SENSIBLES (600 - rw-------)
echo "🔑 Sécurisation des fichiers sensibles..."
chmod 600 backend/.env 2>/dev/null || echo "⚠️ backend/.env non trouvé"
chmod 600 frontend/.env 2>/dev/null || echo "⚠️ frontend/.env non trouvé"
chmod 600 backend/secret_key.txt 2>/dev/null
chmod 600 backend/users.json 2>/dev/null
chmod 600 backend/config/api_keys.json 2>/dev/null
chmod 600 backend/logs/*.log 2>/dev/null

# DOSSIERS SENSIBLES (700 - rwx------)
echo "📁 Sécurisation des dossiers sensibles..."
chmod 700 backend/config/secure 2>/dev/null
chmod 700 backend/backup 2>/dev/null
chmod 700 backend/logs 2>/dev/null

# FICHIERS DE CODE (644 - rw-r--r--)
echo "💻 Configuration des fichiers de code..."
find . -name "*.py" -exec chmod 644 {} \; 2>/dev/null
find . -name "*.ts" -exec chmod 644 {} \; 2>/dev/null
find . -name "*.tsx" -exec chmod 644 {} \; 2>/dev/null
find . -name "*.js" -exec chmod 644 {} \; 2>/dev/null
find . -name "*.json" -exec chmod 644 {} \; 2>/dev/null
find . -name "*.md" -exec chmod 644 {} \; 2>/dev/null

# SCRIPTS EXÉCUTABLES (755 - rwxr-xr-x)
echo "⚙️ Configuration des scripts..."
find . -name "*.sh" -exec chmod 755 {} \; 2>/dev/null
find . -name "*.bat" -exec chmod 755 {} \; 2>/dev/null

# DOSSIERS GÉNÉRAUX (755 - rwxr-xr-x)
echo "📂 Configuration des dossiers..."
find . -type d -name "src" -exec chmod 755 {} \; 2>/dev/null
find . -type d -name "app" -exec chmod 755 {} \; 2>/dev/null
find . -type d -name "components" -exec chmod 755 {} \; 2>/dev/null
find . -type d -name "hooks" -exec chmod 755 {} \; 2>/dev/null
find . -type d -name "services" -exec chmod 755 {} \; 2>/dev/null

echo "✅ Permissions sécurisées appliquées avec succès !"
echo "📊 Vérification des permissions critiques :"
ls -la backend/.env 2>/dev/null || echo "❌ backend/.env manquant"
ls -la backend/secret_key.txt 2>/dev/null || echo "❌ secret_key.txt manquant"
ls -la backend/users.json 2>/dev/null || echo "❌ users.json manquant"
```

### **2. Configuration .gitignore Optimisée**

```gitignore
# === SÉCURITÉ ET SECRETS ===
# Fichiers de configuration sensibles
.env
.env.*
!.env.example
secret_key.txt
api_keys.json
users.json
private_key.pem
certificate.crt

# Dossiers de configuration sensible
config/secure/
backup/
logs/private/

# === DÉVELOPPEMENT ===
# Python
__pycache__/
*.py[cod]
*.pyo
*.pyd
*.pyc
.Python
*.so

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Build et dist
dist/
build/
out/
*.tsbuildinfo

# Cache et temporaires
.cache/
.vite/
.next/
.nuxt/
.pytest_cache/
*.tmp
*.temp
temp/
tmp/

# === OUTILS DE DÉVELOPPEMENT ===
# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
*.pid
*.seed
*.pid.lock

# === DONNÉES ET LOGS ===
# Base de données
*.db
*.sqlite
*.sqlite3

# Logs
*.log
logs/
*.log.*

# === WORKSPACES ET OUTPUTS ===
# Fichiers générés par les agents
workspace/
test_workspace/
*_workspace/
agent_output_*
*_output.*

# === FICHIERS DE TEST TEMPORAIRES ===
test_*.py
test_*.js
test_*.ts
test_*.html
test_*.json
debug_*.json
*_debug.*
*_fix.*
simple_*.ts
nul
```

### **3. Structure de Dossiers Sécurisée**

```
mon-atelier-ia/
├── backend/
│   ├── config/
│   │   ├── secure/           # 700 - Fichiers ultra-sensibles
│   │   │   ├── secret_key.txt    # 600
│   │   │   ├── users.json        # 600
│   │   │   └── private_keys/     # 700
│   │   ├── api_keys.json     # 600 - Clés API
│   │   ├── main_config.json  # 644 - Config générale
│   │   └── agents_config.json # 644 - Config agents
│   ├── logs/
│   │   ├── private/          # 700 - Logs sensibles
│   │   └── public/           # 755 - Logs généraux
│   ├── backup/               # 700 - Sauvegardes
│   └──.env                   # 600 - Variables d'environnement
├── frontend/
│   ├── .env                  # 600 - Config frontend
│   └── src/                  # 755 - Code source
└── scripts/
    ├── deploy.sh             # 755 - Scripts de déploiement
    └── backup.sh             # 755 - Scripts de sauvegarde
```

---

## 🚀 **Application Immédiate**

### **Étape 1 : Exécuter le Script de Sécurisation**

```bash
# Copier le script
cat > secure_permissions.sh << 'EOF'
# [Coller le script ci-dessus]
EOF

# Rendre exécutable et lancer
chmod +x secure_permissions.sh
./secure_permissions.sh
```

### **Étape 2 : Vérifier les Permissions**

```bash
# Vérification des fichiers critiques
ls -la backend/.env
ls -la backend/secret_key.txt
ls -la backend/users.json
ls -la backend/config/

# Vérification .gitignore
git status --ignored
```

### **Étape 3 : Créer les Dossiers Sécurisés**

```bash
# Créer la structure sécurisée
mkdir -p backend/config/secure
mkdir -p backend/logs/private
mkdir -p backend/backup

# Déplacer les fichiers sensibles
mv backend/secret_key.txt backend/config/secure/ 2>/dev/null
mv backend/users.json backend/config/secure/ 2>/dev/null

# Appliquer les permissions
chmod 700 backend/config/secure
chmod 700 backend/logs/private
chmod 700 backend/backup
chmod 600 backend/config/secure/*
```

---

## 🔍 **Commandes de Vérification**

### **Audit de Sécurité Rapide**

```bash
# Vérifier les permissions des fichiers sensibles
echo "🔍 Audit de sécurité :"
echo "====================="

# Fichiers .env
echo "📄 Fichiers .env :"
ls -la backend/.env frontend/.env 2>/dev/null

# Fichiers de secrets
echo "🔑 Fichiers secrets :"
ls -la backend/config/secure/ 2>/dev/null

# Configuration git
echo "📋 Statut Git :"
git status --porcelain --ignored | grep "^!!" | head -5

# Permissions critiques
echo "⚠️ Permissions critiques :"
find . -name "*.env" -exec ls -la {} \; 2>/dev/null
find . -name "*secret*" -exec ls -la {} \; 2>/dev/null
find . -name "*key*" -exec ls -la {} \; 2>/dev/null
```

### **Test de Sécurité Avancé**

```bash
# Rechercher les fichiers avec des permissions trop permissives
echo "🚨 Fichiers potentiellement non sécurisés :"
find . -name "*.env" -not -perm 600 2>/dev/null
find . -name "*secret*" -not -perm 600 2>/dev/null
find . -name "*key*" -not -perm 600 2>/dev/null

# Rechercher les secrets exposés dans le code
echo "🔍 Recherche de secrets dans le code :"
grep -r "sk-" --include="*.py" --include="*.js" --include="*.ts" . | head -3
grep -r "API_KEY" --include="*.py" --include="*.js" --include="*.ts" . | head -3
```

---

## 📊 **Monitoring Continu**

### **Script de Monitoring Quotidien**

```bash
#!/bin/bash
# security_check.sh - Vérification quotidienne

echo "📊 RAPPORT DE SÉCURITÉ QUOTIDIEN - $(date)"
echo "============================================="

# Vérifier les permissions critiques
echo "🔍 1. PERMISSIONS CRITIQUES"
critical_files=("backend/.env" "backend/secret_key.txt" "backend/users.json")
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        perm=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null)
        if [ "$perm" = "600" ]; then
            echo "✅ $file : OK ($perm)"
        else
            echo "🚨 $file : RISQUE ($perm) - Devrait être 600"
        fi
    else
        echo "⚠️ $file : FICHIER MANQUANT"
    fi
done

# Vérifier les nouveaux fichiers sensibles
echo "🔍 2. NOUVEAUX FICHIERS SENSIBLES"
find . -name "*.env*" -newer security_check.log 2>/dev/null | head -5
find . -name "*secret*" -newer security_check.log 2>/dev/null | head -5
find . -name "*key*" -newer security_check.log 2>/dev/null | head -5

# Log du contrôle
touch security_check.log
echo "✅ Contrôle terminé : $(date)" >> security_check.log
```

---

## 🎯 **Recommandations Finales**

### **✅ À FAIRE IMMÉDIATEMENT :**

1. **Exécuter le script de sécurisation** complet
2. **Vérifier** que tous les fichiers sensibles ont les bonnes permissions
3. **Tester** que l'application fonctionne encore après les changements
4. **Mettre à jour** les chemins dans le code si nécessaire

### **⚠️ À SURVEILLER :**

1. **Nouveaux fichiers** créés par l'application
2. **Logs** qui pourraient contenir des informations sensibles  
3. **Fichiers temporaires** générés par les agents IA
4. **Sauvegardes** automatiques avec les bonnes permissions

### **🔄 MAINTENANCE RÉGULIÈRE :**

1. **Audit hebdomadaire** des permissions
2. **Rotation** des clés API tous les 3 mois
3. **Nettoyage** des fichiers temporaires
4. **Mise à jour** du `.gitignore` selon les nouveaux besoins

**🎯 Résultat :** Configuration de sécurité professionnelle qui protège vos données sensibles tout en maintenant la productivité de développement.