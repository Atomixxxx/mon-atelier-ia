/**
 * Hook pour le système de notifications toast
 * Gère l'affichage de notifications avec différents types et animations
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
  persistent?: boolean;
  createdAt: Date;
}

interface NotificationOptions {
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Générer un ID unique
  const generateId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Ajouter une notification
  const add = useCallback((
    type: Notification['type'],
    title: string,
    message?: string,
    options?: NotificationOptions
  ) => {
    const id = generateId();
    const duration = options?.duration ?? (type === 'error' ? 10000 : type === 'loading' ? 0 : 5000);
    
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
      persistent: options?.persistent || type === 'loading',
      action: options?.action,
      icon: options?.icon,
      createdAt: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove après duration (sauf si persistent ou loading)
    if (duration > 0 && !notification.persistent) {
      const timeout = setTimeout(() => {
        remove(id);
      }, duration);
      
      timeoutRefs.current.set(id, timeout);
    }

    return id;
  }, [generateId]);

  // Notifications spécialisées
  const success = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return add('success', title, message, { icon: '✅', ...options });
  }, [add]);

  const error = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return add('error', title, message, { icon: '❌', ...options });
  }, [add]);

  const warning = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return add('warning', title, message, { icon: '⚠️', ...options });
  }, [add]);

  const info = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    return add('info', title, message, { icon: 'ℹ️', ...options });
  }, [add]);

  const loading = useCallback((title: string, message?: string) => {
    return add('loading', title, message, { persistent: true, icon: '⏳' });
  }, [add]);

  // Supprimer une notification
  const remove = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Nettoyer le timeout
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  // Mettre à jour une notification (utile pour les loading)
  const update = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, ...updates }
          : notification
      )
    );

    // Si on change le type d'une notification loading, démarrer le timer
    if (updates.type && updates.type !== 'loading') {
      const notification = notifications.find(n => n.id === id);
      if (notification?.persistent) {
        const duration = updates.duration ?? 5000;
        const timeout = setTimeout(() => {
          remove(id);
        }, duration);
        timeoutRefs.current.set(id, timeout);
      }
    }
  }, [notifications, remove]);

  // Effacer toutes les notifications
  const clear = useCallback(() => {
    // Nettoyer tous les timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    setNotifications([]);
  }, []);

  // Helpers pour les opérations courantes
  const notifyFileOperation = useCallback((operation: 'create' | 'update' | 'delete', filename: string, success: boolean) => {
    const operations = {
      create: 'créé',
      update: 'enregistré', 
      delete: 'supprimé'
    };

    if (success) {
      return add('success', `Fichier ${operations[operation]}`, filename, { icon: '📁' });
    } else {
      return add('error', `Erreur lors de la ${operation === 'create' ? 'création' : operation === 'update' ? 'sauvegarde' : 'suppression'}`, filename);
    }
  }, [add]);

  const notifyWorkflowStart = useCallback((workflowName: string) => {
    return loading('Workflow en cours', workflowName);
  }, [loading]);

  const notifyWorkflowComplete = useCallback((loadingId: string, workflowName: string, success: boolean) => {
    if (success) {
      update(loadingId, {
        type: 'success',
        title: 'Workflow terminé',
        message: workflowName,
        icon: '🎉',
        persistent: false,
        duration: 5000
      });
    } else {
      update(loadingId, {
        type: 'error',
        title: 'Workflow échoué',
        message: workflowName,
        icon: '❌',
        persistent: false,
        duration: 10000
      });
    }
  }, [update]);

  const notifyAPIError = useCallback((operation: string, error: string) => {
    return add('error', `Erreur ${operation}`, error, { duration: 8000 });
  }, [add]);

  const notifyConnection = useCallback((service: string, connected: boolean) => {
    if (connected) {
      return add('success', `${service} connecté`, undefined, { duration: 3000, icon: '🔗' });
    } else {
      return add('error', `${service} déconnecté`, 'Vérifiez la configuration', { icon: '🔌' });
    }
  }, [add]);

  // Nettoyer les timeouts à la destruction
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    notifications,
    add,
    success,
    error,
    warning,
    info,
    loading,
    remove,
    update,
    clear,
    // Helpers
    notifyFileOperation,
    notifyWorkflowStart,
    notifyWorkflowComplete,
    notifyAPIError,
    notifyConnection
  };
};