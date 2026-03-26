import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info' | 'premium' | 'loading';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const usePremiumNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    if (notification.type !== 'loading') {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Omit<Notification, 'id'>>) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    
    // If updated from loading to something else, set a timeout
    if (updates.type && updates.type !== 'loading') {
      const duration = updates.duration || 5000;
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notifyPromise = useCallback(async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    const id = addNotification({ message: messages.loading, type: 'loading' });
    
    try {
      const result = await promise;
      const successMessage = typeof messages.success === 'function' ? messages.success(result) : messages.success;
      updateNotification(id, { message: successMessage, type: 'success' });
      return result;
    } catch (error: any) {
      const errorMessage = typeof messages.error === 'function' ? messages.error(error) : messages.error;
      updateNotification(id, { message: errorMessage, type: 'error' });
      throw error;
    }
  }, [addNotification, updateNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    updateNotification,
    notifyPromise,
    removeNotification,
    clearAllNotifications
  };
};
