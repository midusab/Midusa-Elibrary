import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration }) => {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const defaultDuration = type === 'error' ? 6000 : 4500;
      const ttl = duration || defaultDuration;

      const newToast = { id, type, title, message };
      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 visible

      if (ttl > 0) {
        setTimeout(() => {
          removeToast(id);
        }, ttl);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message, title = 'Success') => addToast({ type: 'success', title, message }),
    [addToast]
  );

  const error = useCallback(
    (message, title = 'Error') => addToast({ type: 'error', title, message }),
    [addToast]
  );

  const warning = useCallback(
    (message, title = 'Warning') => addToast({ type: 'warning', title, message }),
    [addToast]
  );

  const info = useCallback(
    (message, title = 'Notice') => addToast({ type: 'info', title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}

      {/* Floating Toasts Viewport */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarning = toast.type === 'warning';

            // Theme accents strictly honoring allowed brand colors
            const borderClass = isSuccess
              ? 'border-[#00A651]/40'
              : isError
              ? 'border-[#F40009]/40'
              : isWarning
              ? 'border-amber-400/40'
              : 'border-[#1E90FF]/40';

            const bgIconClass = isSuccess
              ? 'bg-[#00A651] text-white'
              : isError
              ? 'bg-[#F40009] text-white'
              : isWarning
              ? 'bg-amber-500 text-white'
              : 'bg-[#1E90FF] text-white';

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                role={isError ? 'alert' : 'status'}
                className={`pointer-events-auto bg-white text-black rounded-xl p-3.5 sm:p-4 shadow-xl border ${borderClass} flex items-start gap-3 relative select-none`}
              >
                {/* Icon badge */}
                <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${bgIconClass} shadow-xs`}>
                  {isSuccess && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                  {isError && <AlertCircle className="w-4 h-4 stroke-[2.5]" />}
                  {isWarning && <AlertTriangle className="w-4 h-4 stroke-[2.5]" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 stroke-[2.5]" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  {toast.title && (
                    <h5 className="text-xs sm:text-sm font-bold text-black tracking-tight leading-snug">
                      {toast.title}
                    </h5>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words font-medium">
                    {toast.message}
                  </p>
                </div>

                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="p-1 rounded-md text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
