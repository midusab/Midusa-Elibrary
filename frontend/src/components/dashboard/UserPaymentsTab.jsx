import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiBookOpen,
  FiCopy,
  FiCheck,
  FiSmartphone
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatPrice } from '../../utils/currency';

export default function UserPaymentsTab({ orders = [], isLoading = false }) {
  const [filter, setFilter] = useState('all');
  const [copiedReceipt, setCopiedReceipt] = useState(null);

  const handleCopyReceipt = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedReceipt(code);
    setTimeout(() => setCopiedReceipt(null), 2500);
  };

  // Status mapping helper
  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'success' || s === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FiCheckCircle className="w-3.5 h-3.5" />
          <span>Paid</span>
        </span>
      );
    }
    if (s === 'pending' || s === 'processing') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <FiClock className="w-3.5 h-3.5 animate-spin" />
          <span>Pending M-PESA</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <FiAlertCircle className="w-3.5 h-3.5" />
        <span>Failed / Cancelled</span>
      </span>
    );
  };

  // Metrics
  const completedOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'success'
  );
  const totalSpent = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
  const totalBooksAcquired = completedOrders.reduce(
    (sum, o) => sum + (o.items?.length || 0),
    0
  );

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const s = String(o.status || '').toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'completed') return s === 'completed' || s === 'success';
    if (filter === 'pending') return s === 'pending' || s === 'processing';
    if (filter === 'failed') return s === 'failed' || s === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── 1. Top Summary Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-slate-200/90 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Paid</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {formatPrice(totalSpent)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary border border-blue-100 flex items-center justify-center">
              <FiCreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Verified M-PESA payments
          </p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Successful Orders</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {completedOrders.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Out of {orders.length} total checkouts
          </p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Books Acquired</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {totalBooksAcquired}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <FiBookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Available in your library
          </p>
        </Card>
      </div>

      {/* ── 2. Filter Bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200/90">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'completed', label: `Paid (${completedOrders.length})` },
            { id: 'pending', label: 'Pending' },
            { id: 'failed', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Orders List ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-16 text-center bg-white border border-slate-200/80 rounded-lg">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading your payment records...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-slate-200 rounded-lg p-6">
          <div className="w-12 h-12 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center mx-auto mb-3">
            <FiCreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No payment records found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filter === 'all'
              ? 'When you purchase books using M-PESA, receipts and transaction records will appear here.'
              : `No orders matching status filter "${filter}".`}
          </p>
          <Link to="/library" className="mt-4 inline-block">
            <Button size="sm" className="bg-primary hover:bg-primary-600 text-white text-xs px-4 py-2">
              Browse Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPaid = order.status === 'completed' || order.status === 'success';
            const mpesaReceipt = order.mpesaReceipt || order.payment?.mpesaReceipt;
            const phoneNumber = order.phoneNumber || order.payment?.phoneNumber;
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <Card
                key={order.id}
                className="p-5 bg-white border border-slate-200/90 rounded-lg transition-all"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-blue-50 text-primary border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <FiSmartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {dateStr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Payment via M-PESA Express {phoneNumber ? `(${phoneNumber})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {getStatusBadge(order.status)}
                    <span className="text-base font-extrabold text-slate-900">
                      {formatPrice(order.amount)}
                    </span>
                  </div>
                </div>

                {/* M-PESA Confirmation Receipt Strip (if available) */}
                {mpesaReceipt && (
                  <div className="mt-3 p-2.5 rounded-md bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        M-PESA Code:
                      </span>
                      <code className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {mpesaReceipt}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopyReceipt(mpesaReceipt)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-700 transition-colors cursor-pointer"
                    >
                      {copiedReceipt === mpesaReceipt ? (
                        <>
                          <FiCheck className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <FiCopy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Order Items Breakdown */}
                <div className="mt-4 space-y-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Purchased Items ({order.items?.length || 0})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(order.items || []).map((it, idx) => {
                      const book = it.book;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 rounded-md bg-slate-50/60 border border-slate-200/60"
                        >
                          {book?.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title || 'Book'}
                              className="w-12 h-16 object-cover rounded bg-slate-200 flex-shrink-0 border border-slate-200/80"
                            />
                          ) : (
                            <div className="w-12 h-16 rounded bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <FiBookOpen className="w-5 h-5" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {book?.title || 'eBook Title'}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              {book?.author || 'Author'}
                            </p>
                            <p className="text-[11px] font-bold text-slate-800 mt-1">
                              {formatPrice(it.price || book?.price || 0)}
                            </p>
                          </div>

                          {/* Direct download if order is paid and download URL exists */}
                          {isPaid && book?.pdfUrl && (
                            <a
                              href={book.pdfUrl}
                              download={`${book.title}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-md bg-white border border-slate-200 text-primary hover:bg-primary-50 transition-colors flex-shrink-0 text-xs font-semibold flex items-center gap-1 shadow-none"
                              title="Download"
                            >
                              <FiDownload className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Download</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
