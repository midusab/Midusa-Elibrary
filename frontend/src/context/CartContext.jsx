import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

/**
 * Derives a deterministic, tamper-resistant account key for cart isolation
 */
function getAccountCartKey(user) {
  if (!user) return 'cart_session_guest';
  const accountIdentifier = (user.email || user.id || '').trim().toLowerCase();
  return `cart_account_${accountIdentifier}`;
}

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const currentKey = getAccountCartKey(user);

  const [prevKey, setPrevKey] = useState(currentKey);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(currentKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // When active user identity changes (login, logout, switch user):
  // Strictly isolate cart products to the active account
  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    try {
      const saved = localStorage.getItem(currentKey);
      setCart(saved ? JSON.parse(saved) : []);
    } catch {
      setCart([]);
    }
  }

  // Persist cart changes strictly under the current active account key
  useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem(currentKey, JSON.stringify(cart));
      } else {
        localStorage.removeItem(currentKey);
      }
    } catch (e) {
      console.warn('Failed to securely persist account cart:', e);
    }
  }, [currentKey, cart]);

  // Clean up guest cart data when user authenticates
  useEffect(() => {
    if (user) {
      try {
        const guestCart = localStorage.getItem('cart_session_guest');
        if (guestCart) {
          const guestItems = JSON.parse(guestCart);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            // Merge guest items securely into the user's account cart
            setCart(prev => {
              const merged = [...prev];
              guestItems.forEach(gItem => {
                const existing = merged.find(m => m.id === gItem.id);
                if (existing) {
                  existing.quantity = (existing.quantity || 1) + (gItem.quantity || 1);
                } else {
                  merged.push(gItem);
                }
              });
              return merged;
            });
          }
          // Remove guest cart so it doesn't linger
          localStorage.removeItem('cart_session_guest');
        }
      } catch (err) {
        console.warn('Cart account transfer notice:', err);
      }
    }
  }, [user]);

  const addToCart = useCallback((book) => {
    if (!book || !book.id) return;
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === book.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...book, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((bookId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== bookId));
  }, []);

  const updateQuantity = useCallback((bookId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === bookId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    try {
      localStorage.removeItem(currentKey);
    } catch {
      // Ignore
    }
  }, [currentKey]);

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      accountKey: currentKey,
      isAccountTied: Boolean(user)
    }}>
      {children}
    </CartContext.Provider>
  );
};
