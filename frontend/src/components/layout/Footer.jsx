import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  Check,
  ShieldCheck
} from 'lucide-react';
import { useCookie } from '../../context/CookieContext';

export default function Footer() {
  const { openCookieSettings } = useCookie();
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setIsSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-[#1E90FF] text-white">
      {/* ── Main Footer Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Column 1: Brand & Overview */}
          <div className="space-y-3.5">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-white text-[#1E90FF] font-black text-lg flex items-center justify-center">
                M
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Midusa<span className="text-white/80">eLibrary</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              Kenya’s premier digital eBookstore for curated personal growth, finance, psychology, and faith literature with automated M-PESA checkout.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 text-white text-xs border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Verified M-PESA Checkout • Lifetime Access</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 pb-1 border-b border-white/20">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/" className="text-white/85 hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-white/60" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/library" className="text-white/85 hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-white/60" />
                  <span>Shop Catalog</span>
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-white/85 hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-white/60" />
                  <span>Categories</span>
                </Link>
              </li>
              <li>
                <Link to="/legal" className="text-white/85 hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-white/60" />
                  <span>Terms &amp; Policies</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Desk */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 pb-1 border-b border-white/20">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/90">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">WhatsApp &amp; Call</p>
                  <a
                    href="https://wa.me/254112478220?text=Hi%20MidusaElibrary,%20I%20have%20an%20inquiry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-mono"
                  >
                    0112 478 220
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-white flex-shrink-0" />
                <a href="mailto:midusab@gmail.com" className="hover:underline">
                  midusab@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-white flex-shrink-0" />
                <span>Mon–Sat: 8:00 AM – 9:00 PM EAT</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 pb-1 border-b border-white/20">
              Reader Newsletter
            </h4>
            <p className="text-xs text-white/85 mb-3 leading-relaxed">
              Subscribe to get curated book summaries, new arrivals, and special seasonal reading offers.
            </p>
            {isSubscribed ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white text-[#1E90FF] text-xs font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Thank you! You're subscribed.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email address..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-md bg-white/20 hover:bg-white text-white hover:text-[#1E90FF] text-xs font-bold transition-colors cursor-pointer border border-white/40"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Bottom Legal & Copyright Bar ── */}
        <div className="mt-10 pt-6 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/80">
          <p>© {currentYear} Midusa eLibrary. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
            <Link to="/refund-policy" className="hover:text-white hover:underline">
              Refund Policy
            </Link>
            <span className="text-white/40">•</span>
            <Link to="/privacy" className="hover:text-white hover:underline">
              Privacy Policy
            </Link>
            <span className="text-white/40">•</span>
            <Link to="/terms" className="hover:text-white hover:underline">
              Terms of Service
            </Link>
            <span className="text-white/40">•</span>
            <button
              type="button"
              onClick={openCookieSettings}
              className="hover:text-white hover:underline cursor-pointer"
            >
              Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
