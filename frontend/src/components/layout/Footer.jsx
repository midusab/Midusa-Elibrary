import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiShield,
  FiSmartphone,
  FiDownload,
  FiTablet,
  FiLock,
  FiCheck,
  FiClock
} from 'react-icons/fi';
import { useCategories } from '../../context/CategoryContext';
import CategoryIcon from '../ui/CategoryIcon';

const Footer = () => {
  const { categories } = useCategories();
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setIsSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800/80">
      {/* ========================================================= */}
      {/* INTERNATIONAL TRUST & ASSURANCE STRIP */}
      {/* ========================================================= */}
      <div className="border-b border-slate-800/80 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#1E90FF] flex items-center justify-center flex-shrink-0">
                <FiDownload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">Instant PDF Download</h4>
                <p className="text-[11px] text-slate-400">Direct download link right after checkout</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                <FiTablet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">Universal Compatibility</h4>
                <p className="text-[11px] text-slate-400">Read on Phone, Tablet, PC &amp; e-Reader</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <FiSmartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">Lipa Na M-PESA</h4>
                <p className="text-[11px] text-slate-400">Instant Safaricom STK push payment</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <FiLock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">256-Bit SSL Encryption</h4>
                <p className="text-[11px] text-slate-400">Bank-grade data security &amp; privacy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN FOOTER COLUMNS */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand & Newsletter Column (2 Cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E90FF] to-blue-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#1E90FF]/20">
                M
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Midusa<span className="text-[#1E90FF]">Elibrary</span>
              </span>
            </Link>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Kenya’s premier digital eBookstore for transformative literature. Empowering readers in Self-Development, Psychology, Business, Finance, and Christian Growth.
            </p>

            {/* Newsletter Subscription Box */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Join the Readers Club
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                Receive weekly curated book recommendations, free chapter extracts &amp; reader discounts.
              </p>

              {isSubscribed ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
                  <FiCheck className="w-4 h-4 text-emerald-400" />
                  <span>Welcome aboard! You're subscribed to weekly picks.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-[#1873cc] text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-4 tracking-wider uppercase">
              Discover &amp; Explore
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/library" className="text-slate-400 hover:text-[#1E90FF] transition-colors">
                  All eBooks Catalog
                </Link>
              </li>
              <li>
                <Link to="/library?bestseller=true" className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <span>★ Bestselling Titles</span>
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-slate-400 hover:text-[#1E90FF] transition-colors">
                  Browse by Category
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Contact &amp; Help Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories Column */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-4 tracking-wider uppercase">
              Catalogue Topics
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {categories.length === 0 ? (
                <li className="text-slate-500 text-xs">Catalogue loading...</li>
              ) : (
                categories.slice(0, 5).map((cat) => (
                  <li key={cat.id || cat.name}>
                    <Link
                      to={`/library?category=${encodeURIComponent(cat.name)}`}
                      className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      <CategoryIcon
                        slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                        className="w-3.5 h-3.5 text-[#1E90FF] group-hover:scale-110 transition-transform"
                      />
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  </li>
                ))
              )}
              {categories.length > 5 && (
                <li>
                  <Link to="/categories" className="text-xs text-[#1E90FF] hover:underline font-semibold block pt-1">
                    View all {categories.length} categories →
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Support & Desk Column */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-4 tracking-wider uppercase">
              Customer Support
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <FiClock className="text-[#1E90FF] flex-shrink-0 w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Operating Hours</p>
                  <p className="text-[11px] text-slate-400">Mon–Sat: 8:00 AM – 9:00 PM EAT</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <FiPhone className="text-green-500 flex-shrink-0 w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-400">WhatsApp Fast Desk</p>
                  <a
                    href="https://wa.me/254112478220?text=Hi%20MidusaElibrary,%20I%20have%20an%20inquiry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    0112 478 220
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <FiPhone className="text-[#1E90FF] flex-shrink-0 w-4 h-4" />
                <a href="tel:+254112478220" className="hover:text-white transition-colors">
                  +254 112 478 220
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail className="text-[#1E90FF] flex-shrink-0 w-4 h-4" />
                <a href="mailto:midusab@gmail.com" className="hover:text-white transition-colors">
                  midusab@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMapPin className="text-[#1E90FF] flex-shrink-0 w-4 h-4" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1.5 rounded-lg w-fit">
              <FiShield className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Response guarantee within 2–4 hrs</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM LEGAL & COMPLIANCE BAR */}
        {/* ========================================================= */}
        <div className="border-t border-slate-800/80 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div>
              <p>© {currentYear} MidusaElibrary. All rights reserved.</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Authorized digital eBook publishing. Billed securely in Kenyan Shillings (KSh).
              </p>
            </div>

            {/* Dedicated International Policy Routes */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
              <Link to="/refund-policy" className="text-slate-400 hover:text-white transition-colors">
                Refund Policy
              </Link>
              <span className="text-slate-700">|</span>
              <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span className="text-slate-700">|</span>
              <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <span className="text-slate-700">|</span>
              <Link to="/legal?tab=dmca" className="text-slate-400 hover:text-white transition-colors">
                Copyright &amp; DMCA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
