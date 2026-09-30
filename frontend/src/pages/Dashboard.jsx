import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiLogOut, FiPlus, FiLayers, FiLock } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getBooks, createBook, getUserOrders } from '../services/api';
import { formatPrice } from '../utils/currency';
import { CATEGORIES } from '../constants/categories';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New book state for real-time backend manipulation
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: 'Self Development',
    price: '',
    description: '',
    coverImage: '',
    pdfUrl: ''
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchCatalog() {
      setIsLoadingBooks(true);
      try {
        const res = await getBooks();
        if (isMounted) {
          setBooks(Array.isArray(res?.books) ? res.books : []);
        }
      } catch (err) {
        console.error('Error fetching catalog in dashboard:', err);
        if (isMounted) setBooks([]);
      } finally {
        if (isMounted) setIsLoadingBooks(false);
      }
    }

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      if (!user?.token) {
        setUserOrders([]);
        return;
      }
      setIsLoadingOrders(true);
      try {
        const orders = await getUserOrders(user.token);
        if (isMounted) {
          setUserOrders(Array.isArray(orders) ? orders : []);
        }
      } catch (err) {
        console.error('Error fetching user orders:', err);
      } finally {
        if (isMounted) setIsLoadingOrders(false);
      }
    }

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Null-safe alias used throughout the template
  const safeBooks = Array.isArray(books) ? books : [];

  const handleLogout = () => {
    logout();
    success('Logged out successfully');
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim() || !newBook.price) {
      error('Please provide book title, author, and price in KSh');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBook({
        ...newBook,
        price: parseFloat(newBook.price)
      }, user?.token);
      success('Book created successfully in database!');
      const res = await getBooks();
      setBooks(Array.isArray(res?.books) ? res.books : []);
      setNewBook({
        title: '',
        author: '',
        category: 'Self Development',
        price: '',
        description: '',
        coverImage: '',
        pdfUrl: ''
      });
    } catch (_err) {
      error(_err.message || 'Failed to create book in database');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[75vh] bg-white flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4">
            <FiLock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In Required</h2>
          <p className="text-xs text-slate-500 mb-5">
            Sign in to view your purchased library and personal dashboard.
          </p>
          <Link to="/login">
            <Button size="sm" className="w-full">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Derive purchased books directly from real user orders
  const purchasedBooks = userOrders.flatMap(order =>
    (order.items || []).map(item => item.book).filter(Boolean)
  );
  const favoriteBooks = [];

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Profile Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullname} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center">
                {user.fullname?.[0] || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {user.fullname}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                  Google Verified
                </span>
              </div>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-100 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('library')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap ${
              activeTab === 'library' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Books ({purchasedBooks.length})
            {activeTab === 'library' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap ${
              activeTab === 'favorites' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Saved Titles ({favoriteBooks.length})
            {activeTab === 'favorites' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('backend-admin')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'backend-admin' ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FiLayers className="w-3.5 h-3.5" />
            Backend Manipulation
            {activeTab === 'backend-admin' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: My Purchased Books */}
        {activeTab === 'library' && (
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Ready to Read</h2>
            {isLoadingOrders ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading your library...</p>
              </div>
            ) : purchasedBooks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
                <p className="text-xs text-slate-500">No books purchased yet.</p>
                <Link to="/library" className="mt-2 inline-block text-xs font-semibold text-primary">
                  Browse Catalog →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {purchasedBooks.map((book) => (
                  <Card key={book.id} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-sm flex gap-3.5 items-center">
                    <img src={book.coverImage} alt={book.title} className="w-16 h-22 object-cover rounded-lg bg-slate-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-primary block truncate">{book.category}</span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{book.title}</h3>
                      <p className="text-[11px] text-slate-500 truncate mb-2">{book.author}</p>
                      <button
                        onClick={() => success(`Opening reader for ${book.title}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-white text-[11px] font-semibold hover:bg-primary-700 transition-colors"
                      >
                        <FiDownload className="w-3 h-3" /> Read Now
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Favorites */}
        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Your Wishlist</h2>
            {isLoadingBooks ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading wishlist...</p>
              </div>
            ) : favoriteBooks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
                <p className="text-xs text-slate-500">No titles saved in wishlist yet.</p>
                <Link to="/library" className="mt-2 inline-block text-xs font-semibold text-primary">
                  Explore Library →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {favoriteBooks.map((book) => (
                  <Card key={book.id} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-sm flex gap-3.5 items-center">
                    <img src={book.coverImage} alt={book.title} className="w-16 h-22 object-cover rounded-lg bg-slate-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-primary block truncate">{book.category}</span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{book.title}</h3>
                      <p className="text-[11px] text-slate-500 truncate mb-2">{formatPrice(book.price)}</p>
                      <Link to={`/book/${book.id}`}>
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Backend Direct Manipulation */}
        {activeTab === 'backend-admin' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
              <h3 className="text-sm font-bold text-blue-900 mb-1">
                Direct Backend Manipulation Panel
              </h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Add and manage books directly in your database. Prices are formatted in Kenyan Shillings (KSh).
              </p>
            </div>

            {/* Form to add book directly */}
            <Card className="p-6 border border-slate-200/80 rounded-2xl bg-white shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                <FiPlus className="text-primary" /> Add New Book to Website
              </h3>

              <form onSubmit={handleCreateBook} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Book Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Master Your Focus"
                      value={newBook.title}
                      onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Author</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. John Maxwell"
                      value={newBook.author}
                      onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category (Your 4 Core Niches)</label>
                    <select
                      value={newBook.category}
                      onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Price (KSh)</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="1500"
                      value={newBook.price}
                      onChange={(e) => setNewBook({ ...newBook, price: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief summary and synopsis..."
                    value={newBook.description}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-xs font-semibold"
                >
                  {isSubmitting ? 'Pushing to Backend...' : 'Publish Book in KSh'}
                </Button>
              </form>
            </Card>

            {/* Current Catalog Inventory */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Live Catalog ({safeBooks.length} Books)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3">Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingBooks ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                          Loading catalog inventory...
                        </td>
                      </tr>
                    ) : safeBooks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          No books found in database.
                        </td>
                      </tr>
                    ) : (
                      safeBooks.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-medium text-slate-900 max-w-xs truncate">{b.title}</td>
                          <td className="p-3 text-slate-600">{b.category}</td>
                          <td className="p-3 font-semibold text-slate-900">{formatPrice(b.price)}</td>
                          <td className="p-3 text-right">
                            <Link to={`/book/${b.id}`} className="text-primary hover:underline font-medium">View</Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
