import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiDownloadCloud, FiStar, FiUsers, FiTrendingUp, FiAward } from 'react-icons/fi';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { BOOKS } from '../data/books';

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

export default function Hero() {
  const featuredBooks = BOOKS.filter(book => book.featured).slice(0, 3);
  const bestSellers = BOOKS.filter(book => book.bestseller).slice(0, 4);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50/60 via-white to-secondary-1/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white mb-4 sm:mb-6 tracking-tight leading-tight"
            >
              <span className="text-gradient">Unlock Unlimited</span>
              <br />
              Knowledge
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 max-w-2xl sm:max-w-3xl mx-auto px-2"
            >
              Access powerful eBooks in business, technology, psychology, finance, and personal development.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-xs sm:max-w-none mx-auto"
            >
              <Link to="/library" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8">
                  Browse Library
                </Button>
              </Link>
              <Link to="/categories" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                  Start Learning
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Floating Book Cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
          >
            {featuredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                variants={fadeInUp}
                whileHover={{ y: -6 }}
                className="relative"
              >
                <Card glassmorphism className="overflow-hidden">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-48 sm:h-52 object-cover"
                  />
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1">{book.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{book.author}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-lg">${book.price}</span>
                      <div className="flex items-center text-yellow-500">
                        <FiStar className="w-4 h-4 fill-current" />
                        <span className="ml-1 text-sm font-medium text-slate-700 dark:text-slate-300">{book.rating}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-10 sm:py-16 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
          >
            {[
              { icon: FiBookOpen, label: 'Books', value: '12,000+' },
              { icon: FiUsers, label: 'Active Readers', value: '45K' },
              { icon: FiDownloadCloud, label: 'Downloads', value: '100K+' },
              { icon: FiStar, label: 'Rating', value: '4.8' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center p-3 sm:p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-3 sm:mb-4">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
              Why Choose MidusaElibrary?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2">
              Experience the future of digital reading with our premium platform
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: FiDownloadCloud,
                title: 'Instant Access',
                description: 'Get immediate access to your purchased books. Download and read anytime, anywhere.'
              },
              {
                icon: FiTrendingUp,
                title: 'Curated Content',
                description: 'Hand-picked collection of premium eBooks from industry experts and thought leaders.'
              },
              {
                icon: FiAward,
                title: 'Premium Quality',
                description: 'High-quality formatting and professional editing for the best reading experience.'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                <Card className="p-6 sm:p-8 text-center h-full border border-slate-100 dark:border-slate-800">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-primary mb-4 sm:mb-6">
                    <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-12 sm:py-20 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 tracking-tight">
                Best Sellers
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Discover what our readers are loving
              </p>
            </div>
            <Link to="/library">
              <Button variant="outline" size="sm" className="sm:size-md">View All</Button>
            </Link>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {bestSellers.map((book) => (
              <motion.div
                key={book.id}
                variants={fadeInUp}
                whileHover={{ y: -6 }}
              >
                <Card className="overflow-hidden h-full flex flex-col justify-between border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="relative">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-56 sm:h-64 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-primary text-white px-2.5 py-0.5 rounded-full text-xs font-semibold shadow">
                        Bestseller
                      </div>
                    </div>
                    <div className="p-4 sm:p-5">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5 line-clamp-1 text-base sm:text-lg">
                        {book.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{book.author}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-yellow-500">
                          <FiStar className="w-4 h-4 fill-current" />
                          <span className="ml-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">{book.rating}</span>
                        </div>
                        <span className="text-primary font-bold text-lg">${book.price}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    <Link to={`/book/${book.id}`}>
                      <Button className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight">
              Ready to Elevate Your Knowledge?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Join thousands of readers who are already transforming their lives with our curated collection.
            </p>
            <Link to="/library">
              <Button size="lg" className="bg-white text-primary hover:bg-slate-100 shadow-xl px-8">
                Get Started Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}