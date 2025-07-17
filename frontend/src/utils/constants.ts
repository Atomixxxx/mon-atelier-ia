// src/utils/constants.ts
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
} as const;

export const VIEWS = {
  CHAT: 'chat',
  PROJECTS: 'projects',
  AGENTS: 'agents',
  SETTINGS: 'settings'
} as const;

export const WORKFLOW_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped'
} as const;

export const AGENT_STATUS = {
  ACTIVE: 'active',
  IDLE: 'idle',
  BUSY: 'busy'
} as const;

export const FILE_EXTENSIONS = {
  TYPESCRIPT: ['.ts', '.tsx'],
  JAVASCRIPT: ['.js', '.jsx'],
  PYTHON: ['.py'],
  CSS: ['.css', '.scss', '.sass'],
  HTML: ['.html', '.htm'],
  JSON: ['.json'],
  MARKDOWN: ['.md', '.markdown']
} as const;

export const KEYBOARD_SHORTCUTS = {
  SAVE: 'Ctrl+S',
  RUN: 'Ctrl+Enter',
  NEW_FILE: 'Ctrl+N',
  OPEN_FILE: 'Ctrl+O',
  TOGGLE_SIDEBAR: 'Ctrl+B',
  TOGGLE_CONSOLE: 'Ctrl+`',
  FORMAT_CODE: 'Shift+Alt+F'
} as const;

// === NOUVELLES CONSTANTES POUR LES CONVERSATIONS ===

export const MESSAGE_TYPES = {
  TEXT: 'text',
  CODE: 'code',
  FILE: 'file',
  IMAGE: 'image',
  ERROR: 'error',
  SYSTEM: 'system'
} as const;

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
} as const;

export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
} as const;

export const AGENT_TYPES = {
  GENERAL: 'general',
  CODE_ASSISTANT: 'code-assistant',
  DEBUGGER: 'debugger',
  REVIEWER: 'reviewer',
  OPTIMIZER: 'optimizer',
  DOCUMENTATION: 'documentation'
} as const;

export const CODE_ANALYSIS_TYPES = {
  REVIEW: 'review',
  OPTIMIZE: 'optimize',
  DEBUG: 'debug',
  EXPLAIN: 'explain',
  REFACTOR: 'refactor',
  TEST: 'test'
} as const;

export const CONVERSATION_LIMITS = {
  MAX_MESSAGES_IN_MEMORY: 50,
  MAX_CONTEXT_LENGTH: 4000,
  MAX_TITLE_LENGTH: 100,
  MAX_SUMMARY_LENGTH: 500,
  AUTO_SAVE_INTERVAL: 5000, // 5 secondes
  COMPRESSION_THRESHOLD: 100 // messages
} as const;

export const STORAGE_KEYS = {
  CONVERSATIONS: 'ai_conversations',
  USER_PREFERENCES: 'user_preferences',
  RECENT_PROJECTS: 'recent_projects',
  AGENT_SETTINGS: 'agent_settings',
  WORKSPACE_STATE: 'workspace_state'
} as const;

export const API_ENDPOINTS = {
  // Agent endpoints
  AGENT_CHAT: '/agent',
  AGENT_EXECUTE: '/agent/execute',
  AGENT_ANALYZE: '/agent/analyze',
  AGENT_GENERATE: '/agent/generate',
  AGENTS_LIST: '/agents',
  
  // Conversation endpoints
  CONVERSATIONS: '/conversations',
  CONVERSATION_BY_ID: (id: string) => `/conversations/${id}`,
  
  // Project endpoints
  PROJECTS: '/projects',
  PROJECT_BY_ID: (id: string) => `/projects/${id}`,
  PROJECT_FILES: (id: string) => `/projects/${id}/files`,
  PROJECT_FILE: (projectId: string, filePath: string) => 
    `/projects/${projectId}/files/${encodeURIComponent(filePath)}`,
  
  // Workflow endpoints
  WORKFLOWS: '/workflows',
  WORKFLOW_START: '/workflows/start',
  WORKFLOW_STATUS: (id: string) => `/workflows/${id}/status`,
  WORKFLOW_STOP: (id: string) => `/workflows/${id}/stop`,
  
  // System endpoints
  HEALTH: '/health',
  STATUS: '/system/status',
  MODELS: '/models/available',
  SWITCH_MODEL: '/models/switch'
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion réseau',
  SERVER_ERROR: 'Erreur serveur',
  CONVERSATION_NOT_FOUND: 'Conversation introuvable',
  PROJECT_NOT_FOUND: 'Projet introuvable',
  AGENT_NOT_AVAILABLE: 'Agent non disponible',
  FILE_NOT_FOUND: 'Fichier introuvable',
  INVALID_CODE: 'Code invalide',
  EXECUTION_FAILED: 'Échec de l\'exécution',
  SAVE_FAILED: 'Échec de la sauvegarde',
  LOAD_FAILED: 'Échec du chargement'
} as const;

export const SUCCESS_MESSAGES = {
  CONVERSATION_CREATED: 'Conversation créée avec succès',
  CONVERSATION_SAVED: 'Conversation sauvegardée',
  CONVERSATION_DELETED: 'Conversation supprimée',
  PROJECT_CREATED: 'Projet créé avec succès',
  PROJECT_SAVED: 'Projet sauvegardé',
  FILE_SAVED: 'Fichier sauvegardé',
  CODE_EXECUTED: 'Code exécuté avec succès',
  ANALYSIS_COMPLETED: 'Analyse terminée'
} as const;

export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 300,
  CHAT_PANEL_MIN_WIDTH: 400,
  EDITOR_MIN_WIDTH: 600,
  HEADER_HEIGHT: 60,
  FOOTER_HEIGHT: 30,
  SCROLL_THRESHOLD: 100,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500
} as const;

// Types utilitaires
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type MessageRole = typeof MESSAGE_ROLES[keyof typeof MESSAGE_ROLES];
export type AgentType = typeof AGENT_TYPES[keyof typeof AGENT_TYPES];
export type CodeAnalysisType = typeof CODE_ANALYSIS_TYPES[keyof typeof CODE_ANALYSIS_TYPES];
export type ConversationStatus = typeof CONVERSATION_STATUS[keyof typeof CONVERSATION_STATUS];
export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS];
export type AgentStatus = typeof AGENT_STATUS[keyof typeof AGENT_STATUS];

// Configuration par défaut
export const DEFAULT_AGENT_CONFIG = {
  type: AGENT_TYPES.GENERAL,
  model: 'llama3.1',
  temperature: 0.7,
  maxTokens: 2000,
  contextWindow: 4000
} as const;

export const DEFAULT_CONVERSATION_CONFIG = {
  autoSave: true,
  compressionEnabled: true,
  maxHistoryLength: CONVERSATION_LIMITS.MAX_MESSAGES_IN_MEMORY,
  contextLength: CONVERSATION_LIMITS.MAX_CONTEXT_LENGTH
} as const;