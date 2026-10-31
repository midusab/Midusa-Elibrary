import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-0 inset-x-0 z-[9999] w-full bg-white border-t border-slate-200 text-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.1)]"
          role="region"
          aria-label="Cookie Consent"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-6">
              
              {/* Privacy text (No logo/icon, no DPA badge) */}
              <div className="space-y-1 max-w-4xl">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Cookie &amp; Privacy Preferences
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We use cookies to maintain your signed-in session, safeguard M-PESA checkout, and improve your browsing experience. Read our{' '}
                  <Link to="/privacy" className="text-[#1E90FF] hover:underline font-semibold">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link to="/terms" className="text-[#1E90FF] hover:underline font-semibold">
                    Terms
                  </Link>.
                </p>
              </div>

              {/* Action Buttons: Reject and Accept */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto flex-shrink-0 justify-end">
                <button
                  type="button"
                  onClick={rejectAll}
                  className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center"
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={acceptAll}
                  className="flex-1 sm:flex-initial px-5 sm:px-6 py-2 rounded-xl bg-[#1E90FF] hover:bg-[#167CD9] text-white text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer text-center"
                >
                  Accept
                </button>

                {isSettingsOpen && (
                  <button
                    type="button"
                    onClick={closeCookieSettings}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
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
