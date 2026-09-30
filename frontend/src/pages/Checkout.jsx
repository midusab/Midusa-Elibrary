import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiCheckCircle, FiShoppingCart } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import { createOrder } from '../services/api';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'mpesa' && !phoneNumber.trim()) {
      error('Please enter your M-PESA phone number');
      return;
    }

    if (!user) {
      error('Please sign in to complete your purchase');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    setIsProcessing(true);
    try {
      await createOrder({
        items: cart.map(item => ({
          bookId: item.id,
          quantity: item.quantity || 1
        })),
        phoneNumber: phoneNumber.trim(),
        paymentMethod
      }, user.token);

      setIsProcessing(false);
      setOrderComplete(true);
      clearCart();
      success('Payment successful! Digital books added to your dashboard.');
    } catch (err) {
      setIsProcessing(false);
      error(err.message || 'Payment processing failed. Please try again.');
    }
  };

  if (cart.length === 0 && !orderComplete) {
    return (
      <div className="min-h-[75vh] bg-white py-12 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4">
            <FiShoppingCart className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Add books to your cart before proceeding to checkout.
          </p>
          <Link to="/library">
            <Button size="md" className="px-6 text-xs sm:text-sm">Browse Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-[75vh] bg-white py-12 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-5">
            <FiCheckCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            Order Complete!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mb-6">
            Thank you for your purchase. Your digital books are now unlocked and ready to read in your dashboard.
          </p>
          <div className="space-y-2.5">
            <Link to="/dashboard">
              <Button size="md" className="w-full text-xs sm:text-sm font-semibold">
                Go to My Dashboard
              </Button>
            </Link>
            <Link to="/library">
              <Button variant="outline" size="md" className="w-full text-xs sm:text-sm">
                Continue Browsing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <Link to="/cart" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-primary transition-colors mb-3">
            <FiArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Secure Checkout
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Instant digital delivery to your account upon payment confirmation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Payment Form */}
          <div className="lg:col-span-7">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                Payment Option
              </h2>

              {/* Payment selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    paymentMethod === 'mpesa'
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block">M-PESA Express</span>
                  <span className="text-[11px] text-slate-500">STK Push to Kenyan number</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary-50/40 text-primary ring-1 ring-primary'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block">Credit / Debit Card</span>
                  <span className="text-[11px] text-slate-500">Visa, Mastercard</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {paymentMethod === 'mpesa' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      M-PESA Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="07XX XXX XXX or 2547XX XXX XXX"
                      required
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      You will receive an M-PESA prompt on your phone for {formatPrice(cartTotal)}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        required
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          required
                          className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength={4}
                          required
                          className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    size="md"
                    disabled={isProcessing}
                    className="w-full py-3 text-sm font-semibold shadow-sm"
                  >
                    {isProcessing ? 'Processing Transaction...' : `Pay ${formatPrice(cartTotal)} Now`}
                  </Button>
                </div>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <FiLock className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-bit encrypted checkout • Certified Secure</span>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="lg:col-span-5">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                Summary ({cart.length} items)
              </h2>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="max-w-[180px] truncate">
                      <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                      <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Digital Delivery</span>
                  <span className="font-semibold text-emerald-600">Free</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Due</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
