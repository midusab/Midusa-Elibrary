import { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Power,
  Trash2,
  Calendar,
  Percent,
  BookOpen,
  Search,
  Check,
  RefreshCw
} from 'lucide-react';
import Card from '../ui/Card';
import { getAdminFlashSale, saveFlashSale, toggleFlashSale, deleteFlashSale } from '../../services/api';
import { useFlashSale } from '../../context/FlashSaleContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/currency';

export default function AdminFlashSaleTab({ token, books = [] }) {
  const { success, error: toastError } = useToast();
  const { refreshFlashSale: globalRefresh } = useFlashSale();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState(25);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scope, setScope] = useState('all'); // 'all' or 'specific'
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [bookFilter, setBookFilter] = useState('');

  // Status Info
  const [saleStatus, setSaleStatus] = useState({
    isActive: false,
    isExpired: false,
    isLive: false,
    sale: null
  });

  const loadSaleData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await getAdminFlashSale(token);
      if (data?.flashSale) {
        const s = data.flashSale;
        setTitle(s.title || '');
        setDescription(s.description || '');
        setDiscountPercent(s.discountPercent || 25);
        
        if (s.startTime) {
          const ds = new Date(s.startTime);
          setStartTime(new Date(ds.getTime() - ds.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }

        if (s.endTime) {
          // Format for datetime-local input: YYYY-MM-DDTHH:mm
          const d = new Date(s.endTime);
          const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setEndTime(localIso);
        }

        const bIds = Array.isArray(s.bookIds) ? s.bookIds : [];
        setSelectedBookIds(bIds);
        setScope(bIds.length > 0 ? 'specific' : 'all');

        setSaleStatus({
          isActive: Boolean(s.isActive),
          isExpired: Boolean(data.isExpired),
          isLive: Boolean(data.isLive),
          sale: s
        });
      }
    } catch (err) {
      console.error('Error fetching admin flash sale data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSaleData();
  }, [token]);

  // Set quick duration preset
  const setQuickDuration = (hours) => {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEndTime(localIso);
  };

  // Toggle book selection
  const handleToggleBook = (bookId) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleSelectAllBooks = () => {
    if (selectedBookIds.length === books.length) {
      setSelectedBookIds([]);
    } else {
      setSelectedBookIds(books.map((b) => b.id));
    }
  };

  // Save Flash Sale
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toastError('Please enter a flash sale campaign title.');
      return;
    }

    if (!endTime) {
      toastError('Please specify when the flash sale should end.');
      return;
    }

    const startTimestamp = startTime ? new Date(startTime).getTime() : Date.now();
    const endTimestamp = new Date(endTime).getTime();
    if (isNaN(endTimestamp) || endTimestamp <= Date.now()) {
      toastError('The flash sale end date and time must be in the future.');
      return;
    }
    if (startTime && startTimestamp >= endTimestamp) {
      toastError('Start time must be before end time.');
      return;
    }

    if (scope === 'specific' && selectedBookIds.length === 0) {
      toastError('Please select at least one book to include in this flash sale.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...(saleStatus.sale?.id ? { id: saleStatus.sale.id } : {}),
        title: title.trim(),
        description: description.trim(),
        discountPercent: parseInt(discountPercent, 10),
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: new Date(endTime).toISOString(),
        isActive: true,
        bookIds: scope === 'all' ? [] : selectedBookIds
      };

      await saveFlashSale(payload, token);
      success('Flash sale campaign saved and activated!');
      await loadSaleData();
      globalRefresh();
    } catch (err) {
      toastError(err.message || 'Failed to save flash sale');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle On / Off
  const handleToggle = async () => {
    if (!saleStatus.sale?.id) return;
    setIsToggling(true);
    try {
      await toggleFlashSale(saleStatus.sale.id, token);
      success(`Flash sale has been ${saleStatus.isActive ? 'disabled' : 'enabled'}.`);
      await loadSaleData();
      globalRefresh();
    } catch (err) {
      toastError(err.message || 'Failed to toggle flash sale');
    } finally {
      setIsToggling(false);
    }
  };

  // End / Delete Flash Sale
  const handleDelete = async () => {
    if (!saleStatus.sale?.id) return;
    if (!window.confirm('Are you sure you want to delete this flash sale?')) return;
    setIsToggling(true);
    try {
      await deleteFlashSale(saleStatus.sale.id, token);
      success('Flash sale deleted successfully.');
      setSaleStatus({ isActive: false, isExpired: false, isLive: false, sale: null });
      setTitle(''); setDescription(''); setStartTime(''); setEndTime('');
      setSelectedBookIds([]); setScope('all');
      globalRefresh();
    } catch (err) {
      toastError(err.message || 'Failed to delete flash sale');
    } finally {
      setIsToggling(false);
    }
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(bookFilter.toLowerCase()) ||
      b.author.toLowerCase().includes(bookFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Status Header Card ── */}
      <Card className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                saleStatus.isLive
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : saleStatus.isActive
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              <Flame className="w-6 h-6 fill-current" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Flash Sale Campaign Manager
                </h3>
                {saleStatus.isLive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    LIVE NOW ({saleStatus.sale?.discountPercent}% OFF)
                  </span>
                ) : saleStatus.isExpired ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    <AlertCircle className="w-3 h-3" />
                    Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {saleStatus.isLive && saleStatus.sale
                  ? `Campaign "${saleStatus.sale.title}" ends on ${new Date(
                      saleStatus.sale.endTime
                    ).toLocaleString()}`
                  : 'Configure and launch time-limited discount events with live homepage countdowns.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleToggle}
              disabled={isToggling || !saleStatus.sale?.title}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                saleStatus.isActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-[#00A651] hover:bg-[#008f45] text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{saleStatus.isActive ? 'Turn Off Sale' : 'Turn On Sale'}</span>
            </button>

            {saleStatus.isActive && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isToggling}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                title="End sale immediately"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">End Now</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadSaleData}
              disabled={isLoading}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* ── Main Form Card ── */}
      <Card className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-600" />
              Flash Sale Details
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Set campaign name, discount rates, duration, and participating titles.
            </p>
          </div>

          {/* Row 1: Campaign Title & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Campaign Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 24-Hour Midweek Reading Mania, Weekend Mega Deals"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Discount Percentage (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="90"
                  required
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-bold"
                />
                <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Row 2: Campaign Subtext */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Promotional Subtitle / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Save up to 50% on all mindset, personal finance, and tech titles before midnight!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Row 3: Start Time & End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Sale Start Time</span>
                <span className="text-slate-400 font-normal">(leave blank to start now)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setStartTime('')}
                  className="px-2.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                >
                  Now
                </button>
              </div>
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Sale End Time *</span>
              </label>

              <div className="flex flex-col gap-2">
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 mr-1">Quick:</span>
                  {[6, 12, 24, 48, 72].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setQuickDuration(h)}
                      className={`px-2.5 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                        h === 24
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      +{h}h{h >= 24 ? ` (${h / 24}d)` : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Scope (All vs Specific Books) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Discount Application Scope
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  scope === 'all'
                    ? 'border-red-500 bg-red-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="saleScope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                    Apply to ALL Books Store-wide
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Every current and future book in your catalog receives this {discountPercent}% flash discount during the event.
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  scope === 'specific'
                    ? 'border-red-500 bg-red-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="saleScope"
                  value="specific"
                  checked={scope === 'specific'}
                  onChange={() => setScope('specific')}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                    Select Specific Titles ({selectedBookIds.length} Selected)
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Limit the {discountPercent}% discount only to manually selected books.
                  </p>
                </div>
              </label>
            </div>

            {/* Book Selector (Visible when specific scope is selected) */}
            {scope === 'specific' && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search books by title or author to include..."
                      value={bookFilter}
                      onChange={(e) => setBookFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAllBooks}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 self-end sm:self-auto cursor-pointer"
                  >
                    {selectedBookIds.length === books.length
                      ? 'Deselect All'
                      : `Select All (${books.length})`}
                  </button>
                </div>

                {filteredBooks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No books found matching &quot;{bookFilter}&quot;
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                    {filteredBooks.map((b) => {
                      const isSelected = selectedBookIds.includes(b.id);
                      const basePrice = Number(b.price) || 0;
                      const discounted = Math.max(1, Math.round(basePrice * (1 - discountPercent / 100)));

                      return (
                        <div
                          key={b.id}
                          onClick={() => handleToggleBook(b.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-red-50/80' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-red-600 rounded-md focus:ring-red-500"
                            />
                            <div className="w-8 h-10 rounded bg-slate-200 overflow-hidden flex-shrink-0">
                              {b.coverImage && (
                                <img
                                  src={b.coverImage}
                                  alt={b.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {b.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                by {b.author}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-3">
                            <span className="text-xs font-bold text-red-600">
                              {formatPrice(discounted)}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through block">
                              {formatPrice(basePrice)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              Saving will immediately publish the Flash Sale banner on the storefront.
            </p>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Activating Sale...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 fill-white" />
                  <span>Launch Flash Sale</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
