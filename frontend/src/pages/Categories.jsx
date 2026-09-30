import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiBookOpen } from 'react-icons/fi';
import Card from '../components/ui/Card';
import CategoryIcon from '../components/ui/CategoryIcon';
import { getCategories } from '../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getCategories();
        if (isMounted) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary-50 px-3 py-1 rounded-full">
            Explore Niches
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-2 tracking-tight">
            Book Categories
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto">
            Focused exclusively on four foundational pillars of human growth, understanding, wealth, and faith.
          </p>
        </motion.div>

        {/* 4 Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id || idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
            >
              <Link to={`/library?category=${encodeURIComponent(cat.name)}`}>
                <Card className="h-full p-6 border border-slate-200/80 hover:border-primary/50 hover:shadow-md rounded-2xl bg-white transition-all cursor-pointer group flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                      <CategoryIcon slug={cat.slug} className="w-7 h-7" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors mb-2">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-6">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Curated collection</span>
                    <span className="text-primary font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                      Explore <FiArrowRight className="ml-1" />
                    </span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Banner with Liquid Glass */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl liquid-glass border border-white/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Can't decide which category to begin with?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Browse our complete library with title and author search.
            </p>
          </div>
          <Link
            to="/library"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary-600 transition-colors flex-shrink-0 shadow-sm"
          >
            <FiBookOpen className="mr-2" /> Open Full Library
          </Link>
        </div>
      </div>
    </div>
  );
}
