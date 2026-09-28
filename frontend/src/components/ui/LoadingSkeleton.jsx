import { motion } from 'framer-motion';

const LoadingSkeleton = ({ className = '' }) => {
  return (
    <motion.div
      className={`bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
    />
  );
};

export const BookCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
      <LoadingSkeleton className="w-full h-64" />
      <div className="p-4 space-y-3">
        <LoadingSkeleton className="h-6 w-3/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
        <LoadingSkeleton className="h-4 w-1/4" />
        <LoadingSkeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

export const CategoryCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
      <LoadingSkeleton className="h-12 w-12 rounded-full mb-4" />
      <LoadingSkeleton className="h-6 w-3/4 mb-2" />
      <LoadingSkeleton className="h-4 w-full mb-4" />
      <LoadingSkeleton className="h-4 w-1/2" />
    </div>
  );
};

export const TextSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
