import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDollarSign,
  FiShoppingBag,
  FiActivity,
  FiUsers,
  FiMousePointer,
  FiTrendingUp,
  FiLayers,
  FiBarChart2,
  FiCalendar
} from 'react-icons/fi';
import { formatPrice } from '../../../utils/currency';

/**
 * Generates a smooth cubic Bezier SVG path through a series of (x, y) points
 */
function getSmoothSplinePath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i != points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export default function DynamicTrendChart({
  dailyTrends = [],
  metric = 'revenue',
  setMetric
}) {
  const [activeMetric, setActiveMetric] = useState(metric || 'revenue');
  const [chartMode, setChartMode] = useState('spline'); // 'spline' | 'bars' | 'dual'
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const containerRef = useRef(null);

  const selectedMetric = setMetric ? metric : activeMetric;
  const handleSelectMetric = (mId) => {
    if (setMetric) setMetric(mId);
    setActiveMetric(mId);
  };

  const metricConfigs = {
    revenue: {
      label: 'Revenue',
      icon: FiDollarSign,
      color: '#1E90FF',
      gradientStart: '#1E90FF',
      gradientEnd: '#60a5fa',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-[#1E90FF]',
      format: (val) => formatPrice(val),
      unit: ''
    },
    sales: {
      label: 'Orders',
      icon: FiShoppingBag,
      color: '#10b981',
      gradientStart: '#10b981',
      gradientEnd: '#34d399',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-600',
      format: (val) => `${val} orders`,
      unit: 'orders'
    },
    visits: {
      label: 'Site Visits',
      icon: FiActivity,
      color: '#6366f1',
      gradientStart: '#6366f1',
      gradientEnd: '#818cf8',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-600',
      format: (val) => `${val.toLocaleString()} visits`,
      unit: 'visits'
    },
    newUsers: {
      label: 'Signups',
      icon: FiUsers,
      color: '#f59e0b',
      gradientStart: '#f59e0b',
      gradientEnd: '#fbbf24',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-600',
      format: (val) => `${val} readers`,
      unit: 'readers'
    },
    clicks: {
      label: 'Book Clicks',
      icon: FiMousePointer,
      color: '#8b5cf6',
      gradientStart: '#8b5cf6',
      gradientEnd: '#a78bfa',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-600',
      format: (val) => `${val} views`,
      unit: 'clicks'
    }
  };

  const activeConfig = metricConfigs[selectedMetric] || metricConfigs.revenue;

  // Compute metrics stats
  const stats = useMemo(() => {
    if (!dailyTrends || dailyTrends.length === 0) {
      return { total: 0, avg: 0, peak: 0, peakLabel: 'N/A' };
    }
    const values = dailyTrends.map((d) => Number(d[selectedMetric]) || 0);
    const total = values.reduce((sum, v) => sum + v, 0);
    const avg = Math.round(total / values.length);
    let peak = 0;
    let peakIndex = 0;
    values.forEach((v, idx) => {
      if (v >= peak) {
        peak = v;
        peakIndex = idx;
      }
    });
    return {
      total,
      avg,
      peak,
      peakLabel: dailyTrends[peakIndex]?.label?.split(',')[0] || 'Peak'
    };
  }, [dailyTrends, selectedMetric]);

  // Coordinates calculation for SVG Spline
  const chartDimensions = { width: 680, height: 210, padX: 42, padY: 28 };
  const { width, height, padX, padY } = chartDimensions;

  const points = useMemo(() => {
    if (!dailyTrends || dailyTrends.length === 0) return [];
    const values = dailyTrends.map((d) => Number(d[selectedMetric]) || 0);
    const maxVal = Math.max(1, ...values);
    const count = dailyTrends.length;

    return dailyTrends.map((d, i) => {
      const val = Number(d[selectedMetric]) || 0;
      const x = padX + (i / (count - 1 || 1)) * (width - 2 * padX);
      const y = height - padY - (val / maxVal) * (height - 2 * padY);
      return { x, y, val, data: d, index: i };
    });
  }, [dailyTrends, selectedMetric, width, height, padX, padY]);

  // Dual comparison secondary points (Visits vs Orders)
  const secondaryMetricKey = selectedMetric === 'visits' ? 'sales' : 'visits';
  const secondaryConfig = metricConfigs[secondaryMetricKey];

  const secondaryPoints = useMemo(() => {
    if (chartMode !== 'dual' || !dailyTrends || dailyTrends.length === 0) return [];
    const values = dailyTrends.map((d) => Number(d[secondaryMetricKey]) || 0);
    const maxVal = Math.max(1, ...values);
    const count = dailyTrends.length;

    return dailyTrends.map((d, i) => {
      const val = Number(d[secondaryMetricKey]) || 0;
      const x = padX + (i / (count - 1 || 1)) * (width - 2 * padX);
      const y = height - padY - (val / maxVal) * (height - 2 * padY);
      return { x, y, val, data: d, index: i };
    });
  }, [chartMode, dailyTrends, secondaryMetricKey, width, height, padX, padY]);

  const splinePath = useMemo(() => getSmoothSplinePath(points), [points]);
  const secondarySplinePath = useMemo(() => getSmoothSplinePath(secondaryPoints), [secondaryPoints]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${splinePath} L ${last.x.toFixed(1)} ${(height - padY).toFixed(1)} L ${first.x.toFixed(1)} ${(height - padY).toFixed(1)} Z`;
  }, [splinePath, points, height, padY]);

  // Shared helper: convert a clientX pixel to the nearest data index
  const clientXToIndex = (clientX) => {
    if (!containerRef.current || points.length === 0) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const svgX = (relX / rect.width) * width;
    let nearestIndex = 0;
    let minDistance = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - svgX);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = idx;
      }
    });
    return nearestIndex;
  };

  // Mouse hover interactive scrubber
  const handleMouseMove = (e) => {
    const idx = clientXToIndex(e.clientX);
    if (idx !== null) setHoveredIndex(idx);
  };

  const handleMouseLeave = () => setHoveredIndex(null);

  // Touch scrubber (mobile)
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const idx = clientXToIndex(touch.clientX);
    if (idx !== null) setHoveredIndex(idx);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const idx = clientXToIndex(touch.clientX);
    if (idx !== null) setHoveredIndex(idx);
  };

  const handleTouchEnd = () => setHoveredIndex(null);

  // Tooltip left position: clamp against the actual rendered container width
  const getTooltipLeft = (pt) => {
    if (!containerRef.current) return Math.max(10, pt.x - 70);
    const containerW = containerRef.current.getBoundingClientRect().width;
    const tooltipW = 184; // min-w in px
    const scaleFactor = containerW / width;
    const scaledX = pt.x * scaleFactor;
    return Math.min(Math.max(scaledX - tooltipW / 2, 8), containerW - tooltipW - 8);
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];
  const activeSecondaryPoint = (chartMode === 'dual' && hoveredIndex !== null)
    ? secondaryPoints[hoveredIndex]
    : secondaryPoints[secondaryPoints.length - 1];

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-5 sm:p-6 space-y-6">
      {/* Chart Control Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <FiTrendingUp className="w-3.5 h-3.5 text-[#1E90FF]" />
            Dynamic Performance Analytics
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            7-Day Activity Velocity & Trajectory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time interactive timeline showing daily performance, traffic, and revenue curves.
          </p>
        </div>

        {/* View Mode & Metric Selectors */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Chart Display Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-md text-xs font-semibold overflow-x-auto scrollbar-none">
            {[
              { id: 'spline', label: 'Curve', icon: FiActivity },
              { id: 'bars', label: 'Bars', icon: FiBarChart2 },
              { id: 'dual', label: 'Dual', icon: FiLayers }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setChartMode(mode.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors cursor-pointer text-xs whitespace-nowrap min-h-[32px] ${
                  chartMode === mode.id
                    ? 'bg-white text-slate-900 font-bold border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <mode.icon className="w-3 h-3 flex-shrink-0" />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-md text-xs font-semibold overflow-x-auto scrollbar-none min-w-0 max-w-full">
            {Object.entries(metricConfigs).map(([mKey, cfg]) => {
              const Icon = cfg.icon;
              const isSelected = selectedMetric === mKey;
              return (
                <button
                  key={mKey}
                  onClick={() => handleSelectMetric(mKey)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-colors cursor-pointer text-xs whitespace-nowrap min-h-[32px] ${
                    isSelected
                      ? 'bg-white text-slate-900 font-bold border border-slate-200/70'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3 h-3 flex-shrink-0" style={{ color: isSelected ? cfg.color : undefined }} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip for selected metric */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50/80 rounded-md border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            7-Day Total
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 block mt-0.5">
            {activeConfig.format(stats.total)}
          </span>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-md border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Daily Average
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 block mt-0.5">
            {activeConfig.format(stats.avg)}
          </span>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-md border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Peak Day ({stats.peakLabel})
          </span>
          <span className="text-base sm:text-lg font-bold text-emerald-600 block mt-0.5">
            {activeConfig.format(stats.peak)}
          </span>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-md border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Selected Point
          </span>
          <span className="text-base sm:text-lg font-bold text-[#1E90FF] block mt-0.5">
            {activePoint ? activeConfig.format(activePoint.val) : '--'}
          </span>
        </div>
      </div>

      {/* Main Interactive Chart Display Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full overflow-hidden select-none cursor-crosshair pt-2 touch-pan-y"
      >
        {/* Floating Tooltip Card */}
        {activePoint && hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-20 top-2 pointer-events-none bg-slate-900 text-white p-3 rounded-md border border-slate-800 text-xs min-w-[170px]"
            style={{ left: getTooltipLeft(activePoint) }}
          >
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <FiCalendar className="w-3 h-3" />
              <span>{activePoint.data.label}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm font-bold">
              <span className="text-white">{activeConfig.label}:</span>
              <span style={{ color: activeConfig.color }}>
                {activeConfig.format(activePoint.val)}
              </span>
            </div>
            {chartMode === 'dual' && activeSecondaryPoint && (
              <div className="flex items-center justify-between gap-3 text-xs text-slate-300 mt-1 pt-1 border-t border-slate-800">
                <span>{secondaryConfig.label}:</span>
                <span style={{ color: secondaryConfig.color }} className="font-semibold">
                  {secondaryConfig.format(activeSecondaryPoint.val)}
                </span>
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">
              {activePoint.data.sales > 0 && activePoint.data.visits > 0
                ? `Conversion: ${((activePoint.data.sales / activePoint.data.visits) * 100).toFixed(1)}%`
                : 'Live telemetry point'}
            </div>
          </motion.div>
        )}

        {/* Dynamic SVG Canvas */}
        {points.length > 0 ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible"
            style={{ minHeight: '190px' }}
          >
            <defs>
              {/* Primary Metric Linear Gradient */}
              <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeConfig.color} stopOpacity="0.28" />
                <stop offset="90%" stopColor={activeConfig.color} stopOpacity="0.01" />
              </linearGradient>

              {/* Secondary Metric Linear Gradient */}
              <linearGradient id="secondaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={secondaryConfig.color} stopOpacity="0.20" />
                <stop offset="90%" stopColor={secondaryConfig.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yPos = height - padY - pct * (height - 2 * padY);
              return (
                <line
                  key={idx}
                  x1={padX}
                  y1={yPos}
                  x2={width - padX}
                  y2={yPos}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* BAR MODE DISPLAY */}
            {chartMode === 'bars' && (
              <g>
                {points.map((pt, idx) => {
                  const barWidth = Math.min(36, ((width - 2 * padX) / points.length) * 0.55);
                  const barHeight = Math.max(4, height - padY - pt.y);
                  const isHovered = hoveredIndex === idx;

                  return (
                    <g key={idx}>
                      <rect
                        x={pt.x - barWidth / 2}
                        y={pt.y}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        fill={isHovered ? activeConfig.color : '#cbd5e1'}
                        className="transition-colors duration-150"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 6}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fill={isHovered ? activeConfig.color : '#64748b'}
                      >
                        {pt.val}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* SPLINE / DUAL MODE DISPLAY */}
            {chartMode !== 'bars' && (
              <>
                {/* Secondary Series in Dual Mode */}
                {chartMode === 'dual' && secondaryPoints.length > 0 && (
                  <>
                    <path
                      d={secondarySplinePath}
                      fill="none"
                      stroke={secondaryConfig.color}
                      strokeWidth="2"
                      strokeDasharray="5 5"
                      strokeLinecap="round"
                    />
                    {secondaryPoints.map((pt, idx) => (
                      <circle
                        key={`sec-${idx}`}
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="#ffffff"
                        stroke={secondaryConfig.color}
                        strokeWidth="2"
                      />
                    ))}
                  </>
                )}

                {/* Primary Metric Smooth Area Fill */}
                <path d={areaPath} fill="url(#primaryAreaGrad)" />

                {/* Primary Metric Smooth Spline Line */}
                <path
                  d={splinePath}
                  fill="none"
                  stroke={activeConfig.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  return (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : 4}
                        fill="#ffffff"
                        stroke={activeConfig.color}
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}
              </>
            )}

            {/* Vertical Hover Scrubber Line */}
            {activePoint && hoveredIndex !== null && (
              <line
                x1={activePoint.x}
                y1={padY}
                x2={activePoint.x}
                y2={height - padY}
                stroke={activeConfig.color}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* X-Axis Labels */}
            {points.map((pt, idx) => {
              const labelParts = pt.data.label ? pt.data.label.split(',') : ['Day', ''];
              const dayName = labelParts[0];
              const isHovered = hoveredIndex === idx;

              return (
                <text
                  key={`label-${idx}`}
                  x={pt.x}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? activeConfig.color : '#64748b'}
                  className="transition-colors duration-150"
                >
                  {dayName}
                </text>
              );
            })}
          </svg>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No daily telemetry events tracked yet.
          </div>
        )}
      </div>

      {/* Chart Legend / Footnote */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: activeConfig.color }}
            />
            {activeConfig.label} ({chartMode === 'bars' ? 'Bar Chart' : 'Active Spline'})
          </span>
          {chartMode === 'dual' && (
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: secondaryConfig.color }}
              />
              {secondaryConfig.label} (Comparison)
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:block">
          Hover or touch data points to scrub daily breakdowns
        </span>
      </div>
    </div>
  );
}
