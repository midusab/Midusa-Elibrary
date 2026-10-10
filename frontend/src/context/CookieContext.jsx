// Cookie context removed — stub retained for any legacy imports
import { createContext, useContext } from 'react';

const CookieContext = createContext({ consent: null, hasGivenConsent: true });

export function CookieProvider({ children }) {
  return <CookieContext.Provider value={{ consent: null, hasGivenConsent: true }}>{children}</CookieContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCookie() {
  return useContext(CookieContext);
}
