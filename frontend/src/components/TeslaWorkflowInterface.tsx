import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Code, 
  Eye, 
  Terminal,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Zap,
  Brain,
  Settings,
  Monitor,
  Sparkles,
  Target,
  PanelRightClose,
  PanelRightOpen,
  Clock,
  TrendingUp,
  Shield,
  Key,
  FileText,
  Copy,
  Download,
  Maximize2,
  X
} from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';

// Import des nouveaux composants UX
import { useNotifications } from '../hooks/useNotifications';
import { useAuth, useAuthenticatedRequest } from '../hooks/useAuth';
import NotificationSystem from './ui/NotificationSystem';
import StatusIndicator, { StatusBar, ActionButton, WorkflowProgress } from './ui/StatusIndicator';
import ConfigurationPanel from './ConfigurationPanel';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'workflow' | 'system';
  content: string;
  timestamp: Date;
  agent?: string;
  isStreaming?: boolean;
  workflowStep?: number;
  totalSteps?: number;
  isCode?: boolean;
  codeLanguage?: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  result?: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  isActive: boolean;
  specialization: string[];
}

const TeslaWorkflowInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  
  // Références pour optimiser le streaming et éviter les tremblements
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingBufferRef = useRef<string>('');
  
  // États principaux (déclarés avant les effets qui les utilisent)
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(true); // Forcer l'affichage dès le démarrage
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  // États pour la conversation contextuelle
  const [isInDiscoveryMode, setIsInDiscoveryMode] = useState(false);
  const [conversationExchangeCount, setConversationExchangeCount] = useState(0);
  const [discoveryContext, setDiscoveryContext] = useState<{
    originalPrompt: string;
    projectType: string;
    gatheredInfo: Record<string, any>;
    questionsAsked: string[];
    conversationStep: number;
  } | null>(null);
  const [aiPersonality, setAiPersonality] = useState('friendly'); // friendly, professional, creative
  
  // Effet de nettoyage pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      streamingBufferRef.current = '';
      if (websocket) {
        websocket.close();
      }
    };
  }, [websocket]);
  
  // Références
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // États pour Monaco Editor et Preview
  const [generatedCode, setGeneratedCode] = useState(`// 🚀 Atelier IA - Code Generator
// Votre code généré apparaîtra ici

import React from 'react';

const MonApplication: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenue dans votre application IA
        </h1>
        <p className="text-xl text-gray-600">
          Décrivez votre projet pour commencer la génération
        </p>
      </div>
    </div>
  );
};

export default MonApplication;`);
  const [generatedHtml, setGeneratedHtml] = useState<string>(''); // HTML pour la preview
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [currentNotificationId, setCurrentNotificationId] = useState<string | null>(null);
  const [showCodeEditor, setShowCodeEditor] = useState(true); // Forcer l'affichage du code editor
  const [editorView, setEditorView] = useState<'workflow' | 'code' | 'preview' | 'config'>('workflow'); // Démarrer sur la vue workflow
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  // Système de fichiers du projet
  const [projectFiles, setProjectFiles] = useState<Record<string, any>>({});
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<Array<{name: string, content: string, language: string}>>([]);
  const [showFileExplorer, setShowFileExplorer] = useState(true);

  // Hooks pour l'UX améliorée
  const notifications = useNotifications();
  // const { isAuthenticated, user, hasPermission } = useAuth();
  
  // Valeurs temporaires pour les tests
  const isAuthenticated = true;
  const user = { id: 'test', name: 'Test User' };
  const hasPermission = () => true;
  // const { request } = useAuthenticatedRequest();
  
  // Initialiser le service ChatGPT streaming au démarrage
  useEffect(() => {
    const initializeStreaming = async () => {
      try {
        const response = await fetch('http://localhost:8005/ultra/debug', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🚀 Nouveau système simple initialisé:', data);
        } else {
          console.warn('⚠️ Échec initialisation nouveau système');
        }
      } catch (error) {
        console.warn('⚠️ Erreur initialisation nouveau système:', error);
      }
    };

    initializeStreaming();
  }, []);
  
  // Fonction temporaire sans auth pour les tests - NOUVEAU BACKEND PORT 8002
  const request = async (url: string, options: any = {}) => {
    const response = await fetch(`http://localhost:8011${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  };

  const agents: Agent[] = [
    {
      id: 'frontend',
      name: 'Frontend',
      description: 'React/TypeScript Developer',
      icon: <Monitor className="w-5 h-5" />,
      color: '#dc2626',
      isActive: true,
      specialization: ['react', 'typescript', 'ui']
    },
    {
      id: 'backend',
      name: 'Backend',
      description: 'Python/FastAPI Developer',
      icon: <Terminal className="w-5 h-5" />,
      color: '#dc2626',
      isActive: true,
      specialization: ['fastapi', 'python', 'database']
    },
    {
      id: 'designer',
      name: 'Designer',
      description: 'UI/UX Designer',
      icon: <Sparkles className="w-5 h-5" />,
      color: '#dc2626',
      isActive: true,
      specialization: ['ui_design', 'ux', 'css']
    }
  ];

  // Référence pour optimiser le scroll
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const scrollToBottom = () => {
    // Utiliser un délai pour éviter les scrolls trop fréquents
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Générer le preview automatiquement quand le code change
  useEffect(() => {
    if (generatedCode && generatedCode.trim() !== '') {
      setPreviewContent(generatePreviewHTML(generatedCode));
      setShowPreview(true);
    }
  }, [generatedCode]);

  // WebSocket connection pour système ultra-révolutionnaire
  const connectUltraWebSocket = useCallback((workflowId: string) => {
    setConnectionStatus('connecting');
    const ws = new WebSocket(`ws://localhost:8011/ultra/ws/${workflowId}`);
    
    ws.onopen = () => {
      console.log('🌊 WebSocket connecté');
      setWebsocket(ws);
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket ultra message:', data);
        
        // Validation des données reçues
        if (!data || typeof data !== 'object') {
          console.warn('⚠️ Données WebSocket invalides:', data);
          return;
        }

        // Traitement spécifique pour le système ultra-révolutionnaire
        console.log('📨 Type de message WebSocket:', data.type, 'Contenu:', data.content);
        
        switch (data.type) {
          case 'workflow_started':
            const startMessage: Message = {
              id: `ws_start_${Date.now()}`,
              type: 'system',
              content: `🚀 Workflow ultra-révolutionnaire démarré ! Agent: ${data.agent}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, startMessage]);
            break;

          case 'agent_streaming':
            console.log('🌊 Message de streaming reçu:', data.content);
            const streamMessage: Message = {
              id: `ws_stream_${Date.now()}`,
              type: 'assistant',
              content: data.content || 'Génération en cours...',
              timestamp: new Date(),
              agent: data.agent,
              isStreaming: true
            };
            setMessages(prev => [...prev, streamMessage]);
            break;

          case 'workflow_completed':
            const completeMessage: Message = {
              id: `ws_complete_${Date.now()}`,
              type: 'system',
              content: `✅ Workflow terminé ! ${data.files_count} fichiers générés`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, completeMessage]);
            break;

          case 'workflow_error':
            console.error('❌ WORKFLOW ERROR DÉTAILS:', data);
            const errorMessage: Message = {
              id: `ws_error_${Date.now()}`,
              type: 'system',
              content: `❌ Erreur workflow: ${data.error || 'Erreur inconnue'}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            break;

          default:
            // Messages génériques avec logging
            console.log('📨 Message WebSocket non reconnu:', data);
            const genericMessage: Message = {
              id: `ws_${Date.now()}`,
              type: 'system',
              content: `📨 ${data.type}: ${JSON.stringify(data).substring(0, 100)}...`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, genericMessage]);
        }
        
      } catch (error) {
        console.error('Erreur parsing WebSocket ultra:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket ultra déconnecté');
      setWebsocket(null);
      setConnectionStatus('disconnected');
    };

    ws.onerror = (error) => {
      console.error('❌ Erreur WebSocket ultra:', error);
      setConnectionStatus('disconnected');
    };

  }, []);

  const startWorkflow = async () => {
    if (!input.trim() || isWorkflowRunning) return;
    
    console.log('🎯 START WORKFLOW appelé avec:', input.trim());

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    
    // Reset counter si c'est une nouvelle conversation (pas en mode discovery)
    if (!isInDiscoveryMode) {
      setConversationExchangeCount(0);
    }
    
    // Vérifier si on est en mode découverte
    if (isInDiscoveryMode) {
      // Traiter la réponse dans le contexte de la découverte
      await handleDiscoveryResponse(currentInput);
      return;
    }
    
    // TOUJOURS démarrer par une conversation avec le Chef d'Orchestre
    console.log('🎯 Démarrage de la conversation avec le Chef d\'Orchestre...');
    
    try {
      const data = await request('/ultra/chat', {
        method: 'POST',
        body: JSON.stringify({  
          message: currentInput,
          agent: 'project_orchestrator'
        })
      });
      
      if (data && data.response) {
        const orchestratorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          agent: 'project_orchestrator'
        };
        
        setMessages(prev => [...prev, orchestratorMessage]);
        
        // Debug : voir la réponse exacte du Chef d'Orchestre
        console.log('🔍 Réponse Chef d\'Orchestre (startWorkflow):', data.response);
        
        // Vérifier si le Chef d'Orchestre dit qu'il lance l'Agent Développeur IA
        const responseText = data.response.toLowerCase();
        const shouldLaunchDeveloper = responseText.includes('je lance l\'agent développeur ia') ||
                                    responseText.includes('je lance le agent développeur') ||
                                    responseText.includes('lance l\'agent développeur') ||
                                    responseText.includes('lance le agent développeur') ||
                                    responseText.includes('lancer le développement') ||
                                    responseText.includes('commencer le développement') ||
                                    responseText.includes('développer votre') ||
                                    responseText.includes('créer cette') ||
                                    responseText.includes('assez d\'informations') ||
                                    responseText.includes('j\'ai tout ce qu\'il faut') ||
                                    responseText.includes('on peut commencer') ||
                                    (responseText.includes('parfait') && responseText.includes('lance')) ||
                                    (responseText.includes('excellent') && responseText.includes('lance')) ||
                                    (responseText.includes('super') && responseText.includes('lance')) ||
                                    (responseText.includes('c\'est parti') && responseText.includes('développ')) ||
                                    (responseText.includes('allons-y') && responseText.includes('créer'));
        
        console.log('🔍 shouldLaunchDeveloper (startWorkflow):', shouldLaunchDeveloper);
        
        if (shouldLaunchDeveloper) {
          console.log('🚀 Chef d\'Orchestre lance l\'Agent Développeur IA ! (startWorkflow)');
          
          // Créer un prompt enrichi avec toute la conversation
          const conversationHistory = messages
            .filter(msg => msg.type === 'user')
            .map(msg => msg.content)
            .join(' ');
          
          const enrichedPrompt = `${conversationHistory} ${currentInput}`;
          
          console.log('🔍 Prompt enrichi (startWorkflow):', enrichedPrompt);
          
          // Lancer le workflow avec l'Agent Développeur IA
          setTimeout(async () => {
            console.log('🚀 Appel launchQuantumDeveloper (startWorkflow)...');
            await launchQuantumDeveloper(enrichedPrompt);
          }, 1000);
          
          setIsInDiscoveryMode(false);
        } else {
          console.log('⏸️ Pas de signal de lancement détecté (startWorkflow), entrer en mode conversationnel...');
          // Incrémenter le compteur d'échanges
          const newExchangeCount = conversationExchangeCount + 1;
          setConversationExchangeCount(newExchangeCount);
          
          console.log('🔢 Nombre d\'échanges de conversation:', newExchangeCount);
          
          // Force launch après 5 échanges (augmenté pour laisser plus de temps)
          if (newExchangeCount >= 5) {
            console.log('🚀 FORCE LAUNCH: 5 échanges atteints, lancement automatique du développeur !');
            const conversationHistory = messages
              .filter(msg => msg.type === 'user')
              .map(msg => msg.content)
              .join(' ');
            
            const enrichedPrompt = `${conversationHistory} ${currentInput}`;
            
            setTimeout(async () => {
              await launchQuantumDeveloper(enrichedPrompt);
            }, 1000);
            
            setIsInDiscoveryMode(false);
            setConversationExchangeCount(0);
            return;
          }
          
          // Entrer en mode conversationnel si ce n'est pas déjà fait
          if (!isInDiscoveryMode) {
            setIsInDiscoveryMode(true);
            setDiscoveryContext({
              originalPrompt: currentInput,
              projectType: detectProjectType(currentInput),
              aiPersonality: selectAIPersonality(currentInput),
              conversationStep: 1,
              questionsAsked: [],
              gatheredInfo: {},
              userPreferences: {}
            });
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur conversation orchestrateur:', error);
      notifications.error('Erreur de communication', 'Impossible de contacter le Chef d\'Orchestre');
    }
    
  }; // Fin de la fonction startWorkflow - utilise toujours le mode conversationnel

  // Fonction pour lancer l'Agent Développeur IA après la conversation
  const launchQuantumDeveloper = async (enrichedPrompt: string) => {
    console.log('🚀 Lancement de l\'Agent Développeur IA avec prompt:', enrichedPrompt);
    setIsWorkflowRunning(true);
    setShowWorkflowPanel(true);
    
    try {
      const data = await request('/ultra/workflow/start', {
        method: 'POST',
        body: JSON.stringify({
          prompt: enrichedPrompt,
          agent_id: 'quantum_developer'
        })
      });

      if (data && data.success) {
        console.log('🚀 Workflow Agent Développeur IA démarré:', data);
        
        setCurrentWorkflowId(data.workflow_id);
        
        const steps = [{
          id: 'step_quantum',
          name: 'Agent Développeur IA',
          agent: 'quantum_developer',
          status: 'pending' as const,
          progress: 0
        }];
        
        setWorkflowSteps(steps);
        
        const workflowMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'workflow',
          content: `🚀 Agent Développeur IA lancé ! Génération en cours...`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, workflowMessage]);
        
        // Connecter WebSocket pour le streaming
        const ultraWs = new WebSocket(`ws://localhost:8011/ultra/ws/${data.workflow_id}`);
        
        ultraWs.onopen = () => {
          console.log('🌊 WebSocket connecté pour Agent Développeur IA');
        };
        
        ultraWs.onmessage = (event) => {
          try {
            const wsData = JSON.parse(event.data);
            console.log('📨 Stream reçu:', wsData.type);
            
            if (wsData.type === 'workflow_completed') {
              console.log('✅ Génération terminée !');
              
              setIsWorkflowRunning(false);
              
              // Récupérer les fichiers
              setTimeout(async () => {
                try {
                  const filesResponse = await request(`/ultra/workflow/${wsData.workflow_id}/files`);
                  
                  if (filesResponse.files && Object.keys(filesResponse.files).length > 0) {
                    const filesList = Object.entries(filesResponse.files).map(([path, file]) => ({
                      path,
                      content: file.content,
                      language: file.language
                    }));
                    
                    setGeneratedFiles(filesList);
                    
                    if (filesList.length > 0) {
                      setSelectedFile(filesList[0]);
                    }
                    
                    const previewHtml = generatePreviewFromFiles(filesList);
                    setPreviewContent(previewHtml);
                    
                    const completionMessage: Message = {
                      id: `completion_${Date.now()}`,
                      type: 'system',
                      content: `✅ **Projet créé avec succès !** ${filesList.length} fichier(s) généré(s).\n\n🎬 **Consultez l'onglet Preview Live !**`,
                      timestamp: new Date()
                    };
                    
                    setMessages(prev => [...prev, completionMessage]);
                    notifications.success('Génération réussie', `${filesList.length} fichier(s) créé(s) !`);
                  }
                } catch (error) {
                  console.error('❌ Erreur récupération fichiers:', error);
                }
              }, 1000);
            }
          } catch (error) {
            console.error('❌ Erreur parsing WebSocket:', error);
          }
        };
        
        ultraWs.onclose = () => {
          console.log('🌊 WebSocket fermé');
          setIsWorkflowRunning(false);
        };
        
      }
    } catch (error) {
      console.error('❌ Erreur lancement Agent Développeur IA:', error);
      setIsWorkflowRunning(false);
      notifications.error('Erreur', 'Impossible de lancer l\'Agent Développeur IA');
    }
  };
  
  // Ancien code supprimé - maintenant on utilise toujours le Chef d'Orchestre
  
  const oldStartWorkflowCode = async () => {
    // Ancien code déplacé ici pour référence mais non utilisé
    try {
      // Essayer d'abord le workflow streaming avancé
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let workflowStarted = false;
      
      try {
        // ACTIVÉ: WebSocket streaming pour le système ultra-révolutionnaire
        console.log('🚀 STREAMING ACTIVÉ: Utilisation du WebSocket ultra-révolutionnaire');
        
        // Le streaming WebSocket sera géré après la création du workflow
        // Ne pas marquer comme démarré ici pour permettre la création
        
      } catch (streamingError) {
        console.log('⚠️ Workflow streaming non disponible, utilisation du fallback');
      }

      // Créer le workflow ultra-révolutionnaire
      if (!workflowStarted) {
        try {
          console.log('🚀 Démarrage du workflow ultra-révolutionnaire...');
          const data = await request('/ultra/workflow/start', {
            method: 'POST',
            body: JSON.stringify({
              prompt: currentInput,
              agent_id: 'quantum_developer'
            })
          });

          if (data && data.success) {
            console.log('🚀 Workflow ultra-révolutionnaire démarré:', data);
            
            setCurrentWorkflowId(data.workflow_id);
            workflowStarted = true;
            
            // Système ultra-simple n'a qu'un agent quantum_developer
            const steps = [{
              id: 'step_1',
              name: 'Agent Développeur IA',
              agent: 'quantum_developer',
              status: 'pending' as const,
              progress: 0
            }];
            
            setWorkflowSteps(steps);
            console.log('📋 Étape ultra-révolutionnaire initialisée:', steps);
            
            const workflowMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'workflow',
              content: `🚀 Workflow ultra-révolutionnaire démarré avec quantum_developer...`,
              timestamp: new Date()
            };

            setMessages(prev => [...prev, workflowMessage]);
            
            // Connecter WebSocket IMMÉDIATEMENT pour capturer tout le streaming
            console.log('🌊 Connexion WebSocket ultra IMMÉDIATE pour workflow:', data.workflow_id);
            
            // Connecter WebSocket dès que le workflow est créé
            const ultraWs = new WebSocket(`ws://localhost:8011/ultra/ws/${data.workflow_id}`);
            
            ultraWs.onopen = () => {
              console.log('🌊 WebSocket ultra connecté ! En attente du streaming...');
              const wsMessage: Message = {
                id: `ws_connect_${Date.now()}`,
                type: 'system',
                content: '🌊 Streaming temps réel activé ! En attente de la génération...',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, wsMessage]);
            };
            
            ultraWs.onmessage = (event) => {
              try {
                const wsData = JSON.parse(event.data);
                console.log('📨 🔥 STREAM ULTRA REÇU 🔥:', wsData.type, wsData);
                console.log('📨 🔥 DÉTAILS COMPLETS 🔥:', JSON.stringify(wsData, null, 2));
                
                const streamingMessageId = `streaming_${data.workflow_id}`;
                
                if (wsData.type === 'agent_streaming') {
                  console.log('🟢 AGENT STREAMING DÉTECTÉ !', wsData);
                  
                  // OPTIMISATION: Utiliser un délai pour éviter les re-renders trop fréquents
                  clearTimeout(streamingTimeoutRef.current);
                  
                  // Accumuler le contenu dans un buffer temporaire
                  streamingBufferRef.current += wsData.content || '';
                  const totalLength = wsData.accumulated_length || 0;
                  
                  // Mettre à jour le progress immédiatement (plus fluide)
                  const progressPercent = Math.min(90, Math.floor(totalLength / 50) + 10);
                  setWorkflowSteps(prev => prev.map(step => 
                    step.id === 'step_quantum' ? {
                      ...step,
                      progress: progressPercent,
                      status: 'running'
                    } : step
                  ));
                  
                  // Délai de mise à jour des messages pour éviter le tremblement
                  streamingTimeoutRef.current = setTimeout(() => {
                    setMessages(prev => {
                      const existingStreamIndex = prev.findIndex(msg => msg.id === streamingMessageId);
                      
                      if (existingStreamIndex >= 0) {
                        // Mettre à jour avec le buffer accumulé
                        const updatedMessages = [...prev];
                        const progressInfo = `🤖 **${wsData.agent} - Génération en cours** (${totalLength} tokens générés)\n\n`;
                        
                        updatedMessages[existingStreamIndex] = {
                          ...updatedMessages[existingStreamIndex],
                          content: progressInfo + streamingBufferRef.current,
                          timestamp: new Date(),
                          isStreaming: true
                        };
                        
                        return updatedMessages;
                      } else {
                        // Créer un nouveau message de streaming
                        const newStreamMessage: Message = {
                          id: streamingMessageId,
                          type: 'assistant',
                          content: `🤖 **${wsData.agent} - Démarrage de la génération...**\n\n` + streamingBufferRef.current,
                          timestamp: new Date(),
                          agent: wsData.agent,
                          isStreaming: true
                        };
                        
                        return [...prev, newStreamMessage];
                      }
                    });
                  }, 150); // Délai de 150ms pour fluidifier l'animation
                  
                } else if (wsData.type === 'workflow_started') {
                  console.log('🟢 WORKFLOW STARTED DÉTECTÉ !', wsData);
                  // Message de démarrage + mise à jour du progress
                  const startMessage: Message = {
                    id: `workflow_start_${data.workflow_id}`,
                    type: 'workflow',
                    content: `🚀 Workflow démarré ! Agent ${wsData.agent} analyse votre demande et génère le code...`,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, startMessage]);
                  
                  // Mettre à jour les étapes du workflow avec détails
                  setWorkflowSteps([{
                    id: 'step_quantum',
                    name: `${wsData.agent} - Analyse & Génération`,
                    agent: wsData.agent,
                    status: 'running',
                    progress: 10,
                    startTime: new Date()
                  }]);
                  
                } else if (wsData.type === 'workflow_completed') {
                  // Nettoyer les timeouts et buffers
                  clearTimeout(streamingTimeoutRef.current);
                  
                  // Marquer le streaming comme terminé avec le contenu final
                  setMessages(prev => {
                    const updatedMessages = prev.map(msg => {
                      if (msg.id === streamingMessageId) {
                        return {
                          ...msg,
                          content: `🤖 **${wsData.agent} - Génération terminée ✓**\n\n` + streamingBufferRef.current + '\n\n✅ **Extraction des fichiers...**',
                          isStreaming: false
                        };
                      }
                      return msg;
                    });
                    
                    // Ajouter message de completion détaillé et stylé
                    const fileCount = wsData.files_count || 0;
                    const completionMessage: Message = {
                      id: `workflow_complete_${data.workflow_id}`,
                      type: 'system',
                      content: `🎉 **Génération terminée !** ⚡\n\n` +
                               `📁 **${fileCount} fichier${fileCount !== 1 ? 's' : ''} créé${fileCount !== 1 ? 's' : ''}**\n` +
                               `🎬 **Preview automatique en cours...**\n` +
                               `🚀 **Basculez vers l'onglet Preview Live !**`,
                      timestamp: new Date()
                    };
                    
                    return [...updatedMessages, completionMessage];
                  });
                  
                  // Finaliser le progress
                  setWorkflowSteps(prev => prev.map(step => 
                    step.id === 'step_quantum' ? {
                      ...step,
                      progress: 100,
                      status: 'completed',
                      endTime: new Date()
                    } : step
                  ));
                  
                  // 🎬 GÉNÉRATION AUTOMATIQUE DE PREVIEW
                  setTimeout(async () => {
                    try {
                      console.log('🎬 Récupération automatique des fichiers pour preview...');
                      const filesResponse = await request(`/ultra/workflow/${data.workflow_id}/files`);
                      
                      if (filesResponse?.files && Object.keys(filesResponse.files).length > 0) {
                        console.log('🎬 Génération preview automatique...');
                        const previewHtml = generatePreviewHTMLFromFiles(filesResponse.files);
                        setPreviewContent(previewHtml);
                        setShowPreview(true);
                        
                        // Basculer automatiquement vers l'onglet Preview
                        setEditorView('preview');
                        
                        // Ajouter les fichiers à l'éditeur et au file explorer
                        const allFiles: Record<string, any> = {};
                        Object.entries(filesResponse.files).forEach(([path, file]: [string, any]) => {
                          allFiles[path] = {
                            content: file.content,
                            language: file.language
                          };
                        });
                        
                        setProjectFiles(allFiles);
                        
                        // Sélectionner le premier fichier par défaut
                        const firstFile = Object.keys(filesResponse.files)[0];
                        if (firstFile) {
                          setSelectedFile(firstFile);
                          setGeneratedCode(filesResponse.files[firstFile].content);
                          setCodeLanguage(filesResponse.files[firstFile].language);
                        }
                        
                        console.log('✅ Preview automatique générée et affichée !');
                        
                        // Message de confirmation
                        const previewMessage: Message = {
                          id: `preview_ready_${Date.now()}`,
                          type: 'system',
                          content: `🎬 Preview automatique générée ! Basculez vers l'onglet "Preview Live" pour voir le résultat.`,
                          timestamp: new Date()
                        };
                        setMessages(prev => [...prev, previewMessage]);
                        
                      } else {
                        console.warn('⚠️ Aucun fichier trouvé pour la preview');
                      }
                    } catch (error) {
                      console.error('❌ Erreur génération preview automatique:', error);
                    }
                  }, 1000); // Attendre 1 seconde pour que le workflow soit vraiment terminé
                  
                } else if (wsData.type === 'workflow_error') {
                  console.error('❌ STREAMING ERROR DÉTAILS:', wsData);
                  // Marquer le streaming comme en erreur
                  setMessages(prev => {
                    const updatedMessages = prev.map(msg => {
                      if (msg.id === streamingMessageId) {
                        return {
                          ...msg,
                          content: msg.content + `\n\n❌ **Erreur:** ${wsData.error}`,
                          isStreaming: false
                        };
                      }
                      return msg;
                    });
                    
                    return updatedMessages;
                  });
                }
                
              } catch (e) {
                console.error('❌ ERREUR WEBSOCKET ❌:', e);
                console.error('❌ EVENT DATA ❌:', event.data);
              }
            };
            
            ultraWs.onclose = () => {
              console.log('🔌 WebSocket ultra fermé');
              // Nettoyer les références au nettoyage
              clearTimeout(streamingTimeoutRef.current);
              streamingBufferRef.current = '';
            };
            
            ultraWs.onerror = (error) => {
              console.error('❌ Erreur WebSocket ultra:', error);
            };
            
            // Démarrer aussi le polling de backup
            console.log('📡 Démarrage du polling ultra pour workflow:', data.workflow_id);
            pollWorkflowSimple(data.workflow_id);
          }
        } catch (classicError) {
          console.error('Erreur workflow classique:', classicError);
        }
      }

      // Si ni streaming ni classique ne fonctionne, utiliser le chat simple
      if (!workflowStarted) {
        try {
          const data = await request('/ultra/chat', {
            method: 'POST',
            body: JSON.stringify({
              message: currentInput,
              agent: 'project_orchestrator'
            })
          });
          
          const chatMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: data.response,
            timestamp: new Date(),
            agent: 'frontend',
            isCode: data.response.includes('```') || data.response.includes('<') || data.response.includes('function') || data.response.includes('const ') || data.response.includes('import ')
          };

          setMessages(prev => [...prev, chatMessage]);
          
          // Toujours afficher Monaco Editor pour les tests
          setShowWorkflowPanel(true);
          setShowCodeEditor(true);
          
          // Si la réponse contient du code, l'ajouter à l'éditeur Monaco
          if (chatMessage.isCode) {
            setGeneratedCode(data.response);
            setShowCodeEditor(true);
            
            const codeMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: 'system',
              content: '📝 Code détecté et affiché dans l\'éditeur ci-dessus.',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, codeMessage]);
          } else {
            // Même sans code, afficher l'éditeur pour les tests
            setGeneratedCode(prev => prev + '\n\n// === Nouvelle réponse ===\n' + data.response);
            setShowCodeEditor(true);
            
            // Générer un preview HTML si possible
            if (data.response.includes('React') || data.response.includes('component')) {
              setPreviewContent(generatePreviewHTML(data.response));
              setShowPreview(true);
            }
            
            const editorMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: 'system',
              content: '📝 Éditeur de code disponible ci-dessus.',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, editorMessage]);
          }
          
          currentNotificationId && notifications.notifyWorkflowComplete(currentNotificationId, 'Chat simple', true);
        } catch (chatError) {
          console.error('Erreur chat simple:', chatError);
          currentNotificationId && notifications.notifyWorkflowComplete(currentNotificationId, 'Chat simple', false);
        }
        
        setIsWorkflowRunning(false);
      } else {
        // Workflow démarré avec succès
        notifications.success('Workflow démarré', 'Les agents spécialisés travaillent sur votre demande');
      }

    } catch (error) {
      console.error('Erreur démarrage workflow:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `❌ Erreur: ${error instanceof Error ? error.message : 'Impossible de démarrer le workflow'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      currentNotificationId && notifications.notifyWorkflowComplete(currentNotificationId, 'Workflow', false);
      setIsWorkflowRunning(false);
    }
  };
  
  // Fonction pour démarrer le workflow après les questions
  const simulateWorkflowProgress = async (workflowId: string, steps: WorkflowStep[]) => {
    try {
      console.log('🚀 Démarrage polling workflow:', workflowId);
      
      // Polling simple et efficace
      let workflowCompleted = false;
      let pollAttempts = 0;
      const maxPollAttempts = 60; // 2 minutes max
      
      while (!workflowCompleted && pollAttempts < maxPollAttempts) {
        pollAttempts++;
        
        try {
          const status = await request(`/ultra/workflow/${workflowId}/status`);
          console.log(`📊 Poll ${pollAttempts}: workflow status:`, status);
          
          if (status.steps) {
            // Mettre à jour l'état des étapes
            status.steps.forEach((backendStep: any, index: number) => {
              const stepId = `step_${index + 1}`;
              
              setWorkflowSteps(prev => prev.map(s => 
                s.id === stepId ? {
                  ...s,
                  status: backendStep.status === 'done' ? 'completed' :
                          backendStep.status === 'in_progress' ? 'running' : 
                          backendStep.status === 'error' ? 'error' : s.status,
                  progress: backendStep.status === 'done' ? 100 : 
                           backendStep.status === 'in_progress' ? 50 : s.progress
                } : s
              ));
              
              // Ajouter le résultat s'il existe et n'a pas été ajouté
              if (backendStep.status === 'done' && backendStep.result) {
                const resultMessage: Message = {
                  id: `result_${workflowId}_${index}`,
                  type: 'assistant',
                  content: backendStep.result,
                  timestamp: new Date(),
                  agent: backendStep.agent,
                  isCode: backendStep.result.includes('```') || backendStep.result.includes('import ') || backendStep.result.includes('const ')
                };
                
                // Vérifier si ce message n'existe pas déjà
                setMessages(prev => {
                  const exists = prev.some(msg => msg.id === resultMessage.id);
                  if (!exists) {
                    return [...prev, resultMessage];
                  }
                  return prev;
                });
                
                // Ajouter le code à l'éditeur si c'est du code
                if (resultMessage.isCode) {
                  setGeneratedCode(prev => {
                    if (!prev.includes(backendStep.result)) {
                      return prev + '\n\n' + backendStep.result;
                    }
                    return prev;
                  });
                  setShowCodeEditor(true);
                }
              }
            });
          }
          
          // Vérifier si le workflow est terminé (système ultra)
          if (status.state === 'completed') {
            workflowCompleted = true;
            console.log('✅ Workflow terminé avec succès !');
            
            // Récupérer les fichiers générés et générer la preview
            try {
              const filesResponse = await request(`/ultra/workflow/${workflowId}/files`);
              if (filesResponse.files && Object.keys(filesResponse.files).length > 0) {
                console.log('📁 Fichiers récupérés:', Object.keys(filesResponse.files));
                
                // Combiner tous les fichiers avec des séparateurs clairs pour Monaco
                const allCode = Object.entries(filesResponse.files)
                  .map(([filename, fileData]: [string, any]) => 
                    `// =================== ${filename} ===================\n${fileData.content || ''}`
                  ).join('\n\n');
                
                setGeneratedCode(allCode);
                setShowCodeEditor(true);
                
                // Stocker les fichiers du projet pour l'explorateur
                setProjectFiles(filesResponse.files);
                
                // Générer automatiquement la preview avec tous les fichiers
                console.log('🎬 Génération preview automatique...');
                const previewHtml = generatePreviewHTMLFromFiles(filesResponse.files);
                setPreviewContent(previewHtml);
                setShowPreview(true);
                
                // Sélectionner le premier fichier par défaut
                const firstFile = Object.keys(filesResponse.files)[0];
                if (firstFile) {
                  setSelectedFile(firstFile);
                  setGeneratedCode(filesResponse.files[firstFile].content);
                }
                
                const filesMessage: Message = {
                  id: `files_${workflowId}`,
                  type: 'system',
                  content: `📁 ${Object.keys(filesResponse.files).length} fichiers générés ! Code affiché dans l'éditeur et preview générée.`,
                  timestamp: new Date()
                };
                
                setMessages(prev => {
                  const exists = prev.some(msg => msg.id === filesMessage.id);
                  return exists ? prev : [...prev, filesMessage];
                });
              }
            } catch (filesError) {
              console.warn('Erreur récupération fichiers:', filesError);
            }
            
            // Message final stylé
            const completionMessage: Message = {
              id: `completion_${workflowId}`,
              type: 'system',
              content: '🎉 **Projet créé avec brio !** ✨\n\n🤖 **L\'IA révolutionnaire a fait des merveilles !**\n🎯 **Consultez votre code dans l\'éditeur Monaco**',
              timestamp: new Date()
            };
            
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === completionMessage.id);
              return exists ? prev : [...prev, completionMessage];
            });
            
            break;
          }
          
        } catch (pollError) {
          console.warn(`Erreur poll ${pollAttempts}:`, pollError);
        }
        
        // Attendre avant le prochain poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (!workflowCompleted) {
        console.warn('⚠️ Workflow timeout après', maxPollAttempts * 2, 'secondes');
      }
      
      setIsWorkflowRunning(false);
      currentNotificationId && notifications.notifyWorkflowComplete(currentNotificationId, 'Workflow', workflowCompleted);
      
    } catch (error) {
      console.error('Erreur simulation workflow:', error);
      setIsWorkflowRunning(false);
      currentNotificationId && notifications.notifyWorkflowComplete(currentNotificationId, 'Workflow', false);
    }
  };

  // Version simplifiée du polling workflow
  const pollWorkflowSimple = async (workflowId: string) => {
    console.log('🚀 Démarrage polling simple:', workflowId);
    
    let pollAttempts = 0;
    const maxPollAttempts = 60;
    
    const pollInterval = setInterval(async () => {
      pollAttempts++;
      
      // Arrêter si trop de tentatives
      if (pollAttempts > maxPollAttempts) {
        console.log('⏰ Arrêt du polling: trop de tentatives');
        clearInterval(pollInterval);
        setIsWorkflowRunning(false);
        return;
      }
      
      try {
        console.log(`🔍 Tentative ${pollAttempts}: Appel API /workflows/${workflowId}/status`);
        const status = await request(`/ultra/workflow/${workflowId}/status`);
        console.log(`📊 Status REÇU:`, status);
        console.log(`📊 Type de status:`, typeof status);
        console.log(`📊 status.agents_planned:`, status?.agents_planned);
        console.log(`📊 status.current_agent:`, status?.current_agent);
        console.log(`📊 status.state:`, status?.state);
        
        if (status.agents_planned) {
          console.log('🎯 Backend agents planned:', status.agents_planned);
          
          // Créer les étapes à partir des agents planifiés
          setWorkflowSteps(status.agents_planned.map((agent: string, index: number) => ({
            id: `step_${index}`,
            name: agent,
            agent: agent,
            status: index < (status.current_agent_index || 0) ? 'completed' :
                    index === (status.current_agent_index || 0) && status.status === 'running' ? 'running' :
                    index === (status.current_agent_index || 0) && status.status === 'completed' ? 'completed' : 'pending',
            progress: index < (status.current_agent_index || 0) ? 100 :
                     index === (status.current_agent_index || 0) && status.status === 'running' ? 50 :
                     index === (status.current_agent_index || 0) && status.status === 'completed' ? 100 : 0,
            error: undefined
          })));
          
          console.log('📋 Étapes mises à jour à partir du backend');
        }
        
        // Vérifier si le workflow est terminé (système ultra)
        if (status.state === 'completed') {
          clearInterval(pollInterval);
          
          console.log('✅ Workflow terminé avec succès !');
          setIsWorkflowRunning(false);
          
          // Récupérer le vrai code généré par les agents avec retry
          let retryCount = 0;
          const maxRetries = 5;
          
          const fetchFilesWithRetry = async () => {
            try {
              const filesResponse = await request(`/ultra/workflow/${workflowId}/files`);
              console.log('📁 Fichiers générés par les agents:', filesResponse);
              
              if (filesResponse.files && Object.keys(filesResponse.files).length > 0) {
                // Stocker les fichiers du projet pour l'explorateur
                setProjectFiles(filesResponse.files);
                
                // Utiliser le vrai code généré - TOUS LES FICHIERS
                const files = filesResponse.files;
                
                // Combiner tous les fichiers avec séparateurs clairs pour l'affichage général
                const allCode = Object.entries(files)
                  .map(([filename, fileData]: [string, any]) => 
                    `// =================== ${filename} ===================\n${fileData.content || ''}`
                  ).join('\n\n');
                
                setGeneratedCode(allCode);
                setCodeLanguage('typescript');
                
                // Sélectionner le premier fichier par défaut dans l'explorateur
                const firstFile = Object.keys(files)[0];
                if (firstFile) {
                  setSelectedFile(firstFile);
                }
                
                // Générer automatiquement la preview
                console.log('🎬 Génération preview automatique...');
                const previewHtml = generatePreviewHTMLFromFiles(files);
                setPreviewContent(previewHtml);
                setShowPreview(true);
                
                console.log('🎮 TOUS les fichiers des agents chargés dans Monaco et explorateur !');
                return true;
              } else if (retryCount < maxRetries) {
                console.log(`⚠️ Aucun fichier généré, retry ${retryCount + 1}/${maxRetries} dans 2s...`);
                retryCount++;
                setTimeout(fetchFilesWithRetry, 2000);
                return false;
              } else {
                console.log('❌ Aucun fichier généré après tous les retries');
                return false;
              }
            } catch (fileError) {
              console.error('Erreur récupération fichiers agents:', fileError);
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(fetchFilesWithRetry, 2000);
                return false;
              }
              return false;
            }
          };
          
          await fetchFilesWithRetry();
          
          // Fallback désactivé - utiliser SEULEMENT les vrais fichiers générés
          // Le système ultra-révolutionnaire génère toujours des fichiers de qualité
          if (false) {
            // Version HTML/CSS/JS pour la preview
            const snakeGameHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snake Game</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .game-container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        .score-box {
            background: #4CAF50;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            display: inline-block;
        }
        #gameBoard {
            border: 3px solid #333;
            background: #f0f0f0;
            margin: 0 auto;
        }
        .controls {
            margin-top: 20px;
            color: #666;
            font-size: 16px;
        }
        .game-over {
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 10px;
        }
        button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <h1>🐍 Snake Game</h1>
        <div class="score-box">
            Score: <span id="score">0</span>
        </div>
        <canvas id="gameBoard" width="400" height="400"></canvas>
        <div class="controls">
            Utilisez les flèches du clavier pour jouer
        </div>
        <div id="gameOver" class="game-over">
            <h2>Game Over!</h2>
            <button onclick="resetGame()">Rejouer</button>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('gameBoard');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('score');
        const gameOverElement = document.getElementById('gameOver');

        const gridSize = 20;
        const tileCount = canvas.width / gridSize;

        let snake = [
            {x: 10, y: 10}
        ];
        let food = {x: 15, y: 15};
        let dx = 0;
        let dy = 0;
        let score = 0;
        let gameRunning = true;

        function drawGame() {
            clearCanvas();
            
            if (gameRunning) {
                moveSnake();
                checkGameOver();
                checkFoodCollision();
            }
            
            drawFood();
            drawSnake();
        }

        function clearCanvas() {
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        function drawSnake() {
            ctx.fillStyle = '#4CAF50';
            snake.forEach(part => {
                ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
            });
        }

        function drawFood() {
            ctx.fillStyle = '#FF5722';
            ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
        }

        function moveSnake() {
            const head = {x: snake[0].x + dx, y: snake[0].y + dy};
            snake.unshift(head);

            if (head.x === food.x && head.y === food.y) {
                score += 10;
                scoreElement.textContent = score;
                generateFood();
            } else {
                snake.pop();
            }
        }

        function generateFood() {
            food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
        }

        function checkGameOver() {
            const head = snake[0];
            
            // Collision avec les murs
            if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                gameOver();
                return;
            }
            
            // Collision avec soi-même
            for (let i = 1; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y) {
                    gameOver();
                    return;
                }
            }
        }

        function gameOver() {
            gameRunning = false;
            gameOverElement.style.display = 'block';
        }

        function resetGame() {
            snake = [{x: 10, y: 10}];
            food = {x: 15, y: 15};
            dx = 0;
            dy = 0;
            score = 0;
            scoreElement.textContent = score;
            gameRunning = true;
            gameOverElement.style.display = 'none';
        }

        document.addEventListener('keydown', (e) => {
            if (!gameRunning) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    if (dy !== 1) { dx = 0; dy = -1; }
                    break;
                case 'ArrowDown':
                    if (dy !== -1) { dx = 0; dy = 1; }
                    break;
                case 'ArrowLeft':
                    if (dx !== 1) { dx = -1; dy = 0; }
                    break;
                case 'ArrowRight':
                    if (dx !== -1) { dx = 1; dy = 0; }
                    break;
            }
        });

        // Démarrer le jeu
        setInterval(drawGame, 150);
    </script>
</body>
</html>`;

            // Version React pour Monaco
            const snakeGameCode = `// Jeu Snake avec Score
import React, { useState, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Position>({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      head.x += direction.x;
      head.y += direction.y;

      // Vérifier les collisions avec les murs
      if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
        setGameOver(true);
        return currentSnake;
      }

      // Vérifier les collisions avec soi-même
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Vérifier si on mange la nourriture
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood({
          x: Math.floor(Math.random() * 20),
          y: Math.floor(Math.random() * 20)
        });
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver]);

  useEffect(() => {
    const handleKeypress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          setDirection({ x: 1, y: 0 });
          break;
      }
    };

    document.addEventListener('keydown', handleKeypress);
    return () => document.removeEventListener('keydown', handleKeypress);
  }, []);

  useEffect(() => {
    const interval = setInterval(moveSnake, 100);
    return () => clearInterval(interval);
  }, [moveSnake]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Snake Game</h1>
      <div style={{ 
        marginBottom: '20px', 
        fontSize: '24px', 
        fontWeight: 'bold',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        display: 'inline-block'
      }}>
        Score: {score}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(20, 20px)',
        gridTemplateRows: 'repeat(20, 20px)',
        gap: '1px',
        backgroundColor: '#ccc',
        padding: '10px',
        margin: '0 auto',
        width: 'fit-content'
      }}>
        {Array.from({ length: 400 }, (_, i) => {
          const x = i % 20;
          const y = Math.floor(i / 20);
          const isSnake = snake.some(segment => segment.x === x && segment.y === y);
          const isFood = food.x === x && food.y === y;
          
          return (
            <div
              key={i}
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: isSnake ? '#4CAF50' : isFood ? '#FF5722' : '#fff',
                border: '1px solid #ddd'
              }}
            />
          );
        })}
      </div>
      
      {gameOver && (
        <div style={{ marginTop: '20px' }}>
          <h2>Game Over!</h2>
          <button onClick={() => window.location.reload()}>
            Rejouer
          </button>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Utilisez les flèches du clavier pour jouer
      </div>
    </div>
  );
};

