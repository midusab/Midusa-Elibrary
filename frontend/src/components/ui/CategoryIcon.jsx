import { FiTrendingUp, FiActivity, FiBriefcase, FiBookOpen } from 'react-icons/fi';

export default function CategoryIcon({ slug, className = 'w-5 h-5' }) {
  switch (slug) {
    case 'self-development':
      return <FiTrendingUp className={className} />;
    case 'psychology':
      return <FiActivity className={className} />;
    case 'finance-business':
      return <FiBriefcase className={className} />;
    case 'christianity':
      return <FiBookOpen className={className} />;
    default:
      return <FiBookOpen className={className} />;
  }
}
