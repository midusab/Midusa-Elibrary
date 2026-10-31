import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'midusa_cookie_consent_v1';

const getUserConsentKey = (user) => {
  if (!user) return STORAGE_KEY;
  const id = user.id || user.uid || user.email;
  return id ? `midusa_cookie_consent_${id}` : STORAGE_KEY;
};

const defaultPreferences = {
  essential: true, // Always true
  analytics: false,
  marketing: false
};

const CookieContext = createContext(null);

export function CookieProvider({ children }) {
  const { user } = useAuth();
  const [consentDecided, setConsentDecided] = useState(true); // Default true until checked
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const key = getUserConsentKey(user);
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({
          essential: true,
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing)
        });
        setConsentDecided(true);
      } else {
        // Show cookie consent for new sign-in or unconsented visitor
        setConsentDecided(false);
      }
    } catch {
      setConsentDecided(false);
    }
  }, [user]);

  const acceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    setConsentDecided(true);
    setIsSettingsOpen(false);
    try {
      const payload = JSON.stringify({ ...allAccepted, status: 'accepted', timestamp: Date.now() });
      localStorage.setItem(STORAGE_KEY, payload);
      const userKey = getUserConsentKey(user);
      if (userKey !== STORAGE_KEY) {
        localStorage.setItem(userKey, payload);
      }
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
      const payload = JSON.stringify({ ...onlyEssential, status: 'rejected', timestamp: Date.now() });
      localStorage.setItem(STORAGE_KEY, payload);
      const userKey = getUserConsentKey(user);
      if (userKey !== STORAGE_KEY) {
        localStorage.setItem(userKey, payload);
      }
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
