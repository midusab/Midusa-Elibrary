import {
  FiDollarSign,
  FiShoppingBag,
  FiActivity,
  FiUsers,
  FiBook,
  FiTrendingUp,
  FiArrowUpRight,
  FiMousePointer,
  FiLayers,
  FiFilter,
  FiCalendar
} from 'react-icons/fi';
import Card from '../ui/Card';
import { formatPrice } from '../../utils/currency';

export default function AdminOverviewTab({
  derivedStats,
  categories = [],
  books = []
}) {
  const dailyTrends = derivedStats.dailyTrends || [];
  const categoryStats = derivedStats.categoryStats || [];

  // Normalize categories breakdown
  const categoryBreakdown = categories.map((cat) => {
    const matchedStat = categoryStats.find((c) => c.name === cat.name);
    const catBooks = books.filter((b) => b.category === cat.name);
    return {
      name: cat.name,
      bookCount: catBooks.length,
      salesCount: matchedStat?.totalSales || 0,
      revenue: matchedStat?.revenue || 0
    };
  });

  const totalCatalogBooks = books.length || 1;

  // Funnel calculations
  const visits = derivedStats.totalVisits || 0;
  const clicks = derivedStats.totalClicks || books.reduce((sum, b) => sum + (b.clicks || 0), 0);
  const sales = derivedStats.sales || 0;
  const visitToClickRate = visits > 0 ? Math.min(100, Math.round((clicks / visits) * 100)) : (clicks > 0 ? 100 : 0);
  const clickToSaleRate = clicks > 0 ? Math.min(100, Math.round((sales / clicks) * 100)) : (sales > 0 ? 100 : 0);
  const overallConversion = derivedStats.overallConversionRate || (visits > 0 ? Number(((sales / visits) * 100).toFixed(1)) : 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================= */}
      {/* 1. KPI Metrics Grid (5 cards)                             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatPrice(derivedStats.revenue)}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span className="text-emerald-600 font-semibold flex items-center">
              <FiArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {derivedStats.trends?.salesGrowthRate
                ? `${derivedStats.trends.salesGrowthRate >= 0 ? '+' : ''}${derivedStats.trends.salesGrowthRate}%`
                : 'Live'}
            </span>
            <span className="text-slate-400">settled sales</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Sales
            </span>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-[#1E90FF] flex items-center justify-center">
              <FiShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {derivedStats.sales}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">Completed orders</p>
        </Card>

        <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Platform Visits
            </span>
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiActivity className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {derivedStats.totalVisits.toLocaleString()}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span className="text-indigo-600 font-semibold flex items-center">
              <FiTrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {derivedStats.trends?.visitsGrowthRate
                ? `${derivedStats.trends.visitsGrowthRate >= 0 ? '+' : ''}${derivedStats.trends.visitsGrowthRate}%`
                : 'Active'}
            </span>
            <span className="text-slate-400">traffic</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Registered Readers
            </span>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
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

        <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Catalogue Titles
            </span>
            <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiBook className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {derivedStats.totalBooks}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">Across {categories.length} categories</p>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 2. STATIC PERFORMANCE & AUDIENCE CONVERSION MATRICES     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Share & Inventory Overview */}
        <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiLayers className="w-3.5 h-3.5 text-[#1E90FF]" />
                Category Inventory & Share
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Catalog Distribution
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200/60">
              {categories.length} Topics
            </span>
          </div>

          <div className="space-y-3.5">
            {categoryBreakdown.map((cat, idx) => {
              const pct = Math.round((cat.bookCount / totalCatalogBooks) * 100) || 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <span className="text-slate-500">
                      <strong>{cat.bookCount}</strong> books ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#1E90FF] rounded"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Reader Conversion & Acquisition Funnel */}
        <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-lg shadow-none">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiFilter className="w-3.5 h-3.5 text-[#1E90FF]" />
                Audience Conversion
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Engagement Pipeline
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {overallConversion}% Overall
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-700">1. Platform Visitors</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Total registered traffic sessions</p>
              </div>
              <span className="text-base font-bold text-slate-900 font-mono">
                {visits.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-md bg-blue-50/50 border border-blue-200/60 flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">2. Book Clicks & Details Views</p>
                <p className="text-[11px] text-blue-600 mt-0.5">{visitToClickRate}% view-through rate</p>
              </div>
              <span className="text-base font-bold text-[#1E90FF] font-mono">
                {clicks.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-md bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between">
              <div>
                <p className="font-semibold text-emerald-950">3. Settled Book Purchases</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{clickToSaleRate}% click-to-purchase</p>
              </div>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {sales.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 3. DAILY ACTIVITY LOG (Replacing dynamic SVG chart)       */}
      {/* ========================================================= */}
      <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-lg shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiCalendar className="w-3.5 h-3.5 text-[#1E90FF]" />
              Recent Daily Performance Log
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Daily Activity & Sales Summary
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Past 7 recording days
          </span>
        </div>

        {dailyTrends.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Settled Orders</th>
                  <th className="py-2.5 px-3 text-right">Revenue (KSh)</th>
                  <th className="py-2.5 px-3 text-center">Visits</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyTrends.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {d.date || `Day ${idx + 1}`}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      {d.sales || 0}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                      {formatPrice(d.revenue || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">
                      {d.visits || 0}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#1E90FF]">
                        Recorded
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No daily activity logs recorded yet. Records populate automatically as checkouts complete.
          </div>
        )}
      </Card>

      {/* ========================================================= */}
      {/* 4. HERO HIGHLIGHTS: WHICH BOOK IS CLICKED MOST & TOP SELLER */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highlight 1: WHICH BOOK IS CLICKED MOST */}
        <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-lg shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Most Clicked eBook
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-blue-100">
                <FiMousePointer className="w-3.5 h-3.5 text-[#1E90FF]" /> #1 Most Viewed
              </span>
            </div>

            {derivedStats.mostClicked ? (
              <div className="flex gap-4 items-center mt-3">
                <div className="w-18 h-24 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 relative group">
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
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-[#1E90FF] border border-blue-100">
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

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Live reader curiosity index</span>
            <span className="font-semibold text-slate-700">Top of Catalog</span>
          </div>
        </Card>

        {/* Highlight 2: TOP REVENUE / BEST SELLING BOOK */}
        <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-lg shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Top Selling eBook
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-amber-200">
                Highest Sales Volume
              </span>
            </div>

            {derivedStats.mostPurchased ? (
              <div className="flex gap-4 items-center mt-3">
                <div className="w-18 h-24 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 relative group">
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
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
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

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Based on completed checkouts</span>
            <span className="font-semibold text-emerald-600">Primary Revenue Generator</span>
          </div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 5. DETAILED RANKING TABLE: eBook Click & Interest Rankings */}
      {/* ========================================================= */}
      <Card className="bg-white border border-slate-200/90 rounded-lg shadow-none overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FiMousePointer className="w-4 h-4 text-[#1E90FF]" />
              eBook Click & Reader Interest Rankings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Which books receive the highest reader views, clicks, and conversion to purchases.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-md border border-slate-200/60">
            Top {derivedStats.topClickedBooks?.length || 0} titles ranked
          </span>
        </div>

        {derivedStats.topClickedBooks && derivedStats.topClickedBooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">eBook Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Total Clicks</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Click-to-Sale Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {derivedStats.topClickedBooks.map((b, idx) => {
                  const clicksCount = b.clicks || 0;
                  const salesCount = b.salesCount || 0;
                  const conv = b.conversionRate || (clicksCount > 0 ? Math.round((salesCount / clicksCount) * 100) : 0);

                  return (
                    <tr key={b.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-11 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
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
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatPrice(b.price)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1E90FF] text-xs font-bold border border-blue-100">
                          <FiMousePointer className="w-3 h-3" />
                          {clicksCount} clicks
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {salesCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{conv}%</span>
                          <div className="w-16 h-1.5 rounded-sm bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-sm"
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
          <div className="py-10 text-center text-slate-400 text-xs">
            No book click data available yet.
          </div>
        )}
      </Card>
    </div>
  );
}
