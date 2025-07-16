import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Save, 
  Download, 
  Copy, 
  Maximize2, 
  Minimize2,
  Settings,
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';

interface ModernMonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onRun?: () => void;
  readOnly?: boolean;
  fileName?: string;
  height?: string | number;
  minimap?: boolean;
  lineNumbers?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
}

export const ModernMonacoEditor: React.FC<ModernMonacoEditorProps> = ({
  value,
  language,
  onChange,
  onSave,
  onRun,
  readOnly = false,
  fileName = 'untitled',
  height = '400px',
  minimap = false,
  lineNumbers = true,
  wordWrap = true,
  fontSize = 14
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState(fontSize);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('vs-dark');
  const editorRef = useRef<any>(null);
  const { theme } = useTheme();
  const { addNotification } = useNotifications();

  // Configuration Monaco avancée
  const editorOptions = {
    fontSize: currentFontSize,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontLigatures: true,
    lineHeight: 1.6,
    letterSpacing: 0.5,
    minimap: { enabled: minimap },
    lineNumbers: lineNumbers ? 'on' : 'off',
    wordWrap: wordWrap ? 'on' : 'off',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: true,
    cursorWidth: 2,
    selectionHighlight: true,
    occurrencesHighlight: true,
    renderIndentGuides: true,
    renderWhitespace: 'selection',
    guides: {
      indentation: true,
      highlightActiveIndentation: true
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on',
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    codeLens: true,
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'mouseover',
    matchBrackets: 'always',
    bracketPairColorization: {
      enabled: true
    },
    mouseWheelZoom: true,
    multiCursorModifier: 'ctrlCmd',
    scrollbar: {
      verticalScrollbarSize: 12,
      horizontalScrollbarSize: 12,
      useShadows: false
    },
    hover: {
      enabled: true,
      delay: 300
    },
    parameterHints: {
      enabled: true,
      cycle: true
    },
    formatOnPaste: true,
    formatOnType: true,
    lightbulb: {
      enabled: true
    },
    readOnly
  };

  // Gestion des thèmes Monaco
  const monacoThemes = {
    dark: 'vs-dark',
    light: 'vs',
    'matrix': 'matrix-dark',
    'cyberpunk': 'cyberpunk-dark',
    'github': 'github-dark'
  };

  // Configuration des thèmes personnalisés
  const defineCustomThemes = (monaco: any) => {
    // Thème Matrix
    monaco.editor.defineTheme('matrix-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '00ff4180', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00ff41', fontStyle: 'bold' },
        { token: 'string', foreground: '00d4aa' },
        { token: 'number', foreground: '50fa7b' },
        { token: 'type', foreground: '00ff41' },
        { token: 'class', foreground: '00d4aa', fontStyle: 'bold' },
        { token: 'function', foreground: '50fa7b' },
        { token: 'variable', foreground: 'ffffff' },
        { token: 'operator', foreground: '00ff41' }
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#00ff4110',
        'editor.selectionBackground': '#00ff4130',
        'editor.inactiveSelectionBackground': '#00ff4115',
        'editorCursor.foreground': '#00ff41',
        'editorLineNumber.foreground': '#00ff4160',
        'editorLineNumber.activeForeground': '#00ff41',
        'editor.findMatchBackground': '#00ff4130',
        'editor.findMatchHighlightBackground': '#00ff4120'
      }
    });

    // Thème Cyberpunk
    monaco.editor.defineTheme('cyberpunk-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: 'ff6b9d80', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff073a', fontStyle: 'bold' },
        { token: 'string', foreground: '39ff14' },
        { token: 'number', foreground: 'ff6b9d' },
        { token: 'type', foreground: 'ff073a' },
        { token: 'class', foreground: '39ff14', fontStyle: 'bold' },
        { token: 'function', foreground: 'ff6b9d' },
        { token: 'variable', foreground: 'ffffff' },
        { token: 'operator', foreground: 'ff073a' }
      ],
      colors: {
        'editor.background': '#0f0f0f',
        'editor.foreground': '#ffffff',
        'editor.lineHighlightBackground': '#ff073a20',
        'editor.selectionBackground': '#ff073a30',
        'editor.inactiveSelectionBackground': '#ff073a15',
        'editorCursor.foreground': '#ff073a',
        'editorLineNumber.foreground': '#ff073a60',
        'editorLineNumber.activeForeground': '#ff073a'
      }
    });

    // Thème GitHub Dark
    monaco.editor.defineTheme('github-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72', fontStyle: 'bold' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'class', foreground: 'ffa657', fontStyle: 'bold' },
        { token: 'function', foreground: 'd2a8ff' },
        { token: 'variable', foreground: 'ffa657' }
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#79c0ff',
        'editorLineNumber.foreground': '#6e7681',
        'editorLineNumber.activeForeground': '#c9d1d9'
      }
    });
  };

  // Actions de l'éditeur
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(value);
    addNotification('success', 'Code copié', 'Le code a été copié dans le presse-papiers');
  }, [value, addNotification]);

  const downloadFile = useCallback(() => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('success', 'Fichier téléchargé', `${fileName} a été téléchargé`);
  }, [value, fileName, addNotification]);

  const formatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
      addNotification('success', 'Code formaté', 'Le code a été formaté automatiquement');
    }
  }, [addNotification]);

  const resetEditor = useCallback(() => {
    setCurrentFontSize(fontSize);
    setCurrentTheme('vs-dark');
    addNotification('info', 'Éditeur réinitialisé', 'Paramètres par défaut restaurés');
  }, [fontSize, addNotification]);

  // Gestion des raccourcis clavier
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Définir les thèmes personnalisés
    defineCustomThemes(monaco);
    
    // Actions personnalisées
    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        onSave?.();
        addNotification('success', 'Fichier sauvegardé', fileName);
      }
    });

    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        onRun?.();
        addNotification('info', 'Code exécuté', 'Le code est en cours d\'exécution');
      }
    });

    editor.addAction({
      id: 'format-document',
      label: 'Format Document',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      run: formatCode
    });

    // Configuration des snippets TypeScript/JavaScript
    if (language === 'typescript' || language === 'javascript') {
      monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: () => ({
          suggestions: [
            {
              label: 'useState',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'React useState hook'
            },
            {
              label: 'useEffect',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'useEffect(() => {\n\t${1:// effect}\n\treturn () => {\n\t\t${2:// cleanup}\n\t};\n}, [${3:dependencies}]);',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'React useEffect hook'
            },
            {
              label: 'component',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'const ${1:ComponentName}: React.FC = () => {\n\treturn (\n\t\t<div>\n\t\t\t${2:content}\n\t\t</div>\n\t);\n};\n\nexport default ${1:ComponentName};',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'React functional component'
            },
            {
              label: 'asyncFunction',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'const ${1:functionName} = async (${2:params}) => {\n\ttry {\n\t\t${3:// async code}\n\t} catch (error) {\n\t\tconsole.error(error);\n\t}\n};',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Async function with error handling'
            }
          ]
        })
      });
    }

    // Focus automatique
    editor.focus();
  };

  // Interface utilisateur
  return (
    <motion.div 
      className={`relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden ${
        isMaximized ? 'fixed inset-4 z-50' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header de l'éditeur */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 cursor-pointer" />
            <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 cursor-pointer" />
            <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 cursor-pointer" />
          </div>
          
          {/* Informations du fichier */}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">{fileName}</span>
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
              {language}
            </span>
          </div>
        </div>
        
        {/* Actions de l'éditeur */}
        <div className="flex items-center gap-1">
          {/* Contrôles de zoom */}
          <button
            onClick={() => setCurrentFontSize(prev => Math.max(8, prev - 1))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Diminuer la taille"
          >
            <ZoomOut className="w-4 h-4 text-gray-400" />
          </button>
          
          <span className="text-xs text-gray-400 px-2">{currentFontSize}px</span>
          
          <button
            onClick={() => setCurrentFontSize(prev => Math.min(24, prev + 1))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Augmenter la taille"
          >
            <ZoomIn className="w-4 h-4 text-gray-400" />
          </button>
          
          <div className="w-px h-6 bg-gray-700 mx-1" />
          
          {/* Actions principales */}
          <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Copier (Ctrl+C)"
          >
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
          
          <button
            onClick={downloadFile}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Télécharger"
          >
            <Download className="w-4 h-4 text-gray-400" />
          </button>
          
          <button
            onClick={formatCode}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Formater (Ctrl+Shift+F)"
          >
            <Code2 className="w-4 h-4 text-gray-400" />
          </button>
          
          {onSave && (
            <button
              onClick={onSave}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Sauvegarder (Ctrl+S)"
            >
              <Save className="w-4 h-4 text-blue-400" />
            </button>
          )}
          
          {onRun && (
            <button
              onClick={onRun}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Exécuter (Ctrl+Enter)"
            >
              <Play className="w-4 h-4 text-green-400" />
            </button>
          )}
          
          <div className="w-px h-6 bg-gray-700 mx-1" />
          
          {/* Paramètres */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${
              showSettings ? 'bg-gray-700' : ''
            }`}
            title="Paramètres"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
          
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title={isMaximized ? 'Réduire' : 'Agrandir'}
          >
            {isMaximized ? 
              <Minimize2 className="w-4 h-4 text-gray-400" /> : 
              <Maximize2 className="w-4 h-4 text-gray-400" />
            }
          </button>
        </div>
      </div>
      
      {/* Panneau de paramètres */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-800 border-b border-gray-700 p-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Thème
                </label>
                <select
                  value={currentTheme}
                  onChange={(e) => setCurrentTheme(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="vs-dark">Dark</option>
                  <option value="vs">Light</option>
                  <option value="matrix-dark">Matrix</option>
                  <option value="cyberpunk-dark">Cyberpunk</option>
                  <option value="github-dark">GitHub Dark</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Taille police
                </label>
                <input
                  type="range"
                  min="8"
                  max="24"
                  value={currentFontSize}
                  onChange={(e) => setCurrentFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={resetEditor}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Éditeur Monaco */}
      <div className="relative">
        <Editor
          height={isMaximized ? 'calc(100vh - 200px)' : height}
          theme={currentTheme}
          language={language}
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            ...editorOptions,
            fontSize: currentFontSize
          }}
          loading={
            <div className="flex items-center justify-center h-64 bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400">Chargement de Monaco Editor...</span>
              </div>
            </div>
          }
        />
        
        {/* Overlay d'informations */}
        <div className="absolute bottom-2 right-4 flex items-center gap-4 text-xs text-gray-500 bg-gray-800/80 backdrop-blur-sm rounded px-3 py-1">
          <span>Lignes: {value.split('\n').length}</span>
          <span>Caractères: {value.length}</span>
          <span>UTF-8</span>
        </div>
      </div>
    </motion.div>
  );
};

