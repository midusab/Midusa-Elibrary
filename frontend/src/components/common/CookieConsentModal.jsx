import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, X } from 'lucide-react';
import { useCookie } from '../../context/CookieContext';

export default function CookieConsentModal() {
  const {
    consentDecided,
    isSettingsOpen,
    acceptAll,
    rejectAll,
    closeCookieSettings
  } = useCookie();

  const isVisible = !consentDecided || isSettingsOpen;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="fixed bottom-0 inset-x-0 z-[9999] w-full bg-[#081B33]/98 backdrop-blur-xl border-t border-[#1E90FF]/30 text-white shadow-[0_-12px_45px_rgba(0,0,0,0.65)]"
          role="region"
          aria-label="User Data Privacy and Cookie Consent"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
              
              {/* Left Column: Icon, Title & Privacy Information */}
              <div className="flex items-start gap-3.5 sm:gap-4 max-w-4xl">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1E90FF]/15 border border-[#1E90FF]/35 text-[#1E90FF] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                      <span>User Data Privacy &amp; Cookie Consent</span>
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#00A651]/20 text-[#00A651] border border-[#00A651]/30">
                      <Lock className="w-2.5 h-2.5" />
                      Data Protection Act &amp; GDPR Compliant
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/85 leading-relaxed">
                    We value your data privacy. MidusaElibrary uses essential cookies to keep you safely signed in, protect your M-PESA checkout, and ensure instant digital eBook delivery. We do not sell your data. You may accept all cookies or reject non-essential analytics cookies.
                  </p>
                  <p className="text-[11px] text-blue-200/70">
                    Review how your information is handled in our{' '}
                    <Link to="/privacy" className="text-[#1E90FF] hover:underline font-semibold">
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link to="/terms" className="text-[#1E90FF] hover:underline font-semibold">
                      Terms of Service
                    </Link>.
                  </p>
                </div>
              </div>

              {/* Right Column: Accept and Reject Actions */}
              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto flex-shrink-0 justify-end pt-1 lg:pt-0">
                <button
                  type="button"
                  onClick={rejectAll}
                  className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl border border-slate-600 hover:border-slate-400 text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center"
                >
                  Reject Non-Essential
                </button>

                <button
                  type="button"
                  onClick={acceptAll}
                  className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-[#167CD9] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-[#1E90FF]/30 active:scale-95 cursor-pointer text-center"
                >
                  Accept All Cookies
                </button>

                {isSettingsOpen && (
                  <button
                    type="button"
                    onClick={closeCookieSettings}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Close cookie banner"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
