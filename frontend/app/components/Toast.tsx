"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: ToastType, message: string, duration: number = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemove={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastComponentProps {
  toast: Toast;
  onRemove: () => void;
}

function ToastComponent({ toast, onRemove }: ToastComponentProps) {
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500';
      case 'warning':
        return 'bg-orange-600 border-orange-500';
      case 'error':
        return 'bg-red-600 border-red-500';
      default:
        return 'bg-gray-600 border-gray-500';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-white" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-white" />;
      default:
        return null;
    }
  };

  const getMessagePrefix = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✅ Success: ';
      case 'warning':
        return '⚠️ Warning: ';
      case 'error':
        return '❌ Error: ';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        duration: 0.3 
      }}
      className={`
        ${getToastStyles(toast.type)}
        border rounded-lg shadow-lg p-4 pr-10 max-w-sm min-w-80
        relative overflow-hidden
      `}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
      
      <div className="relative flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(toast.type)}
        </div>
        
        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium leading-relaxed">
            {getMessagePrefix(toast.type)}{toast.message}
          </p>
        </div>
        
        {/* Close button */}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
      
      {/* Progress bar (optional) */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-white/30"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

// Standalone function for use without context (legacy support)
export const showToast = (type: ToastType, message: string, duration?: number) => {
  console.warn('Direct showToast function is deprecated. Use useToast() hook instead.');
  // This is a fallback that won't work without provider, but maintains API compatibility
};