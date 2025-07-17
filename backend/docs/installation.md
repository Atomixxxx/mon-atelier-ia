\# Installation du Backend



<<<<<<< codex/fill-requirements.txt-and-update-documentation

Ces instructions permettent d'installer les dépendances Python nécessaires pour exécuter l'API FastAPI.



```bash

cd backend

python -m venv venv

source venv/bin/activate

pip install -r requirements.txt

```



Vous pouvez ensuite lancer le serveur de développement avec :



```bash

uvicorn app.main:app --reload

```

=======

Ce dossier contient l'API FastAPI et le moteur de workflows.



\## Prérequis

\- Python 3.10+

\- `pip` récent



\## Étapes rapides

```bash

\# 1. Cloner le dépôt puis se placer dans le dossier backend

cd backend



\# 2. Créer un environnement virtuel

python -m venv .venv

source .venv/bin/activate



\# 3. Installer les dépendances

pip install fastapi uvicorn



\# 4. Copier les variables d'environnement si nécessaire

cp .env.example .env



\# 5. Lancer le serveur en mode développement

uvicorn app.main:app --reload

```



L'API est alors disponible sur `http://localhost:8000`.

>>>>>>> main



