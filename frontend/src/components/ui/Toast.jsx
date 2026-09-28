import { motion } from 'framer-motion';
import { IoCheckmarkCircle, IoAlertCircle, IoInformationCircle, IoClose } from 'react-icons/io5';

const Toast = ({ 
  type = 'success', 
  message, 
  onClose 
}) => {
  const icons = {
    success: <IoCheckmarkCircle className="w-6 h-6 text-green-500" />,
    error: <IoAlertCircle className="w-6 h-6 text-red-500" />,
    info: <IoInformationCircle className="w-6 h-6 text-blue-500" />,
    warning: <IoAlertCircle className="w-6 h-6 text-yellow-500" />
  };

  const colors = {
    success: 'border-green-500',
    error: 'border-red-500',
    info: 'border-blue-500',
    warning: 'border-yellow-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border-l-4 ${colors[type]} p-4 flex items-center gap-3 max-w-md`}
    >
      {icons[type]}
      <p className="flex-1 text-slate-900 dark:text-white">{message}</p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <IoClose className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

export default Toast;