// src/services/api.ts
const API_BASE_URL = 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || response.statusText,
        errorData
      );
    }

    return response.json();
  }

  // Workflows
  async getAvailableWorkflows() {
    return this.request('/workflows/available');
  }

  async startWorkflow(workflowType: string, description: string) {
    return this.request('/workflows/start', {
      method: 'POST',
      body: JSON.stringify({
        workflow_type: workflowType,
        description: description
      })
    });
  }

  async getWorkflowStatus(workflowId: string) {
    return this.request(`/workflows/${workflowId}/status`);
  }

  async stopWorkflow(workflowId: string) {
    return this.request(`/workflows/${workflowId}/stop`, {
      method: 'POST'
    });
  }

  // Agents
  async chatWithAgent(message: string, agentType: string = 'assistant') {
    return this.request('/agent', {
      method: 'POST',
      body: JSON.stringify({
        message,
        agent: agentType
      })
    });
  }

  async getAgentStatus() {
    return this.request('/agent/status');
  }

  // Files
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData
    }).then(res => res.json());
  }

  async downloadFile(fileId: string) {
    return this.request(`/files/${fileId}/download`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();

// src/hooks/useNotifications.ts
import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (type: Notification['type'], title: string, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotifications = create<NotificationStore>((set, get) => ({
  notifications: [],
  
  addNotification: (type, title, message, duration = 5000) => {
    const notification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      duration,
      timestamp: new Date().toISOString()
    };
    
    set(state => ({
      notifications: [...state.notifications, notification]
    }));
    
    // Auto-remove après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(notification.id);
      }, duration);
    }
  },
  
  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  
  clearAll: () => {
    set({ notifications: [] });
  }
}));

