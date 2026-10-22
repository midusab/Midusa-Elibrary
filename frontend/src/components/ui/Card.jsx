import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  glassmorphism = true 
}) => {
  const baseStyles = 'rounded-2xl';
  const hoverStyles = hover ? 'hover-lift' : '';
  const surfaceStyles = glassmorphism 
    ? 'liquid-glass specular-sheen' 
    : 'bg-white/90 backdrop-blur-xl border border-white/60 shadow-sm';
  
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
