import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useCookie } from '../../context/CookieContext';

export default function Footer() {
  const { openCookieSettings } = useCookie();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white text-black font-black text-base flex items-center justify-center">
                M
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Midusa<span className="text-zinc-400">eLibrary</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Kenya’s premier digital eBookstore for personal growth, finance, psychology, and faith literature with instant automated M-PESA delivery.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
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
              <Link to="/" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-zinc-600" />
                <span>Home</span>
              </Link>
              <Link to="/library" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-zinc-600" />
                <span>All Books</span>
              </Link>
              <Link to="/categories" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-zinc-600" />
                <span>Categories</span>
              </Link>
              <Link to="/legal" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-zinc-600" />
                <span>Legal Policies</span>
              </Link>
            </div>
          </div>

          {/* Column 3: Contact & Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Contact &amp; Support
            </h4>
            <div className="space-y-1.5 text-xs text-zinc-400">
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
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Bottom Bar: Copyright & Policies ── */}
        <div className="mt-8 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <p>© {currentYear} Midusa eLibrary. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link to="/refund-policy" className="hover:text-zinc-300 transition-colors">
              Refunds
            </Link>
            <span className="text-zinc-700">•</span>
            <Link to="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
            <span className="text-zinc-700">•</span>
            <Link to="/terms" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={openCookieSettings}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
