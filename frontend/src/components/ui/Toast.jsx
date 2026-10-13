import { motion } from 'framer-motion';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo, 
  FiAlertTriangle, 
  FiX 
} from 'react-icons/fi';

const Toast = ({ 
  type = 'success', 
  message, 
  onClose 
}) => {
  const iconConfig = {
    success: {
      icon: <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
      border: 'border-emerald-200 bg-emerald-50/40',
      text: 'text-emerald-950 dark:text-emerald-200',
      dot: 'bg-emerald-500'
    },
    error: {
      icon: <FiAlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
      border: 'border-rose-200 bg-rose-50/40',
      text: 'text-rose-950 dark:text-rose-200',
      dot: 'bg-rose-500'
    },
    info: {
      icon: <FiInfo className="w-4 h-4 text-[#1E90FF] flex-shrink-0" />,
      border: 'border-blue-200 bg-blue-50/40',
      text: 'text-slate-900 dark:text-blue-200',
      dot: 'bg-[#1E90FF]'
    },
    warning: {
      icon: <FiAlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
      border: 'border-amber-200 bg-amber-50/40',
      text: 'text-amber-950 dark:text-amber-200',
      dot: 'bg-amber-500'
    }
  };

  const current = iconConfig[type] || iconConfig.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={`bg-white dark:bg-slate-900 border ${current.border} rounded-md px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 max-w-[340px] sm:max-w-sm w-auto shadow-none`}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        {current.icon}
      </div>
      <p className={`flex-1 text-xs font-medium leading-snug line-clamp-2 ${current.text}`}>
        {message}
      </p>
      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors flex-shrink-0 cursor-pointer"
        aria-label="Close notification"
      >
        <FiX className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

export default Toast;
