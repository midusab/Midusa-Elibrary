import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-600 shadow-sm active:scale-[0.98]',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:scale-[0.98]',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary hover:bg-primary-50/50 active:scale-[0.98]',
    ghost: 'text-slate-600 hover:text-primary hover:bg-primary-50/50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:scale-[0.98]'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs sm:text-sm',
    lg: 'px-6 py-3 text-sm sm:text-base'
  };
  
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
