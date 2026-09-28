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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Please Sign In
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You need to be logged in to access your dashboard
          </p>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back, {user.fullname?.split(' ')[0]}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your library and account settings
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
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
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.color} bg-opacity-10`}>
                    <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-slate-600 dark:text-slate-400">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {user.fullname?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {user.fullname}
                  </h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('purchased')}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                    activeTab === 'purchased'
                      ? 'bg-primary text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiBookOpen className="mr-3" />
                  Purchased Books
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                    activeTab === 'favorites'
                      ? 'bg-primary text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiHeart className="mr-3" />
                  Favorites
                </button>
                <button
                  onClick={() => setActiveTab('downloads')}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                    activeTab === 'downloads'
                      ? 'bg-primary text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiDownload className="mr-3" />
                  Download History
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-primary text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FiSettings className="mr-3" />
                  Settings
                </button>
              </nav>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <FiLogOut className="mr-2" />
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
