# 🔒 Système de Sécurité - Mon Atelier IA

## Vue d'ensemble

Le système de sécurité de Mon Atelier IA implémente plusieurs couches de protection pour garantir une exécution sécurisée du code utilisateur et une gestion des fichiers robuste.

## 🛡️ Couches de Sécurité

### 1. Validation des Chemins de Fichiers

**Classe**: `PathValidator` dans `core/security_validator.py`

**Protection contre**:
- Traversée de répertoire (`../`, `..\\`)
- Caractères dangereux (`<>:"|?*`)
- Caractères de contrôle (`\x00-\x1f`)
- Noms réservés Windows (`CON`, `PRN`, `AUX`, etc.)
- Chemins absolus non autorisés
- Extensions interdites

**Fonctionnalités**:
- Normalisation des chemins avec `os.path.normpath`
- Vérification avec `os.path.commonpath`
- Validation de la longueur des chemins et noms de fichiers
- Whitelist/blacklist d'extensions

```python
# Exemple d'utilisation
validator = PathValidator()
result = validator.validate_path("src/components/App.tsx", "/project/root")
if result["valid"]:
    safe_path = result["normalized_path"]
```

### 2. Gestion Sécurisée des Processus

**Classe**: `ProcessManager` dans `core/security_validator.py`

**Fonctionnalités**:
- Timeout obligatoire pour tous les processus
- Limitation mémoire et CPU
- Arrêt forcé des processus zombies
- Suivi des processus actifs
- Signal SIGTERM puis SIGKILL si nécessaire

```python
# Exemple d'utilisation
process_manager = ProcessManager()
result = await process_manager.execute_with_timeout(
    command=["npm", "install"],
    process_id="npm_install_123",
    timeout=30
)
```

### 3. Isolation Renforcée (Sandbox)

**Classes**: `DockerSandbox`, `UserIsolationSandbox`, `SandboxManager`

#### Option A: Docker Sandbox
- Isolation complète dans conteneur Docker
- Réseau désactivé par défaut
- Limitations mémoire/CPU configurables
- Utilisateur non-root (1000:1000)
- Auto-cleanup des conteneurs

#### Option B: Isolation Utilisateur (Linux/Unix)
- Exécution sous utilisateur non-privilégié
- Répertoire temporaire sécurisé
- Changement d'UID/GID via `preexec_fn`
- Limitations système

```python
# Configuration sandbox
config = SandboxConfig(
    type=SandboxType.DOCKER,
    docker_image="node:18-alpine",
    docker_timeout=30,
    docker_memory_limit="512m"
)

sandbox = SandboxManager(config)
result = await sandbox.execute_safe(
    command=["npm", "test"],
    project_path="/tmp/project"
)
```

## 🔧 Configuration

### SecurityConfig

```python
@dataclass
class SecurityConfig:
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    max_files_per_project: int = 1000
    process_timeout: int = 10  # secondes
    enable_sandbox: bool = True
    sandbox_type: SandboxType = SandboxType.DOCKER
    docker_image: str = "node:18-alpine"
    allowed_extensions: List[str] = ['.js', '.tsx', ...]
    blocked_extensions: List[str] = ['.exe', '.dll', ...]
```

## 🌐 API Endpoints

### Sécurité Générale

- `POST /security/execute` - Exécute une commande sécurisée
- `POST /security/stop` - Arrête un processus
- `GET /security/processes` - Liste les processus actifs
- `DELETE /security/processes` - Arrête tous les processus
- `POST /security/validate-file` - Valide une opération fichier
- `GET /security/config` - Configuration sécurité
- `PUT /security/config` - Met à jour la configuration

### Sandbox Spécifique

- `GET /security/sandbox/info` - Informations sandbox
- `POST /security/sandbox/test` - Test du sandbox
- `POST /security/sandbox/cleanup` - Nettoyage sandbox
- `POST /security/sandbox/execute` - Exécution forcée sandbox

### Monitoring

- `GET /security/health` - État du système sécurité
- `WebSocket /security/events` - Événements temps réel

## 🚀 Installation

### Prérequis

1. **Docker** (recommandé pour isolation maximale):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install docker.io
   
   # Windows
   # Installer Docker Desktop
   ```

2. **Dépendances Python**:
   ```bash
   pip install -r requirements_security.txt
   ```

### Configuration Docker

1. **Créer l'image de base**:
   ```dockerfile
   FROM node:18-alpine
   RUN adduser -D -s /bin/sh sandbox
   WORKDIR /workspace
   USER sandbox:sandbox
   ```

2. **Permissions**:
   ```bash
   # Ajouter l'utilisateur au groupe docker
   sudo usermod -aG docker $(whoami)
   ```

## 🧪 Tests

### Test Manual

```python
# Test de sécurité basique
from core.security_validator import SecurityManager

security = SecurityManager()

# Test validation chemin
result = security.validate_file_operation(
    operation="create",
    path="src/test.js",
    project_root="/safe/project"
)

# Test sandbox
result = await security.execute_safe_command(
    command=["echo", "Hello World"],
    process_id="test_123",
    project_root="/safe/project"
)
```

### API Tests

```bash
# Test configuration
curl -X GET http://localhost:8000/security/config

# Test exécution sécurisée
curl -X POST http://localhost:8000/security/execute \
  -H "Content-Type: application/json" \
  -d '{"command": ["echo", "test"], "use_sandbox": true}'

# Test sandbox
curl -X POST http://localhost:8000/security/sandbox/test
```

## ⚠️ Considérations de Sécurité

### Production

1. **Utilisateur dédié**: Créer un utilisateur système `sandbox` avec permissions minimales
2. **Docker**: Configurer Docker avec user namespaces
3. **Réseau**: Isoler les conteneurs du réseau
4. **Monitoring**: Surveiller les ressources et processus
5. **Logs**: Audit trail complet des opérations

### Développement

1. **Sandbox désactivable** pour debug
2. **Timeouts courts** pour éviter les blocages
3. **Logs verbeux** pour diagnostiquer les problèmes

## 🐛 Troubleshooting

### Docker non disponible
```
Erreur: Docker non disponible
Solution: Installer Docker ou désactiver le sandbox
```

### Permissions insuffisantes
```
Erreur: Permission denied
Solution: Vérifier les permissions utilisateur/groupe
```

### Timeout processus
```
Erreur: Process timed out
Solution: Augmenter timeout ou optimiser commande
```

### Chemins invalides
```
Erreur: Tentative d'accès en dehors du projet
Solution: Utiliser des chemins relatifs valides
```

## 📊 Métriques de Sécurité

- Nombre de tentatives d'évasion bloquées
- Processus timeout par projet
- Utilisation ressources sandbox
- Temps moyen d'exécution sécurisée
- Taux de succès validation fichiers

## 🔄 Migration

Pour activer la sécurité sur un projet existant:

1. Installer les dépendances
2. Configurer Docker (optionnel)
3. Mettre à jour la configuration
4. Tester avec sandbox désactivé
5. Activer progressivement les protections

## 📝 Changelog

- **v2.1.0**: Ajout sandbox Docker et isolation utilisateur
- **v2.0.0**: Système de sécurité complet avec validation chemins
- **v1.0.0**: Version initiale sans sécurité