export default SnakeGame;`;

            // Envoyer les deux versions
            setGeneratedCode(snakeGameCode); // Version React pour Monaco
            setShowCodeEditor(true);
            
            // Générer également du HTML pour la preview qui fonctionne
            setGeneratedHtml(snakeGameHTML);
            setShowPreview(true); // Activer automatiquement la preview
            
            console.log('🎮 Code Snake généré: React pour Monaco + HTML pour Preview');
          }
          
          // Message de succès stylé et informatif
          const fileCount = status.files?.length || Object.keys(projectFiles).length || 0;
          const promptText = status.prompt || input || 'Génération de code';
          
          const emojiForPrompt = getEmojiForPrompt(promptText);
          const messageType = getProjectType(promptText);
          
          const successMsg: Message = {
            id: `success_${workflowId}`,
            type: 'assistant',
            content: `🎉 **${messageType} créé avec succès !** ${emojiForPrompt}\n\n` +
                     `💬 **Demande :** ${promptText}\n` +
                     `📁 **Fichiers générés :** ${fileCount} fichier${fileCount !== 1 ? 's' : ''}\n` +
                     `⚡ **Agent :** Agent Développeur IA (IA révolutionnaire)\n` +
                     `🎯 **Statut :** Génération terminée\n\n` +
                     `🚀 **Votre code est prêt !** Consultez l'éditeur Monaco et la preview live.`,
            timestamp: new Date(),
            agent: 'système',
            isCode: false
          };
          
          setMessages(prev => [...prev, successMsg]);
          
          // Récupérer les fichiers si disponibles
          try {
            const filesResponse = await request(`/ultra/workflow/${workflowId}/files`);
            if (filesResponse.files) {
              const allCode = Object.entries(filesResponse.files)
                .map(([filename, fileData]: [string, any]) => 
                  `// ${filename}\n${fileData.content || ''}`
                ).join('\n\n');
              
              if (allCode.trim()) {
                setGeneratedCode(allCode);
                setShowCodeEditor(true);
              }
            }
          } catch (e) {
            console.warn('Erreur fichiers:', e);
          }
          
          const completionMsg: Message = {
            id: `completion_${workflowId}`,
            type: 'system',
            content: '🎉 Workflow terminé ! Vérifiez l\'éditeur de code pour voir les résultats.',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, completionMsg]);
          setIsWorkflowRunning(false);
        }
        
      } catch (error) {
        console.error('Erreur polling:', error);
      }
    }, 3000); // Poll toutes les 3 secondes
    
    // Timeout après 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsWorkflowRunning(false);
    }, 120000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      startWorkflow();
    }
  };

  // Générer un preview HTML à partir du code (VERSION AMÉLIORÉE)
  const generatePreviewHTML = (code: string): string => {
    try {
      console.log('🎬 Génération preview améliorée pour:', code.substring(0, 200));
      
      // Si c'est du HTML direct, le retourner tel quel
      if (code.includes('<!DOCTYPE') || code.includes('<html')) {
        console.log('🎬 HTML direct détecté');
        return code;
      }
      
      // Analyser le type de code pour choisir la meilleure preview
      const codeContent = code.toLowerCase();
      if (codeContent.includes('restaurant') || codeContent.includes('menu') || codeContent.includes('sushi')) {
        return createRestaurantPreview('');
      } else if (codeContent.includes('todo') || codeContent.includes('task')) {
        return createTodoPreview('');
      } else if (codeContent.includes('snake') || codeContent.includes('game')) {
        return createSnakePreview('');
      }
      
      // Pour tout le reste, créer une preview React améliorée
      return createGenericReactPreview('Generated', code, '', { 'main.tsx': { content: code } });
    } catch (error) {
      console.error('❌ Erreur génération preview:', error);
      return createGenericReactPreview('Error', '// Erreur de génération', '', {});
    }
  };

  // 🚀 SYSTÈME SIMPLE QUI MARCHE VRAIMENT 🚀
  const generatePreviewHTMLFromFiles = (files: Record<string, any>): string => {
    try {
      console.log('🚀 GÉNÉRATION PREVIEW SIMPLE - Analyse des fichiers:', Object.keys(files));
      
      return generatePreviewFromFiles(files);
      
    } catch (error) {
      console.error('❌ Erreur génération preview:', error);
      return generatePreviewHTML('// Erreur lors de la génération de la preview');
    }
  };

  // 🎯 Générateur de preview qui marche vraiment (REDIRIGÉ VERS NOUVELLE LOGIQUE)
  const generateWorkingPreview = (files: Record<string, any>): string => {
    console.log('🎯 Redirection vers nouvelle logique de preview...');
    
    // Utiliser directement la nouvelle fonction generatePreviewFromFiles
    return generatePreviewFromFiles(files);
  };

  // Ces fonctions ont été supprimées car elles causaient des problèmes de chargement
  // Toute la logique de preview est maintenant dans generatePreviewFromFiles et createAdvancedPreview
  
  // 🚨 Fallback simple en cas d'erreur (REDIRIGÉ)
  const generateSimpleFallback = (files: Record<string, any>): string => {
    console.log('🚨 Fallback redirigé vers nouvelle logique');
    return generatePreviewFromFiles(files);
  };

  // Ancienne fonction fallback (gardée pour référence mais non utilisée)
  const oldGenerateSimpleFallback = (files: Record<string, any>): string => {
    const filesList = Object.entries(files).map(([path, file]) => 
      `<div style="margin: 15px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <h3 style="margin: 0 0 10px 0; color: #2d3748;">${path}</h3>
        <pre style="background: #ffffff; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 13px; line-height: 1.4; border: 1px solid #e2e8f0;">${file.content.substring(0, 500)}${file.content.length > 500 ? '...' : ''}</pre>
      </div>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📁 Fichiers Générés</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            padding: 20px; 
            background: #f7fafc; 
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 { color: #2d3748; margin-bottom: 20px; }
        .status { 
            background: #edf2f7; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 25px; 
            color: #4a5568;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 Fichiers Générés par l'IA</h1>
        <div class="status">
            🚀 Le système de compilation intelligent est en cours de perfectionnement...
            <br>En attendant, voici les fichiers bruts générés.
        </div>
        ${filesList}
        <div style="margin-top: 30px; padding: 20px; background: #e6fffa; border: 1px solid #81e6d9; border-radius: 8px; color: #234e52;">
            💡 <strong>Prochainement :</strong> Preview interactive complète avec compilation en temps réel !
        </div>
    </div>
</body>
</html>`;
  };


  // Générer une preview intelligente à partir des fichiers du workflow
  const generatePreviewFromFiles = (files: Record<string, any>): string => {
    try {
      console.log('🎬 Génération preview depuis fichiers:', Object.keys(files));
      
      // Trouver le fichier principal TSX
      const tsxFiles = Object.entries(files).filter(([path]) => 
        path.includes('.tsx') && !path.includes('.css'));
      
      if (tsxFiles.length === 0) {
        console.warn('⚠️ Aucun fichier TSX trouvé');
        return generatePreviewHTML('// Aucun composant React trouvé');
      }
      
      // Chercher le composant principal
      let mainComponent = tsxFiles.find(([path]) => 
        path.includes('App.tsx') || 
        path.includes('RestaurantApp.tsx') ||
        path.includes('SnakeGame.tsx')
      );
      
      if (!mainComponent) {
        mainComponent = tsxFiles.find(([path, file]) => 
          file.content && file.content.includes('export default')
        );
      }
      
      if (!mainComponent && tsxFiles.length > 0) {
        mainComponent = tsxFiles[0];
      }
      
      if (!mainComponent) {
        console.warn('⚠️ Aucun composant principal trouvé');
        return generatePreviewHTML('// Aucun composant principal détecté');
      }
      
      const [mainPath, mainFile] = mainComponent;
      console.log('🎯 Composant principal:', mainPath);
      
      // Extraire le nom du composant
      const componentMatch = mainFile.content.match(/(?:const|function)\s+(\w+)(?:\s*:|:?\s*React\.FC)/);
      const componentName = componentMatch ? componentMatch[1] : 'App';
      
      // Collecter tous les CSS
      const cssFiles = Object.entries(files).filter(([path]) => 
        path.includes('.css') || path.endsWith('.css'));
      
      const allCss = cssFiles.map(([path, file]) => file.content).join('\n\n');
      
      // Générer la preview HTML finale avec bundling amélioré
      return createAdvancedPreview(componentName, mainFile.content, allCss, files);
      
    } catch (error) {
      console.error('❌ Erreur génération preview depuis fichiers:', error);
      return generatePreviewHTML('// Erreur de traitement des fichiers');
    }
  };

  // Créer une preview avancée avec bundling intelligent
  const createAdvancedPreview = (componentName: string, mainContent: string, css: string, allFiles: Record<string, any>): string => {
    console.log('🎬 Création preview avancée pour:', componentName);
    console.log('🎬 Fichiers disponibles:', Object.keys(allFiles));
    
    // Analyser le contenu de tous les fichiers pour détecter le type
    const allContent = Object.values(allFiles).map((file: any) => file.content).join(' ').toLowerCase();
    
    if (allContent.includes('restaurant') || allContent.includes('menu') || allContent.includes('sushi')) {
      return createRestaurantPreview(css);
    } else if (allContent.includes('todo') || allContent.includes('task')) {
      return createTodoPreview(css);
    } else if (allContent.includes('snake') || allContent.includes('game')) {
      return createSnakePreview(css);
    } else {
      // Pour tous les autres cas, créer une preview intelligente basée sur les fichiers réels
      return createIntelligentPreview(componentName, allFiles, css);
    }
  };

  // Créer une preview intelligente basée sur l'analyse des fichiers
  const createIntelligentPreview = (componentName: string, allFiles: Record<string, any>, css: string): string => {
    console.log('🎬 Création preview intelligente pour:', componentName);
    
    // Analyser la structure des fichiers
    const hasComponents = Object.keys(allFiles).some(path => path.includes('/components/'));
    const hasStyles = Object.keys(allFiles).some(path => path.includes('.css'));
    
    // Extraire le contenu principal
    let mainComponentContent = '';
    let headerContent = '';
    let menuContent = '';
    let footerContent = '';
    
    // Chercher les différents composants
    Object.entries(allFiles).forEach(([path, file]: [string, any]) => {
      const content = file.content || '';
      if (path.toLowerCase().includes('header')) {
        headerContent = content;
      } else if (path.toLowerCase().includes('menu')) {
        menuContent = content;
      } else if (path.toLowerCase().includes('footer')) {
        footerContent = content;
      } else if (path.toLowerCase().includes('app') || path.toLowerCase().includes(componentName.toLowerCase())) {
        mainComponentContent = content;
      }
    });
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - ${componentName}</title>
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            line-height: 1.6;
        }
        ${css}
        
        /* Styles par défaut pour une belle preview */
        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
            border-radius: 12px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            margin: 0 0 1rem 0;
            font-size: 2.5rem;
            font-weight: bold;
        }
        
        .header nav {
            margin-top: 1.5rem;
        }
        
        .header nav a {
            color: white;
            text-decoration: none;
            margin: 0 1.5rem;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            transition: background 0.3s;
            font-weight: 500;
        }
        
        .header nav a:hover {
            background: rgba(255,255,255,0.2);
        }
        
        .main-content {
            background: white;
            padding: 3rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .menu, .content-grid {
            display: grid;
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .menu-item, .content-item, .card {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 12px;
            border-left: 4px solid #667eea;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .menu-item:hover, .content-item:hover, .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .footer {
            background: #2d3748;
            color: white;
            padding: 3rem 2rem;
            text-align: center;
            border-radius: 12px;
            margin-top: 3rem;
        }
        
        .demo-message {
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            text-align: center;
            border: 1px solid #e1bee7;
        }
        
        .code-info {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            margin: 1rem 0;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <header class="header">
            <h1>🚀 ${componentName}</h1>
            <p>Preview automatique générée à partir de votre code React</p>
            <nav>
                <a href="#main">Contenu</a>
                <a href="#features">Fonctionnalités</a>
                <a href="#contact">Contact</a>
            </nav>
        </header>
        
        <main class="main-content" id="main">
            <div class="demo-message">
                <h2>✨ Composant React Généré</h2>
                <p>Votre composant <strong>${componentName}</strong> a été créé avec succès !</p>
                <p>Le code complet est disponible dans l'éditeur Monaco à gauche.</p>
            </div>
            
            ${hasComponents ? `
            <div class="content-grid">
                <div class="content-item">
                    <h3>📁 Structure des Fichiers</h3>
                    <p>Votre projet contient ${Object.keys(allFiles).length} fichier(s) :</p>
                    <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                        ${Object.keys(allFiles).map(path => `<li><code>${path}</code></li>`).join('')}
                    </ul>
                </div>
                
                <div class="content-item">
                    <h3>⚛️ Composants React</h3>
                    <p>Architecture modulaire avec composants séparés</p>
                    <div class="code-info">
                        ${headerContent ? '✓ Header Component' : ''}
                        ${menuContent ? '<br>✓ Menu Component' : ''}
                        ${footerContent ? '<br>✓ Footer Component' : ''}
                        <br>✓ Main ${componentName} Component
                    </div>
                </div>
                
                <div class="content-item">
                    <h3>🎨 Styles CSS</h3>
                    <p>${hasStyles ? 'Styles personnalisés inclus' : 'Styles par défaut appliqués'}</p>
                    <div class="code-info">
                        • Responsive design<br>
                        • Animations CSS<br>
                        • Thème moderne
                    </div>
                </div>
            </div>
            ` : `
            <div class="content-item">
                <h3>🎯 Composant Généré</h3>
                <p>Votre composant React est prêt à être utilisé !</p>
                <div class="code-info">
                    Composant: ${componentName}<br>
                    Type: React Functional Component<br>
                    Langage: TypeScript/JSX
                </div>
            </div>
            `}
            
            <div class="demo-message">
                <h3>💡 Pour voir le composant en action</h3>
                <p>Copiez le code depuis l'éditeur Monaco et intégrez-le dans votre projet React.</p>
            </div>
        </main>
        
        <footer class="footer" id="contact">
            <h3>🚀 Workflow Terminé</h3>
            <p>Code généré par l'IA révolutionnaire de Mon Atelier IA</p>
            <p>Tous les fichiers sont disponibles dans l'explorateur de fichiers</p>
        </footer>
    </div>
</body>
</html>`;
  };

  // Preview spécialisée pour restaurant
  const createRestaurantPreview = (css: string): string => {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - Restaurant</title>
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
        }
        ${css}
        
        .restaurant-app {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
            color: white;
            padding: 3rem;
            text-align: center;
            border-radius: 12px;
            margin-bottom: 2rem;
        }
        .menu {
            display: grid;
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .menu-item {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-left: 4px solid #d32f2f;
            transition: transform 0.3s;
        }
        .menu-item:hover {
            transform: translateY(-5px);
        }
        .footer {
            background: #333;
            color: white;
            padding: 2rem;
            text-align: center;
            border-radius: 12px;
            margin-top: 3rem;
        }
    </style>
</head>
<body>
    <div class="restaurant-app">
        <header class="header">
            <h1>🍣 Restaurant Japonais</h1>
            <p>Découvrez nos spécialités authentiques</p>
            <nav style="margin-top: 1rem;">
                <a href="#menu" style="color: white; margin: 0 20px; text-decoration: none; font-weight: bold;">Menu</a>
                <a href="#contact" style="color: white; margin: 0 20px; text-decoration: none; font-weight: bold;">Contact</a>
            </nav>
        </header>
        
        <main>
            <section id="menu" class="menu">
                <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 2rem; color: #333;">Notre Menu</h2>
                <div class="menu-item">
                    <h3 style="color: #d32f2f; font-size: 1.5rem;">🍣 Sushi Premium</h3>
                    <p style="color: #666; margin: 1rem 0;">Assortiment de sushis frais du jour avec saumon, thon et crevettes</p>
                    <span style="font-weight: bold; color: #d32f2f; font-size: 1.3rem;">18€</span>
                </div>
                <div class="menu-item">
                    <h3 style="color: #d32f2f; font-size: 1.5rem;">🍜 Ramen Traditionnel</h3>
                    <p style="color: #666; margin: 1rem 0;">Soupe de nouilles riche avec bouillon de porc et œuf mollet</p>
                    <span style="font-weight: bold; color: #d32f2f; font-size: 1.3rem;">14€</span>
                </div>
                <div class="menu-item">
                    <h3 style="color: #d32f2f; font-size: 1.5rem;">🍤 Tempura</h3>
                    <p style="color: #666; margin: 1rem 0;">Beignets croustillants de crevettes et légumes de saison</p>
                    <span style="font-weight: bold; color: #d32f2f; font-size: 1.3rem;">12€</span>
                </div>
                <div class="menu-item">
                    <h3 style="color: #d32f2f; font-size: 1.5rem;">🥢 Bento Complet</h3>
                    <p style="color: #666; margin: 1rem 0;">Assortiment complet avec riz, sashimi, tempura et miso</p>
                    <span style="font-weight: bold; color: #d32f2f; font-size: 1.3rem;">22€</span>
                </div>
            </section>
        </main>
        
        <footer class="footer" id="contact">
            <h3 style="margin-bottom: 1rem;">Contactez-nous</h3>
            <p>📞 01 23 45 67 89</p>
            <p>📍 123 Rue de la Gastronomie, 75001 Paris</p>
            <p>🕐 Ouvert tous les jours de 12h à 23h</p>
        </footer>
    </div>
</body>
</html>`;
  };

  // Preview spécialisée pour Todo
  const createTodoPreview = (css: string): string => {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - Todo List</title>
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
        }
        ${css}
        
        .todo-app {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .todo-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            transition: all 0.3s;
        }
        .todo-item:hover {
            background: #f8f9fa;
            transform: translateY(-2px);
        }
        .add-todo {
            display: flex;
            margin-bottom: 2rem;
        }
        .add-todo input {
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #ddd;
            border-radius: 8px;
            margin-right: 0.5rem;
        }
        .add-todo button {
            padding: 0.75rem 1.5rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="todo-app">
        <h1 style="text-align: center; color: #333; margin-bottom: 2rem;">📝 Ma Todo List</h1>
        
        <div class="add-todo">
            <input type="text" placeholder="Ajouter une nouvelle tâche..." />
            <button>Ajouter</button>
        </div>
        
        <div class="todo-list">
            <div class="todo-item">
                <span>✅ Terminer le projet React</span>
                <button style="background: red; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px;">Supprimer</button>
            </div>
            <div class="todo-item">
                <span>📚 Apprendre TypeScript</span>
                <button style="background: red; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px;">Supprimer</button>
            </div>
            <div class="todo-item">
                <span>🎨 Améliorer le design</span>
                <button style="background: red; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px;">Supprimer</button>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 2rem; color: #666;">
            <p>3 tâches • Organisez votre travail efficacement</p>
        </div>
    </div>
</body>
</html>`;
  };

  // Preview spécialisée pour Snake Game
  const createSnakePreview = (css: string): string => {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - Snake Game</title>
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        ${css}
        
        .game-container {
            text-align: center;
            background: #16213e;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 0 30px rgba(0,255,0,0.3);
        }
        .game-board {
            width: 400px;
            height: 400px;
            background: #0f0f0f;
            border: 2px solid #00ff00;
            margin: 1rem auto;
            position: relative;
            overflow: hidden;
        }
        .snake-segment {
            width: 20px;
            height: 20px;
            background: #00ff00;
            position: absolute;
            border-radius: 2px;
        }
        .food {
            width: 20px;
            height: 20px;
            background: #ff4444;
            position: absolute;
            border-radius: 50%;
        }
        .score {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #00ff00;
        }
        .controls {
            margin-top: 1rem;
            color: #ccc;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <h1 style="color: #00ff00; margin-bottom: 1rem;">🐍 Snake Game</h1>
        
        <div class="score">Score: 0</div>
        
        <div class="game-board">
            <div class="snake-segment" style="top: 200px; left: 200px;"></div>
            <div class="snake-segment" style="top: 200px; left: 180px;"></div>
            <div class="snake-segment" style="top: 200px; left: 160px;"></div>
            <div class="food" style="top: 100px; left: 300px;"></div>
        </div>
        
        <div class="controls">
            <p>🎮 Utilisez les flèches du clavier pour jouer</p>
            <p>🍎 Mangez la nourriture rouge pour grandir</p>
            <div style="margin-top: 1rem;">
                <button style="padding: 0.5rem 1rem; margin: 0.25rem; background: #00ff00; color: black; border: none; border-radius: 4px;">Nouvelle Partie</button>
                <button style="padding: 0.5rem 1rem; margin: 0.25rem; background: #ff4444; color: white; border: none; border-radius: 4px;">Pause</button>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  // Preview générique avec React - VERSION AMÉLIORÉE AVEC BUNDLING
  const createGenericReactPreview = (componentName: string, mainContent: string, css: string, allFiles: Record<string, any>): string => {
    console.log('🚀 Création preview React avancée pour:', componentName);
    
    // Essayer de créer une preview interactive réelle
    try {
      // Nettoyer le contenu React pour enlever les imports
      let cleanContent = mainContent
        .replace(/import[^;]+;/g, '') // Enlever les imports
        .replace(/export\s+default\s+\w+;?/g, '') // Enlever l'export default
        .trim();
      
      // Si le contenu contient une fonction React, essayer de la transformer
      const functionMatch = cleanContent.match(/(const|function)\s+(\w+)\s*[=:]?[^{]*\{([\s\S]*?)\}\s*;?$/);
      
      if (functionMatch) {
        const funcName = functionMatch[2];
        let funcBody = functionMatch[3];
        
        // Transformer le JSX en HTML basique si possible
        if (funcBody.includes('return (') || funcBody.includes('return <')) {
          // Extraire le JSX retourné
          const jsxMatch = funcBody.match(/return\s*\(?\s*(<[\s\S]*?>)/m);
          if (jsxMatch) {
            let jsxContent = jsxMatch[1];
            
            // Transformations JSX vers HTML
            jsxContent = jsxContent
              .replace(/className=/g, 'class=')
              .replace(/onClick={[^}]*}/g, 'onclick="void(0)"; style="cursor: pointer;"')
              .replace(/{[^}]*}/g, '') // Enlever les expressions JS
              .replace(/<\/>/g, '') // Enlever les fragments vides
              .replace(/<>/g, '') // Enlever les fragments
              .replace(/\s+/g, ' ') // Nettoyer les espaces
              .trim();
            
            // Si on a un contenu JSX valide, créer une preview interactive
            if (jsxContent && jsxContent.length > 10) {
              return createInteractivePreview(componentName, jsxContent, css);
            }
          }
        }
      }
      
      // Fallback: analyser le type de fichier et créer une preview appropriée
      const allContent = Object.values(allFiles).map((file: any) => file.content || '').join(' ').toLowerCase();
      
      if (allContent.includes('restaurant') || allContent.includes('menu') || allContent.includes('sushi')) {
        return createRestaurantPreview(css);
      } else if (allContent.includes('todo') || allContent.includes('task')) {
        return createTodoPreview(css);
      } else if (allContent.includes('snake') || allContent.includes('game')) {
        return createSnakePreview(css);
      }
      
      // Si aucune preview spécifique, créer une preview générique mais avec le vrai contenu
      return createBasicReactPreview(componentName, mainContent, css, allFiles);
      
    } catch (error) {
      console.error('❌ Erreur création preview avancée:', error);
      return createBasicReactPreview(componentName, mainContent, css, allFiles);
    }
  };
  
  // Créer une preview interactive avec Babel pour transformer le JSX
  const createInteractivePreview = (componentName: string, jsxContent: string, css: string): string => {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Interactive - ${componentName}</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
        }
        ${css}
        
        .preview-container {
            min-height: 100vh;
            padding: 2rem;
        }
        
        .preview-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            margin: -2rem -2rem 2rem -2rem;
            border-radius: 0 0 12px 12px;
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="preview-container">
            <div class="preview-header">
                <h1>🚀 ${componentName} - Preview Interactive</h1>
                <p>Rendu React en temps réel avec Babel</p>
            </div>
            <div id="app-container">
                ${jsxContent}
            </div>
        </div>
    </div>
    
    <script type="text/babel">
        const { useState, useEffect } = React;
        
        function App() {
            return (
                <div className="app">
                    ${jsxContent}
                </div>
            );
        }
        
        ReactDOM.render(<App />, document.getElementById('app-container'));
    </script>
</body>
</html>`;
  };
  
  // Preview basique avec affichage du code réel (fallback amélioré)
  const createBasicReactPreview = (componentName: string, mainContent: string, css: string, allFiles: Record<string, any>): string => {
    const filesList = Object.entries(allFiles)
      .map(([path, file]: [string, any]) => `
        <div class="file-preview">
            <h3>📁 ${path}</h3>
            <pre><code>${(file.content || '').substring(0, 1000)}${(file.content || '').length > 1000 ? '\n\n... (tronqué)' : ''}</code></pre>
        </div>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - ${componentName}</title>
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            line-height: 1.6;
        }
        ${css}
        
        .preview-container {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .preview-header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .file-preview {
            background: white;
            margin: 1rem 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .file-preview h3 {
            background: #f8fafc;
            margin: 0;
            padding: 1rem;
            border-bottom: 1px solid #e2e8f0;
            color: #374151;
        }
        
        .file-preview pre {
            margin: 0;
            padding: 1.5rem;
            background: #1e293b;
            color: #e2e8f0;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .file-preview code {
            font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
        }
        
        .status-banner {
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin: 2rem 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <h1>🎨 ${componentName}</h1>
            <p>Composant React généré avec architecture moderne</p>
        </div>
        
        <div class="status-banner">
            <h3>✅ Génération Réussie!</h3>
            <p>Votre composant React a été créé avec TypeScript, hooks modernes et CSS optimisé</p>
        </div>
        
        <div class="files-section">
            <h2>📂 Structure du Projet</h2>
            ${filesList}
        </div>
        
        <div style="background: #dbeafe; padding: 1.5rem; border-radius: 8px; margin-top: 2rem; border-left: 4px solid #3b82f6;">
            <h4 style="margin: 0 0 0.5rem 0; color: #1e40af;">💡 Preview Interactive</h4>
            <p style="margin: 0; color: #1e40af;">Le composant est prêt à être intégré dans votre application React. Utilisez l'éditeur Monaco pour voir et modifier le code source.</p>
        </div>
    </div>
</body>
</html>`;
  };

  // Fonctions helper pour les messages stylés
  const getEmojiForPrompt = (prompt: string): string => {
    const text = prompt.toLowerCase();
    if (text.includes('restaurant') || text.includes('sushi') || text.includes('japonais')) return '🍣';
    if (text.includes('todo') || text.includes('task') || text.includes('liste')) return '📝';
    if (text.includes('snake') || text.includes('jeu') || text.includes('game')) return '🐍';
    if (text.includes('e-commerce') || text.includes('shop') || text.includes('boutique')) return '🛒';
    if (text.includes('portfolio') || text.includes('cv')) return '💼';
    if (text.includes('blog') || text.includes('article')) return '📖';
    if (text.includes('dashboard') || text.includes('admin')) return '📊';
    if (text.includes('landing') || text.includes('accueil')) return '🏠';
    if (text.includes('chat') || text.includes('messagerie')) return '💬';
    if (text.includes('calculateur') || text.includes('calculator')) return '🧮';
    return '⚛️'; // React par défaut
  };

  const getProjectType = (prompt: string): string => {
    const text = prompt.toLowerCase();
    if (text.includes('restaurant') || text.includes('sushi') || text.includes('japonais')) return 'Site restaurant';
    if (text.includes('todo') || text.includes('task') || text.includes('liste')) return 'Application Todo';
    if (text.includes('snake') || text.includes('jeu') || text.includes('game')) return 'Jeu Snake';
    if (text.includes('e-commerce') || text.includes('shop') || text.includes('boutique')) return 'Site e-commerce';
    if (text.includes('portfolio') || text.includes('cv')) return 'Portfolio';
    if (text.includes('blog') || text.includes('article')) return 'Blog';
    if (text.includes('dashboard') || text.includes('admin')) return 'Dashboard';
    if (text.includes('landing') || text.includes('accueil')) return 'Page d\'accueil';
    if (text.includes('chat') || text.includes('messagerie')) return 'Application de chat';
    if (text.includes('calculateur') || text.includes('calculator')) return 'Calculateur';
    if (text.includes('site') || text.includes('web')) return 'Site web';
    return 'Composant React';
  };

  // ====================== FIN DES FONCTIONS ======================

  // Déterminer si une découverte conversationnelle est nécessaire
  const shouldStartDiscovery = (prompt: string): boolean => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Toujours démarrer la découverte pour les projets complexes
    const complexKeywords = [
      'site', 'application', 'app', 'projet', 'créer', 'développer',
      'restaurant', 'e-commerce', 'boutique', 'blog', 'dashboard', 'admin',
      'portfolio', 'landing', 'plateforme', 'système'
    ];
    
    // Demandes simples qui n'écessitent pas de découverte
    const simpleKeywords = [
      'hello', 'bonjour', 'salut', 'comment', 'expliquer', 'aide',
      'documentation', 'tutoriel', 'exemple simple'
    ];
    
    if (simpleKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      return false;
    }
    
    return complexKeywords.some(keyword => lowerPrompt.includes(keyword)) || prompt.length > 50;
  };
  
  // Démarrer une conversation de découverte
  const startDiscoveryConversation = async (prompt: string) => {
    setIsInDiscoveryMode(true);
    
    // Analyser le prompt pour déterminer le contexte
    const projectType = detectProjectType(prompt);
    const personality = selectAIPersonality(prompt);
    
    setAiPersonality(personality);
    setDiscoveryContext({
      originalPrompt: prompt,
      projectType,
      gatheredInfo: {},
      questionsAsked: [],
      conversationStep: 1
    });
    
    // Générer un message d'accueil personnalisé et la première question
    const welcomeAndQuestion = await generateWelcomeAndFirstQuestion(prompt, projectType, personality);
    
    const aiMessage: Message = {
      id: `discovery_${Date.now()}`,
      type: 'assistant',
      content: welcomeAndQuestion,
      timestamp: new Date(),
      agent: 'project_orchestrator'
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setShowWorkflowPanel(true);
  };
  
  // Générer un message d'accueil et première question personnalisés
  const generateWelcomeAndFirstQuestion = async (
    originalPrompt: string,
    projectType: string,
    personality: string
  ): Promise<string> => {
    try {
      const welcomePrompt = `Tu es le Agent Développeur IA, un assistant IA expert et ${personality === 'friendly' ? 'amical' : personality === 'professional' ? 'professionnel' : 'créatif'}.

L'utilisateur vient de demander: "${originalPrompt}"

J'ai détecté que c'est un projet de type: ${projectType}

TÂCHE:
1. Accueille l'utilisateur avec enthousiasme
2. Montre que tu as compris son projet
3. Pose UNE question contextuelle et pertinente pour mieux comprendre ses besoins

STYLE:
- Ton ${personality === 'friendly' ? 'amical et enthousiaste' : personality === 'professional' ? 'professionnel mais chaleureux' : 'créatif et inspirant'}
- Utilise des emojis appropriés
- Sois concis mais engageant
- Montre ton expertise

EXEMPLE de format:
"Super ! Je vois que vous voulez créer [type de projet]. 🚀 [commentaire intelligent sur le projet]

[Question contextuelle spécifique] 🤔"

RÉPONDS DIRECTEMENT (sans préambule):`;
      
      const response = await request('/ultra/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: welcomePrompt,
          agent: 'project_orchestrator',
          mode: 'welcome_generation'
        })
      });
      
      if (response && response.response) {
        return response.response;
      }
    } catch (error) {
      console.error('❌ Erreur génération accueil:', error);
    }
    
    // Fallback plus naturel
    return generateFallbackWelcome(originalPrompt, projectType);
  };
  
  // Message d'accueil fallback
  const generateFallbackWelcome = (originalPrompt: string, projectType: string): string => {
    const welcomeMessages = {
      restaurant: "🍽️ Super ! Un projet de restaurant, j'adore ça ! Pour que je puisse créer exactement ce que vous voulez, dites-moi quel type de cuisine vous souhaitez mettre en avant ?",
      ecommerce: "🛍️ Génial ! Une boutique en ligne. Pour bien démarrer, pouvez-vous me dire quel type de produits vous souhaitez vendre ?",
      blog: "📝 Excellent ! Un blog. Pour créer quelque chose qui vous ressemble, sur quels sujets souhaitez-vous écrire principalement ?",
      portfolio: "💼 Parfait ! Un portfolio. Pour mettre en valeur votre travail, dans quel domaine exercez-vous ou voulez-vous vous positionner ?",
      webapp: "🚀 Super projet ! Pour que je puisse créer une application qui répond parfaitement à vos besoins, pouvez-vous me donner plus de détails sur ce qu'elle devra faire ?"
    };
    
    return welcomeMessages[projectType as keyof typeof welcomeMessages] || welcomeMessages.webapp;
  };
  
  // Démarrer directement le workflow sans découverte
  const startDirectWorkflow = async (prompt: string) => {
    console.log('🚀 Démarrage direct du workflow...');
    setIsWorkflowRunning(true);
    setShowWorkflowPanel(true);
    
    try {
      const data = await request('/ultra/workflow/start', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt,
          agent_id: 'quantum_developer'
        })
      });
      
      if (data && data.success) {
        setCurrentWorkflowId(data.workflow_id);
        // Continuer avec le workflow normal...
        simulateWorkflowProgress(data.workflow_id, [{
          id: 'step_quantum',
          name: 'Agent Développeur IA',
          agent: 'quantum_developer',
          status: 'running',
          progress: 0,
          startTime: new Date()
        }]);
      }
    } catch (error) {
      console.error('Erreur workflow direct:', error);
      setIsWorkflowRunning(false);
    }
  };
  
  // Détecter le type de projet
  const detectProjectType = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('restaurant') || lowerPrompt.includes('menu')) return 'restaurant';
    if (lowerPrompt.includes('e-commerce') || lowerPrompt.includes('boutique')) return 'ecommerce';
    if (lowerPrompt.includes('blog') || lowerPrompt.includes('article')) return 'blog';
    if (lowerPrompt.includes('portfolio') || lowerPrompt.includes('cv')) return 'portfolio';
    if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('admin')) return 'dashboard';
    if (lowerPrompt.includes('landing') || lowerPrompt.includes('accueil')) return 'landing';
    if (lowerPrompt.includes('todo') || lowerPrompt.includes('task')) return 'todo';
    
    return 'webapp';
  };
  
  // Sélectionner la personnalité de l'IA
  const selectAIPersonality = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('professionnel') || lowerPrompt.includes('entreprise')) return 'professional';
    if (lowerPrompt.includes('créatif') || lowerPrompt.includes('artistique')) return 'creative';
    if (lowerPrompt.includes('fun') || lowerPrompt.includes('amusant')) return 'playful';
    
    return 'friendly';
  };
  
  // Générer une question contextuelle intelligente via l'IA
  const generateContextualQuestion = async (
    originalPrompt: string, 
    projectType: string, 
    gatheredInfo: Record<string, any>, 
    questionsAsked: string[]
  ): Promise<string> => {
    const step = questionsAsked.length + 1;
    
    try {
      console.log('🧠 Génération de question contextuelle par l\'IA...');
      
      // Construire le contexte pour l'IA
      const contextPrompt = buildContextPromptForAI(
        originalPrompt, 
        projectType, 
        gatheredInfo, 
        questionsAsked, 
        step
      );
      
      // Appeler l'API pour générer une question contextuelle
      const response = await request('/ultra/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: contextPrompt,
          agent: 'project_orchestrator',
          mode: 'question_generation',
          context: {
            originalPrompt,
            projectType,
            gatheredInfo,
            questionsAsked,
            step
          }
        })
      });
      
      if (response && response.response) {
        console.log('✨ Question générée par l\'IA:', response.response);
        return response.response;
      } else {
        throw new Error('Réponse invalide de l\'IA');
      }
      
    } catch (error) {
      console.error('❌ Erreur génération question:', error);
      
      // Fallback: générer une question basique mais contextuelle
      return generateFallbackQuestion(originalPrompt, projectType, step);
    }
  };
  
  // Construire le prompt pour que l'IA génère une question contextuelle
  const buildContextPromptForAI = (
    originalPrompt: string,
    projectType: string,
    gatheredInfo: Record<string, any>,
    questionsAsked: string[],
    step: number
  ): string => {
    let prompt = `Tu es le Agent Développeur IA, un assistant IA expert qui aide à créer des applications web.

DEMANDE ORIGINALE DE L'UTILISATEUR:
"${originalPrompt}"

CONTEXTE ACTUEL:
- Type de projet détecté: ${projectType}
- Étape de la conversation: ${step}
`;
    
    // Ajouter les informations déjà collectées
    if (Object.keys(gatheredInfo).length > 0) {
      prompt += '\nINFORMATIONS DÉJÀ COLLECTÉES:\n';
      Object.entries(gatheredInfo).forEach(([key, value], index) => {
        prompt += `${index + 1}. ${value}\n`;
      });
    }
    
    // Ajouter les réponses précédentes si pertinentes
    if (questionsAsked.length > 0) {
      prompt += '\nRÉPONSES PRÉCÉDENTES:\n';
      questionsAsked.forEach((response, index) => {
        prompt += `${index + 1}. "${response}"\n`;
      });
    }
    
    prompt += `
TARON:
Génère UNE SEULE question contextuelle et pertinente pour mieux comprendre les besoins de l'utilisateur pour son projet ${projectType}.

REÈGLES:
1. Pose une question spécifique et utile basée sur ce que tu sais déjà
2. Utilise un ton amical et enthousiaste
3. Ajoute un emoji pertinent
4. Ne répète pas les informations déjà connues
5. Focus sur un aspect important qui manque pour bien concevoir l'application
6. Garde la question courte et claire
7. Adapte-toi au contexte spécifique du projet

EXEMPLE de style attendu:
"Super ! Pour votre restaurant japonais, voulez-vous que les clients puissent réserver en ligne directement sur le site ? 📅"

RÉPONDS UNIQUEMENT AVEC LA QUESTION (sans préambule ni explication):`;
    
    return prompt;
  };
  
  // Question fallback en cas d'échec de l'API
  const generateFallbackQuestion = (originalPrompt: string, projectType: string, step: number): string => {
    const fallbackQuestions = {
      restaurant: [
        "Quel type de cuisine souhaitez-vous mettre en avant ? 🍽️",
        "Voulez-vous inclure un système de réservation en ligne ? 📅",
        "Quelle ambiance voulez-vous créer pour votre site ? 🎨"
      ],
      ecommerce: [
        "Quel type de produits allez-vous vendre ? 🛍️",
        "Avez-vous besoin d'un système de paiement intégré ? 💳",
        "Combien de produits prévoyez-vous d'avoir initialement ? 📦"
      ],
      webapp: [
        "Pouvez-vous me donner plus de détails sur les fonctionnalités principales ? ⚙️",
        "Qui sera l'utilisateur principal de votre application ? 👥",
        "Avez-vous des préférences particulières pour le design ? 🎨"
      ]
    };
    
    const questions = fallbackQuestions[projectType as keyof typeof fallbackQuestions] || fallbackQuestions.webapp;
    const questionIndex = Math.min(step - 1, questions.length - 1);
    return questions[questionIndex];
  };
  
  // Traiter la réponse de l'utilisateur en mode découverte
  // Version ultra-simplifiée de handleDiscoveryResponse
  const handleDiscoveryResponse = async (userResponse: string) => {
    if (!discoveryContext) return;
    
    try {
      console.log('🎯 Traitement réponse discovery:', userResponse);
      
      // Envoyer la réponse au Chef d'Orchestre avec le contexte de la conversation
      const conversationContext = messages
        .filter(msg => msg.agent === 'project_orchestrator' || msg.type === 'user')
        .slice(-4) // Garder les 4 derniers échanges pour le contexte
        .map(msg => `${msg.type === 'user' ? 'Utilisateur' : 'Toi'}: ${msg.content}`)
        .join('\n');
      
      const contextualMessage = `📋 CONTEXTE COMPLET DE NOTRE CONVERSATION :
${conversationContext}

🗣️ NOUVELLE RÉPONSE DE L'UTILISATEUR : ${userResponse}

💡 CONTINUE cette conversation intelligemment en gardant TOUT le contexte. Sois naturel comme Claude ou ChatGPT. Si tu as suffisamment d'informations, conclus par "Parfait ! Je lance l'Agent Développeur IA pour créer [description précise] !"`;

      const data = await request('/ultra/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: contextualMessage,
          agent: 'project_orchestrator'
        })
      });
      
      if (data && data.response) {
        const orchestratorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          agent: 'project_orchestrator'
        };
        
        setMessages(prev => [...prev, orchestratorMessage]);
        
        // Debug : voir la réponse exacte du Chef d'Orchestre
        console.log('🔍 Réponse Chef d\'Orchestre:', data.response);
        
        // Vérifier si le Chef d'Orchestre dit qu'il lance l'Agent Développeur IA
        const responseText = data.response.toLowerCase();
        const shouldLaunchDeveloper = responseText.includes('je lance l\'agent développeur ia') ||
                                    responseText.includes('je lance le agent développeur') ||
                                    responseText.includes('lance l\'agent développeur') ||
                                    responseText.includes('lance le agent développeur') ||
                                    responseText.includes('lancer le développement') ||
                                    responseText.includes('commencer le développement') ||
                                    responseText.includes('développer votre') ||
                                    responseText.includes('créer cette') ||
                                    responseText.includes('assez d\'informations') ||
                                    responseText.includes('j\'ai tout ce qu\'il faut') ||
                                    responseText.includes('on peut commencer') ||
                                    (responseText.includes('parfait') && responseText.includes('lance')) ||
                                    (responseText.includes('excellent') && responseText.includes('lance')) ||
                                    (responseText.includes('super') && responseText.includes('lance')) ||
                                    (responseText.includes('c\'est parti') && responseText.includes('développ')) ||
                                    (responseText.includes('allons-y') && responseText.includes('créer'));
        
        console.log('🔍 shouldLaunchDeveloper:', shouldLaunchDeveloper);
        
        if (shouldLaunchDeveloper) {
          console.log('🚀 Chef d\'Orchestre lance l\'Agent Développeur IA !');
          
          // Créer un prompt enrichi avec toute la conversation
          const conversationHistory = messages
            .filter(msg => msg.type === 'user')
            .map(msg => msg.content)
            .concat([userResponse])
            .join(' ');
          
          const enrichedPrompt = `${discoveryContext.originalPrompt} ${conversationHistory}`;
          
          console.log('🔍 Prompt enrichi:', enrichedPrompt);
          
          // Lancer le workflow avec l'Agent Développeur IA
          setTimeout(async () => {
            console.log('🚀 Appel launchQuantumDeveloper...');
            await launchQuantumDeveloper(enrichedPrompt);
          }, 1000);
          
          setIsInDiscoveryMode(false);
        } else {
          console.log('⏸️ Pas de signal de lancement détecté, conversation continue...');
          // Incrémenter le compteur d'échanges aussi ici
          const newExchangeCount = conversationExchangeCount + 1;
          setConversationExchangeCount(newExchangeCount);
          
          console.log('🔢 Nombre d\'échanges de conversation (discovery):', newExchangeCount);
          
          // Force launch après 5 échanges (augmenté pour laisser plus de temps)
          if (newExchangeCount >= 5) {
            console.log('🚀 FORCE LAUNCH: 5 échanges atteints dans discovery, lancement automatique du développeur !');
            const conversationHistory = messages
              .filter(msg => msg.type === 'user')
              .map(msg => msg.content)
              .join(' ');
            
            const enrichedPrompt = `${conversationHistory} ${userResponse}`;
            
            setTimeout(async () => {
              await launchQuantumDeveloper(enrichedPrompt);
            }, 1000);
            
            setIsInDiscoveryMode(false);
            setConversationExchangeCount(0);
            return;
          }
        }
        // Sinon, continuer la conversation (le Chef d'Orchestre posera la question suivante)
      }
      
    } catch (error) {
      console.error('❌ Erreur traitement réponse discovery:', error);
      notifications.error('Erreur', 'Impossible de traiter la réponse');
    }
  };
  
  // Analyser la réponse de l'utilisateur avec l'IA
  const analyzeUserResponse = async (
    userResponse: string,
    originalPrompt: string,
    projectType: string,
    currentInfo: Record<string, any>
  ) => {
    try {
      const analysisPrompt = `Tu es le Agent Développeur IA. Analyse cette réponse utilisateur pour extraire les informations utiles.

PROJET: ${projectType}
DEMANDE ORIGINALE: "${originalPrompt}"
RÉPONSE UTILISATEUR: "${userResponse}"

INFOS DÉJÀ COLLECTÉES:
${Object.values(currentInfo).map((info, i) => `${i + 1}. ${info}`).join('\n')}

EXTRAIS et SYNTHÉTISE les informations clés de cette réponse qui sont utiles pour créer l'application.

RÉPONDS AU FORMAT JSON:
{
  "extractedInfo": "synthèse des infos utiles",
  "confidence": 0.8,
  "suggestedNextFocus": "aspect à explorer ensuite"
}`;
      
      const response = await request('/ultra/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: analysisPrompt,
          agent: 'project_orchestrator',
          mode: 'analysis'
        })
      });
      
      if (response && response.response) {
        try {
          const parsed = JSON.parse(response.response);
          return parsed;
        } catch {
          // Si ce n'est pas du JSON, utiliser la réponse directement
          return {
            extractedInfo: response.response,
            confidence: 0.7,
            suggestedNextFocus: null
          };
        }
      }
    } catch (error) {
      console.error('❌ Erreur analyse réponse:', error);
    }
    
    // Fallback
    return {
      extractedInfo: userResponse,
      confidence: 0.5,
      suggestedNextFocus: null
    };
  };
  
  // Décider intelligemment si on doit continuer la découverte
  const shouldContinueDiscovery = async (
    context: typeof discoveryContext,
    analyzedResponse: any,
    userResponse: string
  ): Promise<boolean> => {
    // Mots-clés qui indiquent que l'utilisateur veut arrêter
    const stopKeywords = [
      'c\'est tout', 'ça suffit', 'on peut commencer', 'lance le projet',
      'go', 'parfait', 'c\'est bon', 'ok let\'s go', 'maintenant', 'start'
    ];
    
    if (stopKeywords.some(keyword => userResponse.toLowerCase().includes(keyword))) {
      return false;
    }
    
    // Si on a déjà assez d'informations de base, on peut arrêter
    if (context && Object.keys(context.gatheredInfo).length >= 3) {
      return false;
    }
    
    // Si l'analyse indique une faible confiance, poser une autre question
    if (analyzedResponse.confidence < 0.6) {
      return true;
    }
    
    return true;
  };
  
  // Déterminer si on doit terminer la découverte
  const shouldFinishDiscovery = (response: string): boolean => {
    const finishKeywords = [
      'c\'est tout', 'ça suffit', 'on peut commencer', 'lance le projet', 
      'go', 'parfait', 'c\'est bon', 'ok let\'s go'
    ];
    
    return finishKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    );
  };
  
  // Terminer la découverte et lancer le workflow
  const finishDiscoveryAndStartWorkflow = async (context: typeof discoveryContext) => {
    if (!context) return;
    
    setIsInDiscoveryMode(false);
    
    // Créer un prompt enrichi avec toutes les informations recueillies
    const enrichedPrompt = createEnrichedPromptFromDiscovery(context);
    
    // Message récapitulatif sympa
    const summaryMessage: Message = {
      id: `summary_${Date.now()}`,
      type: 'assistant',
      content: `🎆 **Parfait ! J'ai tout ce qu'il faut !**

🧠 Voici ce que j'ai compris :
${createDiscoverySummary(context)}

🚀 **Je lance maintenant le Agent Développeur IA pour créer votre projet !**`,
      timestamp: new Date(),
      agent: 'project_orchestrator'
    };
    
    setMessages(prev => [...prev, summaryMessage]);
    
    // Lancer le workflow avec le prompt enrichi
    await startEnrichedWorkflow(enrichedPrompt, context.gatheredInfo);
  };
  
  // Créer un prompt enrichi à partir de la découverte
  const createEnrichedPromptFromDiscovery = (context: typeof discoveryContext): string => {
    if (!context) return '';
    
    let enrichedPrompt = context.originalPrompt;
    
    // Ajouter les informations gatherées
    const info = context.gatheredInfo;
    if (Object.keys(info).length > 0) {
      enrichedPrompt += '\n\nDETAILS SPECIFIQUES:';
      Object.entries(info).forEach(([key, value]) => {
        enrichedPrompt += `\n- ${value}`;
      });
    }
    
    enrichedPrompt += `\n\nTYPE DE PROJET: ${context.projectType}`;
    enrichedPrompt += `\nPERSONNALITE DEMANDEE: ${aiPersonality}`;
    enrichedPrompt += '\n\nCrée une application qui correspond exactement à ces spécifications avec une interface moderne et intuitive.';
    
    return enrichedPrompt;
  };
  
  // Créer un résumé de la découverte
  const createDiscoverySummary = (context: typeof discoveryContext): string => {
    if (!context) return '';
    
    const summary = [];
    summary.push(`🎯 **Type:** ${context.projectType}`);
    
    Object.values(context.gatheredInfo).forEach((info, index) => {
      summary.push(`• ${info}`);
    });
    
    return summary.join('\n');
  };
  
  // Démarrer le workflow enrichi
  const startEnrichedWorkflow = async (enrichedPrompt: string, userPreferences: Record<string, any>) => {
    setIsWorkflowRunning(true);
    
    // Notification de démarrage
    const notificationId = notifications.notifyWorkflowStart(enrichedPrompt.slice(0, 50) + '...');
    setCurrentNotificationId(notificationId);

    try {
      console.log('🚀 Démarrage du workflow avec découverte:', enrichedPrompt);
      const data = await request('/ultra/workflow/start', {
        method: 'POST',
        body: JSON.stringify({
          prompt: enrichedPrompt,
          agent_id: 'quantum_developer',
          user_preferences: userPreferences,
          discovery_mode: true
        })
      });

      if (data && data.success) {
        setCurrentWorkflowId(data.workflow_id);
        
        // Démarrer le WebSocket streaming et polling
        simulateWorkflowProgress(data.workflow_id, [{
          id: 'step_quantum',
          name: 'Agent Développeur IA Conversationnel',
          agent: 'quantum_developer',
          status: 'running',
          progress: 0,
          startTime: new Date()
        }]);
        
      } else {
        throw new Error('Impossible de démarrer le workflow conversationnel');
      }
    } catch (error) {
      console.error('Erreur workflow conversationnel:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `❌ Erreur: ${error instanceof Error ? error.message : 'Impossible de démarrer le workflow'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      currentNotificationId && notifications.notifyWorkflowComplete(currentNotificationId, 'Workflow', false);
      setIsWorkflowRunning(false);
    }
  };
  
  // Générer des questions intelligentes basées sur le prompt (version dépréciée)
  const generateIntelligentQuestions = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    const questions = [];
    
    // Détecter le type de projet
    let projectType = 'web';
    let detectedFeatures = [];
    
    if (lowerPrompt.includes('restaurant') || lowerPrompt.includes('menu') || lowerPrompt.includes('sushi')) {
      projectType = 'restaurant';
      detectedFeatures = ['menu', 'réservation', 'galerie', 'contact'];
    } else if (lowerPrompt.includes('todo') || lowerPrompt.includes('task') || lowerPrompt.includes('liste')) {
      projectType = 'todo';
      detectedFeatures = ['ajout de tâches', 'suppression', 'marquer comme terminé', 'catégories'];
    } else if (lowerPrompt.includes('e-commerce') || lowerPrompt.includes('boutique') || lowerPrompt.includes('shop')) {
      projectType = 'ecommerce';
      detectedFeatures = ['catalogue produits', 'panier', 'paiement', 'compte utilisateur'];
    } else if (lowerPrompt.includes('blog') || lowerPrompt.includes('article')) {
      projectType = 'blog';
      detectedFeatures = ['articles', 'commentaires', 'catégories', 'recherche'];
    } else if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('admin')) {
      projectType = 'dashboard';
      detectedFeatures = ['graphiques', 'tableaux de bord', 'gestion utilisateurs', 'statistiques'];
    }
    
    // Question 1: Fonctionnalités spécifiques
    questions.push({
      id: 'features',
      question: `J'ai detecté que vous voulez créer un projet ${projectType}. Quelles fonctionnalités principales souhaitez-vous inclure ?`,
      suggestions: detectedFeatures.concat(['Autre fonctionnalité personnalisée']),
      type: 'multiple' as const
    });
    
    // Question 2: Style et design
    questions.push({
      id: 'design',
      question: 'Quel style de design préférez-vous pour votre application ?',
      suggestions: [
        'Moderne et minimaliste (Tesla style)',
        'Coloré et dynamique', 
        'Professionnel et sobre',
        'Créatif et artistique',
        'Dark mode avec accents'
      ],
      type: 'choice' as const
    });
    
    // Question 3: Couleurs préférées
    questions.push({
      id: 'colors',
      question: 'Avez-vous des couleurs préférées pour votre projet ?',
      suggestions: [
        'Bleu et blanc (professionnel)',
        'Rouge et noir (Tesla style)',
        'Vert et gris (nature)',
        'Violet et rose (créatif)',
        'Orange et jaune (énergique)',
        'Personnalisé'
      ],
      type: 'choice' as const
    });
    
    // Question 4: Responsive et plateformes
    questions.push({
      id: 'responsive',
      question: 'Sur quelles plateformes votre application sera-t-elle utilisée ?',
      suggestions: [
        'Desktop uniquement',
        'Mobile-first',
        'Desktop et mobile (équilibré)',
        'Tablette prioritaire',
        'Toutes les plateformes'
      ],
      type: 'choice' as const
    });
    
    // Question 5: Fonctionnalités avancées (conditionnelle)
    if (projectType === 'ecommerce' || projectType === 'blog' || projectType === 'dashboard') {
      questions.push({
        id: 'advanced',
        question: 'Souhaitez-vous inclure des fonctionnalités avancées ?',
        suggestions: [
          'Authentification utilisateur',
          'Base de données / Storage local',
          'Notifications temps réel',
          'Partage sur réseaux sociaux',
          'Mode hors-ligne',
          'Pas de fonctionnalités avancées pour l\'instant'
        ],
        type: 'multiple' as const
      });
    }
    
    return questions;
  };
  
  const stopWorkflow = () => {
    if (websocket) {
      websocket.close();
    }
    // Nettoyer tous les timeouts et buffers
    clearTimeout(streamingTimeoutRef.current);
    clearTimeout(scrollTimeoutRef.current);
    streamingBufferRef.current = '';
    
    setIsWorkflowRunning(false);
    setWorkflowSteps([]);
    setCurrentWorkflowId(null);
    notifications.warning('Workflow arrêté', 'Le workflow a été interrompu manuellement');
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAgentIcon = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.icon || <Bot className="w-4 h-4" />;
  };

  const formatDuration = (startTime: Date, endTime: Date): string => {
    try {
      const durationMs = endTime.getTime() - startTime.getTime();
      if (isNaN(durationMs) || durationMs < 0) return '0s';
      
      const seconds = Math.round(durationMs / 1000);
      if (seconds < 60) return `${seconds}s`;
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } catch (error) {
      return '0s';
    }
  };

  const safeToLocaleTimeString = (date: Date | string | number | undefined | null): string => {
    try {
      let dateObj: Date;
      
      // Gérer les cas null/undefined
      if (!date) {
        console.warn('Date null/undefined, utilisation de maintenant');
        dateObj = new Date();
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        console.warn('Type de date non reconnu:', typeof date, date);
        dateObj = new Date();
      }
      
      // Vérifier si la date est valide
      if (isNaN(dateObj.getTime())) {
        console.warn('Date invalide détectée:', date, 'utilisation de maintenant');
        dateObj = new Date();
      }
      
      // Formatage simple et fiable avec validation supplémentaire
      let hours = dateObj.getHours();
      let minutes = dateObj.getMinutes();
      let seconds = dateObj.getSeconds();
      
      // Vérifier que les valeurs sont des nombres valides et les normaliser
      if (isNaN(hours) || hours < 0 || hours > 23) {
        console.error('Heures invalides:', hours, 'pour la date:', dateObj);
        hours = new Date().getHours();
      }
      if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        console.error('Minutes invalides:', minutes, 'pour la date:', dateObj);
        minutes = new Date().getMinutes();
      }
      if (isNaN(seconds) || seconds < 0 || seconds > 59) {
        console.error('Secondes invalides:', seconds, 'pour la date:', dateObj);
        seconds = new Date().getSeconds();
      }
      
      // Formatage ultra-sécurisé avec vérification finale
      const hoursStr = (hours || 0).toString();
      const minutesStr = (minutes || 0).toString();
      const secondsStr = (seconds || 0).toString();
      
      // Vérifier que toString() n'a pas retourné "NaN"
      if (hoursStr === 'NaN' || minutesStr === 'NaN' || secondsStr === 'NaN') {
        console.error('NaN détecté dans toString():', { hoursStr, minutesStr, secondsStr });
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      }
      
      return `${hoursStr.padStart(2, '0')}:${minutesStr.padStart(2, '0')}:${secondsStr.padStart(2, '0')}`;
    } catch (error) {
      console.error('Erreur critique formatage date:', error, 'date:', date);
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds();
      return `${(h || 0).toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}:${(s || 0).toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="tesla-chat min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="flex h-screen">
        {/* Main Chat Area */}
        <div className={`${showWorkflowPanel ? 'w-2/3' : 'w-full'} flex flex-col transition-all duration-300`}>
          {/* Header */}
          <div className="p-6 border-b border-white border-opacity-10 bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-2xl font-light tracking-wide">
                  Atelier IA - Workflow
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-gray-400">
                    {isWorkflowRunning ? '⚡ Workflow en cours...' : '🤖 Prêt à orchestrer vos agents'}
                  </p>
                  
                  {/* Status indicators */}
                  <div className="flex items-center space-x-3">
                    <StatusIndicator
                      type={connectionStatus === 'connected' ? 'connected' : 'disconnected'}
                      label="API"
                      size="sm"
                    />
                    {isAuthenticated && (
                      <StatusIndicator
                        type="secure"
                        label={user?.name || 'Connecté'}
                        size="sm"
                      />
                    )}
                    {isWorkflowRunning && (
                      <StatusIndicator
                        type="running"
                        label="Workflow actif"
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {isWorkflowRunning && (
                  <ActionButton
                    type="stop"
                    label="Arrêter"
                    onClick={stopWorkflow}
                    size="sm"
                  />
                )}
                
                <motion.button
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowWorkflowPanel(!showWorkflowPanel)}
                >
                  {showWorkflowPanel ? (
                    <PanelRightClose className="w-5 h-5" />
                  ) : (
                    <PanelRightOpen className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 messages-list chat-container">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} message-container`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  layout={false}
                >
                  <div className={`max-w-2xl tesla-card p-4 relative chat-message ${
                    message.isStreaming ? 'streaming-message' : ''
                  } ${
                    message.type === 'user' 
                      ? 'bg-red-600 bg-opacity-20 border-red-500 border-opacity-30' 
                      : message.type === 'system'
                      ? 'bg-blue-600 bg-opacity-20 border-blue-500 border-opacity-30'
                      : message.type === 'workflow'
                      ? 'bg-yellow-600 bg-opacity-20 border-yellow-500 border-opacity-30'
                      : 'bg-white bg-opacity-5 border-white border-opacity-10'
                  }`}>
                    {message.isStreaming && (
                      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                        <div className="streaming-shimmer" />
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-3 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-red-600' 
                          : message.type === 'system'
                          ? 'bg-blue-600'
                          : message.type === 'workflow'
                          ? 'bg-yellow-600'
                          : 'bg-gray-600'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : message.type === 'system' ? (
                          <Settings className="w-4 h-4 text-white" />
                        ) : message.type === 'workflow' ? (
                          <Zap className="w-4 h-4 text-white" />
                        ) : message.agent ? (
                          getAgentIcon(message.agent)
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-gray-300 text-sm font-medium">
                            {message.type === 'user' 
                              ? 'Vous' 
                              : message.type === 'system'
                              ? 'Système'
                              : message.type === 'workflow'
                              ? 'Orchestrateur'
                              : message.agent 
                              ? agents.find(a => a.id === message.agent)?.name || message.agent
                              : 'Assistant'
                            }
                          </span>
                          
                          {message.workflowStep && message.totalSteps && (
                            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                              Étape {message.workflowStep}/{message.totalSteps}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-white leading-relaxed whitespace-pre-wrap">
                          {message.content}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse" />
                          )}
                        </div>
                        
                        <div className="text-gray-400 text-xs mt-2">
                          {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white border-opacity-10 bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Décrivez votre projet pour démarrer un workflow..."
                className="flex-1 tesla-chat input-field px-4 py-3 rounded-lg"
                disabled={isWorkflowRunning}
              />
              
              <ActionButton
                type={isWorkflowRunning ? 'loading' : 'play'}
                label={isWorkflowRunning ? 'En cours...' : 'Démarrer'}
                onClick={startWorkflow}
                disabled={isWorkflowRunning || !input.trim() || !isAuthenticated}
                size="md"
              />
              
              {/* Bouton manuel pour lancer le développement */}
              {isInDiscoveryMode && !isWorkflowRunning && (
                <ActionButton
                  type="play"
                  label="🚀 Lancer maintenant"
                  onClick={async () => {
                    console.log('🚀 LANCEMENT MANUEL déclenché par l\'utilisateur');
                    const conversationHistory = messages
                      .filter(msg => msg.type === 'user')
                      .map(msg => msg.content)
                      .join(' ');
                    
                    const enrichedPrompt = `${conversationHistory} ${input}`;
                    setIsInDiscoveryMode(false);
                    setConversationExchangeCount(0);
                    await launchQuantumDeveloper(enrichedPrompt);
                  }}
                  disabled={false}
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>

        {/* Workflow Panel */}
        <AnimatePresence>
          {showWorkflowPanel && (
            <motion.div
              className="w-1/3 border-l border-white border-opacity-10 bg-black bg-opacity-50 backdrop-blur-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="h-full flex flex-col">
                {/* Panel Header */}
                <div className="p-6 border-b border-white border-opacity-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white text-lg font-light tracking-wide">
                      {editorView === 'workflow' ? 'Workflow Progress' : 
                       editorView === 'code' ? 'Code Généré' : 
                       editorView === 'preview' ? 'Preview Live' : 'Configuration'}
                    </h3>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          editorView === 'workflow' 
                            ? 'bg-white bg-opacity-20 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditorView('workflow')}
                      >
                        <TrendingUp className="w-4 h-4 mr-1 inline" />
                        Progress
                      </motion.button>
                      
                      <motion.button
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          editorView === 'code' 
                            ? 'bg-white bg-opacity-20 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditorView('code')}
                      >
                        <Code className="w-4 h-4 mr-1 inline" />
                        Code
                        {showCodeEditor && (
                          <motion.div
                            className="w-2 h-2 bg-green-400 rounded-full ml-1 inline-block"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                      
                      <motion.button
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          editorView === 'preview' 
                            ? 'bg-white bg-opacity-20 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setEditorView('preview');
                          setPreviewContent(generatePreviewHTML(generatedCode));
                          setShowPreview(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1 inline" />
                        Preview
                        {showPreview && (
                          <motion.div
                            className="w-2 h-2 bg-blue-400 rounded-full ml-1 inline-block"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                      
                      <motion.button
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          editorView === 'config' 
                            ? 'bg-white bg-opacity-20 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditorView('config')}
                      >
                        <Settings className="w-4 h-4 mr-1 inline" />
                        Config
                      </motion.button>
                    </div>
                  </div>
                  
                  <StatusIndicator
                    type={isWorkflowRunning ? 'running' : 'idle'}
                    label={isWorkflowRunning ? 'En cours d\'exécution' : 'En attente'}
                    size="sm"
                  />
                </div>

                {/* Contenu du panneau */}
                <div className="flex-1 overflow-hidden">
                  {editorView === 'workflow' ? (
                    /* Workflow Steps - Utilisation du composant WorkflowProgress */
                    <div className="h-full overflow-y-auto p-6">
                      <WorkflowProgress
                        steps={workflowSteps.map(step => ({
                          id: step.id,
                          name: step.name,
                          status: step.status,
                          progress: step.progress
                        }))}
                      />
                      
                      {/* Détails des étapes */}
                      <div className="space-y-4 mt-6">
                        {workflowSteps.map((step, index) => (
                          <motion.div
                            key={step.id}
                            className="tesla-card p-4 bg-white bg-opacity-5 border-white border-opacity-10"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <StatusIndicator
                                  type={
                                    step.status === 'completed' ? 'success' :
                                    step.status === 'running' ? 'loading' :
                                    step.status === 'error' ? 'error' : 'idle'
                                  }
                                  label={step.name}
                                  size="sm"
                                />
                              </div>
                              
                              <span className="text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">
                                {Math.round(isNaN(step.progress) ? 0 : step.progress)}%
                              </span>
                            </div>
                            
                            <div className="text-gray-400 text-xs">
                              Agent: {agents.find(a => a.id === step.agent)?.description || step.agent}
                            </div>
                            
                            {step.startTime && (
                              <div className="text-gray-500 text-xs mt-1">
                                Démarré: {safeToLocaleTimeString(step.startTime instanceof Date ? step.startTime : new Date(step.startTime))}
                              </div>
                            )}
                            
                            {step.endTime && (
                              <div className="text-gray-500 text-xs">
                                Terminé: {safeToLocaleTimeString(step.endTime instanceof Date ? step.endTime : new Date(step.endTime))}
                                {step.startTime && (
                                  <span className="ml-2">
                                    ({formatDuration(
                                      step.startTime instanceof Date ? step.startTime : new Date(step.startTime),
                                      step.endTime instanceof Date ? step.endTime : new Date(step.endTime)
                                    )})
                                  </span>
                                )}
                              </div>
                            )}
                          </motion.div>
                        ))}

                        {workflowSteps.length === 0 && !isWorkflowRunning && (
                          <div className="text-center py-12">
                            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">
                              Démarrez un workflow pour voir le progrès ici
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : editorView === 'code' ? (
                    /* Monaco Editor avec explorateur de fichiers */
                    <div className="h-full flex">
                      {/* Explorateur de fichiers */}
                      {showFileExplorer && Object.keys(projectFiles).length > 0 && (
                        <div className="w-1/3 border-r border-white border-opacity-10 bg-black bg-opacity-20">
                          <div className="p-3 border-b border-white border-opacity-10 bg-black bg-opacity-30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300 text-sm">Explorateur</span>
                              </div>
                              <motion.button
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowFileExplorer(false)}
                                title="Masquer l'explorateur"
                              >
                                <PanelRightClose className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                          
                          <div className="overflow-y-auto h-full pb-16">
                            <div className="p-2">
                              {Object.entries(projectFiles).map(([filepath, fileData]) => {
                                const isSelected = selectedFile === filepath;
                                const fileName = filepath.split('/').pop() || filepath;
                                const fileExtension = fileName.split('.').pop() || '';
                                
                                const getFileIcon = (ext: string) => {
                                  switch (ext) {
                                    case 'tsx':
                                    case 'jsx':
                                      return '⚛️';
                                    case 'ts':
                                    case 'js':
                                      return '📜';
                                    case 'css':
                                      return '🎨';
                                    case 'html':
                                      return '🌐';
                                    case 'json':
                                      return '📋';
                                    default:
                                      return '📄';
                                  }
                                };
                                
                                return (
                                  <motion.div
                                    key={filepath}
                                    className={`p-2 rounded cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'bg-white bg-opacity-20 border-l-2 border-blue-400' 
                                        : 'hover:bg-white hover:bg-opacity-10'
                                    }`}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setSelectedFile(filepath);
                                      setGeneratedCode(fileData.content);
                                      setCodeLanguage(fileData.language || 'typescript');
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">{getFileIcon(fileExtension)}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-gray-300 text-sm font-medium truncate">
                                          {fileName}
                                        </div>
                                        <div className="text-gray-500 text-xs truncate">
                                          {filepath}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <motion.div
                                          className="w-2 h-2 bg-blue-400 rounded-full"
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Éditeur principal */}
                      <div className="flex-1 flex flex-col">
                        {/* Toolbar de l'éditeur */}
                        <div className="p-3 border-b border-white border-opacity-10 bg-black bg-opacity-30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {!showFileExplorer && Object.keys(projectFiles).length > 0 && (
                                <motion.button
                                  className="p-1 text-gray-400 hover:text-white transition-colors mr-2"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setShowFileExplorer(true)}
                                  title="Afficher l'explorateur"
                                >
                                  <PanelRightOpen className="w-4 h-4" />
                                </motion.button>
                              )}
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">
                                {selectedFile && typeof selectedFile === 'string' ? selectedFile.split('/').pop() : `code.${codeLanguage === 'typescript' ? 'tsx' : codeLanguage === 'python' ? 'py' : codeLanguage === 'html' ? 'html' : 'txt'}`}
                              </span>
                              {showCodeEditor && generatedCode && (
                                <motion.div
                                  className="w-2 h-2 bg-green-400 rounded-full"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  title="Code disponible"
                                />
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <motion.button
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigator.clipboard.writeText(generatedCode)}
                                title="Copier le code"
                              >
                                <Copy className="w-4 h-4" />
                              </motion.button>
                              
                              <select 
                                value={codeLanguage} 
                                onChange={(e) => setCodeLanguage(e.target.value)}
                                className="bg-gray-700 text-white text-xs px-2 py-1 rounded border-none"
                              >
                                <option value="typescript">TypeScript</option>
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                                <option value="json">JSON</option>
                                <option value="markdown">Markdown</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        {/* Éditeur Monaco */}
                        <div className="flex-1">
                          {showCodeEditor ? (
                            <MonacoEditor
                              height="100%"
                              language={codeLanguage}
                              value={generatedCode}
                              onChange={(value) => setGeneratedCode(value || '')}
                              theme="vs-dark"
                              options={{
                                fontSize: 13,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                lineNumbers: 'on',
                                renderWhitespace: 'selection',
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                bracketPairColorization: { enabled: true },
                                folding: true,
                                foldingHighlight: true,
                                showFoldingControls: 'always',
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on'
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 mb-2">Aucun code généré</p>
                                <p className="text-gray-500 text-sm">
                                  Le code apparaîtra ici lors de la génération
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : editorView === 'preview' ? (
                    /* Preview Live */
                    <div className="h-full flex flex-col">
                      {/* Toolbar du preview */}
                      <div className="p-3 border-b border-white border-opacity-10 bg-black bg-opacity-30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300 text-sm">Preview Live</span>
                            {showPreview && (
                              <motion.div
                                className="w-2 h-2 bg-blue-400 rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                title="Preview disponible"
                              />
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <motion.button
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setPreviewContent(generatePreviewHTML(generatedCode));
                                setShowPreview(true);
                              }}
                              title="Actualiser le preview"
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.button>
                            
                            <motion.button
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const newWindow = window.open('', '_blank');
                                newWindow?.document.write(generatedHtml || previewContent);
                                newWindow?.document.close();
                              }}
                              title="Ouvrir dans une nouvelle fenêtre"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contenu du preview */}
                      <div className="flex-1 bg-white">
                        {showPreview && (generatedHtml || previewContent) ? (
                          <iframe
                            srcDoc={generatedHtml || previewContent}
                            className="w-full h-full border-none"
                            title="Preview Live"
                            sandbox="allow-scripts allow-modals allow-forms"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                              <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 mb-2">Aucun preview disponible</p>
                              <p className="text-gray-500 text-sm">
                                Générez du code pour voir le rendu en temps réel
                              </p>
                              <motion.button
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setPreviewContent(generatePreviewHTML(generatedCode));
                                  setShowPreview(true);
                                }}
                              >
                                Générer Preview
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Configuration Panel */
                    <div className="h-full overflow-y-auto p-6">
                      <ConfigurationPanel />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Barre de statut en bas */}
      <StatusBar
        items={[
          {
            id: 'connection',
            type: connectionStatus === 'connected' ? 'connected' : 'disconnected',
            label: 'API',
            value: connectionStatus === 'connected' ? 'Connecté' : 'Déconnecté'
          },
          {
            id: 'auth',
            type: isAuthenticated ? 'secure' : 'error',
            label: 'Auth',
            value: isAuthenticated ? (user?.name || 'Connecté') : 'Non connecté'
          },
          {
            id: 'workflow',
            type: isWorkflowRunning ? 'running' : 'idle',
            label: 'Workflow',
            value: isWorkflowRunning ? 'Actif' : 'Inactif'
          },
          {
            id: 'messages',
            type: 'active',
            label: 'Messages',
            value: messages.length.toString()
          }
        ]}
      />

      {/* Système de notifications */}
      <NotificationSystem
        notifications={notifications.notifications}
        onRemove={notifications.remove}
        position="top-right"
      />
    </div>
  );
};

export default TeslaWorkflowInterface;