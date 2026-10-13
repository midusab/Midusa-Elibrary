import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiBookOpen,
  FiPrinter,
  FiX,
  FiCheck,
  FiCopy,
  FiSmartphone,
  FiArrowRight,
  FiShield
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatPrice } from '../../utils/currency';

export default function UserOrdersTab({ orders = [], isLoading = false, user = null }) {
  const [filter, setFilter] = useState('all');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [copiedReceipt, setCopiedReceipt] = useState(null);

  const handleCopyReceipt = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedReceipt(code);
    setTimeout(() => setCopiedReceipt(null), 2000);
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'success' || s === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FiCheckCircle className="w-3.5 h-3.5" />
          <span>Completed</span>
        </span>
      );
    }
    if (s === 'pending' || s === 'processing') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <FiClock className="w-3.5 h-3.5 animate-spin" />
          <span>Pending</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <FiAlertCircle className="w-3.5 h-3.5" />
        <span>Cancelled</span>
      </span>
    );
  };

  const completedOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'success'
  );
  const totalSpent = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
  const totalBooksAcquired = completedOrders.reduce(
    (sum, o) => sum + (o.items?.length || 0),
    0
  );

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
      {/* ── Top Summary Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Orders</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {orders.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary border border-blue-100 flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-[#1E90FF]" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {completedOrders.length} settled purchases
          </p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Spent</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {formatPrice(totalSpent)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Verified M-PESA transactions
          </p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">eBooks In Library</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {totalBooksAcquired}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <FiBookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Immediate digital download access
          </p>
        </Card>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200/90">
          {[
            { id: 'all', label: `All Orders (${orders.length})` },
            { id: 'completed', label: `Completed (${completedOrders.length})` },
            { id: 'pending', label: 'Pending' },
            { id: 'failed', label: 'Cancelled' },
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

      {/* ── Orders List ── */}
      {isLoading ? (
        <div className="py-16 text-center bg-white border border-slate-200/80 rounded-lg">
          <div className="w-7 h-7 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-slate-200 rounded-lg p-6">
          <div className="w-12 h-12 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center mx-auto mb-3">
            <FiFileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filter === 'all'
              ? 'When you order books, complete order records and official invoices will appear here.'
              : `No orders matching status filter "${filter}".`}
          </p>
          <Link to="/library" className="mt-4 inline-block">
            <Button size="sm" className="bg-[#1E90FF] hover:bg-[#1873cc] text-white text-xs px-4 py-2 rounded-md shadow-none">
              Browse Shop
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
                className="p-5 bg-white border border-slate-200/90 rounded-lg shadow-none transition-all"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-blue-50 text-[#1E90FF] border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <FiFileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {dateStr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.items?.length || 0} title(s) • M-PESA Express {phoneNumber ? `(${phoneNumber})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {getStatusBadge(order.status)}
                    <span className="text-base font-extrabold text-slate-900">
                      {formatPrice(order.amount)}
                    </span>
                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <FiFileText className="w-3.5 h-3.5 text-[#1E90FF]" />
                      <span>Invoice</span>
                    </button>
                  </div>
                </div>

                {/* M-PESA Code Strip */}
                {mpesaReceipt && (
                  <div className="mt-3 p-2.5 rounded-md bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        M-PESA Receipt:
                      </span>
                      <code className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {mpesaReceipt}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopyReceipt(mpesaReceipt)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E90FF] hover:underline cursor-pointer"
                    >
                      {copiedReceipt === mpesaReceipt ? (
                        <>
                          <FiCheck className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <FiCopy className="w-3 h-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Purchased Items List */}
                <div className="mt-4 space-y-2.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Order Items ({order.items?.length || 0})
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

                          {isPaid && book?.pdfUrl && (
                            <a
                              href={book.pdfUrl}
                              download={`${book.title}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-md bg-white border border-slate-200 text-primary hover:bg-primary-50 transition-colors flex-shrink-0 text-xs font-semibold flex items-center gap-1 shadow-none"
                              title="Download eBook"
                            >
                              <FiDownload className="w-3.5 h-3.5 text-[#1E90FF]" />
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

      {/* ── 4. Printable Order Invoice Modal ── */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-2xl w-full border border-slate-200 shadow-none overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 print:hidden">
              <div className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-[#1E90FF]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Official Order Invoice
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#1E90FF] hover:bg-[#1873cc] text-white transition-colors cursor-pointer"
                >
                  <FiPrinter className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 print:p-0">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Midusa eLibrary
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Premium Curated Digital Bookstore
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Nairobi, Kenya • support@midusaelibrary.com
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-mono text-xs font-bold uppercase mb-1">
                    INVOICE
                  </span>
                  <p className="font-mono text-xs font-bold text-slate-900">
                    INV-{selectedInvoiceOrder.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Date:{' '}
                    {selectedInvoiceOrder.createdAt
                      ? new Date(selectedInvoiceOrder.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Recent'}
                  </p>
                  <div className="mt-1.5">
                    {getStatusBadge(selectedInvoiceOrder.status)}
                  </div>
                </div>
              </div>

              {/* Billed To / Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pb-4 border-b border-slate-100">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Billed To
                  </p>
                  <p className="font-bold text-slate-900 text-sm">
                    {user?.fullname || 'Registered Reader'}
                  </p>
                  <p className="text-slate-600 mt-0.5">{user?.email}</p>
                  {selectedInvoiceOrder.phoneNumber && (
                    <p className="text-slate-600 mt-0.5">
                      Phone: {selectedInvoiceOrder.phoneNumber}
                    </p>
                  )}
                </div>
                <div className="sm:text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Payment Method
                  </p>
                  <p className="font-semibold text-slate-800">
                    M-PESA Express (STK Push)
                  </p>
                  {selectedInvoiceOrder.mpesaReceipt && (
                    <p className="font-mono font-bold text-slate-700 mt-0.5">
                      Receipt: {selectedInvoiceOrder.mpesaReceipt}
                    </p>
                  )}
                  <p className="text-slate-500 mt-0.5">
                    Status: Settled & Confirmed
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5">Item Description</th>
                      <th className="py-2.5 text-center">Type</th>
                      <th className="py-2.5 text-center">Qty</th>
                      <th className="py-2.5 text-right">Price</th>
                      <th className="py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedInvoiceOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3">
                          <p className="font-bold text-slate-900">
                            {item.book?.title || 'eBook Title'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            by {item.book?.author || 'Author'}
                          </p>
                        </td>
                        <td className="py-3 text-center text-slate-500">
                          Digital PDF
                        </td>
                        <td className="py-3 text-center font-mono">
                          {item.quantity || 1}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-700">
                          {formatPrice(item.price || item.book?.price || 0)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-900">
                          {formatPrice((item.price || item.book?.price || 0) * (item.quantity || 1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500 max-w-xs">
                  <p className="font-semibold text-slate-700">Digital Access Grant:</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Lifetime digital personal license granted. Download links remain active in your reader dashboard.
                  </p>
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatPrice(selectedInvoiceOrder.amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (0%):</span>
                    <span className="font-mono">KSh 0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Paid:</span>
                    <span className="font-mono text-[#1E90FF]">
                      {formatPrice(selectedInvoiceOrder.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Footer Notice */}
              <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
                <p>Thank you for choosing Midusa eLibrary!</p>
                <p className="mt-0.5">
                  Automated electronic receipt generated by Midusa eLibrary system.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
