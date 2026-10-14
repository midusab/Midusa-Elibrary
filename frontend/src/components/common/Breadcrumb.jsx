import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

/**
 * Route labels dictionary for auto-generated breadcrumbs
 */
const ROUTE_LABELS = {
  library: 'Library',
  categories: 'Categories',
  cart: 'Shopping Cart',
  checkout: 'Checkout',
  wishlist: 'My Wishlist',
  dashboard: 'Dashboard',
  admin: 'Admin Portal',
  about: 'About Us',
  contact: 'Contact & Support',
  legal: 'Legal & Policies',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  'refund-policy': 'Refund Policy',
  'terms-conditions': 'Terms & Conditions',
  faq: 'Frequently Asked Questions',
  book: 'Book Details',
};

/**
 * Modern, SEO-optimized Breadcrumb component.
 *
 * @param {Object} props
 * @param {Array<{ label: string, to?: string, icon?: React.ReactNode }>} [props.items] - Optional custom breadcrumb hierarchy
 * @param {string} [props.className] - Additional styling classes
 * @param {boolean} [props.showHome=true] - Whether to prefix with Home link
 */
export default function Breadcrumb({ items, className = '', showHome = true }) {
  const location = useLocation();

  // If custom items not provided, derive automatically from current pathname
  const breadcrumbItems = items || (() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const derived = [];

    let accumulatedPath = '';
    segments.forEach((seg, index) => {
      accumulatedPath += `/${seg}`;
      const isLast = index === segments.length - 1;
      const label = ROUTE_LABELS[seg.toLowerCase()] || decodeURIComponent(seg).replace(/[-_]+/g, ' ');

      derived.push({
        label,
        to: isLast ? undefined : accumulatedPath,
      });
    });

    return derived;
  })();

  // Guarantee Home link at start if showHome is enabled and not already first
  const fullItems = showHome && (breadcrumbItems.length === 0 || breadcrumbItems[0]?.to !== '/')
    ? [{ label: 'Home', to: '/', icon: <FiHome className="w-3.5 h-3.5" /> }, ...breadcrumbItems]
    : breadcrumbItems;

  if (fullItems.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`py-2 text-xs text-slate-500 ${className}`}
    >
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        className="flex items-center flex-wrap gap-1.5 leading-none"
      >
        {fullItems.map((item, index) => {
          const isLast = index === fullItems.length - 1;
          const position = index + 1;

          return (
            <li
              key={index}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              className="inline-flex items-center gap-1.5"
            >
              {index > 0 && (
                <FiChevronRight
                  className="w-3 h-3 text-slate-300 flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  itemProp="item"
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#1E90FF] font-medium transition-colors hover:underline"
                >
                  {item.icon}
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span
                  itemProp="name"
                  aria-current={isLast ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 ${
                    isLast
                      ? 'font-bold text-slate-900 max-w-[200px] sm:max-w-[340px] md:max-w-[420px] truncate'
                      : 'text-slate-500'
                  }`}
                  title={typeof item.label === 'string' ? item.label : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
