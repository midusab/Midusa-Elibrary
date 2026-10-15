import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiLock, FiCheckCircle, FiShoppingCart,
  FiSmartphone, FiShield, FiRefreshCw, FiXCircle,
  FiZap, FiDownload, FiStar, FiBookOpen
} from 'react-icons/fi';

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
  @keyframes co-tick {
    from { stroke-dashoffset: 50; }
    to   { stroke-dashoffset: 0; }
  }

  .co-slide-up { animation: co-slide-up 0.3s ease-out; }
  
  .co-mpesa-gradient {
    background: linear-gradient(135deg, #00A651 0%, #007A3D 100%);
  }

  /* M-Pesa green pay button */
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

  .co-svg-tick { stroke-dasharray: 50; animation: co-tick 0.4s 0.2s ease-out forwards; }
`;

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

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['Cart', 'M-PESA Payment', 'Instant Access'];
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
              <span className={`text-[10px] font-semibold whitespace-nowrap ${
                active ? 'text-slate-900 font-bold' : done ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-1.5 mb-4 ${
                done ? 'bg-[#00A651]' : 'bg-slate-200'
              }`} />
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
        <FiShield className="w-3 h-3 text-emerald-500" /> Official M-PESA Secure
      </span>
      <span className="flex items-center gap-1.5">
        <FiZap className="w-3 h-3 text-emerald-500" /> Instant Digital Delivery
      </span>
    </div>
  );
}

// ── Shared page wrapper ────────────────────────────────────────────────────────
function PageWrap({ children }) {
  return (
    <div className="min-h-[80vh] bg-white flex items-center justify-center p-4 py-12">
      <style>{styles}</style>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // STK Push state
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Purchased books metadata for instant download links
  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);

  // Pending payment tracking & polling
  const [pendingPaymentId, setPendingPaymentId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef(null);

  // Clean up polling interval on unmount
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
          success('Payment confirmed! Your books are ready to download.');
        } else if (payment.status === 'failed') {
          if (count >= 6) {
            clearInterval(pollIntervalRef.current);
            setIsPolling(false);
            setPaymentFailed(true);
            setFailureReason(payment.result_desc || 'Payment request was cancelled or timed out.');
            error('Payment was not completed. Please try again.');
          }
        }

        // Max poll duration: 120 seconds (24 polls * 5s)
        if (count >= 24) {
          clearInterval(pollIntervalRef.current);
          setIsPolling(false);
          setPaymentFailed(true);
          setFailureReason('Payment prompt timed out without confirmation.');
        }
      } catch (pollErr) {
        console.warn('Status check notice:', pollErr.message);
      }
    }, 5000);
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
    if (phoneError) setPhoneError('');
  };

  // Submit STK Push
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setPhoneError('Enter your M-PESA phone number to continue');
      return;
    }

    if (!user) {
      error('Please sign in to complete your purchase');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    setIsProcessing(true);
    setPaymentFailed(false);
    setFailureReason('');

    try {
      const orderResult = await createOrder(
        {
          items: cart.map(item => ({
            bookId: item.id,
            quantity: item.quantity || 1,
          })),
          phoneNumber: cleanPhone,
          paymentMethod: 'mpesa',
        },
        user.token
      );

      const books = (orderResult.items || []).map(it => ({
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
        success('Order created! Books are available in your dashboard.');
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

  // ── Empty cart view ──────────────────────────────────────────────────────────
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

  // ── Payment success view ─────────────────────────────────────────────────────
  if (orderComplete) {
    return (
      <PageWrap>
        <div className="max-w-md w-full co-slide-up">
          <div className="flex flex-col items-center mb-6">
            <div className="relative inline-flex items-center justify-center w-20 h-20">
              <div className="co-pulse-ring" style={{ animationDelay: '0s' }} />
              <div className="co-pulse-ring" style={{ animationDelay: '0.4s' }} />
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20"
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
              Your M-PESA payment was approved successfully.
            </p>
          </div>

          {confirmedReceipt && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  M-PESA Confirmation Receipt
                </p>
                <p className="font-mono text-sm font-extrabold text-emerald-950">
                  {confirmedReceipt}
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-300">
                Verified
              </span>
            </div>
          )}

          {/* Download buttons */}
          <div className="space-y-3 mb-5">
            {purchasedBooks.length > 0 ? (
              purchasedBooks.map((book, i) => (
                <a
                  key={book.id || i}
                  href={book.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className={`co-pay-btn w-full py-3.5 rounded-lg text-sm flex items-center gap-3 px-4 shadow-sm ${
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
              <Link to="/dashboard">
                <button className="co-pay-btn w-full py-3.5 rounded-lg text-sm flex items-center justify-center gap-2">
                  <FiBookOpen className="w-4 h-4" /> Go to My Library
                </button>
              </Link>
            )}
          </div>

          <div className="text-center mb-4">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <FiBookOpen className="w-3.5 h-3.5" /> View all your purchases in My Library
            </Link>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Payment failed view ──────────────────────────────────────────────────────
  if (paymentFailed) {
    return (
      <PageWrap>
        <div className="max-w-sm w-full text-center co-slide-up">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-50 border border-red-100">
            <FiXCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Not Completed</h1>
          <p className="text-sm text-slate-500 mb-6">
            {failureReason || 'The M-PESA payment prompt was cancelled or timed out. Please try again.'}
          </p>

          <div className="space-y-3">
            <button
              className="co-pay-btn w-full py-3.5 rounded-lg text-sm"
              onClick={handleRetry}
            >
              Try Again with M-PESA
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

  // ── Awaiting M-PESA PIN (STK Prompt Sent) ────────────────────────────────────
  if (pendingPaymentId && isPolling) {
    const elapsed = pollCount * 5;
    const progressPct = Math.min((elapsed / 60) * 100, 100);
    const userStep = elapsed < 8 ? 1 : elapsed < 25 ? 2 : 3;
    const paymentSteps = [
      { label: 'Prompt Sent to Phone', desc: `Payment request dispatched to ${phoneNumber}`, done: elapsed >= 1 },
      { label: 'Enter M-PESA PIN', desc: 'Look at your phone screen and enter your secret PIN', done: elapsed >= 25 },
      { label: 'Instant Access', desc: 'Confirming payment and granting book access', done: false },
    ];

    return (
      <PageWrap>
        <div className="max-w-md w-full co-slide-up">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
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
            <h1 className="text-xl font-bold text-slate-900 mt-3 mb-1 text-center">
              Check Your Phone Screen
            </h1>
            <p className="text-xs text-slate-500 text-center max-w-xs">
              An M-PESA prompt has been sent to <strong className="text-slate-800">{phoneNumber}</strong>. Please enter your PIN to approve <strong className="text-slate-800">{formatPrice(cartTotal)}</strong>.
            </p>
          </div>

          {/* Live step-by-step progress */}
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
          <div className="co-card p-3 mb-4">
            <div className="flex justify-between text-[11px] text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <FiRefreshCw className="w-3 h-3 animate-spin text-[#00A651]" /> Waiting for PIN entry…
              </span>
              <span className="font-mono text-slate-500">{elapsed}s</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full" style={{ height: 4 }}>
              <div className="co-progress-bar rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Amount banner */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
            <span className="text-xs text-emerald-800 font-medium">Total to approve</span>
            <span className="text-base font-extrabold text-[#00A651]">{formatPrice(cartTotal)}</span>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer py-2 text-center"
          >
            Cancel / Change Phone Number
          </button>
        </div>
      </PageWrap>
    );
  }

  // ── Main STK Push Checkout Form ──────────────────────────────────────────────
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

          {/* ── LEFT: Payment Form (STK Push Only) ───────────────────────────── */}
          <div className="lg:col-span-7 co-slide-up">
            <div className="co-card overflow-hidden shadow-sm">

              {/* Green header strip */}
              <div className="co-mpesa-gradient px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <FiSmartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-extrabold text-base leading-none">Lipa Na M-PESA</p>
                    <p className="text-white/80 text-[11px] mt-1 font-medium">
                      Instant PIN Checkout
                    </p>
                  </div>
                </div>
                <span
                  className="co-badge text-white/95 border border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <FiZap className="w-2.5 h-2.5" /> INSTANT ACCESS
                </span>
              </div>

              <div className="p-6">
                {/* How it works simple guide */}
                <div className="rounded-xl p-4 mb-6 border border-slate-100 bg-slate-50/70">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    How it works
                  </p>
                  <div className="space-y-2.5">
                    {[
                      'Enter your M-PESA phone number below and click Pay',
                      `A payment prompt for ${formatPrice(cartTotal)} will instantly pop up on your phone screen`,
                      'Enter your M-PESA PIN to confirm and your books unlock immediately',
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

                {/* STK Push Phone Form */}
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
                        placeholder="0712 345 678 or 0112 345 678"
                        required
                        className="flex-1 px-3 py-3 text-sm bg-white text-slate-900 placeholder-slate-400 font-medium"
                        style={{ border: 'none', outline: 'none' }}
                      />
                    </div>

                    {phoneError ? (
                      <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                        <FiXCircle className="w-3 h-3" /> {phoneError}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        A secure prompt will be sent to this phone to authorize{' '}
                        <strong className="text-slate-700">{formatPrice(cartTotal)}</strong>.
                      </p>
                    )}
                  </div>

                  {/* Pay button */}
                  <button
                    id="pay-now-btn"
                    type="submit"
                    disabled={isProcessing}
                    className="co-pay-btn w-full py-4 rounded-lg text-sm flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20"
                  >
                    {isProcessing ? (
                      <>
                        <span
                          className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                          style={{ animation: 'co-spin-slow 0.8s linear infinite' }}
                        />
                        Sending Prompt to Your Phone…
                      </>
                    ) : (
                      <>
                        <FiSmartphone className="w-4 h-4" />
                        Pay {formatPrice(cartTotal)} with M-PESA
                      </>
                    )}
                  </button>
                </form>

                <TrustRow />
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order summary ────────────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="co-card p-5 sticky top-24 shadow-sm">

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
                        <span className="text-[10px] text-slate-400">eBook</span>
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
                  <span className="font-bold text-emerald-600">Free (Instant)</span>
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
                  'Instant book unlock right after PIN confirmation',
                  'Lifetime download access from your dashboard',
                  'Encrypted & secured M-PESA payment',
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
