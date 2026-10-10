import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiLogOut, FiLayers, FiLock, FiUser, 
  FiShield, FiMail, FiCheckCircle, FiBookOpen, FiHeart
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getBooks, createBook, getUserOrders, uploadPdf } from '../services/api';
import { useCategories } from '../context/CategoryContext';

// Modular Dashboard Tab Components
import UserProfileTab from '../components/dashboard/UserProfileTab';
import UserLibraryTab from '../components/dashboard/UserLibraryTab';
import UserFavoritesTab from '../components/dashboard/UserFavoritesTab';
import UserAdminTab from '../components/dashboard/UserAdminTab';

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
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  // Derive purchased books ready for download from user orders
  const purchasedBooksMap = new Map();
  userOrders.forEach((order) => {
    // If order is completed or has items
    if (order.status === 'completed' || order.status === 'success') {
      (order.items || []).forEach((item) => {
        const b = item.book;
        if (b && b.id && !purchasedBooksMap.has(b.id)) {
          purchasedBooksMap.set(b.id, b);
        }
      });
    }
  });
  // Fallback: if user has orders, also include them if no completed filter matched yet
  if (purchasedBooksMap.size === 0 && userOrders.length > 0) {
    userOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const b = item.book;
        if (b && b.id && !purchasedBooksMap.has(b.id)) {
          purchasedBooksMap.set(b.id, b);
        }
      });
    });
  }
  const purchasedBooks = Array.from(purchasedBooksMap.values());
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
          <UserProfileTab
            user={user}
            isAdmin={isAdmin}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
            editName={editName}
            setEditName={setEditName}
            editAvatar={editAvatar}
            setEditAvatar={setEditAvatar}
            isSavingProfile={isSavingProfile}
            handleSaveProfile={handleSaveProfile}
            handleStartEdit={handleStartEdit}
            purchasedBooks={purchasedBooks}
            favoriteBooks={favoriteBooks}
          />
        )}

        {/* Tab 2: My Purchased Books */}
        {activeTab === 'library' && (
          <UserLibraryTab
            isLoadingOrders={isLoadingOrders}
            purchasedBooks={purchasedBooks}
            onReadNow={(book) => success(`Opening reader for ${book.title}`)}
          />
        )}

        {/* Tab 3: Saved Favorites */}
        {activeTab === 'favorites' && (
          <UserFavoritesTab
            isLoadingBooks={isLoadingBooks}
            favoriteBooks={favoriteBooks}
          />
        )}

        {/* Tab 4: Backend Direct Manipulation (Admin Only) */}
        {activeTab === 'backend-admin' && isAdmin && (
          <UserAdminTab
            handleCreateBook={handleCreateBook}
            newBook={newBook}
            setNewBook={setNewBook}
            effectiveCategory={effectiveCategory}
            categories={categories}
            pdfFile={pdfFile}
            setPdfFile={setPdfFile}
            isUploadingPdf={isUploadingPdf}
            uploadProgress={uploadProgress}
            isSubmitting={isSubmitting}
            safeBooks={safeBooks}
            isLoadingBooks={isLoadingBooks}
          />
        )}
      </div>
    </div>
  );
}
