import React, { useState, useEffect, useCallback, createContext, useContext, useReducer } from 'react';
import {
  MessageSquare, Code, FolderOpen, Settings, Play, Terminal, Zap,
  ChevronRight, ChevronDown, File, FileText, Database, Cpu, Monitor, Users,
  Activity, Search, Plus, X, Maximize2, Minimize2, Bell, Moon, Sun, Menu, Home,
  Bookmark, History, Upload, Download, Trash2, Edit3, Save, Copy, RefreshCw,
  AlertCircle, CheckCircle, XCircle, Clock, Sparkles, Palette, Key
} from 'lucide-react';

// 👉 On importe Notification UI externe
import Notification from "@/components/ui/Notification";

// Context pour la gestion d'état globale
interface AppState {
  theme: 'dark' | 'light';
  currentView: 'chat' | 'projects' | 'agents' | 'settings';
  sidebarCollapsed: boolean;
  consoleCollapsed: boolean;
  currentAgent: Agent | null;
  currentProject: Project | null;
  currentWorkflow: WorkflowResult | null;
  messages: ChatMessage[];
  logs: ConsoleLog[];
  notifications: Notification[];
  isWorkflowRunning: boolean;
  availableWorkflows: Record<string, AvailableWorkflow>;
}

interface AvailableWorkflow {
  name: string;
  description: string;
  steps: string[];
  category: string;
  icon: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy';
  avatar: string;
  description: string;
  capabilities: string[];
  lastActivity?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  type: 'frontend' | 'backend' | 'fullstack';
  status: 'active' | 'completed' | 'draft';
  files: ProjectFile[];
  lastModified: string;
  createdAt: string;
  technologies: string[];
}

interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  size?: number;
  children?: ProjectFile[];
  parentId?: string;
  path: string;
  lastModified: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  agentId?: string;
  timestamp: string;
  type: 'text' | 'code' | 'file' | 'image';
  metadata?: any;
}

interface ConsoleLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  timestamp: string;
  source?: string;
  details?: any;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  duration?: number;
  actions?: { label: string; action: () => void }[];
}

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description: string;
  result?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
  agentId?: string;
  executionTime?: number;
  outputData?: any;
}

interface WorkflowResult {
  id: string;
  type: string;
  description: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  steps: WorkflowStep[];
  results: Record<string, any>;
  startTime: string;
  endTime?: string;
  progress: number;
  currentStep: number;
}

// Actions pour le reducer
type AppAction =
  | { type: 'SET_THEME'; payload: 'dark' | 'light' }
  | { type: 'SET_VIEW'; payload: 'chat' | 'projects' | 'agents' | 'settings' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_CONSOLE' }
  | { type: 'SET_CURRENT_AGENT'; payload: Agent | null }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_CURRENT_WORKFLOW'; payload: WorkflowResult | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_LOG'; payload: ConsoleLog }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_WORKFLOW_RUNNING'; payload: boolean }
  | { type: 'SET_AVAILABLE_WORKFLOWS'; payload: Record<string, AvailableWorkflow> }
  | { type: 'UPDATE_PROJECT_FILE'; payload: { projectId: string; file: ProjectFile } }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'CLEAR_LOGS' };

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'TOGGLE_CONSOLE':
      return { ...state, consoleCollapsed: !state.consoleCollapsed };
    case 'SET_CURRENT_AGENT':
      return { ...state, currentAgent: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'SET_CURRENT_WORKFLOW':
      return { ...state, currentWorkflow: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'ADD_LOG':
      return { ...state, logs: [...state.logs, action.payload] };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case 'SET_WORKFLOW_RUNNING':
      return { ...state, isWorkflowRunning: action.payload };
    case 'SET_AVAILABLE_WORKFLOWS':
      return { ...state, availableWorkflows: action.payload };
    case 'UPDATE_PROJECT_FILE':
      return {
        ...state,
        currentProject: state.currentProject?.id === action.payload.projectId
          ? {
            ...state.currentProject,
            files: updateFileInTree(state.currentProject.files, action.payload.file)
          }
          : state.currentProject
      };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'CLEAR_LOGS':
      return { ...state, logs: [] };
    default:
      return state;
  }
};

// Helper function pour mettre à jour un fichier dans l'arbre
const updateFileInTree = (files: ProjectFile[], updatedFile: ProjectFile): ProjectFile[] => {
  return files.map(file => {
    if (file.id === updatedFile.id) {
      return updatedFile;
    }
    if (file.children) {
      return { ...file, children: updateFileInTree(file.children, updatedFile) };
    }
    return file;
  });
};

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Hook personnalisé pour utiliser le context
const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// État initial
const initialState: AppState = {
  theme: 'dark',
  currentView: 'chat',
  sidebarCollapsed: false,
  consoleCollapsed: false,
  currentAgent: null,
  currentProject: null,
  currentWorkflow: null,
  messages: [],
  logs: [],
  notifications: [],
  isWorkflowRunning: false,
  availableWorkflows: {}
};

