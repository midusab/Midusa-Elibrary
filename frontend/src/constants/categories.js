export const CATEGORIES = [
  {
    id: 1,
    name: 'Programming',
    description: 'Learn coding languages, software development, and programming concepts',
    icon: '💻',
    bookCount: 1250
  },
  {
    id: 2,
    name: 'Business',
    description: 'Business strategy, management, entrepreneurship, and corporate insights',
    icon: '📊',
    bookCount: 890
  },
  {
    id: 3,
    name: 'Finance',
    description: 'Personal finance, investing, trading, and financial management',
    icon: '💰',
    bookCount: 756
  },
  {
    id: 4,
    name: 'Psychology',
    description: 'Human behavior, mental health, cognitive science, and personal growth',
    icon: '🧠',
    bookCount: 634
  },
  {
    id: 5,
    name: 'Self Development',
    description: 'Personal growth, productivity, habits, and self-improvement',
    icon: '📈',
    bookCount: 1120
  },
  {
    id: 6,
    name: 'Marketing',
    description: 'Digital marketing, branding, advertising, and growth strategies',
    icon: '🎯',
    bookCount: 543
  },
  {
    id: 7,
    name: 'Entrepreneurship',
    description: 'Startup guides, innovation, business building, and leadership',
    icon: '🚀',
    bookCount: 789
  },
  {
    id: 8,
    name: 'University Resources',
    description: 'Academic materials, research papers, and educational resources',
    icon: '🎓',
    bookCount: 2340
  }
];

export const PRICE_RANGES = [
  { id: 'all', label: 'All Prices', min: 0, max: Infinity },
  { id: 'free', label: 'Free', min: 0, max: 0 },
  { id: 'under-10', label: 'Under $10', min: 0, max: 10 },
  { id: '10-25', label: '$10 - $25', min: 10, max: 25 },
  { id: '25-50', label: '$25 - $50', min: 25, max: 50 },
  { id: 'over-50', label: 'Over $50', min: 50, max: Infinity }
];

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'popular', label: 'Most Popular' }
];
