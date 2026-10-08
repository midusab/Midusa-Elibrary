import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  glassmorphism = false 
}) => {
  const baseStyles = 'rounded-2xl';
  //const baseWidth = 'w-60';
  const hoverStyles = hover ? 'hover:shadow-md transition-all duration-250' : '';
  const surfaceStyles = glassmorphism 
    ? 'liquid-glass' 
    : 'bg-white border border-slate-200/80 shadow-sm';
  
  return (
    <motion.div
      whileHover={hover ? { y: -3 } : {}}
      className={`${baseStyles} ${hoverStyles} ${surfaceStyles}  ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
