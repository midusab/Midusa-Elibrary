import { useState, useMemo } from 'react';
import {
  FiFilter,
  FiMousePointer,
  FiShoppingBag,
  FiActivity,
  FiArrowRight,
  FiTrendingUp,
  FiBook
} from 'react-icons/fi';
import { formatPrice } from '../../../utils/currency';

export default function DynamicConversionFunnel({
  derivedStats = {},
  books = []
}) {
  const [filterMode, setFilterMode] = useState('clicks'); // 'clicks' | 'sales' | 'conversion'

  const visits = derivedStats.totalVisits || 0;
  const clicks = derivedStats.totalClicks || books.reduce((sum, b) => sum + (b.clicks || 0), 0);
  const sales = derivedStats.sales || 0;

  // Funnel conversion percentages
  const visitToClickRate = visits > 0 ? Math.min(100, Math.round((clicks / visits) * 100)) : (clicks > 0 ? 100 : 0);
  const clickToSaleRate = clicks > 0 ? Math.min(100, Math.round((sales / clicks) * 100)) : (sales > 0 ? 100 : 0);
  const overallConversionRate = derivedStats.overallConversionRate || (visits > 0 ? Number(((sales / visits) * 100).toFixed(1)) : 0);

  // Top books data sorted dynamically
  const sortedBooks = useMemo(() => {
    const list = derivedStats.topClickedBooks && derivedStats.topClickedBooks.length > 0
      ? [...derivedStats.topClickedBooks]
      : [...books].map((b) => ({
          ...b,
          salesCount: b.salesCount || 0,
          clicks: b.clicks || 0,
          conversionRate: (b.clicks || 0) > 0 ? Math.min(100, Math.round(((b.salesCount || 0) / b.clicks) * 100)) : 0
        }));

    if (filterMode === 'sales') {
      return list.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 5);
    }
    if (filterMode === 'conversion') {
      return list.sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0)).slice(0, 5);
    }
    // Default 'clicks'
    return list.sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
  }, [derivedStats.topClickedBooks, books, filterMode]);

  const maxClicks = Math.max(1, ...sortedBooks.map((b) => b.clicks || 0));

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <FiFilter className="w-3.5 h-3.5 text-[#1E90FF]" />
            Audience Conversion
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Reader Acquisition & Conversion Funnel
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage-by-stage conversion from platform visits to book discovery and paid order completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            {overallConversionRate}% Overall Conversion
          </span>
        </div>
      </div>

      {/* 3-Stage Visual Funnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Stage 1: Platform Discovery */}
        <div className="p-4 rounded-md bg-slate-50/80 border border-slate-200/70 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiActivity className="w-3.5 h-3.5 text-indigo-500" />
              1. Platform Visits
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
              Top of Funnel
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {visits.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Total unique readers browsing the library platform
          </p>
          <div className="w-full h-1.5 bg-slate-200 rounded-sm mt-3 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-sm w-full" />
          </div>
        </div>

        {/* Stage 2: Exploration & Clicks */}
        <div className="p-4 rounded-md bg-slate-50/80 border border-slate-200/70 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiMousePointer className="w-3.5 h-3.5 text-[#1E90FF]" />
              2. Title Clicks
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#1E90FF]">
              {visitToClickRate}% Curiosity
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {clicks.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Book cards opened, previewed, or inspected in catalog
          </p>
          <div className="w-full h-1.5 bg-slate-200 rounded-sm mt-3 overflow-hidden">
            <div
              className="h-full bg-[#1E90FF] rounded-sm transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(10, visitToClickRate))}%` }}
            />
          </div>
        </div>

        {/* Stage 3: Checkout Purchases */}
        <div className="p-4 rounded-md bg-slate-50/80 border border-slate-200/70 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              3. Purchases Completed
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
              {clickToSaleRate}% Conversion
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {sales.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Successful checkouts settled to digital library
          </p>
          <div className="w-full h-1.5 bg-slate-200 rounded-sm mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-sm transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(8, clickToSaleRate * 2))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dynamic eBook Conversion Matrix */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Top Title Performance Comparison
          </span>

          <div className="w-full overflow-x-auto scrollbar-none">
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-md text-xs font-semibold">
              {[
                { id: 'clicks', label: 'By Clicks' },
                { id: 'sales', label: 'By Sales' },
                { id: 'conversion', label: 'By Conversion %' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterMode(f.id)}
                  className={`px-2.5 py-1.5 rounded transition-colors cursor-pointer text-xs whitespace-nowrap ${
                    filterMode === f.id
                      ? 'bg-white text-slate-900 font-bold border border-slate-200/70'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sortedBooks.length > 0 ? (
          <div className="space-y-2.5">
            {sortedBooks.map((b, idx) => {
              const bClicks = b.clicks || 0;
              const bSales = b.salesCount || 0;
              const bConv = b.conversionRate || (bClicks > 0 ? Math.min(100, Math.round((bSales / bClicks) * 100)) : 0);
              const clickBarPct = Math.min(100, Math.max(12, Math.round((bClicks / maxClicks) * 100)));

              return (
                <div
                  key={b.id || idx}
                  className="p-3 rounded-md border border-slate-100 hover:border-slate-200 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 sm:w-1/3">
                    <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{b.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {b.category} • {formatPrice(b.price)}
                      </p>
                    </div>
                  </div>

                  {/* Volume Bar & Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                        <FiMousePointer className="w-3 h-3 text-[#1E90FF]" /> {bClicks} clicks
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <FiShoppingBag className="w-3 h-3 text-emerald-600" /> {bSales} sales
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-sm overflow-hidden flex">
                      <div
                        className="h-full bg-[#1E90FF] rounded-sm transition-all duration-300"
                        style={{ width: `${clickBarPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Conversion Badge */}
                  <div className="sm:w-28 text-right flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      <FiTrendingUp className="w-3 h-3" /> {bConv}% conv
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No book performance metrics recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
