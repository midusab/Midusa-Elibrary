import { FiDollarSign } from 'react-icons/fi';
import Card from '../ui/Card';
import { formatPrice } from '../../utils/currency';

export default function AdminOrdersTab({
  orders,
  filteredOrders,
  orderStatusFilter,
  setOrderStatusFilter,
  handleUpdateOrderStatus
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm w-fit">
        {['all', 'completed', 'pending', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setOrderStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              orderStatusFilter === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st === 'all' ? `All Orders (${orders.length})` : st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items / eBooks</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600 text-xs">
                      #{ord.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">
                          {ord.user?.fullname || 'Customer'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {ord.user?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-xs">
                        {(ord.items || []).map((it, idx) => (
                          <p key={idx} className="text-xs text-slate-700 truncate">
                            • {it.book?.title || 'eBook Item'} (×{it.quantity || 1})
                          </p>
                        ))}
                        {(!ord.items || ord.items.length === 0) && (
                          <span className="text-slate-400 text-xs">Direct Digital Order</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatPrice(ord.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          ord.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : ord.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1E90FF] bg-white cursor-pointer"
                      >
                        <option value="completed">Completed (Paid)</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FiDollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No orders recorded</p>
            <p className="mt-0.5">Customer payments and checkout orders will be displayed here in real time.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
