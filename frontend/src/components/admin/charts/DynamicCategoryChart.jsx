import { useState, useMemo } from 'react';
import { FiPieChart, FiDollarSign, FiShoppingBag, FiBook, FiMousePointer } from 'react-icons/fi';
import { formatPrice } from '../../../utils/currency';

const CATEGORY_COLORS = [
  '#1E90FF', // Dodgerblue
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#64748b'  // Slate
];

export default function DynamicCategoryChart({
  categoryStats = [],
  books = [],
  categories = []
}) {
  const [metric, setMetric] = useState('sales'); // 'sales' | 'revenue' | 'books' | 'clicks'
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Normalize category data across sources
  const data = useMemo(() => {
    // If backend provided categoryStats
    if (categoryStats && categoryStats.length > 0) {
      return categoryStats.map((c, idx) => ({
        name: c.name || 'General',
        sales: Number(c.totalSales) || 0,
        revenue: Number(c.revenue) || 0,
        books: Number(c.bookCount) || 0,
        clicks: Number(c.clicks) || 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      }));
    }

    // Fallback: derive directly from books and categories
    const catMap = {};
    categories.forEach((cat, idx) => {
      catMap[cat.name] = {
        name: cat.name,
        sales: 0,
        revenue: 0,
        books: 0,
        clicks: 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      };
    });

    books.forEach((b) => {
      const cName = b.category || 'General';
      if (!catMap[cName]) {
        catMap[cName] = {
          name: cName,
          sales: 0,
          revenue: 0,
          books: 0,
          clicks: 0,
          color: CATEGORY_COLORS[Object.keys(catMap).length % CATEGORY_COLORS.length]
        };
      }
      catMap[cName].books += 1;
      catMap[cName].clicks += b.clicks || 0;
      catMap[cName].sales += b.salesCount || 0;
      catMap[cName].revenue += (b.salesCount || 0) * (Number(b.price) || 0);
    });

    return Object.values(catMap);
  }, [categoryStats, books, categories]);

  // Metric calculation & percentages
  const metricConfigs = {
    sales: {
      label: 'Units Sold',
      icon: FiShoppingBag,
      format: (v) => `${v} sold`,
      getValue: (d) => d.sales
    },
    revenue: {
      label: 'Revenue',
      icon: FiDollarSign,
      format: (v) => formatPrice(v),
      getValue: (d) => d.revenue
    },
    books: {
      label: 'Titles Count',
      icon: FiBook,
      format: (v) => `${v} titles`,
      getValue: (d) => d.books
    },
    clicks: {
      label: 'Reader Clicks',
      icon: FiMousePointer,
      format: (v) => `${v} clicks`,
      getValue: (d) => d.clicks
    }
  };

  const currentConfig = metricConfigs[metric];

  // Total value for currently selected metric
  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + currentConfig.getValue(item), 0);
  }, [data, currentConfig]);

  // Donut SVG Slices geometry
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  const slices = useMemo(() => {
    if (totalValue === 0) return [];
    let accumulatedPct = 0;

    return data
      .map((item) => {
        const val = currentConfig.getValue(item);
        const pct = val / totalValue;
        const strokeDasharray = `${pct * circumference} ${circumference}`;
        const strokeDashoffset = -accumulatedPct * circumference;
        accumulatedPct += pct;

        return {
          ...item,
          value: val,
          pct: Math.round(pct * 100),
          strokeDasharray,
          strokeDashoffset
        };
      })
      .filter((s) => s.value > 0);
  }, [data, currentConfig, totalValue, circumference]);

  const activeSlice = hoveredCategory
    ? slices.find((s) => s.name === hoveredCategory) || slices[0]
    : slices[0] || null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-5 sm:p-6 space-y-6">
      {/* Header and Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <FiPieChart className="w-3.5 h-3.5 text-[#1E90FF]" />
            Catalogue Share
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Category Distribution Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare sales velocity, revenue generation, and catalogue density by category.
          </p>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-md text-xs font-semibold overflow-x-auto scrollbar-none min-w-0">
          {Object.entries(metricConfigs).map(([mKey, cfg]) => {
            const Icon = cfg.icon;
            const isSelected = metric === mKey;
            return (
              <button
                key={mKey}
                onClick={() => {
                  setMetric(mKey);
                  setHoveredCategory(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors cursor-pointer text-xs whitespace-nowrap min-h-[32px] ${
                  isSelected
                    ? 'bg-white text-slate-900 font-bold border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3 h-3 flex-shrink-0 text-[#1E90FF]" />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Donut and Detailed List Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Donut Visual (5 columns) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {slices.length > 0 ? (
              <svg
                viewBox="0 0 160 160"
                className="w-full h-full -rotate-90 transform"
              >
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth={strokeWidth}
                />

                {/* Dynamic Category Slices */}
                {slices.map((slice, idx) => {
                  const isHovered = hoveredCategory === slice.name;
                  return (
                    <circle
                      key={idx}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="butt"
                      onMouseEnter={() => setHoveredCategory(slice.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onTouchStart={() => setHoveredCategory(slice.name)}
                      onTouchEnd={() => setHoveredCategory(null)}
                      className="cursor-pointer transition-all duration-200"
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="w-full h-full rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                No data
              </div>
            )}

            {/* Central Donut Hole Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {activeSlice ? (
                <>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider block truncate max-w-[120px]"
                    style={{ color: activeSlice.color }}
                  >
                    {activeSlice.name}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                    {activeSlice.pct}%
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate max-w-[120px]">
                    {currentConfig.format(activeSlice.value)}
                  </span>
                </>
              ) : (
                <div className="text-center text-xs text-slate-400">
                  <span className="font-semibold block text-slate-700">All Categories</span>
                  <span>{currentConfig.format(totalValue)}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Tap or hover a segment to inspect
          </p>
        </div>

        {/* Category Breakdown Bars List (7 columns) */}
        <div className="md:col-span-7 space-y-3">
          {slices.length > 0 ? (
            slices.slice(0, 6).map((slice, idx) => {
              const isHovered = hoveredCategory === slice.name;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredCategory(slice.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onTouchStart={() => setHoveredCategory(slice.name)}
                  onTouchEnd={() => setHoveredCategory(null)}
                  className={`p-2.5 rounded-md border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="truncate max-w-[180px] sm:max-w-xs">{slice.name}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-600">
                        {currentConfig.format(slice.value)}
                      </span>
                      <span className="font-bold text-slate-900 w-10 text-right">
                        {slice.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-300"
                      style={{
                        width: `${slice.pct}%`,
                        backgroundColor: slice.color
                      }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No category metrics recorded yet for {currentConfig.label.toLowerCase()}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
