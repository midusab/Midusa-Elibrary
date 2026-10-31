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
    ({ type = 'info', message, duration }) => {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const defaultDuration = type === 'error' ? 5000 : 4000;
      const ttl = duration || defaultDuration;

      const newToast = { id, type, message };
      setToasts((prev) => [...prev.slice(-2), newToast]); // Keep max 3 visible at once

      if (ttl > 0) {
        setTimeout(() => {
          removeToast(id);
        }, ttl);
      }

      return id;
    },
    [removeToast]
  );

  const normalizeParams = (message, arg2, arg3) => {
    let duration = null;
    if (typeof arg2 === 'number') {
      duration = arg2;
    } else if (typeof arg3 === 'number') {
      duration = arg3;
    }
    return { message, duration };
  };

  const success = useCallback(
    (message, arg2, arg3) => {
      const { duration } = normalizeParams(message, arg2, arg3);
      return addToast({ type: 'success', message, duration });
    },
    [addToast]
  );

  const error = useCallback(
    (message, arg2, arg3) => {
      const { duration } = normalizeParams(message, arg2, arg3);
      return addToast({ type: 'error', message, duration });
    },
    [addToast]
  );

  const warning = useCallback(
    (message, arg2, arg3) => {
      const { duration } = normalizeParams(message, arg2, arg3);
      return addToast({ type: 'warning', message, duration });
    },
    [addToast]
  );

  const info = useCallback(
    (message, arg2, arg3) => {
      const { duration } = normalizeParams(message, arg2, arg3);
      return addToast({ type: 'info', message, duration });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}

      {/* Minimalistic Bottom Pop-Up Toast Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse items-center gap-2 max-w-lg w-auto pointer-events-none px-4 select-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarning = toast.type === 'warning';

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 35, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.94, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                role={isError ? 'alert' : 'status'}
                className="pointer-events-auto bg-white/95 backdrop-blur-md text-black rounded-2xl px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-slate-200/90 flex items-center gap-2.5 min-w-[260px] max-w-md"
              >
                {/* Minimalist icon badge */}
                {isSuccess && (
                  <CheckCircle2 className="w-4 h-4 text-[#00A651] stroke-[2.5] flex-shrink-0" />
                )}
                {isError && (
                  <AlertCircle className="w-4 h-4 text-[#F40009] stroke-[2.5] flex-shrink-0" />
                )}
                {isWarning && (
                  <AlertTriangle className="w-4 h-4 text-amber-500 stroke-[2.5] flex-shrink-0" />
                )}
                {!isSuccess && !isError && !isWarning && (
                  <Info className="w-4 h-4 text-[#1E90FF] stroke-[2.5] flex-shrink-0" />
                )}

                {/* Clean message with no numbers, titles, or headers */}
                <p className="text-xs sm:text-sm font-semibold text-black leading-snug flex-1 break-words">
                  {toast.message}
                </p>

                {/* Subtle dismiss button */}
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="text-slate-400 hover:text-black transition-colors p-1 -mr-1 rounded-md hover:bg-slate-100 cursor-pointer flex-shrink-0"
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
