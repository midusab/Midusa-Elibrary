import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiShield, FiSmartphone } from 'react-icons/fi';
import { useCategories } from '../../context/CategoryContext';
import CategoryIcon from '../ui/CategoryIcon';

const Footer = () => {
  const { categories } = useCategories();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand / About */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
                M
              </div>
              <span className="text-xl font-bold text-white tracking-tight">MidusaElibrary</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Curated digital library empowering your intellectual and personal growth. Focused on Self Development, Psychology, Finance &amp; Business, and Christianity.
            </p>

            {/* M-Pesa Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/40 rounded-xl px-3 py-2">
              <FiSmartphone className="text-emerald-400 w-4 h-4 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-emerald-300">Lipa Na M-PESA</p>
                <p className="text-[10px] text-emerald-500">Safaricom Secured</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/library" className="text-slate-400 hover:text-white transition-colors">Browse Library</Link>
              </li>
              <li>
                <Link to="/categories" className="text-slate-400 hover:text-white transition-colors">All Categories</Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact &amp; Support</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">
              Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories.length === 0 ? (
                <li className="text-slate-500 text-xs">No categories added yet</li>
              ) : (
                categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/library?category=${encodeURIComponent(cat.name)}`}
                      className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <CategoryIcon slug={cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="w-4 h-4 text-primary" />
                      <span>{cat.name}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">
              Support
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2.5">
                <FiPhone className="text-primary flex-shrink-0 w-4 h-4" />
                <a href="tel:+254112478220" className="hover:text-white transition-colors">+254 112 478 220</a>
              </li>
              <li className="flex items-start gap-2.5">
                <FiPhone className="text-green-500 flex-shrink-0 w-4 h-4 mt-0.5" />
                <div>
                  <p className="text-[11px] text-green-500 font-semibold">WhatsApp Support</p>
                  <a href="https://wa.me/254112478220" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    0112 478 220
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail className="text-primary flex-shrink-0 w-4 h-4" />
                <a href="mailto:midusab@gmail.com" className="hover:text-white transition-colors">
                  midusab@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMapPin className="text-primary flex-shrink-0 w-4 h-4" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <FiShield className="text-emerald-500 w-3.5 h-3.5" />
              <span>Response within 2–4 hours</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-10 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© {currentYear} MidusaElibrary. All rights reserved.</p>

            <div className="flex flex-wrap justify-center gap-4">
              <span className="text-slate-600">Prices in Kenyan Shillings (KSh)</span>
              <span className="text-slate-700">|</span>
              <Link to="/contact" className="hover:text-white transition-colors">Refund Policy</Link>
              <span className="text-slate-700">|</span>
              <Link to="/contact" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-slate-700">|</span>
              <Link to="/contact" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
