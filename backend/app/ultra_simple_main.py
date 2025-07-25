#!/usr/bin/env python3
"""
🚀 ULTRA SIMPLE REVOLUTIONARY SYSTEM - Mon Atelier IA v5.0
System ultra-simplifié mais révolutionnaire pour tests immédiats
"""

import asyncio
import json
import os
import time
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ultra-simple")

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")
WORKSPACE_DIR = "./ultra_workspace"
os.makedirs(WORKSPACE_DIR, exist_ok=True)

app = FastAPI(title="🚀 Ultra Simple Revolutionary", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== SYSTÈME ULTRA-SIMPLE ====================

class UltraAgent:
    def __init__(self, agent_id: str, name: str, prompt: str):
        self.agent_id = agent_id
        self.name = name
        self.prompt = prompt

class UltraSimpleEngine:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        self.active_workflows = {}
        self.websocket_connections = {}
        
        # Agents ultra-simples mais puissants
        self.agents = {
            "project_orchestrator": UltraAgent(
                "project_orchestrator",
                "🎯 Chef d'Orchestre de Projet",
                """Tu es un Assistant IA conversationnel expert, comme Claude ou ChatGPT. Tu es le Chef d'Orchestre de Mon Atelier IA.

🎯 MISSION : Avoir une conversation naturelle et intelligente avec l'utilisateur pour comprendre exactement son projet de développement.

🧠 STYLE CONVERSATIONNEL :
- Parle comme un humain intelligent et bienveillant
- Sois curieux et pose des questions pertinentes
- Montre que tu comprends les nuances et le contexte
- GARDE TOUJOURS le fil de la conversation précédente
- Adapte ton ton selon le projet (formel pour business, décontracté pour perso)
- Fais des suppositions intelligentes basées sur le contexte

🎨 APPROCHE INTELLIGENTE :
1. ANALYSE le projet mentionné avec intelligence contextuelle
2. IDENTIFIE les aspects cruciaux à clarifier (audience, fonctionnalités, style)
3. POSE des questions stratégiques qui montrent ta compréhension
4. SYNTHÉTISE intelligemment les réponses pour orienter vers l'action
5. Après 2-3 échanges riches, lance le développement

💬 EXEMPLES DE CONVERSATION NATURELLE :

Utilisateur: "créer un site moderne et épuré pour un restaurant italien avec une page reservation et une pour les menus"

Toi: "Excellente idée ! Un site épuré pour un restaurant italien peut vraiment se démarquer. Je pense déjà à une esthétique minimaliste avec peut-être des touches de couleurs chaudes. 

Pour la réservation, envisages-tu un système simple de formulaire ou quelque chose de plus avancé avec calendrier interactif et gestion des créneaux en temps réel ?"

---

RÈGLES ABSOLUES :
- JAMAIS de code dans tes réponses
- Conversation fluide et naturelle uniquement  
- Quand tu as assez d'informations (2-3 échanges), conclus par : "Parfait ! Je lance l'Agent Développeur IA pour créer [description précise du projet] !"
- GARDE le contexte de TOUTE la conversation précédente"""
            ),
            
            "quantum_developer": UltraAgent(
                "quantum_developer",
                "⚛️ Agent Développeur IA",
                """Tu es un développeur quantique révolutionnaire expert React/TypeScript.

MISSION : Analyse d'abord la demande, puis génère du code React/TypeScript révolutionnaire, complet et fonctionnel.

PROCESSUS OBLIGATOIRE :
1. ANALYSE : Commence par analyser la demande en détail
2. ARCHITECTURE : Définis la structure du projet (composants, fichiers, dépendances)
3. IMPLÉMENTATION : Génère le code complet avec raisonnement
4. OPTIMISATION : Explique les choix techniques et optimisations

RÈGLES ABSOLUES :
1. TOUJOURS créer du code dans des blocs avec noms de fichiers explicites
2. Code 100% fonctionnel et prêt pour production
3. TypeScript strict avec interfaces complètes
4. Composants modernes avec hooks React
5. Styles CSS magnifiques et responsives
6. Architecture modulaire et maintenable

FORMAT OBLIGATOIRE AVEC RAISONNEMENT :

**ANALYSE DE LA DEMANDE :**
[Explique ce que tu comprends de la demande]

**ARCHITECTURE PROPOSÉE :**
[Décris la structure des composants et fichiers]

**IMPLÉMENTATION :**

```typescript
// FICHIER: src/components/MonComposant.tsx
import React, { useState, useEffect } from 'react';
import './MonComposant.css';

// Interface TypeScript stricte
interface Props {
  // props détaillées avec types
}

// Composant avec logique métier
const MonComposant: React.FC<Props> = () => {
  // State et logique React moderne
  
  return (
    <div className="mon-composant">
      {/* JSX révolutionnaire avec logique */}
    </div>
  );
};

export default MonComposant;
```

```css
/* FICHIER: src/components/MonComposant.css */
.mon-composant {
  /* styles révolutionnaires avec CSS moderne */
  /* variables CSS, flexbox, grid, animations */
}
```

**OPTIMISATIONS ET CHOIX TECHNIQUES :**
[Explique pourquoi tu as fait ces choix]

GÉNÈRE TOUJOURS DU CODE RÉVOLUTIONNAIRE AVEC RAISONNEMENT COMPLET !"""
            ),
            
            "ultra_designer": UltraAgent(
                "ultra_designer", 
                "🎨 Ultra Designer",
                """Tu es un designer ultra-révolutionnaire expert en CSS moderne.

MISSION : Crée des designs qui révolutionnent l'industrie.

RÈGLES :
1. CSS ultra-moderne avec variables, animations, gradients
2. Responsive design parfait
3. Accessibilité totale
4. Micro-interactions fluides

FORMAT :
```css
/* FICHIER: src/styles/Revolutionary.css */
:root {
  --primary: #3b82f6;
  /* variables révolutionnaires */
}

/* styles révolutionnaires */
```

CRÉE DE LA MAGIE VISUELLE !"""
            ),
            
            "code_architect": UltraAgent(
                "code_architect",
                "🏗️ Code Architect", 
                """Tu es un architecte de code révolutionnaire.

MISSION : Architecture et structure de code parfaite.

RÈGLES :
1. Code structuré et maintenable
2. Patterns modernes et best practices
3. Documentation claire
4. Performance optimale

GÉNÈRE DE L'ARCHITECTURE RÉVOLUTIONNAIRE !"""
            )
        }
        
        logger.info(f"🚀 Ultra Simple Engine initialisé avec {len(self.agents)} agents")

    async def create_ultra_workflow(self, prompt: str, agent_id: str = "quantum_developer") -> str:
        """Crée un workflow ultra-simple et révolutionnaire"""
        
        workflow_id = str(uuid.uuid4())
        
        workflow_data = {
            "workflow_id": workflow_id,
            "prompt": prompt,
            "agent_id": agent_id,
            "state": "created",
            "created_at": datetime.now().isoformat(),
            "files": [],
            "response": ""
        }
        
        self.active_workflows[workflow_id] = workflow_data
        
        logger.info(f"🚀 Workflow ultra-simple créé: {workflow_id}")
        return workflow_id

    async def execute_ultra_workflow(self, workflow_id: str, websocket: WebSocket = None):
        """Exécute le workflow ultra-simple avec streaming"""
        
        if workflow_id not in self.active_workflows:
            logger.error(f"❌ Workflow {workflow_id} non trouvé")
            return
        
        workflow = self.active_workflows[workflow_id]
        workflow["state"] = "executing"
        
        try:
            agent = self.agents[workflow["agent_id"]]
            prompt = workflow["prompt"]
            
            logger.info(f"🚀 Exécution agent {agent.name}")
            
            # Stream de début
            if websocket:
                await websocket.send_json({
                    "type": "workflow_started",
                    "workflow_id": workflow_id,
                    "agent": agent.name
                })
            
            # Appel OpenAI avec streaming
            response_content = ""
            
            stream = await self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": agent.prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=4096,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    response_content += content
                    
                    # Stream temps réel
                    if websocket:
                        await websocket.send_json({
                            "type": "agent_streaming",
                            "agent": agent.agent_id,
                            "content": content,
                            "accumulated_length": len(response_content)
                        })
            
            # Extraction des fichiers
            files = self._extract_files_ultra(response_content, workflow_id)
            
            workflow["response"] = response_content
            workflow["files"] = files
            workflow["state"] = "completed"
            workflow["completed_at"] = datetime.now().isoformat()
            
            # Stream final
            if websocket:
                await websocket.send_json({
                    "type": "workflow_completed",
                    "workflow_id": workflow_id,
                    "files_count": len(files),
                    "response_length": len(response_content)
                })
            
            logger.info(f"✅ Workflow {workflow_id} terminé: {len(files)} fichiers")
            
        except Exception as e:
            logger.error(f"❌ Erreur workflow {workflow_id}: {e}")
            workflow["state"] = "error"
            workflow["error"] = str(e)
            
            if websocket:
                await websocket.send_json({
                    "type": "workflow_error",
                    "workflow_id": workflow_id,
                    "error": str(e)
                })

    def _extract_files_ultra(self, content: str, workflow_id: str) -> List[Dict]:
        """Extraction ultra-simple mais efficace"""
        
        files = []
        print(f"🔍 [DEBUG] Extraction fichiers pour workflow {workflow_id}")
        print(f"🔍 [DEBUG] Longueur contenu: {len(content)}")
        print(f"🔍 [DEBUG] Aperçu contenu: {content[:500]}...")
        
        # Pattern principal : // FICHIER: ou /* FICHIER: 
        import re
        
        patterns = [
            r'(?://|/\*)\s*FICHIER:\s*([^\n]+)\n(.*?)(?=(?://|/\*)\s*FICHIER:|```|$)',
            r'```(\w+)\s*\n(?://|/\*|#)\s*FICHIER:\s*([^\n]+)\n(.*?)```'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, content, re.DOTALL | re.IGNORECASE)
            
            for match in matches:
                groups = match.groups()
                
                if len(groups) == 2:  # filepath + content
                    filepath = groups[0].strip()
                    file_content = groups[1].strip()
                    language = self._detect_lang(filepath)
                elif len(groups) == 3:  # lang + filepath + content
                    language = groups[0]
                    filepath = groups[1].strip()
                    file_content = groups[2].strip()
                else:
                    continue
                
                if file_content and len(file_content) > 20:
                    # Nettoyer le nom de fichier pour éviter les caractères invalides
                    clean_filepath = self._clean_filepath(filepath)
                    
                    # Sauvegarder physiquement
                    full_path = Path(WORKSPACE_DIR) / workflow_id / clean_filepath
                    full_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(file_content)
                    
                    file_info = {
                        "name": filepath.split('/')[-1],  # Nom du fichier seul
                        "path": filepath,
                        "content": file_content,
                        "language": language,
                        "size": len(file_content),
                        "created_at": datetime.now().isoformat()
                    }
                    
                    files.append(file_info)
                    logger.info(f"📁 Fichier créé: {filepath}")
        
        print(f"🔍 [DEBUG] Extraction terminée: {len(files)} fichiers trouvés")
        for i, file in enumerate(files):
            print(f"🔍 [DEBUG] Fichier {i}: {file.get('name', 'no-name')} ({len(file.get('content', ''))} chars)")
        
        return files

    def _clean_filepath(self, filepath: str) -> str:
        """Nettoie le nom de fichier pour éviter les caractères invalides"""
        import re
        # Supprimer les caractères invalides pour Windows
        clean_path = re.sub(r'[<>:"|?*]', '', filepath)
        # Remplacer les espaces multiples et autres caractères problématiques
        clean_path = re.sub(r'\s+', '_', clean_path)
        # Supprimer les points de fin et espaces
        clean_path = clean_path.strip('. ')
        return clean_path

    def _detect_lang(self, filepath: str) -> str:
        ext = Path(filepath).suffix.lower()
        mapping = {
            '.tsx': 'typescript', '.ts': 'typescript',
            '.jsx': 'javascript', '.js': 'javascript', 
            '.css': 'css', '.scss': 'scss',
            '.html': 'html', '.json': 'json',
            '.py': 'python', '.md': 'markdown'
        }
        return mapping.get(ext, 'text')

# Instance globale
ultra_engine = UltraSimpleEngine()

# ==================== ENDPOINTS ULTRA-SIMPLES ====================

class UltraWorkflowRequest(BaseModel):
    prompt: str
    agent_id: Optional[str] = "quantum_developer"

@app.post("/ultra/workflow/start")
async def start_ultra_workflow(request: UltraWorkflowRequest):
    """🚀 Démarre un workflow ultra-simple révolutionnaire"""
    
    try:
        workflow_id = await ultra_engine.create_ultra_workflow(
            request.prompt, 
            request.agent_id
        )
        
        # Le workflow sera lancé quand le WebSocket se connectera
        # Cela permet de capturer tout le streaming depuis le début
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "message": "🚀 Workflow ultra-révolutionnaire démarré !",
            "websocket_url": f"/ultra/ws/{workflow_id}",
            "status_url": f"/ultra/workflow/{workflow_id}/status"
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        raise HTTPException(500, str(e))

@app.get("/ultra/workflow/{workflow_id}/status")
async def get_ultra_status(workflow_id: str):
    """📊 Statut du workflow ultra"""
    
    if workflow_id not in ultra_engine.active_workflows:
        raise HTTPException(404, "Workflow non trouvé")
    
    return ultra_engine.active_workflows[workflow_id]

@app.get("/ultra/workflow/{workflow_id}/files")
async def get_ultra_files(workflow_id: str):
    """📁 Fichiers du workflow ultra"""
    
    if workflow_id not in ultra_engine.active_workflows:
        raise HTTPException(404, "Workflow non trouvé")
    
    workflow = ultra_engine.active_workflows[workflow_id]
    files_list = workflow.get("files", [])
    
    # Convertir la liste de fichiers en dictionnaire avec le nom comme clé
    files_dict = {}
    for file in files_list:
        filename = file.get("name", file.get("path", f"file_{len(files_dict)}"))
        files_dict[filename] = {
            "content": file.get("content", ""),
            "language": file.get("language", "javascript"),
            "path": file.get("path", filename)
        }
    
    print(f"🔍 [DEBUG] get_ultra_files - {len(files_dict)} fichiers retournés")
    for name, content in files_dict.items():
        print(f"🔍 [DEBUG] Fichier: {name} ({len(content.get('content', ''))} chars)")
    
    return {
        "workflow_id": workflow_id,
        "files": files_dict,
        "total_files": len(files_dict)
    }

@app.websocket("/ultra/ws/{workflow_id}")
async def ultra_websocket(websocket: WebSocket, workflow_id: str):
    """🌊 WebSocket ultra-simple"""
    
    await websocket.accept()
    ultra_engine.websocket_connections[workflow_id] = websocket
    
    try:
        logger.info(f"🌊 WebSocket connecté: {workflow_id}")
        
        # Si workflow pas encore exécuté, le lancer
        if workflow_id in ultra_engine.active_workflows:
            workflow = ultra_engine.active_workflows[workflow_id]
            if workflow["state"] == "created":
                await ultra_engine.execute_ultra_workflow(workflow_id, websocket)
        
        # Garder la connexion
        while True:
            try:
                message = await websocket.receive_text()
                if message == "ping":
                    await websocket.send_json({"type": "pong"})
            except WebSocketDisconnect:
                break
                
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")
    finally:
        if workflow_id in ultra_engine.websocket_connections:
            del ultra_engine.websocket_connections[workflow_id]

@app.post("/ultra/chat")
async def ultra_chat(data: dict = Body(...)):
    """💬 Chat ultra-simple direct"""
    
    message = data.get("message", "")
    agent_id = data.get("agent", "quantum_developer")
    
    if not message:
        raise HTTPException(400, "Message requis")
    
    try:
        agent = ultra_engine.agents.get(agent_id)
        if not agent:
            raise HTTPException(404, f"Agent {agent_id} non trouvé")
        
        response = await ultra_engine.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": agent.prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.3,
            max_tokens=4096
        )
        
        content = response.choices[0].message.content
        
        return {
            "success": True,
            "agent": agent_id,
            "response": content,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Chat error: {e}")
        raise HTTPException(500, str(e))

@app.get("/ultra/debug")
async def ultra_debug():
    """🔍 Debug ultra-simple"""
    
    return {
        "system": "Ultra Simple Revolutionary v5.0",
        "status": "🚀 ULTRA SYSTEM ONLINE",
        "agents": {
            agent_id: agent.name 
            for agent_id, agent in ultra_engine.agents.items()
        },
        "active_workflows": len(ultra_engine.active_workflows),
        "websockets": len(ultra_engine.websocket_connections),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/ultra/health")
async def ultra_health():
    """💚 Health check ultra"""
    
    try:
        # Test OpenAI
        await ultra_engine.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=1
        )
        
        return {
            "status": "healthy",
            "version": "5.0.0",
            "openai": "connected",
            "agents": len(ultra_engine.agents),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 LANCEMENT SYSTÈME ULTRA-RÉVOLUTIONNAIRE")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8011,
        log_level="info"
    )