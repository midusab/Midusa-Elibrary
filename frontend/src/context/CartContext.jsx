import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  // Compute a secure, account-specific storage key
  const getCartKey = (u) => {
    if (u?.email) return `cart_user_${u.email.trim().toLowerCase()}`;
    if (u?.id) return `cart_user_${u.id}`;
    return 'cart_guest';
  };

  const currentKey = getCartKey(user);
  const currentKeyRef = useRef(currentKey);

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem(currentKey);
    return saved ? JSON.parse(saved) : [];
  });

  // When active user changes (sign in, sign out, switch account), switch to their account-specific cart
  useEffect(() => {
    const key = getCartKey(user);
    currentKeyRef.current = key;
    const saved = localStorage.getItem(key);
    setCart(saved ? JSON.parse(saved) : []);
  }, [user?.email, user?.id]);

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
