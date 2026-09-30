import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiShield, FiHeart } from 'react-icons/fi';
import { CATEGORIES } from '../../constants/categories';
import CategoryIcon from '../ui/CategoryIcon';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
                M
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">MidusaElibrary</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Curated digital library focused strictly on Self Development, Psychology, Finance & Business, and Christianity.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <FiShield className="text-primary w-4 h-4" />
              <span>Certified Digital Delivery</span>
            </div>
          </div>

          {/* Quick Links: 18px Heading, 14px Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 tracking-tight">
              Navigation
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
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* 4 Core Categories: 18px Heading, 14px Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 tracking-tight">
              Core Niches
            </h3>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/library?category=${encodeURIComponent(cat.name)}`}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <CategoryIcon slug={cat.slug} className="w-4 h-4 text-primary" />
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information: 18px Heading, 14px Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 tracking-tight">
              Support
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2.5">
                <FiPhone className="text-primary flex-shrink-0 w-4 h-4" />
                <span>0112478220</span>
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
          </div>
        </div>

        {/* Bottom Section: 12px Copyright */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-3">
          <p>© {currentYear} MidusaElibrary. All rights reserved.</p>
          <p className="text-slate-500">Prices in Kenyan Shillings (KSh)</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
