import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiLock, FiCheckCircle, FiShoppingCart,
  FiSmartphone, FiShield, FiRefreshCw, FiXCircle, FiClock,
  FiZap, FiDownload, FiStar, FiBookOpen,
} from 'react-icons/fi';

import Button from '../components/ui/Button';
import Breadcrumb from '../components/common/Breadcrumb';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import { createOrder } from '../services/api';
import { API_BASE_URL, authHeader } from '../services/api/client';

// ── Inline styles ─────────────────────────────────────────────────────────────
const styles = `
  @keyframes co-pulse-ring {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes co-spin-slow {
    to { transform: rotate(360deg); }
  }
  @keyframes co-bounce-dot {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40%            { transform: translateY(-6px); opacity: 1; }
  }
  @keyframes co-slide-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes co-success-pop {
    0%   { transform: scale(0.6); opacity: 0; }
    60%  { transform: scale(1.12); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes co-tick {
    from { stroke-dashoffset: 50; }
    to   { stroke-dashoffset: 0; }
  }

  .co-slide-up  { animation: co-slide-up 0.38s cubic-bezier(0.16,1,0.3,1) forwards; }
  .co-success   { animation: co-success-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards; }

  /* M-Pesa green pay button — solid, no gradient */
  .co-pay-btn {
    position: relative;
    background: #00A651;
    border: none !important;
    color: #fff !important;
    font-weight: 700;
    letter-spacing: 0.02em;
    transition: background 0.18s, transform 0.15s;
    cursor: pointer;
  }
  .co-pay-btn:not(:disabled):hover  { background: #008f44; transform: translateY(-1px); }
  .co-pay-btn:not(:disabled):active { transform: translateY(0); }
  .co-pay-btn:disabled { opacity: 0.65; cursor: not-allowed; }

  .co-phone-wrap:focus-within {
    border-color: #00A651 !important;
    box-shadow: 0 0 0 3px rgba(0,166,81,0.14) !important;
  }

  .co-pulse-ring {
    position: absolute; inset: -8px; border-radius: 50%;
    border: 2px solid #00A651;
    animation: co-pulse-ring 1.6s ease-out infinite;
  }
  .co-dot {
    display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #00A651;
    animation: co-bounce-dot 1.2s ease-in-out infinite;
  }
  .co-dot:nth-child(2) { animation-delay: 0.18s; }
  .co-dot:nth-child(3) { animation-delay: 0.36s; }

  /* Solid M-Pesa green progress bar */
  .co-progress-bar {
    height: 4px;
    background: #00A651;
    border-radius: 9999px;
    transition: width 1s linear;
  }

  .co-step-active  { background: #00A651; color:#fff; }
  .co-step-done    { background: #00A651; color:#fff; }
  .co-step-pending { background: #f1f5f9; color: #94a3b8; }

  .co-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }

  .co-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
    padding: 3px 10px; border-radius: 9999px;
  }

  .co-mpesa-gradient {
    background: linear-gradient(135deg, #005f2e 0%, #00a651 100%);
  }

  .co-svg-tick { stroke-dasharray: 50; animation: co-tick 0.4s 0.2s ease-out forwards; }
`;

