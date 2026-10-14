import { FiDollarSign, FiInfo, FiTrash2 } from 'react-icons/fi';
import Card from '../ui/Card';
import { formatPrice } from '../../utils/currency';

export default function AdminOrdersTab({
  orders,
  filteredOrders,
  orderStatusFilter,
  setOrderStatusFilter,
  handleResetOrders,
}) {
  const statusBadge = (status) => {
    if (status === 'completed')
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (status === 'pending')
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-red-50 text-[#F40009] border border-red-200';
  };

  const statusLabel = (status) => {
    if (status === 'completed') return '✓ Paid & Confirmed';
    if (status === 'pending') return '⏳ Awaiting Payment';
    return '✕ ' + status;
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Filter Tabs + Reset Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200/90 w-fit">
            {['all', 'completed', 'pending', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  orderStatusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st === 'all' ? `All Orders (${orders.length})` : st}
              </button>
            ))}
          </div>
        </div>
        {handleResetOrders && (
          <button
            onClick={handleResetOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#F40009] border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            Reset Orders Data
          </button>
        )}
      </div>

      {/* Auto-status info banner */}
      <div className="flex items-start gap-2.5 px-4 py-3 bg-[#1E90FF]/5 border border-[#1E90FF]/20 rounded-lg">
        <FiInfo className="w-4 h-4 text-[#1E90FF] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Order statuses are automatic.</span>{' '}
          They are set by M-Pesa payment confirmation — <span className="text-emerald-700 font-semibold">completed</span> when paid,{' '}
          <span className="text-amber-700 font-semibold">pending</span> while waiting, and{' '}
          <span className="text-[#F40009] font-semibold">failed</span> if cancelled. No manual override needed.
        </p>
      </div>

      {/* Orders Table */}
      <Card className="bg-white border border-slate-200/90 rounded-lg overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">eBooks</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500 text-xs">
                      #{ord.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-xs">{ord.user?.fullname || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">{ord.user?.email || 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        {(ord.items || []).map((it, idx) => (
                          <p key={idx} className="text-xs text-slate-600 truncate">
                            • {it.book?.title || 'eBook'} ×{it.quantity || 1}
                          </p>
                        ))}
                        {(!ord.items || ord.items.length === 0) && (
                          <span className="text-slate-400 text-xs">Digital Order</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-xs">
                      {formatPrice(ord.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-KE') : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${statusBadge(ord.status)}`}>
                        {statusLabel(ord.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <FiDollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No orders found</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer orders appear here automatically after M-Pesa confirmation.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
