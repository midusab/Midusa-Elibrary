import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowLeft, FiShield } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
  const { success } = useToast();

  const handleRemoveFromCart = (bookId, bookTitle) => {
    removeFromCart(bookId);
    success(`"${bookTitle}" removed from cart`);
  };

  const handleClearCart = () => {
    clearCart();
    success('Cart cleared');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white py-12 sm:py-20 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4">
            <FiShoppingCart className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Explore our curated collection across Self Development, Psychology, Finance, and Christianity.
          </p>
          <Link to="/library">
            <Button size="md" className="px-6 text-xs sm:text-sm font-semibold">
              Browse Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link to="/library" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-primary transition-colors mb-3">
            <FiArrowLeft className="mr-1.5 h-4 w-4" />
            Continue Browsing
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Shopping Cart ({cartCount} {cartCount === 1 ? 'book' : 'books'})
            </h1>
            <button
              onClick={handleClearCart}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-3.5">
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                <div className="flex gap-3.5 items-center min-w-0">
                  <Link to={`/book/${item.id}`} className="flex-shrink-0">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-16 h-22 object-cover rounded-xl bg-slate-100 border border-slate-100"
                    />
                  </Link>

                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-primary block truncate mb-0.5">
                      {item.category}
                    </span>
                    <Link to={`/book/${item.id}`} className="hover:text-primary transition-colors">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-slate-500 mb-1.5 truncate">By {item.author}</p>
                    <span className="text-sm font-bold text-slate-900">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1 bg-slate-50/50">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="text-slate-500 hover:text-slate-800 p-1"
                    >
                      <FiMinus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-slate-500 hover:text-slate-800 p-1"
                    >
                      <FiPlus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-sm font-extrabold text-slate-900 min-w-[80px] text-right">
                    {formatPrice(item.price * item.quantity)}
                  </span>

                  <button
                    onClick={() => handleRemoveFromCart(item.id, item.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                    title="Remove item"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary Column */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Order Summary
              </h2>

              <div className="space-y-2.5 text-xs mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="font-semibold text-slate-800">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Method</span>
                  <span className="font-semibold text-emerald-600">Instant Digital (Free)</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>

              <Link to="/checkout" className="block w-full">
                <Button size="md" className="w-full py-3 text-sm font-semibold shadow-sm">
                  Proceed to Checkout ({formatPrice(cartTotal)})
                </Button>
              </Link>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <FiShield className="text-emerald-500 w-3.5 h-3.5" />
                <span>Instant access sent directly to your account</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