// src/hooks/useWorkflow.ts
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useNotifications } from './useNotifications';

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

export const useWorkflow = () => {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowResult | null>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  // Charger les workflows disponibles
  const loadAvailableWorkflows = useCallback(async () => {
    try {
      const response = await apiService.getAvailableWorkflows();
      if (response.success) {
        setAvailableWorkflows(response.workflows);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des workflows:', error);
      setError('Impossible de charger les workflows disponibles');
      addNotification('error', 'Erreur', 'Impossible de charger les workflows');
    }
  }, [addNotification]);

  // Exécuter un workflow
  const executeWorkflow = useCallback(async (workflowType: string, description: string) => {
    setIsExecuting(true);
    setError(null);
    
    try {
      const response = await apiService.startWorkflow(workflowType, description);
      if (response.success) {
        addNotification('success', 'Workflow démarré', `Workflow "${workflowType}" lancé avec succès`);
        startPolling(response.workflow_id);
        return response.workflow_id;
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution du workflow:', error);
      setError('Échec de l\'exécution du workflow');
      setIsExecuting(false);
      addNotification('error', 'Erreur', 'Impossible d\'exécuter le workflow');
    }
  }, [addNotification]);

  // Polling du statut
  const startPolling = useCallback((workflowId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const workflow = await apiService.getWorkflowStatus(workflowId);
        setCurrentWorkflow(workflow);
        
        if (workflow.status === 'completed' || workflow.status === 'failed') {
          setIsExecuting(false);
          clearInterval(pollInterval);
          
          if (workflow.status === 'completed') {
            addNotification('success', 'Workflow terminé', 'Le workflow s\'est terminé avec succès');
          } else {
            addNotification('error', 'Workflow échoué', 'Le workflow a échoué');
          }
        }
      } catch (error) {
        console.error('Erreur lors du polling:', error);
        clearInterval(pollInterval);
        setIsExecuting(false);
        setError('Erreur lors du suivi du workflow');
      }
    }, 1000);

    // Timeout après 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsExecuting(false);
    }, 5 * 60 * 1000);
  }, [addNotification]);

  // Arrêter un workflow
  const stopWorkflow = useCallback(async (workflowId: string) => {
    try {
      await apiService.stopWorkflow(workflowId);
      setIsExecuting(false);
      setCurrentWorkflow(null);
      addNotification('info', 'Workflow arrêté', 'Le workflow a été arrêté');
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du workflow:', error);
      addNotification('error', 'Erreur', 'Impossible d\'arrêter le workflow');
    }
  }, [addNotification]);

  // Initialisation
  useEffect(() => {
    loadAvailableWorkflows();
  }, [loadAvailableWorkflows]);

  return {
    currentWorkflow,
    availableWorkflows,
    isExecuting,
    error,
    executeWorkflow,
    stopWorkflow,
    loadAvailableWorkflows
  };
};

// src/hooks/useTheme.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  theme: 'dark' | 'light' | 'matrix' | 'cyberpunk';
  fontSize: number;
  fontFamily: string;
  sidebarCollapsed: boolean;
  consoleCollapsed: boolean;
  setTheme: (theme: ThemeStore['theme']) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setConsoleCollapsed: (collapsed: boolean) => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  theme: 'dark' as const,
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  sidebarCollapsed: false,
  consoleCollapsed: false
};

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      setTheme: (theme) => {
        set({ theme });
        // Appliquer le thème au document
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      },
      
      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setConsoleCollapsed: (consoleCollapsed) => set({ consoleCollapsed }),
      
      resetToDefaults: () => {
        set(defaultSettings);
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      }
    }),
    {
      name: 'mon-atelier-ia-theme'
    }
  )
);