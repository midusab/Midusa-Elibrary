import { createContext, useContext, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../components/ui/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 2400) => {
    if (!message) return null;
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    // Keep max 3 toasts to prevent screen clutter
    setToasts(prev => [...prev.slice(-2), toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, duration) => addToast(message, 'success', duration);
  const error = (message, duration) => addToast(message, 'error', duration);
  const info = (message, duration) => addToast(message, 'info', duration);
  const warning = (message, duration) => addToast(message, 'warning', duration);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[99999] flex flex-col gap-2 pointer-events-none max-w-sm w-full sm:w-auto">
        <div className="flex flex-col gap-2 pointer-events-auto items-end">
          <AnimatePresence>
            {toasts.map(toast => (
              <Toast
                key={toast.id}
                type={toast.type}
                message={toast.message}
                onClose={() => removeToast(toast.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
};
