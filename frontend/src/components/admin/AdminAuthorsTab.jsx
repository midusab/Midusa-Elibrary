import { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Edit3,
  Plus,
  BookOpen,
  CheckCircle2,
  X
} from 'lucide-react';
import { getAdminAuthors, saveAuthorBio } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminAuthorsTab({ token, _books = [], onRefresh }) {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: ''
  });

  const { success, error: toastError } = useToast();

  const loadAuthors = async () => {
    setLoading(true);
    try {
      const data = await getAdminAuthors(token);
      setAuthors(data || []);
    } catch (err) {
      console.error('Failed to load authors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthors();
  }, [token]);

  const handleOpenEdit = (author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name || '',
      bio: author.bio || '',
      avatar: author.avatar || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingAuthor(null);
    setFormData({
      name: '',
      bio: '',
      avatar: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toastError('Author name is required');
      return;
    }
    setIsSaving(true);
    try {
      await saveAuthorBio(formData, token);
      success(`Author biography for "${formData.name}" saved successfully`);
      setIsModalOpen(false);
      loadAuthors();
      if (onRefresh) onRefresh();
    } catch (err) {
      toastError(err.message || 'Failed to update author biography');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAuthors = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return authors;
    return authors.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.bio?.toLowerCase().includes(q)
    );
  }, [authors, search]);

  return (
    <div className="space-y-6">
      {/* Top action / search bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search authors or biographies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#1E90FF] hover:bg-[#1873cc] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add / Update Author Bio</span>
        </button>
      </div>

      {/* Authors Grid / Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
          <div className="w-8 h-8 border-3 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading author directory...</p>
        </div>
      ) : filteredAuthors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No authors found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'No authors match your search query.' : 'Add your first author biography or publish books to populate authors automatically.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAuthors.map((author) => {
            const initials = author.name
              ? author.name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'AU';

            return (
              <div
                key={author.id || author.name}
                className="bg-white border border-slate-200/90 rounded-lg p-5 flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {author.avatar ? (
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-blue-50 text-[#1E90FF] font-bold text-sm flex items-center justify-center border border-blue-100 flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#1E90FF] transition-colors">
                          {author.name}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          <span>{author.book_count || 0} eBook{author.book_count === 1 ? '' : 's'}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(author)}
                      className="p-1.5 text-slate-400 hover:text-[#1E90FF] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      title="Edit Biography"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed bg-slate-50/70 p-3 rounded border border-slate-100">
                    {author.bio || (
                      <span className="italic text-slate-400">
                        No custom biography yet. Default placeholder will show on book pages until edited.
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {author.bio ? (
                      <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Bio Active
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Needs Custom Bio</span>
                    )}
                  </span>

                  <button
                    onClick={() => handleOpenEdit(author)}
                    className="text-xs font-semibold text-[#1E90FF] hover:underline cursor-pointer"
                  >
                    Edit Bio →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Author Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingAuthor ? `Edit Biography: ${editingAuthor.name}` : 'Add Author Biography'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This biography displays on reader book detail pages and catalog profile cards.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Author Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Greene, James Clear"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Author Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Biography &amp; Background *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Enter detailed background, research credentials, career accolades, and published accomplishments..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tip: A thorough biography helps readers trust the book's authority and drives conversions.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#1E90FF] hover:bg-[#1873cc] rounded-md transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Biography'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
