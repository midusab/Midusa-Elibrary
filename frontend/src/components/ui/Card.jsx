import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  glassmorphism = false 
}) => {
  const baseStyles = 'rounded-2xl shadow-lg';
  const hoverStyles = hover ? 'hover:shadow-xl transition-all duration-300' : '';
  const glassStyles = glassmorphism ? 'glassmorphism' : 'bg-white dark:bg-slate-800';
  
  return (
    <motion.div
      whileHover={hover ? { y: -8 } : {}}
      className={`${baseStyles} ${hoverStyles} ${glassStyles} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
