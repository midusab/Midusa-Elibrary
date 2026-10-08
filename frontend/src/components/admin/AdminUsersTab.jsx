import {
  FiUsers,
  FiShoppingBag,
  FiTrendingUp,
  FiDollarSign,
  FiSearch
} from 'react-icons/fi';
import Card from '../ui/Card';
import { formatPrice } from '../../utils/currency';

export default function AdminUsersTab({
  usersList,
  filteredUsers,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  derivedStats
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Customer KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Total Registered Members
          </span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{usersList.length}</h3>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center">
              <FiUsers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Active platform accounts</p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Active Buyers
          </span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">
              {usersList.filter((u) => (u.orders || []).some((o) => o.status === 'completed')).length}
            </h3>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Placed at least 1 completed purchase</p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            New Signups (7 Days)
          </span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">
              {
                usersList.filter((u) => {
                  if (!u.createdAt || !derivedStats.sevenDaysAgo) return false;
                  return new Date(u.createdAt) >= derivedStats.sevenDaysAgo;
                }).length
              }
            </h3>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiTrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Recent member acquisition</p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Total Member Spend
          </span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">
              {formatPrice(
                usersList.reduce((sum, u) => sum + (Number(u.totalSpent) || 0), 0)
              )}
            </h3>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Cumulative revenue from readers</p>
        </Card>
      </div>

      {/* Search and Role Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search registered members by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'all', label: `All (${usersList.length})` },
              { id: 'user', label: `Readers (${usersList.filter((u) => u.role !== 'admin').length})` },
              { id: 'admin', label: `Admins (${usersList.filter((u) => u.role === 'admin').length})` }
            ].map((rf) => (
              <button
                key={rf.id}
                onClick={() => setUserRoleFilter(rf.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  userRoleFilter === rf.id
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline-block">
            Showing {filteredUsers.length} of {usersList.length}
          </span>
        </div>
      </div>

      {/* Registered Customers Table */}
      <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Customer / Reader</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Date Joined</th>
                  <th className="py-3.5 px-4 text-center">Orders Placed</th>
                  <th className="py-3.5 px-4">Lifetime Spend</th>
                  <th className="py-3.5 px-4">Purchased eBooks</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const userOrders = u.orders || [];
                  const completedOrders = userOrders.filter((o) => o.status === 'completed');
                  
                  // Calculate total spend
                  const userSpend = u.totalSpent !== undefined
                    ? u.totalSpent
                    : completedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

                  // Collect unique titles of purchased books
                  const purchasedTitles = u.purchasedTitles || [];
                  if (purchasedTitles.length === 0) {
                    userOrders.forEach((o) => {
                      (o.items || []).forEach((it) => {
                        if (it.book?.title && !purchasedTitles.includes(it.book.title)) {
                          purchasedTitles.push(it.book.title);
                        }
                      });
                    });
                  }

                  const hasPurchases = completedOrders.length > 0;
                  const isNew = Boolean(u.createdAt && derivedStats.sevenDaysAgo && new Date(u.createdAt) >= derivedStats.sevenDaysAgo);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.fullname}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1E90FF] flex items-center justify-center font-bold text-xs ring-1 ring-blue-100">
                              {u.fullname?.[0] || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{u.fullname || 'Reader Member'}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role === 'admin' ? 'Administrator' : 'Reader'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-900">
                          {completedOrders.length}
                        </span>
                        {userOrders.length > completedOrders.length && (
                          <span className="text-[10px] text-slate-400 block">
                            ({userOrders.length} total)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatPrice(userSpend)}
                      </td>
                      <td className="py-3.5 px-4">
                        {purchasedTitles.length > 0 ? (
                          <div className="space-y-0.5 max-w-xs">
                            {purchasedTitles.slice(0, 2).map((title, i) => (
                              <p key={i} className="text-xs text-slate-700 truncate font-medium">
                                • {title}
                              </p>
                            ))}
                            {purchasedTitles.length > 2 && (
                              <p className="text-[10px] text-slate-400">
                                +{purchasedTitles.length - 2} more eBook(s)
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            No purchases yet
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {hasPurchases ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60">
                            Paying Customer
                          </span>
                        ) : isNew ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200/60">
                            New Reader
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                            Registered
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FiUsers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No customers found</p>
            <p className="mt-0.5">No registered members matched your search or filter.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
