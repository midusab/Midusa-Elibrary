import { motion } from 'framer-motion';

/**
 * Base Shimmer Skeleton
 */
const LoadingSkeleton = ({ className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200 rounded-xl before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent ${className}`}
    />
  );
};

/**
 * Realistic Book Card Skeleton (matching aspect ratio and layout)
 */
export const BookCardSkeleton = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between h-full select-none">
      <div>
        <LoadingSkeleton className="w-full aspect-[3/4] rounded-t-xl" />
        <div className="p-2.5 sm:p-3 space-y-1.5">
          <LoadingSkeleton className="h-3.5 w-4/5 rounded-md" />
          <LoadingSkeleton className="h-3.5 w-3/5 rounded-md" />
          <LoadingSkeleton className="h-2.5 w-1/2 rounded-md mt-1" />
          <LoadingSkeleton className="h-3 w-1/3 rounded-md mt-1.5" />
          <LoadingSkeleton className="h-4 w-2/5 rounded-md mt-2" />
        </div>
      </div>
      <div className="p-2.5 sm:p-3 pt-0">
        <LoadingSkeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Horizontal Book Shelf Skeleton
 */
export const BookShelfSkeleton = () => {
  return (
    <div className="py-4 px-4 sm:px-6 bg-white rounded-xl border border-slate-200">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex items-center justify-between mb-3.5">
          <LoadingSkeleton className="h-6 w-44 rounded-md" />
          <LoadingSkeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="flex gap-4 overflow-hidden pt-1 pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-36 sm:w-44">
              <LoadingSkeleton className="w-full aspect-[3/4] rounded-xl mb-2.5" />
              <LoadingSkeleton className="h-3.5 w-3/4 rounded-md mb-1.5" />
              <LoadingSkeleton className="h-3 w-1/2 rounded-md mb-2.5" />
              <LoadingSkeleton className="h-7 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Hero Carousel Banner Skeleton
 */
export const HeroCarouselSkeleton = () => {
  return (
    <div className="relative bg-slate-950 min-h-[380px] sm:min-h-[460px] flex items-center overflow-hidden border-b border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7 space-y-4">
          <LoadingSkeleton className="h-6 w-32 rounded-xl bg-slate-800 before:via-slate-700/50" />
          <LoadingSkeleton className="h-10 sm:h-12 w-4/5 rounded-xl bg-slate-800 before:via-slate-700/50" />
          <LoadingSkeleton className="h-4 w-full rounded-md bg-slate-800 before:via-slate-700/50" />
          <LoadingSkeleton className="h-4 w-2/3 rounded-md bg-slate-800 before:via-slate-700/50" />
          <div className="flex gap-3 pt-3">
            <LoadingSkeleton className="h-11 w-36 rounded-xl bg-slate-800 before:via-slate-700/50" />
            <LoadingSkeleton className="h-11 w-32 rounded-xl bg-slate-800 before:via-slate-700/50" />
          </div>
        </div>
        <div className="hidden md:flex md:col-span-5 justify-center">
          <LoadingSkeleton className="w-56 aspect-[3/4] rounded-2xl bg-slate-800 before:via-slate-700/50 shadow-2xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Full Page Transition Suspense Skeleton
 */
export const PageSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-8 w-48 rounded-xl" />
        <LoadingSkeleton className="h-8 w-32 rounded-xl" />
      </div>
      <LoadingSkeleton className="h-12 w-full rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  );
};

export const CategoryCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-4">
      <LoadingSkeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton className="h-5 w-3/4 rounded-md" />
        <LoadingSkeleton className="h-3.5 w-1/2 rounded-md" />
      </div>
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
