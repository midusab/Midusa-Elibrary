import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiHeart, FiDownload, FiSettings, FiLogOut, FiUser, FiShoppingBag } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState('purchased');

  // Mock purchased books
  const purchasedBooks = BOOKS.slice(0, 3);
  const favoriteBooks = BOOKS.slice(3, 6);
  const downloadHistory = BOOKS.slice(0, 2);

  const handleLogout = () => {
    logout();
    success('Logged out successfully');
  };

  const handleDownload = (bookTitle) => {
    success(`Downloading ${bookTitle}...`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="p-8 sm:p-12 text-center max-w-md w-full border border-slate-100 dark:border-slate-800">
          <div className="text-5xl sm:text-6xl mb-4">🔐</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Please Sign In
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">
            You need to be logged in to access your dashboard
          </p>
          <Link to="/login">
            <Button className="px-8">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
            Welcome back, {user.fullname?.split(' ')[0]}!
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Manage your library and account settings
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8"
        >
          {[
            { icon: FiBookOpen, label: 'Purchased', value: purchasedBooks.length, color: 'bg-primary' },
            { icon: FiHeart, label: 'Favorites', value: favoriteBooks.length, color: 'bg-red-500' },
            { icon: FiDownload, label: 'Downloads', value: downloadHistory.length, color: 'bg-green-500' },
            { icon: FiShoppingBag, label: 'Total Spent', value: '$127.97', color: 'bg-purple-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
            >
              <Card className="p-4 sm:p-6 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full ${stat.color} bg-opacity-10`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-0.5">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 sm:p-6 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center mb-5 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {user.fullname?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate text-base">
                    {user.fullname}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              <nav className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                <button
                  onClick={() => setActiveTab('purchased')}
                  className={`w-full flex items-center justify-center lg:justify-start px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm font-medium ${
                    activeTab === 'purchased'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiBookOpen className="mr-2 sm:mr-3 w-4 h-4" />
                  Purchased
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full flex items-center justify-center lg:justify-start px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm font-medium ${
                    activeTab === 'favorites'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiHeart className="mr-2 sm:mr-3 w-4 h-4" />
                  Favorites
                </button>
                <button
                  onClick={() => setActiveTab('downloads')}
                  className={`w-full flex items-center justify-center lg:justify-start px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm font-medium ${
                    activeTab === 'downloads'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiDownload className="mr-2 sm:mr-3 w-4 h-4" />
                  Downloads
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center justify-center lg:justify-start px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm font-medium ${
                    activeTab === 'settings'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiSettings className="mr-2 sm:mr-3 w-4 h-4" />
                  Settings
                </button>
              </nav>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm py-2"
                  onClick={handleLogout}
                >
                  <FiLogOut className="mr-2 w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'purchased' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Purchased Books
                </h2>
                {purchasedBooks.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      No purchased books yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Start building your library by purchasing your first book
                    </p>
                    <Link to="/library">
                      <Button>Browse Library</Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {purchasedBooks.map((book) => (
                      <Card key={book.id} className="p-4 flex gap-4">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-24 h-36 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                            {book.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {book.author}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDownload(book.title)}
                            >
                              <FiDownload className="mr-2" />
                              Download
                            </Button>
                            <Link to={`/book/${book.id}`}>
                              <Button variant="outline" size="sm">
                                Read Now
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Favorites
                </h2>
                {favoriteBooks.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="text-6xl mb-4">❤️</div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      No favorites yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Save books you love to your favorites
                    </p>
                    <Link to="/library">
                      <Button>Browse Library</Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favoriteBooks.map((book) => (
                      <Card key={book.id} className="overflow-hidden">
                        <Link to={`/book/${book.id}`}>
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-48 object-cover"
                          />
                        </Link>
                        <div className="p-4">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                            {book.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {book.author}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-primary font-bold">${book.price}</span>
                            <Link to={`/book/${book.id}`}>
                              <Button size="sm">View Details</Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'downloads' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Download History
                </h2>
                {downloadHistory.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="text-6xl mb-4">📥</div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      No downloads yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Your download history will appear here
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {downloadHistory.map((book) => (
                      <Card key={book.id} className="p-4 flex items-center gap-4">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {book.title}
                          </h3>
                          <p className="text-sm text-slate-500">Downloaded on {new Date().toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Download Again
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Account Settings
                </h2>
                <Card className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user.fullname}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <Button>Save Changes</Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
