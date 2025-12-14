/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const icons = {
  success: <CheckCircle size={20} className="text-green-500" />,
  error: <XCircle size={20} className="text-red-500" />,
  warning: <AlertCircle size={20} className="text-yellow-500" />,
  info: <Info size={20} className="text-blue-500" />,
};

const bgColors = {
  success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
};

export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300',
        bgColors[type],
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      {icons[type]}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {message}
      </span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X size={16} className="text-slate-500" />
      </button>
    </div>
  );
};

// Toast管理用のシンプルなストア
interface ToastState {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
}

let toastState: ToastState = { toasts: [] };
let listeners: Array<(state: ToastState) => void> = [];

const notify = () => {
  listeners.forEach((listener) => listener(toastState));
};

export const toast = {
  show: (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    toastState = {
      toasts: [...toastState.toasts, { id, message, type }],
    };
    notify();
    return id;
  },
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error'),
  warning: (message: string) => toast.show(message, 'warning'),
  info: (message: string) => toast.show(message, 'info'),
  remove: (id: string) => {
    toastState = {
      toasts: toastState.toasts.filter((t) => t.id !== id),
    };
    notify();
  },
  subscribe: (listener: (state: ToastState) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  getState: () => toastState,
};
