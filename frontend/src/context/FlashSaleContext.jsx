import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getActiveFlashSale } from '../services/api';

const FlashSaleContext = createContext({
  flashSale: null,
  isLive: false,
  discountPercent: 0,
  countdown: { hours: '00', minutes: '00', seconds: '00' },
  remainingSeconds: 0,
  refreshFlashSale: () => Promise.resolve(),
  isBookInFlashSale: () => false,
  getDiscountedPrice: () => null
});

export function FlashSaleProvider({ children }) {
  const [flashSale, setFlashSale] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const refreshFlashSale = useCallback(async () => {
    try {
      const data = await getActiveFlashSale();
      if (data?.active && data?.flashSale) {
        const sale = data.flashSale;
        const now = Date.now();
        const end = new Date(sale.endTime).getTime();
        const diffSecs = Math.max(0, Math.floor((end - now) / 1000));

        if (diffSecs > 0) {
          setFlashSale(sale);
          setRemainingSeconds(diffSecs);
          return;
        }
      }
      setFlashSale(null);
      setRemainingSeconds(0);
    } catch {
      setFlashSale(null);
      setRemainingSeconds(0);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshFlashSale();
  }, [refreshFlashSale]);

  // Live countdown timer ticking every second
  useEffect(() => {
    if (!flashSale || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFlashSale(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale, remainingSeconds]);

  const countdown = useMemo(() => {
    if (remainingSeconds <= 0) {
      return { hours: '00', minutes: '00', seconds: '00' };
    }
    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    const s = remainingSeconds % 60;
    return {
      hours: String(h).padStart(2, '0'),
      minutes: String(m).padStart(2, '0'),
      seconds: String(s).padStart(2, '0'),
      totalHours: h
    };
  }, [remainingSeconds]);

  const isLive = Boolean(flashSale && remainingSeconds > 0 && flashSale.isActive);
  const discountPercent = isLive ? (flashSale.discountPercent || 20) : 0;

  const isBookInFlashSale = useCallback((bookId) => {
    if (!isLive) return false;
    // If bookIds is empty or contains 'all', then ALL books qualify
    if (!flashSale.bookIds || flashSale.bookIds.length === 0) return true;
    return flashSale.bookIds.some((id) => String(id) === String(bookId));
  }, [isLive, flashSale]);

  const getDiscountedPrice = useCallback((book) => {
    if (!book || !isBookInFlashSale(book.id)) return null;
    const basePrice = Number(book.price) || 0;
    if (basePrice <= 0) return null;

    const discountAmount = Math.round(basePrice * (discountPercent / 100));
    const salePrice = Math.max(1, basePrice - discountAmount);

    return {
      salePrice,
      originalPrice: basePrice,
      discountPercent,
      savings: discountAmount
    };
  }, [isBookInFlashSale, discountPercent]);

  const value = {
    flashSale,
    isLive,
    discountPercent,
    countdown,
    remainingSeconds,
    refreshFlashSale,
    isBookInFlashSale,
    getDiscountedPrice
  };

  return (
    <FlashSaleContext.Provider value={value}>
      {children}
    </FlashSaleContext.Provider>
  );
}

export function useFlashSale() {
  return useContext(FlashSaleContext);
}