// Poll payment status from backend
async function pollPaymentStatus(paymentId, token) {
  const res = await fetch(`${API_BASE_URL}/payments/status/${paymentId}`, {
    headers: { ...authHeader(token) },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.payment;
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['Cart', 'Payment', 'Confirm'];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done   = idx < step;
        const active = idx === step;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? 'co-step-done' : active ? 'co-step-active' : 'co-step-pending'
                }`}
              >
                {done ? <FiCheckCircle className="w-3.5 h-3.5" /> : idx}
              </div>
              <span className={`text-[10px] font-semibold ${
                active ? 'text-[#00A651]' : done ? 'text-[#00A651]' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-14 h-px mx-1 mb-4 ${done ? 'bg-[#00A651]' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrustRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-[11px] text-slate-400">
      <span className="flex items-center gap-1.5">
        <FiLock className="w-3 h-3 text-emerald-500" /> 256-bit Encrypted
      </span>
      <span className="flex items-center gap-1.5">
        <FiShield className="w-3 h-3 text-emerald-500" /> Safaricom Certified
      </span>
      <span className="flex items-center gap-1.5">
        <FiZap className="w-3 h-3 text-emerald-500" /> Instant Delivery
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  // Store purchased books for download buttons on success
  const [purchasedBooks, setPurchasedBooks] = useState([]);

  // Pending payment tracking
  const [pendingPaymentId, setPendingPaymentId] = useState(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef(null);

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
        const payment = await pollPaymentStatus(paymentId, user.token);
        if (!payment) return;

        if (payment.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          setIsPolling(false);
          setPurchasedBooks(books || []);
          setOrderComplete(true);
          clearCart();
          success('Payment confirmed! Your books are ready to download.');
        } else if (payment.status === 'failed') {
          // ⚠️ Grace period: only trust 'failed' after 40 s (8 polls × 5 s).
          // Safaricom's webhook callback can arrive up to ~30 s after PIN entry.
          // Showing "cancelled" too early causes the false-positive bug where
          // the user paid but sees a failure screen.
          if (count >= 8) {
            clearInterval(pollIntervalRef.current);
            setIsPolling(false);
            setPaymentFailed(true);
            error('Payment was not completed. You may try again.');
          }
          // Before 40 s, keep polling — the real callback may still arrive.
        }

        // Hard stop at 2 min (24 × 5 s) — show "still waiting" screen
        if (count >= 24) {
          clearInterval(pollIntervalRef.current);
          setIsPolling(false);
        }
      } catch (pollErr) {
        console.warn('Polling error:', pollErr.message);
      }
    }, 5000);
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
    if (phoneError) setPhoneError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setPhoneError('Enter your Safaricom M-PESA number to continue');
      return;
    }

    if (!user) {
      error('Please sign in to complete your purchase');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    setIsProcessing(true);
    setPaymentFailed(false);
    try {
      const orderResult = await createOrder(
        {
          items: cart.map(item => ({
            bookId: item.id,
            quantity: item.quantity || 1,
          })),
          phoneNumber: phoneNumber.trim(),
          paymentMethod: 'mpesa',
        },
        user.token
      );

      // Collect book info for download buttons shown on success
      const books = (orderResult.items || []).map(it => ({
        id: it.bookId || it.book_id,
        title: it.book?.title || it.title || 'Book',
        pdfUrl: it.book?.pdfUrl || it.book?.pdf_url || null,
        coverImage: it.book?.coverImage || it.book?.cover_url || null,
      }));

      const paymentId = orderResult.payment?.paymentId;
      if (paymentId) {
        setPendingPaymentId(paymentId);
        setPendingMessage(
          orderResult.payment?.customerMessage ||
            'M-PESA prompt sent! Enter your PIN on your phone.'
        );
        startPolling(paymentId, books);
      } else {
        setPurchasedBooks(books);
        setOrderComplete(true);
        clearCart();
        success('Order created! Books are available in your dashboard.');
      }
    } catch (err) {
      error(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setPaymentFailed(false);
    setPendingPaymentId(null);
    setPendingMessage('');
    setIsPolling(false);
    setPollCount(0);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  // ── Shared page wrapper ──────────────────────────────────────────────────────
  const PageWrap = ({ children }) => (
    <div className="min-h-[80vh] bg-white flex items-center justify-center p-4 py-12">
      <style>{styles}</style>
      {children}
    </div>
  );

  // ── Empty cart ───────────────────────────────────────────────────────────────
  if (cart.length === 0 && !orderComplete && !pendingPaymentId) {
    return (
      <PageWrap>
        <div className="max-w-sm w-full text-center co-slide-up">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#e0efff,#f0f7ff)' }}
          >
            <FiShoppingCart className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-sm text-slate-500 mb-6">
            Add books to your cart before checking out.
          </p>
          <Link to="/library">
            <button className="co-pay-btn w-full py-3 rounded-lg text-sm">Browse Library</button>
          </Link>
        </div>
      </PageWrap>
    );
  }

  // ── Payment success ──────────────────────────────────────────────────────────
  if (orderComplete) {
    return (
      <PageWrap>
        <div className="max-w-sm w-full co-slide-up">
          {/* Success icon */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative inline-flex items-center justify-center w-20 h-20">
              <div className="co-pulse-ring" style={{ animationDelay: '0s' }} />
              <div className="co-pulse-ring" style={{ animationDelay: '0.4s' }} />
              <div
                className="co-success w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00c853,#00e676)' }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path
                    className="co-svg-tick"
                    d="M8 18l7 7 13-13"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-5 mb-1 tracking-tight text-center">
              Payment Confirmed!
            </h1>
            <p className="text-sm text-slate-500 text-center">
              Tap below to download your book{purchasedBooks.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Per-book download buttons */}
          <div className="space-y-3 mb-5">
            {purchasedBooks.length > 0 ? (
              purchasedBooks.map((book, i) => (
                <a
                  key={book.id || i}
                  href={book.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className={`co-pay-btn w-full py-3.5 rounded-lg text-sm flex items-center gap-3 px-4 ${
                    !book.pdfUrl ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {book.coverImage && (
                    <img
                      src={book.coverImage}
                      alt=""
                      className="w-8 h-10 object-cover rounded flex-shrink-0"
                      style={{ opacity: 0.9 }}
                    />
                  )}
                  <span className="flex-1 text-left truncate">{book.title}</span>
                  <FiDownload className="w-4 h-4 flex-shrink-0" />
                </a>
              ))
            ) : (
              /* Fallback: no book metadata captured — send to dashboard */
              <Link to="/dashboard">
                <button className="co-pay-btn w-full py-3.5 rounded-lg text-sm flex items-center justify-center gap-2">
                  <FiBookOpen className="w-4 h-4" /> Go to My Library
                </button>
              </Link>
            )}
          </div>

          {/* M-PESA SMS reminder */}
          <div className="co-card p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FiSmartphone className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Check your <strong className="text-slate-700">M-PESA SMS</strong> for the
              payment confirmation from Safaricom.
            </p>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Payment failed ───────────────────────────────────────────────────────────
  if (paymentFailed) {
    return (
      <PageWrap>
        <div className="max-w-sm w-full text-center co-slide-up">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-50 border border-red-100">
            <FiXCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
          <p className="text-sm text-slate-500 mb-6">
            The M-PESA payment was not completed. No money was deducted.
          </p>
          <div className="space-y-2.5">
            <button
              className="co-pay-btn w-full py-3 rounded-lg text-sm"
              onClick={handleRetry}
            >
              Try Again
            </button>
            <Link to="/cart">
              <button className="w-full py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                Back to Cart
              </button>
            </Link>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Awaiting PIN ─────────────────────────────────────────────────────────────
  if (pendingPaymentId && isPolling) {
    const elapsed = pollCount * 5;
    const progressPct = Math.min((elapsed / 60) * 100, 100);
    // Which step is the user likely on based on elapsed time
    const userStep = elapsed < 8 ? 1 : elapsed < 25 ? 2 : 3;
    const paymentSteps = [
      { label: 'STK Push Sent', desc: 'M-PESA prompt delivered to your phone', done: elapsed >= 1 },
      { label: 'Enter Your PIN', desc: 'Open your phone and enter M-PESA PIN', done: elapsed >= 25 },
      { label: 'Confirming Payment', desc: 'Safaricom is processing your transaction', done: false },
    ];
    return (
      <PageWrap>
        <div className="max-w-sm w-full co-slide-up">
          {/* Header */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-emerald-50 border-2 border-[#00A651]/30">
                <FiSmartphone className="w-9 h-9 text-[#00A651]" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-[#00A651] animate-pulse" />
              </span>
            </div>
            <div className="flex gap-1.5 mt-4">
              <span className="co-dot" />
              <span className="co-dot" />
              <span className="co-dot" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-3 mb-1">Action Required on Your Phone</h1>
            <p className="text-xs text-slate-500 text-center">
              {pendingMessage || 'Check your phone — a prompt has been sent.'}
            </p>
          </div>

          {/* Live step-by-step process */}
          <div className="co-card p-4 mb-4 space-y-3">
            {paymentSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 transition-all ${
                  s.done ? 'bg-[#00A651] text-white' :
                  i + 1 === userStep ? 'border-2 border-[#00A651] text-[#00A651] bg-emerald-50' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {s.done ? <FiCheckCircle className="w-3 h-3" /> : i + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-bold ${
                    s.done ? 'text-[#00A651]' : i + 1 === userStep ? 'text-slate-900' : 'text-slate-400'
                  }`}>{s.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                </div>
                {i + 1 === userStep && !s.done && (
                  <span className="text-[10px] font-bold text-[#00A651] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0 mt-0.5">NOW</span>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="co-card p-3 mb-3">
            <div className="flex justify-between text-[11px] text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <FiRefreshCw className="w-3 h-3 animate-spin text-[#00A651]" /> Checking every 5 seconds…
              </span>
              <span className="font-mono">{elapsed}s</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full" style={{ height: 4 }}>
              <div className="co-progress-bar rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Amount reminder */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
            <span className="text-xs text-emerald-800 font-semibold">Amount to confirm</span>
            <span className="text-base font-extrabold text-[#00A651]">{formatPrice(cartTotal)}</span>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="w-full text-xs text-slate-400 hover:text-[#F40009] transition-colors cursor-pointer py-2"
          >
            Cancel payment
          </button>
        </div>
      </PageWrap>
    );
  }

  // ── Timeout / Still pending ──────────────────────────────────────────────────
  if (pendingPaymentId && !isPolling && !orderComplete && !paymentFailed) {
    return (
      <PageWrap>
        <div className="max-w-sm w-full text-center co-slide-up">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-slate-50 border border-slate-200">
            <FiClock className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Still waiting…</h1>
          <p className="text-sm text-slate-500 mb-6">
            We haven't received confirmation yet. If you entered your PIN, please check your
            library — it may already be there.
          </p>
          <div className="space-y-2.5">
            <Link to="/dashboard">
              <button className="co-pay-btn w-full py-3 rounded-lg text-sm">
                Check My Library
              </button>
            </Link>
            <button
              className="w-full py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Main checkout form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <style>{styles}</style>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-primary transition-colors mb-6"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>

        {/* Step indicator */}
        <StepIndicator step={2} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT: Payment form ─────────────────────────────────────────── */}
          <div className="lg:col-span-7 co-slide-up">
            <div className="co-card overflow-hidden">

              {/* Green header strip */}
              <div className="co-mpesa-gradient px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <FiSmartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-none">M-PESA Express</p>
                    <p className="text-white/70 text-[10px] mt-0.5">STK Push — Lipa Na M-PESA</p>
                  </div>
                </div>
                <span
                  className="co-badge text-white/90 border border-white/30"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <FiShield className="w-2.5 h-2.5" /> SECURED
                </span>
              </div>

              <div className="p-6">

                {/* How it works */}
                <div
                  className="rounded-xl p-4 mb-6 border border-slate-100"
                  style={{ background: '#f8fafc' }}
                >
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    How it works
                  </p>
                  <div className="space-y-2.5">
                    {[
                      'Enter your Safaricom M-PESA phone number below',
                      'Tap "Pay Now" — a prompt appears instantly on your phone',
                      'Enter your M-PESA PIN to confirm the payment',
                      'Your books unlock immediately in your library',
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                          style={{ background: '#00A651' }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                      M-PESA Phone Number
                    </label>

                    <div
                      className={`co-phone-wrap flex items-center border rounded-lg overflow-hidden transition-all ${
                        phoneError ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 px-3 py-3 bg-slate-50 border-r border-slate-200 flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-600">+254</span>
                      </div>
                      <input
                        id="mpesa-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="0712 345 678"
                        required
                        className="flex-1 px-3 py-3 text-sm bg-white text-slate-900 placeholder-slate-400"
                        style={{ border: 'none', outline: 'none' }}
                      />
                    </div>

                    {phoneError ? (
                      <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                        <FiXCircle className="w-3 h-3" /> {phoneError}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Registered Safaricom number. You will receive a prompt for{' '}
                        <strong className="text-slate-700">{formatPrice(cartTotal)}</strong>.
                      </p>
                    )}
                  </div>

                  {/* Pay button */}
                  <button
                    id="pay-now-btn"
                    type="submit"
                    disabled={isProcessing}
                    className="co-pay-btn w-full py-4 rounded-lg text-sm flex items-center justify-center gap-2.5"
                  >
                    {isProcessing ? (
                      <>
                        <span
                          className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                          style={{ animation: 'co-spin-slow 0.8s linear infinite' }}
                        />
                        Sending M-PESA Prompt…
                      </>
                    ) : (
                      <>
                        <FiSmartphone className="w-4 h-4" />
                        Pay {formatPrice(cartTotal)} via M-PESA
                      </>
                    )}
                  </button>
                </form>

                <TrustRow />
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order summary ───────────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="co-card p-5 sticky top-24">

              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Order Summary
                </h2>
                <span className="co-badge text-slate-500 bg-slate-100">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto -mx-1 px-1 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded-md bg-slate-100"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <FiStar className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] text-slate-400">Digital Book</span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-slate-400">× {item.quantity}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-800 flex-shrink-0">
                      {formatPrice(item.price * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Digital Delivery</span>
                  <span className="font-bold text-emerald-600">Free</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center rounded-lg px-3 py-3 bg-emerald-50 border border-emerald-100">
                  <span className="text-sm font-bold text-slate-900">Total Due</span>
                  <span className="text-xl font-extrabold text-[#00A651]">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Perks */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                {[
                  'Instant access after payment',
                  'Lifetime access — download anytime',
                  '24/7 WhatsApp support: 0112478220',
                ].map((perk) => (
                  <div key={perk} className="flex items-start gap-2">
                    <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-500">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
