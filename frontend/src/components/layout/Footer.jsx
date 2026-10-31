import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useCookie } from '../../context/CookieContext';
import Logo from '../../assets/logo.jpg';

export default function Footer() {
  const { openCookieSettings } = useCookie();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A3D6E] text-white border-t border-[#1063B0]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 group py-1" title="Midusa Elibrary Home">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-white flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden flex-shrink-0 shadow-sm">
                <img className="w-full h-full object-cover rounded-md" src={Logo} alt="Midusa Elibrary" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight select-none">
                <span className="text-white">Midusa</span>
                <span className="text-[#1E90FF]">Elibrary</span>
              </span>
            </Link>
            <p className="text-xs text-blue-100/80 max-w-sm leading-relaxed">
              Kenya’s premier digital eBookstore for personal growth, finance, psychology, and faith literature with instant automated M-PESA delivery.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-blue-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00A651]" />
              <span>Instant Digital Delivery • Verified M-PESA Checkout</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/" className="text-blue-100/80 hover:text-white transition-colors flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-blue-300/60" />
                <span>Home</span>
              </Link>
              <Link to="/library" className="text-blue-100/80 hover:text-white transition-colors flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-blue-300/60" />
                <span>All Books</span>
              </Link>
              <Link to="/categories" className="text-blue-100/80 hover:text-white transition-colors flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-blue-300/60" />
                <span>Categories</span>
              </Link>
              <Link to="/legal" className="text-blue-100/80 hover:text-white transition-colors flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-blue-300/60" />
                <span>Legal Policies</span>
              </Link>
            </div>
          </div>

          {/* Column 3: Contact & Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Contact &amp; Support
            </h4>
            <div className="space-y-1.5 text-xs text-blue-100/80">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#00A651]" />
                <a
                  href="https://wa.me/254112478220?text=Hi%20MidusaElibrary,%20I%20have%20an%20inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors font-mono"
                >
                  0112 478 220
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#1E90FF]" />
                <a href="mailto:midusab@gmail.com" className="hover:text-white transition-colors">
                  midusab@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-300/70" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Bottom Bar: Copyright & Policies ── */}
        <div className="mt-8 pt-5 border-t border-[#1063B0]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-blue-200/70">
          <p>© {currentYear} Midusa Elibrary. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link to="/refund-policy" className="hover:text-white transition-colors">
              Refunds
            </Link>
            <span className="text-blue-300/40">•</span>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span className="text-blue-300/40">•</span>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span className="text-blue-300/40">•</span>
            <button
              type="button"
              onClick={openCookieSettings}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
