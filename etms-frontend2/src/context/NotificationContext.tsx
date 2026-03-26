import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info' | 'loading';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  updateNotification: (id: string, updates: Partial<Omit<Notification, 'id'>>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  success: (message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => void;
  error: (message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => void;
  warning: (message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => void;
  info: (message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => void;
  loading: (message: string) => string;
  notifyPromise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => Promise<T>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

let removeNotificationExternal: ((id: string) => void) | null = null;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Expose to external functions
  removeNotificationExternal = removeNotification;

  const addNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newNotif: Notification = { ...notification, id };
    setNotifications(prev => [...prev, newNotif]);

    // Auto-remove if not loading
    if (notification.type !== 'loading') {
      const duration = notification.duration ?? 5000;
      setTimeout(() => removeNotification(id), duration + 350); // Extra buffer for exit animation
    }
    return id;
  }, [removeNotification]);

  const updateNotification = useCallback((id: string, updates: Partial<Omit<Notification, 'id'>>) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    // Auto-remove after transition if type changes from loading
    if (updates.type && updates.type !== 'loading') {
      const duration = updates.duration ?? 5000;
      setTimeout(() => removeNotification(id), duration + 350);
    }
  }, [removeNotification]);

  const clearAll = useCallback(() => setNotifications([]), []);

  const success = useCallback((message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => {
    addNotification({ message, type: 'success', ...options });
  }, [addNotification]);

  const error = useCallback((message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => {
    addNotification({ message, type: 'error', duration: 7000, ...options });
  }, [addNotification]);

  const warning = useCallback((message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => {
    addNotification({ message, type: 'warning', ...options });
  }, [addNotification]);

  const info = useCallback((message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => {
    addNotification({ message, type: 'info', ...options });
  }, [addNotification]);

  const loading = useCallback((message: string): string => {
    return addNotification({ message, type: 'loading' });
  }, [addNotification]);

  const notifyPromise = useCallback(async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ): Promise<T> => {
    const id = addNotification({ message: messages.loading, type: 'loading' });
    try {
      const result = await promise;
      const msg = typeof messages.success === 'function' ? messages.success(result) : messages.success;
      updateNotification(id, { message: msg, type: 'success' });
      return result;
    } catch (err: unknown) {
      const msg = typeof messages.error === 'function' ? messages.error(err) : messages.error;
      updateNotification(id, { message: msg, type: 'error' });
      throw err;
    }
  }, [addNotification, updateNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      updateNotification,
      removeNotification,
      clearAll,
      success,
      error,
      warning,
      info,
      loading,
      notifyPromise,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx;
}
