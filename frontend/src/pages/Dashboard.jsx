import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiDownload, FiLogOut, FiPlus, FiLayers, FiLock, FiUser, 
  FiShield, FiMail, FiCheckCircle, FiBookOpen, FiHeart, FiEdit3, FiSave
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getBooks, createBook, getUserOrders, uploadPdf } from '../services/api';
import { formatPrice } from '../utils/currency';
import { useCategories } from '../context/CategoryContext';

export default function Dashboard() {
  const { user, logout, updateProfile, isAdmin } = useAuth();
  const { categories } = useCategories();
  const { success, error } = useToast();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');
  const [books, setBooks] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.fullname || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // New book state for real-time backend manipulation
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: '',
    price: '',
    description: '',
    coverImage: '',
    pdfUrl: ''
  });
  const [pdfFile, setPdfFile] = useState(null);       // raw File object from picker
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Derive the effective category without syncing it back into state.
  // Falls back to the first available category when the user hasn't picked one yet.
  const effectiveCategory = newBook.category || categories[0]?.name || '';

  const handleStartEdit = () => {
    setEditName(user?.fullname || '');
    setEditAvatar(user?.avatar || '');
    setIsEditingProfile(true);
  };

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

  const safeBooks = Array.isArray(books) ? books : [];

  const handleLogout = async () => {
    await logout();
    success('You have signed out successfully.');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      error('Full name cannot be blank.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullname: editName.trim(),
        avatar: editAvatar.trim()
      });
      success('Profile details updated successfully!');
      setIsEditingProfile(false);
    } catch (err) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim() || !newBook.price) {
      error('Please provide book title, author, and price in KSh');
      return;
    }
    if (!pdfFile && !newBook.pdfUrl) {
      error('Please upload a PDF file for this book.');
      return;
    }

    setIsSubmitting(true);
    try {
      let pdfUrl = newBook.pdfUrl;

      // Upload the PDF first
      if (pdfFile) {
        setIsUploadingPdf(true);
        setUploadProgress(0);
        try {
          pdfUrl = await uploadPdf(pdfFile, user?.token, (pct) => setUploadProgress(pct));
        } finally {
          setIsUploadingPdf(false);
          setUploadProgress(0);
        }
      }

      await createBook({
        ...newBook,
        category: effectiveCategory,
        pdfUrl,
        price: parseFloat(newBook.price)
      }, user?.token);
      success('Book added to database successfully!');
      const res = await getBooks();
      setBooks(Array.isArray(res?.books) ? res.books : []);
      setNewBook({
        title: '',
        author: '',
        category: '',
        price: '',
        description: '',
        coverImage: '',
        pdfUrl: ''
      });
      setPdfFile(null);
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
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E90FF] flex items-center justify-center mx-auto mb-4">
            <FiLock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In Required</h2>
          <p className="text-xs text-slate-500 mb-5">
            Sign in to view your profile, purchased library, and personal dashboard.
          </p>
          <Link to="/login">
            <Button size="sm" className="w-full bg-[#1E90FF] hover:bg-[#1C86EE] text-white">
              Sign In to Your Account
            </Button>
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
    <div className="min-h-screen bg-slate-50/60 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Profile Summary Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullname}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1E90FF] to-blue-400 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-[#1E90FF]/20">
                  {user.fullname?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {user.fullname}
                  </h1>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <FiShield className="w-3 h-3 text-amber-600" />
                      Administrator
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FiCheckCircle className="w-3 h-3" />
                      Verified Reader
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                  <FiMail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {isAdmin && (
                <Link to="/admin" className="flex-1 sm:flex-none">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer">
                    <FiShield className="w-3.5 h-3.5" />
                    Admin Portal
                  </button>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
              >
                <FiLogOut className="w-3.5 h-3.5 text-rose-500" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Admin Notice Bar if signed in as admin */}
          {isAdmin && (
            <div className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2 text-xs text-amber-900 min-w-0">
                <FiShield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="min-w-0">
                  <strong>Admin Account Verified:</strong> Signed in as{' '}
                  <code className="break-all">{user.email}</code>. Full system privileges active.
                </span>
              </div>
              <Link to="/admin" className="text-xs font-bold text-amber-800 hover:underline flex-shrink-0 self-end sm:self-auto">
                Launch Portal →
              </Link>
            </div>
          )}
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'profile' ? 'text-[#1E90FF]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FiUser className="w-4 h-4" />
            My Profile
            {activeTab === 'profile' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E90FF] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'library' ? 'text-[#1E90FF]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FiBookOpen className="w-4 h-4" />
            My Books ({purchasedBooks.length})
            {activeTab === 'library' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E90FF] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'favorites' ? 'text-[#1E90FF]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FiHeart className="w-4 h-4" />
            Saved Titles ({favoriteBooks.length})
            {activeTab === 'favorites' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E90FF] rounded-full" />
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('backend-admin')}
              className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'backend-admin' ? 'text-amber-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FiLayers className="w-4 h-4 text-amber-600" />
              Direct Catalog Management
              {activeTab === 'backend-admin' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          )}
        </div>

        {/* Tab 1: Profile View & Management */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Account Overview Card */}
              <Card className="p-6 border border-slate-200/80 rounded-2xl bg-white shadow-sm md:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FiUser className="text-[#1E90FF]" /> Profile Details
                  </h2>
                  {!isEditingProfile && (
                    <button
                      onClick={handleStartEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1E90FF] transition-colors cursor-pointer"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Avatar Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={editAvatar}
                        onChange={(e) => setEditAvatar(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF]"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E90FF] hover:bg-[#1C86EE] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
                      >
                        <FiSave className="w-3.5 h-3.5" />
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditName(user.fullname || '');
                          setEditAvatar(user.avatar || '');
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                          Full Name
                        </span>
                        <span className="text-sm font-bold text-slate-900">{user.fullname}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                          Email Address
                        </span>
                        <span className="text-sm font-semibold text-slate-900 truncate block">{user.email}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                          Account Role
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold capitalize ${isAdmin ? 'text-amber-700' : 'text-slate-900'}`}>
                            {isAdmin ? 'Platform Administrator' : 'Library Reader'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                          Account Status
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active & Verified
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Quick Info & Stats Card */}
              <div className="space-y-4">
                <Card className="p-6 border border-slate-200/80 rounded-2xl bg-white shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">
                    Library Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Books Purchased</span>
                      <span className="font-bold text-slate-900">{purchasedBooks.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Saved Wishlist</span>
                      <span className="font-bold text-slate-900">{favoriteBooks.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Currency</span>
                      <span className="font-bold text-slate-900">Kenyan Shillings (KSh)</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <Link to="/library">
                      <button className="w-full py-2 px-3 rounded-xl bg-[#1E90FF]/10 hover:bg-[#1E90FF]/20 text-[#1E90FF] text-xs font-bold transition-colors cursor-pointer">
                        Explore Book Catalog →
                      </button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My Purchased Books */}
        {activeTab === 'library' && (
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Ready to Read</h2>
            {isLoadingOrders ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading your library...</p>
              </div>
            ) : purchasedBooks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
                <p className="text-xs text-slate-500">No books purchased yet.</p>
                <Link to="/library" className="mt-2 inline-block text-xs font-semibold text-[#1E90FF]">
                  Browse Catalog →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {purchasedBooks.map((book) => (
                  <Card key={book.id} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-sm flex gap-3.5 items-center">
                    <img src={book.coverImage} alt={book.title} className="w-16 h-22 object-cover rounded-lg bg-slate-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-[#1E90FF] block truncate">{book.category}</span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{book.title}</h3>
                      <p className="text-[11px] text-slate-500 truncate mb-2">{book.author}</p>
                      <button
                        onClick={() => success(`Opening reader for ${book.title}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1E90FF] text-white text-[11px] font-semibold hover:bg-[#1C86EE] transition-colors"
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

        {/* Tab 3: Saved Favorites */}
        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Your Wishlist</h2>
            {isLoadingBooks ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading wishlist...</p>
              </div>
            ) : favoriteBooks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
                <p className="text-xs text-slate-500">No titles saved in wishlist yet.</p>
                <Link to="/library" className="mt-2 inline-block text-xs font-semibold text-[#1E90FF]">
                  Explore Library →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {favoriteBooks.map((book) => (
                  <Card key={book.id} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-sm flex gap-3.5 items-center">
                    <img src={book.coverImage} alt={book.title} className="w-16 h-22 object-cover rounded-lg bg-slate-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-[#1E90FF] block truncate">{book.category}</span>
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

        {/* Tab 4: Backend Direct Manipulation (Admin Only) */}
        {activeTab === 'backend-admin' && isAdmin && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <h3 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
                <FiShield className="text-amber-600" /> Administrator Database Panel
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Add and manage books directly in your database. All prices are in Kenyan Shillings (KSh).
              </p>
            </div>

            {/* Form to add book directly */}
            <Card className="p-6 border border-slate-200/80 rounded-2xl bg-white shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                <FiPlus className="text-[#1E90FF]" /> Add New Book to Website
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
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
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
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={effectiveCategory}
                      onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
                    >
                      {categories.length === 0 ? (
                        <option value="">No categories available</option>
                      ) : (
                        categories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))
                      )}
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
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newBook.coverImage}
                    onChange={(e) => setNewBook({ ...newBook, coverImage: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    eBook PDF File
                    {newBook.pdfUrl && !pdfFile && (
                      <span className="ml-2 text-green-600 font-normal">✓ URL set</span>
                    )}
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0] || null;
                      setPdfFile(file);
                      // Clear any manually typed URL when a file is chosen
                      if (file) setNewBook(prev => ({ ...prev, pdfUrl: '' }));
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF] file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#1E90FF]/10 file:text-[#1E90FF] file:font-semibold cursor-pointer"
                  />
                  {pdfFile && (
                    <p className="mt-1 text-[11px] text-slate-500">Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                  )}
                  {isUploadingPdf && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#1E90FF]">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-3 h-3 border border-[#1E90FF] border-t-transparent rounded-full animate-spin" />
                          Uploading PDF…
                        </span>
                        <span className="font-semibold tabular-nums">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1E90FF] rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief summary and synopsis..."
                    value={newBook.description}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E90FF]"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-xs font-semibold bg-[#1E90FF] hover:bg-[#1C86EE] text-white"
                >
                  {isSubmitting ? 'Saving to Database...' : 'Publish Book in KSh'}
                </Button>
              </form>
            </Card>

            {/* Current Catalog Inventory */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Live Catalog ({safeBooks.length} Books)
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs min-w-[480px]">
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
                          <div className="w-5 h-5 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
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
                          <td className="p-3 font-medium text-slate-900 max-w-[180px] truncate">{b.title}</td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">{b.category}</td>
                          <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{formatPrice(b.price)}</td>
                          <td className="p-3 text-right">
                            <Link to={`/book/${b.id}`} className="text-[#1E90FF] hover:underline font-medium">View</Link>
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
