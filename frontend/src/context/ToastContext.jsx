import { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  // Floating toast popups suppressed in favor of inbuilt inline contextual messages
  const [toasts, setToasts] = useState([]);

  const addToast = () => null;
  const removeToast = () => {};
  const success = () => null;
  const error = () => null;
  const info = () => null;
  const warning = () => null;

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
    </ToastContext.Provider>
  );
};
