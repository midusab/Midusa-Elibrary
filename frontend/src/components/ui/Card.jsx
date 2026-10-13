import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  glassmorphism = false 
}) => {
  const baseStyles = 'rounded-lg';
  //const baseWidth = 'w-60';
  const hoverStyles = hover ? 'hover:border-slate-300 transition-all duration-200' : '';
  const surfaceStyles = glassmorphism 
    ? 'liquid-glass' 
    : 'bg-white border border-slate-200/90';
  
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : {}}
      className={`${baseStyles} ${hoverStyles} ${surfaceStyles} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
