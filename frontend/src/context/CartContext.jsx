import { createContext, useContext, useState, useEffect, useRef } from 'react';
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

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  // Derive a stable, account-specific storage key based on user identity
  const userKey = user?.email ? user.email.trim().toLowerCase() : (user?.id || 'guest');
  const currentKey = `cart_user_${userKey}`;
  const currentKeyRef = useRef(currentKey);

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem(currentKey);
    return saved ? JSON.parse(saved) : [];
  });

  // When active user changes (sign in, sign out, switch account), switch to their account-specific cart
  useEffect(() => {
    currentKeyRef.current = currentKey;
    const saved = localStorage.getItem(currentKey);
    setCart(saved ? JSON.parse(saved) : []);
  }, [currentKey]);

  // Persist cart changes strictly under the current user's account key
  useEffect(() => {
    const key = currentKeyRef.current;
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (book) => {
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
  };

  const removeFromCart = (bookId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== bookId));
  };

  const updateQuantity = (bookId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === bookId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

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
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
