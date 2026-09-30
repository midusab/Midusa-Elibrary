import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowLeft } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
  const { success } = useToast();

  const handleRemoveFromCart = (bookId, bookTitle) => {
    removeFromCart(bookId);
    success(`${bookTitle} removed from cart`);
  };

  const handleUpdateQuantity = (bookId, quantity) => {
    updateQuantity(bookId, quantity);
  };

  const handleClearCart = () => {
    clearCart();
    success('Cart cleared');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 py-12 sm:py-20 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-5xl sm:text-6xl mb-4">🛒</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Your cart is empty
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8">
              Looks like you haven't added any books to your cart yet.
            </p>
            <Link to="/library">
              <Button size="lg" className="px-8">
                Browse Library
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <Link to="/library">
            <Button variant="ghost" className="mb-4">
              <FiArrowLeft className="mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  variants={fadeInUp}
                >
                  <Card className="p-4 sm:p-6 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link to={`/book/${item.id}`} className="flex-shrink-0 flex justify-center sm:block">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-28 h-40 sm:w-20 sm:h-28 object-cover rounded-xl"
                        />
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <Link to={`/book/${item.id}`}>
                              <h3 className="font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors text-base sm:text-lg">
                                {item.title}
                              </h3>
                            </Link>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.author}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.id, item.title)}
                            className="text-red-500 hover:text-red-600 p-1 transition-colors"
                            title="Remove from cart"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <FiMinus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-medium text-slate-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <FiPlus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-lg sm:text-xl font-bold text-primary">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500">
                              ${item.price} each
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {cart.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Button
                  variant="outline"
                  onClick={handleClearCart}
                  className="w-full"
                >
                  Clear Cart
                </Button>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal ({cartCount} items)</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Shipping</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Tax</span>
                    <span>${(cartTotal * 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white">
                      <span>Total</span>
                      <span className="text-primary">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Link to="/checkout">
                  <Button size="lg" className="w-full mb-4">
                    Proceed to Checkout
                  </Button>
                </Link>

                <Link to="/library">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>

                <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    🔒 Secure checkout powered by Stripe
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
