export const CATEGORIES = [
  {
    id: 1,
    name: 'Self Development',
    slug: 'self-development',
    description: 'Habits, productivity, personal growth, emotional resilience, and peak performance'
  },
  {
    id: 2,
    name: 'Psychology',
    slug: 'psychology',
    description: 'Human behavior, cognitive science, mental health, and understanding the mind'
  },
  {
    id: 3,
    name: 'Finance & Business',
    slug: 'finance-business',
    description: 'Wealth creation, financial literacy, investing, business strategy, and entrepreneurship'
  },
  {
    id: 4,
    name: 'Christianity',
    slug: 'christianity',
    description: 'Spiritual growth, biblical wisdom, faith in practice, devotion, and Christian living'
  }
];

export const PRICE_RANGES = [
  { id: 'all',       label: 'All Prices',           min: 0,   max: Infinity },
  { id: '100-150',   label: 'KSh 100 – 150',        min: 100, max: 150 },
  { id: '151-200',   label: 'KSh 151 – 200',        min: 151, max: 200 },
  { id: '201-300',   label: 'KSh 201 – 300',        min: 201, max: 300 },
  { id: '301-500',   label: 'KSh 301 – 500',        min: 301, max: 500 },
  { id: 'over-500',  label: 'Over KSh 500',         min: 501, max: Infinity },
];

/**
 * Dynamically computes price ranges tailored to the actual book prices in the library catalog.
 */
export function generateDynamicPriceRanges(books = []) {
  const prices = books
    .map((b) => Number(b.price) || 0)
    .filter((p) => !isNaN(p) && p >= 0);

  if (prices.length === 0) {
    return [{ id: 'all', label: 'All Prices', min: 0, max: Infinity }];
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return [
      { id: 'all', label: 'All Prices', min: 0, max: Infinity },
      { id: 'exact', label: `KSh ${min.toLocaleString()}`, min, max },
    ];
  }

  const niceSteps = [10, 20, 25, 50, 100, 150, 200, 250, 500, 1000, 2500, 5000];
  const targetBrackets = 4;
  const rawStep = (max - min) / targetBrackets;
  const step = niceSteps.find((s) => s >= rawStep) || niceSteps[niceSteps.length - 1];

  const firstCut = Math.ceil(min / step) * step === min ? min + step : Math.ceil(min / step) * step;
  const cuts = [];
  for (let c = firstCut; c < max; c += step) {
    cuts.push(c);
  }

  const ranges = [{ id: 'all', label: 'All Prices', min: 0, max: Infinity }];

  if (cuts.length === 0) {
    ranges.push({
      id: `${min}-${max}`,
      label: `KSh ${min.toLocaleString()} – ${max.toLocaleString()}`,
      min,
      max,
    });
    return ranges;
  }

  // Under first cutoff
  const countFirst = prices.filter((p) => p <= cuts[0]).length;
  if (countFirst > 0) {
    ranges.push({
      id: `under-${cuts[0]}`,
      label: `Under KSh ${cuts[0].toLocaleString()}`,
      min: 0,
      max: cuts[0],
    });
  }

  // Intermediate ranges
  for (let i = 0; i < cuts.length - 1; i++) {
    const low = cuts[i] + 1;
    const high = cuts[i + 1];
    const count = prices.filter((p) => p >= low && p <= high).length;
    if (count > 0) {
      ranges.push({
        id: `${low}-${high}`,
        label: `KSh ${low.toLocaleString()} – ${high.toLocaleString()}`,
        min: low,
        max: high,
      });
    }
  }

  // Over last cutoff
  const lastCut = cuts[cuts.length - 1];
  const countLast = prices.filter((p) => p > lastCut).length;
  if (countLast > 0) {
    ranges.push({
      id: `over-${lastCut}`,
      label: `Over KSh ${lastCut.toLocaleString()}`,
      min: lastCut + 1,
      max: Infinity,
    });
  }

  return ranges;
}

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'popular', label: 'Most Popular' }
];