// Données de test
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'CodeMaster',
    role: 'Frontend Developer',
    status: 'active',
    avatar: '👨‍💻',
    description: 'Expert en React, TypeScript et UI/UX moderne',
    capabilities: ['React', 'TypeScript', 'CSS', 'UI/UX', 'Performance'],
    lastActivity: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'BackendPro',
    role: 'Backend Developer',
    status: 'idle',
    avatar: '🔧',
    description: 'Spécialiste APIs, bases de données et architecture',
    capabilities: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'Docker'],
    lastActivity: '2024-01-15T09:45:00Z'
  },
  {
    id: '3',
    name: 'DesignGuru',
    role: 'UI/UX Designer',
    status: 'busy',
    avatar: '🎨',
    description: 'Design moderne et expérience utilisateur optimale',
    capabilities: ['Figma', 'Design System', 'Prototyping', 'User Research'],
    lastActivity: '2024-01-15T11:00:00Z'
  },
  {
    id: '4',
    name: 'DataWizard',
    role: 'Data Analyst',
    status: 'active',
    avatar: '📊',
    description: 'Analyse de données et intelligence artificielle',
    capabilities: ['Python', 'SQL', 'Machine Learning', 'Data Viz', 'Statistics'],
    lastActivity: '2024-01-15T10:15:00Z'
  }
];

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'E-commerce Platform',
    description: 'Plateforme e-commerce moderne avec React et Node.js',
    type: 'fullstack',
    status: 'active',
    lastModified: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-10T09:00:00Z',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
    files: [
      {
        id: '1',
        name: 'frontend',
        type: 'folder',
        path: '/frontend',
        lastModified: '2024-01-15T10:30:00Z',
        children: [
          {
            id: '2',
            name: 'App.tsx',
            type: 'file',
            language: 'typescript',
            content: 'import React from "react";\n\nfunction App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;',
            path: '/frontend/App.tsx',
            lastModified: '2024-01-15T10:30:00Z',
            size: 125
          },
          {
            id: '3',
            name: 'components',
            type: 'folder',
            path: '/frontend/components',
            lastModified: '2024-01-15T10:25:00Z',
            children: [
              {
                id: '4',
                name: 'Header.tsx',
                type: 'file',
                language: 'typescript',
                content: 'import React from "react";\n\nexport const Header = () => {\n  return <header>Header</header>;\n};',
                path: '/frontend/components/Header.tsx',
                lastModified: '2024-01-15T10:25:00Z',
                size: 98
              }
            ]
          }
        ]
      },
      {
        id: '5',
        name: 'backend',
        type: 'folder',
        path: '/backend',
        lastModified: '2024-01-15T10:20:00Z',
        children: [
          {
            id: '6',
            name: 'server.js',
            type: 'file',
            language: 'javascript',
            content: 'const express = require("express");\nconst app = express();\n\napp.get("/", (req, res) => {\n  res.json({ message: "Hello World" });\n});\n\napp.listen(3000);',
            path: '/backend/server.js',
            lastModified: '2024-01-15T10:20:00Z',
            size: 156
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Dashboard Analytics',
    description: 'Dashboard d\'analyse avec graphiques interactifs',
    type: 'frontend',
    status: 'completed',
    lastModified: '2024-01-12T15:30:00Z',
    createdAt: '2024-01-08T14:00:00Z',
    technologies: ['React', 'Chart.js', 'TailwindCSS'],
    files: []
  }
];

const mockWorkflows: Record<string, AvailableWorkflow> = {
  'frontend-component': {
    name: 'Composant Frontend',
    description: 'Créer un composant React moderne avec TypeScript',
    steps: ['Analyse', 'Design', 'Code', 'Test', 'Documentation'],
    category: 'Frontend',
    icon: '🖥️'
  },
  'backend-api': {
    name: 'API Backend',
    description: 'Développer une API REST avec Node.js et Express',
    steps: ['Conception', 'Modèles', 'Routes', 'Middleware', 'Tests'],
    category: 'Backend',
    icon: '🔧'
  },
  'fullstack-app': {
    name: 'Application Full-Stack',
    description: 'Créer une application complète frontend + backend',
    steps: ['Architecture', 'Backend', 'Frontend', 'Base de données', 'Tests', 'Déploiement'],
    category: 'Full-Stack',
    icon: '🚀'
  },
  'ui-design': {
    name: 'Design UI/UX',
    description: 'Créer un design moderne et responsive',
    steps: ['Recherche', 'Wireframes', 'Mockups', 'Prototypage', 'Guidelines'],
    category: 'Design',
    icon: '🎨'
  }
};

// Composant principal
const ModernAtelierIA = () => {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    availableWorkflows: mockWorkflows,
    currentAgent: mockAgents[0],
    currentProject: mockProjects[0]
  });

  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);

  // API base URL
  const API_BASE_URL = 'http://localhost:8000';

  // Charger les workflows disponibles
  const loadAvailableWorkflows = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/available`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({ type: 'SET_AVAILABLE_WORKFLOWS', payload: data.workflows });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des workflows:', error);
      addNotification('error', 'Erreur', 'Impossible de charger les workflows');
    }
  }, []);

  // Exécuter un workflow
  const executeWorkflow = useCallback(async (workflowType: string, description: string) => {
    dispatch({ type: 'SET_WORKFLOW_RUNNING', payload: true });
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: workflowType,
          description: description
        })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          addNotification('success', 'Workflow démarré', `Workflow "${workflowType}" lancé avec succès`);
          startWorkflowPolling(result.workflow_id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution du workflow:', error);
      dispatch({ type: 'SET_WORKFLOW_RUNNING', payload: false });
      addNotification('error', 'Erreur', 'Impossible d\'exécuter le workflow');
    }
  }, []);

  // Polling du workflow
  const startWorkflowPolling = useCallback((workflowId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/status`);
        if (response.ok) {
          const workflow = await response.json();
          dispatch({ type: 'SET_CURRENT_WORKFLOW', payload: workflow });
          if (workflow.status === 'completed' || workflow.status === 'failed') {
            dispatch({ type: 'SET_WORKFLOW_RUNNING', payload: false });
            clearInterval(pollInterval);
            if (workflow.status === 'completed') {
              addNotification('success', 'Workflow terminé', 'Le workflow s\'est terminé avec succès');
            } else {
              addNotification('error', 'Workflow échoué', 'Le workflow a échoué');
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du polling:', error);
        clearInterval(pollInterval);
        dispatch({ type: 'SET_WORKFLOW_RUNNING', payload: false });
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(pollInterval);
      dispatch({ type: 'SET_WORKFLOW_RUNNING', payload: false });
    }, 5 * 60 * 1000);
  }, []);

  // Ajouter une notification
  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      duration: 5000
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
    }, notification.duration);
  };

  // Envoyer un message
  const sendMessage = useCallback(() => {
    if (!inputMessage.trim() || !state.currentAgent) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    setInputMessage('');

    // Simuler une réponse d'agent
    setTimeout(() => {
      const agentResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Je vais vous aider avec : "${inputMessage}". Laissez-moi analyser votre demande et créer une solution adaptée.`,
        sender: 'agent',
        agentId: state.currentAgent?.id,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      dispatch({ type: 'ADD_MESSAGE', payload: agentResponse });
    }, 1000);
  }, [inputMessage, state.currentAgent]);

  // Ajouter un log
  const addLog = useCallback((level: 'info' | 'warn' | 'error' | 'success', message: string, source?: string) => {
    const log: ConsoleLog = {
      id: Date.now().toString(),
      level,
      message,
      timestamp: new Date().toISOString(),
      source
    };
    dispatch({ type: 'ADD_LOG', payload: log });
  }, []);

  // Initialisation
  useEffect(() => {
    loadAvailableWorkflows();
    addLog('info', 'Mon Atelier IA démarré', 'system');
  }, [loadAvailableWorkflows, addLog]);

  // Rendu des composants (inchangé)
  const renderSidebar = () => (
    /* ... */
    // Pas modifié dans ce patch.
  );

  const renderMainContent = () => (
    /* ... */
    // Pas modifié dans ce patch.
  );

  const renderConsole = () => (
    /* ... */
    // Pas modifié dans ce patch.
  );

  // 🔥 NE PAS DÉFINIR LA FONCTION renderNotifications ICI ! 🔥

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className={`h-screen bg-gray-950 text-white flex flex-col overflow-hidden ${
        state.theme === 'light' ? 'bg-gray-100 text-gray-900' : ''
      }`}>
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          {/* ... */}
        </header>
        
        <div className="flex flex-1 overflow-hidden">
          {renderSidebar()}
          {renderMainContent()}
        </div>
        
        {renderConsole()}

        {/* Utilise ton composant Notification UI */}
        <Notification notifications={state.notifications} dispatch={dispatch} />
      </div>
    </AppContext.Provider>
  );
};

export default ModernAtelierIA;
