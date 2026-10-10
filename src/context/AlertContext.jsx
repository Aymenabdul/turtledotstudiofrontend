import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  HelpCircle 
} from 'lucide-react';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Add toast
  const showToast = useCallback((type, message, title, duration = 4500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, title = 'Success') => showToast('success', message, title), [showToast]);
  const error = useCallback((message, title = 'Error') => showToast('error', message, title, 6000), [showToast]);
  const warning = useCallback((message, title = 'Warning') => showToast('warning', message, title, 5000), [showToast]);
  const info = useCallback((message, title = 'Information') => showToast('info', message, title), [showToast]);

  // Confirmation dialog
  const confirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger', // 'danger' | 'warning' | 'primary'
    onConfirm,
    onCancel
  }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        variant,
        onConfirm: async () => {
          setConfirmDialog(null);
          if (onConfirm) await onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          if (onCancel) onCancel();
          resolve(false);
        }
      });
    });
  }, []);

  // Expose to window for global safety
  useEffect(() => {
    window.studioAlert = {
      success,
      error,
      warning,
      info,
      confirm
    };
  }, [success, error, warning, info, confirm]);

  return (
    <AlertContext.Provider value={{ success, error, warning, info, confirm, removeToast }}>
      {children}
      {createPortal(
        <>
          {/* Toasts Container */}
          <div className="fixed top-5 right-5 z-[99999] flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
          </div>

          {/* Confirm Dialog Modal */}
          {confirmDialog && (
            <ConfirmModal dialog={confirmDialog} />
          )}
        </>,
        document.body
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Toast Item Component
const ToastItem = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const config = {
    success: {
      bg: 'bg-white border-emerald-200/90 text-stone-900',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      icon: CheckCircle2,
      accent: 'bg-emerald-500',
      titleColor: 'text-emerald-950',
    },
    error: {
      bg: 'bg-white border-rose-200/90 text-stone-900',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
      icon: AlertCircle,
      accent: 'bg-rose-500',
      titleColor: 'text-rose-950',
    },
    warning: {
      bg: 'bg-white border-amber-200/90 text-stone-900',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
      icon: AlertTriangle,
      accent: 'bg-amber-500',
      titleColor: 'text-amber-950',
    },
    info: {
      bg: 'bg-white border-sky-200/90 text-stone-900',
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-200',
      icon: Info,
      accent: 'bg-sky-500',
      titleColor: 'text-sky-950',
    },
  }[toast.type] || {
    bg: 'bg-white border-stone-200 text-stone-900',
    iconBg: 'bg-stone-50 text-stone-600 border border-stone-200',
    icon: Info,
    accent: 'bg-stone-500',
    titleColor: 'text-stone-950',
  };

  const IconComponent = config.icon;

  return (
    <div className={`pointer-events-auto rounded-2xl p-4 shadow-xl border ${config.bg} flex items-start space-x-3 relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200 transition-all`}>
      <div className="absolute top-0 left-0 bottom-0 w-1.5 overflow-hidden">
        <div className={`w-full h-full ${config.accent}`} />
      </div>

      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        {toast.title && (
          <h4 className={`text-xs font-bold leading-tight ${config.titleColor}`}>{toast.title}</h4>
        )}
        <p className="text-xs text-stone-600 font-medium mt-0.5 leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      <button
        onClick={onClose}
        className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Confirm Modal Component
const ConfirmModal = ({ dialog }) => {
  const isDanger = dialog.variant === 'danger';
  const isWarning = dialog.variant === 'warning';

  const iconBg = isDanger 
    ? 'bg-rose-50 border-rose-200 text-rose-600' 
    : isWarning 
    ? 'bg-amber-50 border-amber-200 text-amber-600' 
    : 'bg-sky-50 border-sky-200 text-sky-600';

  const confirmBtnBg = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white'
    : isWarning
    ? 'bg-amber-600 hover:bg-amber-700 text-white'
    : 'bg-stone-900 hover:bg-stone-800 text-white';

  const Icon = isDanger ? AlertTriangle : isWarning ? AlertCircle : HelpCircle;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white border border-stone-200 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-start space-x-4">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-stone-900 text-base">{dialog.title}</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {dialog.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={dialog.onCancel}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition"
          >
            {dialog.cancelText}
          </button>
          <button
            type="button"
            onClick={dialog.onConfirm}
            className={`px-5 py-2 font-semibold rounded-xl text-xs shadow-sm transition ${confirmBtnBg}`}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
