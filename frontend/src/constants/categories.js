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
  { id: 'all', label: 'All Prices', min: 0, max: Infinity },
  { id: 'free', label: 'Free', min: 0, max: 0 },
  { id: 'under-1000', label: 'Under KSh 1,000', min: 0, max: 1000 },
  { id: '1000-2000', label: 'KSh 1,000 - KSh 2,000', min: 1000, max: 2000 },
  { id: 'over-2000', label: 'Over KSh 2,000', min: 2000, max: Infinity }
];

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'popular', label: 'Most Popular' }
];
