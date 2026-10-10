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

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'popular', label: 'Most Popular' }
];
