import { FiDollarSign, FiShoppingBag, FiActivity, FiUsers, FiBook, FiTrendingUp, FiTrendingDown, FiArrowUpRight, FiBarChart2, FiMousePointer } from 'react-icons/fi';
import Card from '../ui/Card';
import { formatPrice } from '../../utils/currency';

export default function AdminOverviewTab({
  derivedStats,
  categories,
  trendViewMetric,
  setTrendViewMetric
}) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* KPI Metrics Grid (5 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatPrice(derivedStats.revenue)}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span className="text-emerald-600 font-semibold flex items-center">
              <FiArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {derivedStats.trends?.salesGrowthRate ? `${derivedStats.trends.salesGrowthRate >= 0 ? '+' : ''}${derivedStats.trends.salesGrowthRate}%` : 'Live'}
            </span>
            <span className="text-slate-400">settled sales</span>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Sales
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center">
              <FiShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {derivedStats.sales}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">Completed orders</p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Platform Visits
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiActivity className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {derivedStats.totalVisits.toLocaleString()}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span className="text-indigo-600 font-semibold flex items-center">
              <FiTrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {derivedStats.trends?.visitsGrowthRate ? `${derivedStats.trends.visitsGrowthRate >= 0 ? '+' : ''}${derivedStats.trends.visitsGrowthRate}%` : 'Active'}
            </span>
            <span className="text-slate-400">traffic</span>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Registered Readers
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiUsers className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {derivedStats.totalUsers}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span className="text-amber-600 font-semibold">
              +{derivedStats.trends?.comparison?.currentPeriod?.newUsers ?? 0} new
            </span>
            <span className="text-slate-400">this week</span>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Catalogue Titles
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiBook className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {derivedStats.totalBooks}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">Across {categories.length} categories</p>
        </Card>
      </div>

      {/* DYNAMIC TREND STATUS & DEPENDENT METRICS (Sales, Visits, Users) */}
      <Card className="p-6 sm:p-7 bg-white border border-slate-200/80 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/50 via-indigo-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Trend Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <FiBarChart2 className="w-4 h-4 text-[#1E90FF]" />
                Market & Growth Intelligence
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Customer Growth & Activity Trends
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                {derivedStats.trends?.summary ||
                  'Platform activity evaluated live across reader acquisition, sales velocity, and site traffic.'}
              </p>
            </div>

            {/* Trend Indicator Pill */}
            <div className="flex items-center gap-3">
              {derivedStats.trends?.status === 'growth' && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <FiTrendingUp className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Trend: Growth</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Customer base & traffic expanding</p>
                  </div>
                </div>
              )}
              {derivedStats.trends?.status === 'declining' && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <FiTrendingDown className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Trend: Declining</p>
                    <p className="text-[11px] text-rose-600 font-medium">Slowdown in recent orders / visits</p>
                  </div>
                </div>
              )}
              {(!derivedStats.trends || derivedStats.trends?.status === 'neutral') && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <FiActivity className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Trend: Neutral</p>
                    <p className="text-[11px] text-amber-700 font-medium">Stable reader & visit volume</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3 Dependent Factors Breakdown (Sales, Visits, Readers) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Driver 1: Sales Impact */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FiShoppingBag className="w-4 h-4 text-[#1E90FF]" />
                  Sales Momentum
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    (derivedStats.trends?.salesGrowthRate ?? 0) >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {(derivedStats.trends?.salesGrowthRate ?? 0) >= 0 ? '+' : ''}
                  {derivedStats.trends?.salesGrowthRate ?? 0}%
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {derivedStats.trends?.comparison?.currentPeriod?.sales ?? derivedStats.sales} orders
              </p>
              <p className="text-xs text-slate-500">
                vs {derivedStats.trends?.comparison?.previousPeriod?.sales ?? 0} in prior period.
                Directly powers growth score.
              </p>
            </div>

            {/* Driver 2: Traffic / Platform Visits */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FiActivity className="w-4 h-4 text-indigo-500" />
                  Traffic & Visits
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    (derivedStats.trends?.visitsGrowthRate ?? 0) >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {(derivedStats.trends?.visitsGrowthRate ?? 0) >= 0 ? '+' : ''}
                  {derivedStats.trends?.visitsGrowthRate ?? 0}%
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {derivedStats.trends?.comparison?.currentPeriod?.visits ?? derivedStats.totalVisits} visits
              </p>
              <p className="text-xs text-slate-500">
                vs {derivedStats.trends?.comparison?.previousPeriod?.visits ?? 0} prior period.
                Indicates platform discoverability.
              </p>
            </div>

            {/* Driver 3: Reader Acquisition */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FiUsers className="w-4 h-4 text-amber-500" />
                  New Readers
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  +{derivedStats.trends?.comparison?.currentPeriod?.newUsers ?? 0} joined
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {derivedStats.trends?.comparison?.currentPeriod?.newUsers ?? 0} signups
              </p>
              <p className="text-xs text-slate-500">
                vs {derivedStats.trends?.comparison?.previousPeriod?.newUsers ?? 0} prior period.
                Measures account registration velocity.
              </p>
            </div>
          </div>

          {/* Interactive Daily Activity Chart */}
          {derivedStats.dailyTrends.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    7-Day Velocity Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">
                    Daily trend visualization for activity over the past week
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  {[
                    { id: 'visits', label: 'Visits' },
                    { id: 'sales', label: 'Sales' },
                    { id: 'newUsers', label: 'Signups' },
                    { id: 'clicks', label: 'Clicks' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setTrendViewMetric(m.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        trendViewMetric === m.id
                          ? 'bg-white text-slate-900 shadow-sm font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const maxVal = Math.max(
                  1,
                  ...derivedStats.dailyTrends.map((d) => d[trendViewMetric] || 0)
                );
                const colors = {
                  visits: 'bg-indigo-500 hover:bg-indigo-600',
                  sales: 'bg-emerald-500 hover:bg-emerald-600',
                  newUsers: 'bg-amber-500 hover:bg-amber-600',
                  clicks: 'bg-blue-500 hover:bg-blue-600'
                };

                return (
                  <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-6 items-end min-h-[160px]">
                    {derivedStats.dailyTrends.map((day, idx) => {
                      const val = day[trendViewMetric] || 0;
                      const heightPct = Math.max(12, Math.round((val / maxVal) * 100));

                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 group">
                          <span className="text-[11px] font-bold text-slate-700 opacity-90 group-hover:text-[#1E90FF] transition-colors">
                            {val}
                          </span>
                          <div className="w-full max-w-[42px] h-28 bg-slate-100 rounded-xl overflow-hidden flex items-end p-1">
                            <div
                              className={`w-full ${colors[trendViewMetric]} rounded-lg transition-all duration-500`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <div className="text-center">
                            <span className="block text-[11px] font-bold text-slate-800">
                              {day.label.split(',')[0]}
                            </span>
                            <span className="block text-[9px] text-slate-400">
                              {day.date.slice(5)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </Card>

      {/* HERO HIGHLIGHTS: WHICH BOOK IS CLICKED MOST & TOP SELLER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highlight 1: WHICH BOOK IS CLICKED MOST */}
        <Card className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Most Clicked eBook
                </span>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-blue-100">
                <FiMousePointer className="w-3.5 h-3.5 text-[#1E90FF]" /> #1 Most Viewed
              </span>
            </div>

            {derivedStats.mostClicked ? (
              <div className="flex gap-4 items-center mt-3">
                <div className="w-20 h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-md border border-slate-200 relative group">
                  {derivedStats.mostClicked.coverImage ? (
                    <img
                      src={derivedStats.mostClicked.coverImage}
                      alt={derivedStats.mostClicked.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <FiBook className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-[#1E90FF] uppercase tracking-wider block mb-0.5">
                    {derivedStats.mostClicked.category}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 truncate">
                    {derivedStats.mostClicked.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mb-2">
                    by {derivedStats.mostClicked.author}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E90FF] border border-blue-100">
                      {derivedStats.mostClicked.clicks || 0} Total Clicks
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatPrice(derivedStats.mostClicked.price)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No click activity tracked yet. Clicks are logged live as readers explore eBooks.
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Live reader curiosity index</span>
            <span className="font-semibold text-slate-700">Top of Catalog</span>
          </div>
        </Card>

        {/* Highlight 2: TOP REVENUE / BEST SELLING BOOK */}
        <Card className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Top Selling eBook
                </span>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-200">
                ★ Highest Sales Volume
              </span>
            </div>

            {derivedStats.mostPurchased ? (
              <div className="flex gap-4 items-center mt-3">
                <div className="w-20 h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-md border border-slate-200 relative group">
                  {derivedStats.mostPurchased.coverImage ? (
                    <img
                      src={derivedStats.mostPurchased.coverImage}
                      alt={derivedStats.mostPurchased.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <FiBook className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-0.5">
                    {derivedStats.mostPurchased.category}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 truncate">
                    {derivedStats.mostPurchased.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mb-2">
                    by {derivedStats.mostPurchased.author}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {derivedStats.mostPurchased.salesCount || 0} Units Purchased
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatPrice(derivedStats.mostPurchased.price)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No orders completed yet. Top seller will be determined directly from settled checkout transactions.
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Based on completed checkouts</span>
            <span className="font-semibold text-emerald-600">Primary Revenue Generator</span>
          </div>
        </Card>
      </div>

      {/* DETAILED RANKING TABLE: eBook Click & Interest Rankings */}
      <Card className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FiMousePointer className="w-4 h-4 text-[#1E90FF]" />
              eBook Click & Reader Interest Rankings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Which books receive the highest reader views, clicks, and conversion to purchases.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/60">
            Top {derivedStats.topClickedBooks.length} titles ranked
          </span>
        </div>

        {derivedStats.topClickedBooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                  <th className="py-3.5 px-4">eBook Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4 text-center">Total Clicks</th>
                  <th className="py-3.5 px-4 text-center">Units Sold</th>
                  <th className="py-3.5 px-4 text-right">Click-to-Sale Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {derivedStats.topClickedBooks.map((b, idx) => {
                  const clicks = b.clicks || 0;
                  const sales = b.salesCount || 0;
                  const conv = b.conversionRate || (clicks > 0 ? Math.round((sales / clicks) * 100) : 0);

                  return (
                    <tr key={b.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-900'
                              : 'text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                            {b.coverImage ? (
                              <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <FiBook className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-slate-900 truncate">{b.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">by {b.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatPrice(b.price)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E90FF] text-xs font-bold border border-blue-100">
                          <FiMousePointer className="w-3.5 h-3.5" />
                          {clicks} clicks
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {sales}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{conv}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(8, conv * 2))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No book click data available yet.
          </div>
        )}
      </Card>
    </div>
  );
}
