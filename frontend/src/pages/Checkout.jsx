import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  ShoppingCart,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Download,
  BookOpen,
  Check,
  AlertCircle,
  Phone,
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import { createOrder } from '../services/api';
import { API_BASE_URL, authHeader } from '../services/api/client';

// Poll payment status from backend
async function pollPaymentStatus(paymentId, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/payments/status/${paymentId}`, {
      headers: { ...authHeader(token) },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.payment;
  } catch {
    return null;
  }
}

// ── Phone number normalization ─────────────────────────────────────────────────
function validateKenyanPhone(input) {
  const digits = input.trim().replace(/\D/g, '');
  if (!digits) return { valid: false, error: 'Phone number is required' };
  if (digits.startsWith('254') && digits.length === 12)
    return { valid: true, clean: digits };
  if ((digits.startsWith('07') || digits.startsWith('01')) && digits.length === 10)
    return { valid: true, clean: '254' + digits.substring(1) };
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9)
    return { valid: true, clean: '254' + digits };
  return { valid: false, error: 'Enter a valid Kenyan number (e.g. 0712 345 678)' };
}

// ── Shared page wrapper ────────────────────────────────────────────────────────
function PageWrap({ children }) {
  return (
    <div className="min-h-[80vh] bg-slate-50/50 flex items-center justify-center p-4 py-12">
      {children}
    </div>
  );
}

/**
 * Clean checkout progress tracker — no "Step N" jargon.
 * stage: 1 = phone entry, 2 = sending, 3 = approve on phone, 4 = done
 */
function CheckoutProgress({ stage }) {
  const steps = [
    { label: 'Phone Number', icon: Phone },
    { label: 'Sending Prompt', icon: Smartphone },
    { label: 'Approve on Phone', icon: RefreshCw },
    { label: 'Payment Done', icon: Check },
  ];

  return (
    <div className="w-full max-w-md mx-auto mb-8 px-2">
      <div className="relative flex items-center justify-between">
        {/* Track bar perfectly connecting node centers */}
        <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-200 -z-0">
          <div
            className="h-full bg-[#00A651] transition-all duration-500 ease-out"
            style={{
              width:
                stage === 1
                  ? '0%'
                  : stage === 2
                  ? '33.33%'
                  : stage === 3
                  ? '66.66%'
                  : '100%',
            }}
          />
        </div>

        {steps.map((s, i) => {
          const num = i + 1;
          const done = num < stage;
          const active = num === stage;
          const Icon = s.icon;

          return (
            <div key={num} className="flex flex-col items-center gap-2 z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  done
                    ? 'bg-[#00A651] text-white shadow-sm'
                    : active
                    ? 'bg-[#00A651] text-white shadow-md ring-4 ring-[#00A651]/20 scale-110 font-bold'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {done ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      active && (num === 2 || num === 3) ? 'animate-spin' : ''
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'text-[#00A651] font-bold'
                    : done
                    ? 'text-slate-700 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Checkout Component ────────────────────────────────────────────────────
export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);

  const [pendingPaymentId, setPendingPaymentId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const startPolling = (paymentId, books) => {
    setIsPolling(true);
    setPollCount(0);
    let count = 0;
    pollIntervalRef.current = setInterval(async () => {
      count++;
      setPollCount(count);
      try {
        const payment = await pollPaymentStatus(paymentId, user?.token);
        if (!payment) return;
        if (payment.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          setIsPolling(false);
          setConfirmedReceipt(payment.mpesa_receipt_number || payment.mpesaReceipt || null);
          setPurchasedBooks(books || []);
          setOrderComplete(true);
          clearCart();
          success('Payment confirmed! Your books are ready to download.', 5000);
        } else if (payment.status === 'failed' && count >= 5) {
          clearInterval(pollIntervalRef.current);
          setIsPolling(false);
          setPaymentFailed(true);
          setFailureReason(payment.result_desc || 'Payment was cancelled or timed out.');
          error('Payment was not completed. Please try again.');
        }
        if (count >= 24) {
          clearInterval(pollIntervalRef.current);
          setIsPolling(false);
          setPaymentFailed(true);
          setFailureReason('Payment timed out without confirmation.');
        }
      } catch (pollErr) {
        console.warn('Status check notice:', pollErr.message);
      }
    }, 4500);
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
    if (phoneError) setPhoneError('');
  };

  const phoneValidation = validateKenyanPhone(phoneNumber);
  const isPhoneValid = phoneNumber.trim().length >= 9 && phoneValidation.valid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = validateKenyanPhone(phoneNumber);
    if (!val.valid) { setPhoneError(val.error); return; }
    if (!user) {
      error('Please sign in to complete your purchase');
      openAuthModal({ redirectPath: '/checkout' });
      return;
    }
    setIsProcessing(true);
    setPaymentFailed(false);
    setFailureReason('');
    try {
      const orderResult = await createOrder(
        {
          items: cart.map((item) => ({ bookId: item.id, quantity: item.quantity || 1 })),
          phoneNumber: val.clean,
          paymentMethod: 'mpesa',
        },
        user.token
      );
      const books = (orderResult.items || []).map((it) => ({
        id: it.bookId || it.book_id,
        title: it.book?.title || it.title || 'Book',
        pdfUrl: it.book?.pdfUrl || it.book?.pdf_url || null,
        coverImage: it.book?.coverImage || it.book?.cover_url || null,
      }));
      const paymentId = orderResult.payment?.paymentId;
      if (paymentId) {
        setPendingPaymentId(paymentId);
        startPolling(paymentId, books);
      } else {
        setPurchasedBooks(books);
        setOrderComplete(true);
        clearCart();
        success('Order created! Books are available in your dashboard.', 5000);
      }
    } catch (err) {
      const msg = err.message || 'Unable to send M-PESA prompt. Please verify your phone number and try again.';
      error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setPaymentFailed(false);
    setFailureReason('');
    setPendingPaymentId(null);
    setIsPolling(false);
    setPollCount(0);
  };

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (cart.length === 0 && !orderComplete && !pendingPaymentId) {
    return (
      <PageWrap>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-xl mx-auto mb-5 flex items-center justify-center bg-blue-50 text-[#1E90FF]">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Your cart is empty</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Add some books before checking out.
          </p>
          <Link to="/library">
            <button className="w-full py-3 rounded-xl text-sm font-bold bg-[#00A651] text-white hover:bg-[#008f44] transition-colors cursor-pointer">
              Browse Books
            </button>
          </Link>
        </div>
      </PageWrap>
    );
  }

  // ── Payment success ────────────────────────────────────────────────────────
  if (orderComplete) {
    return (
      <PageWrap>
        <div className="max-w-md w-full">
          <CheckoutProgress stage={4} />
          <div className="liquid-glass specular-sheen rounded-3xl border border-white/80 p-6 sm:p-8 shadow-xl text-center">
            {/* Success icon */}
            <div className="w-20 h-20 rounded-xl mx-auto mb-5 flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg,#00A651,#007A3D)' }}>
              <Check className="w-10 h-10 text-white stroke-[3]" />
            </div>

            <h1 className="text-2xl font-black text-black mb-1">Payment Confirmed!</h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Your M-Pesa payment was received. Your books are now available in your library.
            </p>

            {confirmedReceipt && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-left">
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    M-Pesa Receipt
                  </p>
                  <p className="font-mono text-sm font-extrabold text-emerald-950 mt-0.5">
                    {confirmedReceipt}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-300">
                  ✓ Verified
                </span>
              </div>
            )}

            {/* Download links */}
            <div className="space-y-3 mb-6">
              {purchasedBooks.length > 0 ? (
                purchasedBooks.map((book, i) => (
                  <a
                    key={book.id || i}
                    href={book.pdfUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className={`w-full py-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-3 px-4 bg-[#00A651] hover:bg-[#008f44] text-white font-bold transition-colors cursor-pointer ${!book.pdfUrl ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    {book.coverImage && (
                      <img src={book.coverImage} alt="" className="w-8 h-10 object-cover rounded shadow flex-shrink-0" />
                    )}
                    <span className="flex-1 text-left truncate">{book.title}</span>
                    <Download className="w-4 h-4 flex-shrink-0" />
                  </a>
                ))
              ) : (
                <Link to="/dashboard">
                  <button className="w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 bg-[#00A651] hover:bg-[#008f44] text-white font-bold transition-colors cursor-pointer">
                    <BookOpen className="w-4 h-4" /> Go to My Library
                  </button>
                </Link>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/dashboard"
                className="text-xs font-bold text-[#1E90FF] hover:underline inline-flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" /> Open My Library
              </Link>
              <Link to="/library" className="text-xs text-slate-500 hover:underline">
                Continue browsing books
              </Link>
            </div>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Payment failed ─────────────────────────────────────────────────────────
  if (paymentFailed) {
    return (
      <PageWrap>
        <div className="max-w-md w-full">
          <CheckoutProgress stage={3} />
          <div className="liquid-glass specular-sheen rounded-3xl border border-red-200/80 p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-xl mx-auto mb-5 flex items-center justify-center bg-red-50 border border-red-100 text-[#F40009]">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-black mb-2">Payment Not Completed</h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {failureReason ||
                'The M-Pesa request was cancelled or timed out. No funds were charged. Please try again.'}
            </p>
            <div className="space-y-3">
              <button
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#00A651] hover:bg-[#008f44] text-white transition-colors cursor-pointer"
                onClick={handleRetry}
              >
                Try Again
              </button>
              <Link to="/cart">
                <button className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                  Back to Cart
                </button>
              </Link>
            </div>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Awaiting M-Pesa PIN ────────────────────────────────────────────────────
  if (pendingPaymentId && isPolling) {
    const elapsed = pollCount * 5;
    const progressPct = Math.min((elapsed / 60) * 100, 100);

    return (
      <PageWrap>
        <div className="max-w-md w-full">
          <CheckoutProgress stage={3} />
          <div className="liquid-glass specular-sheen rounded-3xl border border-white/80 p-6 sm:p-8 shadow-2xl">
            {/* Animated phone icon */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="relative w-20 h-20 rounded-xl flex items-center justify-center bg-emerald-50 border-2 border-[#00A651]/30 mb-4">
                <Smartphone className="w-9 h-9 text-[#00A651]" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-[#00A651] animate-pulse" />
                </span>
              </div>

              <h1 className="text-xl font-black text-black mb-1">Check Your Phone</h1>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                An M-Pesa prompt has been sent to{' '}
                <strong className="text-slate-800 font-mono">{phoneNumber}</strong>. Enter your
                PIN to pay <strong className="text-slate-800">{formatPrice(cartTotal)}</strong>.
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00A651]" />
                  Waiting for confirmation…
                </span>
                <span className="font-mono text-slate-500">{elapsed}s</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height: 5 }}>
                <div
                  className="h-full bg-[#00A651] rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-5">
              <span className="text-xs text-emerald-800 font-medium">Amount to approve</span>
              <span className="text-base font-extrabold text-[#00A651]">{formatPrice(cartTotal)}</span>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer py-1.5 text-center font-semibold"
            >
              Cancel / Change phone number
            </button>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Main checkout form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1E90FF] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>

        {/* Checkout progress flow */}
        <CheckoutProgress stage={isProcessing ? 2 : 1} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT: Payment Form ── */}
          <div className="lg:col-span-7">
            <div className="liquid-glass specular-sheen rounded-2xl overflow-hidden shadow-md border border-white/80">
              {/* M-Pesa header */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #00A651 0%, #007A3D 100%)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-extrabold text-base leading-none">Lipa Na M-Pesa</p>
                    <p className="text-white/80 text-[11px] mt-1">Pay directly from your phone</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-white/90 text-[10px] font-bold border border-white/30 px-2.5 py-1 rounded-xl bg-white/15">
                  <ShieldCheck className="w-3 h-3" /> Secure
                </span>
              </div>

              <div className="p-6 sm:p-8">
                {/* Info blurb */}
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Enter your M-Pesa registered number. You will receive a payment prompt on your
                  phone — just enter your PIN to complete the purchase.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Phone input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        M-Pesa Phone Number
                      </label>
                      {isPhoneValid && (
                        <span className="text-xs font-semibold text-[#00A651] inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Valid
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex items-center border rounded-xl overflow-hidden bg-white transition-all ${
                        phoneError
                          ? 'border-red-400 ring-2 ring-red-100'
                          : isPhoneValid
                          ? 'border-emerald-500 ring-2 ring-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 px-3.5 py-3.5 bg-slate-50 border-r border-slate-200 flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">+254</span>
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="0712 345 678"
                        required
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3.5 text-sm bg-white text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                      />
                    </div>

                    {phoneError ? (
                      <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {phoneError}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-2">
                        Accepts numbers starting with <strong className="text-slate-600">07</strong>,{' '}
                        <strong className="text-slate-600">01</strong>, or{' '}
                        <strong className="text-slate-600">254</strong>.
                      </p>
                    )}
                  </div>

                  {/* Sending indicator */}
                  {isProcessing && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00A651] flex-shrink-0" />
                      <span className="text-sm font-medium">Sending payment request to your phone…</span>
                    </div>
                  )}

                  {/* Pay button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 bg-[#00A651] hover:bg-[#008f44] text-white transition-colors shadow-md disabled:opacity-65 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending request…</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>Pay {formatPrice(cartTotal)} with M-Pesa</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Trust row */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Lock className="w-3.5 h-3.5 text-[#00A651]" /> Encrypted & Secure
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00A651]" /> Official M-Pesa
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-[#00A651]" /> Instant Download
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="liquid-glass specular-sheen rounded-2xl p-6 shadow-md border border-white/80">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100/80 flex items-center justify-between">
                <span>Your Order</span>
                <span className="text-xs text-slate-400 font-normal">
                  {cart.length} item{cart.length === 1 ? '' : 's'}
                </span>
              </h3>

              <div className="divide-y divide-slate-100/80 max-h-72 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-3">
                    <img
                      src={item.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-lg shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-400">by {item.author}</p>
                      <p className="text-xs font-extrabold text-slate-900 mt-0.5">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100/80 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Delivery</span>
                  <span className="text-[#00A651] font-bold">Free</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100/80">
                  <span>Total</span>
                  <span className="text-[#00A651]">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl liquid-glass-pill border border-white/80 text-xs text-slate-500 leading-relaxed shadow-xs">
              <p className="font-bold text-slate-700 mb-1">Satisfaction Guarantee</p>
              <p>
                All purchases are permanently stored in your account library. Need help? Contact us via WhatsApp any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
