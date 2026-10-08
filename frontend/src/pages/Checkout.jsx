import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiCheckCircle, FiShoppingCart, FiSmartphone, FiShield } from 'react-icons/fi';
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
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
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
        paymentMethod: 'mpesa'
      }, user.token);

      setIsProcessing(false);
      setOrderComplete(true);
      clearCart();
      success('Payment successful! Your books are ready in your dashboard.');
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-5">
            <FiCheckCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mb-2">
            Thank you for your purchase. Your digital books are now unlocked and available in your dashboard.
          </p>
          <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-6">
            📱 Check your M-PESA messages for the payment confirmation SMS.
          </p>
          <div className="space-y-2.5">
            <Link to="/dashboard">
              <Button size="md" className="w-full text-xs sm:text-sm font-semibold">
                Go to My Library
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
            Instant digital delivery to your account upon M-PESA confirmation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* M-PESA Payment Form */}
          <div className="lg:col-span-7">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm">

              {/* M-Pesa Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <FiSmartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">M-PESA Express</h2>
                  <p className="text-[11px] text-slate-500">STK Push — Lipa Na M-PESA</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  Safaricom Secured
                </span>
              </div>

              {/* How It Works */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5">
                <p className="text-xs font-bold text-slate-700 mb-2.5">How it works:</p>
                <ol className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex gap-2"><span className="font-bold text-emerald-600 flex-shrink-0">1.</span> Enter your Safaricom M-PESA number below</li>
                  <li className="flex gap-2"><span className="font-bold text-emerald-600 flex-shrink-0">2.</span> Click "Pay Now" — a prompt appears on your phone</li>
                  <li className="flex gap-2"><span className="font-bold text-emerald-600 flex-shrink-0">3.</span> Enter your M-PESA PIN to confirm payment</li>
                  <li className="flex gap-2"><span className="font-bold text-emerald-600 flex-shrink-0">4.</span> Your books unlock instantly in your dashboard</li>
                </ol>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    M-PESA Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712 345 678  or  254712345678"
                    required
                    className="w-full px-3.5 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Must be a registered Safaricom number. You will receive a prompt for <span className="font-bold text-slate-700">{formatPrice(cartTotal)}</span>.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="md"
                    disabled={isProcessing}
                    className="w-full py-3.5 text-sm font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending M-PESA Prompt...
                      </span>
                    ) : (
                      `Pay ${formatPrice(cartTotal)} via M-PESA`
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FiLock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>256-bit encrypted checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiShield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Safaricom M-PESA Certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                Order Summary ({cart.length} {cart.length === 1 ? 'item' : 'items'})
              </h2>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-8 h-10 object-cover rounded-lg bg-slate-100 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                        <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 ml-2 flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
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

              {/* Trust Badges */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Instant PDF/EPUB access after payment</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Lifetime access — download anytime</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>24/7 WhatsApp support: 0112478220</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
