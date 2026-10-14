import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'midusa_cookie_consent_v1';

const defaultPreferences = {
  essential: true, // Always true
  analytics: false,
  marketing: false
};

const CookieContext = createContext(null);

export function CookieProvider({ children }) {
  const [consentDecided, setConsentDecided] = useState(true); // Default true until checked to prevent layout flash
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({
          essential: true,
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing)
        });
        setConsentDecided(true);
      } else {
        setConsentDecided(false);
      }
    } catch {
      setConsentDecided(false);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    setConsentDecided(true);
    setIsSettingsOpen(false);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...allAccepted, status: 'accepted', timestamp: Date.now() })
      );
    } catch (e) {
      console.warn('Could not persist cookie consent:', e);
    }
  };

  const rejectAll = () => {
    const onlyEssential = { essential: true, analytics: false, marketing: false };
    setPreferences(onlyEssential);
    setConsentDecided(true);
    setIsSettingsOpen(false);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...onlyEssential, status: 'rejected', timestamp: Date.now() })
      );
    } catch (e) {
      console.warn('Could not persist cookie consent:', e);
    }
  };

  const saveCustomPreferences = (custom) => {
    const merged = {
      essential: true,
      analytics: Boolean(custom.analytics),
      marketing: Boolean(custom.marketing)
    };
    setPreferences(merged);
    setConsentDecided(true);
    setIsSettingsOpen(false);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...merged, status: 'custom', timestamp: Date.now() })
      );
    } catch (e) {
      console.warn('Could not persist cookie preferences:', e);
    }
  };

  const openCookieSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeCookieSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <CookieContext.Provider
      value={{
        consentDecided,
        preferences,
        isSettingsOpen,
        acceptAll,
        rejectAll,
        saveCustomPreferences,
        openCookieSettings,
        closeCookieSettings
      }}
    >
      {children}
    </CookieContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCookie() {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error('useCookie must be used within a CookieProvider');
  }
  return context;
}
