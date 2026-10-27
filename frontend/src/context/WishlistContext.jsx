import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

/**
 * Returns account-isolated storage key for wishlist
 */
function getAccountWishlistKey(user) {
  if (!user) return 'wishlist_guest';
  const accountIdentifier = (user.email || user.id || '').trim().toLowerCase();
  return `wishlist_account_${accountIdentifier}`;
}

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const currentKey = getAccountWishlistKey(user);

  const [prevKey, setPrevKey] = useState(currentKey);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(currentKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // When user logs in/out, isolate wishlist to current account
  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    try {
      const saved = localStorage.getItem(currentKey);
      setWishlist(saved ? JSON.parse(saved) : []);
    } catch {
      setWishlist([]);
    }
  }

  // Persist wishlist under the current account key
  useEffect(() => {
    try {
      if (wishlist.length > 0) {
        localStorage.setItem(currentKey, JSON.stringify(wishlist));
      } else {
        localStorage.removeItem(currentKey);
      }
    } catch (e) {
      console.warn('Failed to save wishlist:', e);
    }
  }, [currentKey, wishlist]);

  // Merge guest wishlist into user account upon authentication
  useEffect(() => {
    if (user) {
      try {
        const guestWishlist = localStorage.getItem('wishlist_guest');
        if (guestWishlist) {
          const guestItems = JSON.parse(guestWishlist);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            setWishlist(prev => {
              const existingIds = new Set(prev.map(b => b.id));
              const combined = [...prev];
              guestItems.forEach(item => {
                if (!existingIds.has(item.id)) {
                  combined.push(item);
                }
              });
              return combined;
            });
          }
          localStorage.removeItem('wishlist_guest');
        }
      } catch (err) {
        console.warn('Wishlist transfer notice:', err);
      }
    }
  }, [user]);

  const isInWishlist = useCallback((bookId) => {
    if (!bookId) return false;
    return wishlist.some(b => b.id === bookId);
  }, [wishlist]);

  const addToWishlist = useCallback((book) => {
    if (!book || !book.id) return;
    setWishlist(prev => {
      if (prev.some(b => b.id === book.id)) return prev;
      return [
        {
          id: book.id,
          title: book.title,
          author: book.author,
          price: book.price,
          category: book.category,
          coverImage: book.coverImage || book.cover_url,
          rating: book.rating || 4.8,
          addedAt: new Date().toISOString()
        },
        ...prev
      ];
    });
  }, []);

  const removeFromWishlist = useCallback((bookId) => {
    if (!bookId) return;
    setWishlist(prev => {
      return prev.filter(b => b.id !== bookId);
    });
  }, []);

  const toggleWishlist = useCallback((book) => {
    if (!book || !book.id) return;
    if (isInWishlist(book.id)) {
      removeFromWishlist(book.id);
    } else {
      addToWishlist(book);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    try {
      localStorage.removeItem(currentKey);
    } catch {
      // Ignore
    }
  }, [currentKey]);

  return (
    <WishlistContext.Provider value={{
      wishlist,
      wishlistCount: wishlist.length,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
      isAccountTied: Boolean(user)
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
