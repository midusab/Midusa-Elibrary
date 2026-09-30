import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants/categories';
import Card from '../components/ui/Card';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Categories() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
            Browse Categories
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2">
            Explore our curated collection of eBooks across various domains
          </p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {CATEGORIES.map((category) => (
            <motion.div
              key={category.id}
              variants={fadeInUp}
              whileHover={{ y: -6 }}
            >
              <Link to={`/library?category=${category.name}`}>
                <Card className="h-full p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-slate-100 dark:border-slate-800">
                  <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {category.bookCount} books
                    </span>
                    <span className="text-primary font-medium group-hover:translate-x-1.5 transition-transform flex items-center">
                      Explore →
                    </span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 sm:mt-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8 text-center tracking-tight">
            Featured Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {CATEGORIES.slice(0, 3).map((category) => (
              <Link key={category.id} to={`/library?category=${category.name}`}>
                <Card className="relative overflow-hidden h-44 sm:h-48 group cursor-pointer border border-transparent shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary-1 opacity-90 transition-opacity group-hover:opacity-100" />
                  <div className="relative z-10 p-5 sm:p-6 h-full flex flex-col justify-end">
                    <div className="text-3xl sm:text-4xl mb-2">{category.icon}</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-0.5">{category.name}</h3>
                    <p className="text-white/80 text-xs sm:text-sm font-medium">{category.bookCount} books</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
