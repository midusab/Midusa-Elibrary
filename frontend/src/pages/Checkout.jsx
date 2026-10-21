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
  Sparkles
} from 'lucide-react';

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
    height: 5px;
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
    padding: 3px 10px; border-radius: 12px;
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

// ── Interactive 4-Step Indicator ──────────────────────────────────────────────
function InteractiveStepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Phone Number' },
    { num: 2, label: 'M-Pesa Prompt' },
    { num: 3, label: 'Enter PIN' },
    { num: 4, label: 'eBooks Ready' }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-2">
      <div className="flex items-center justify-between relative">
        {steps.map((step) => {
          const isDone = step.num < currentStep;
          const isActive = step.num === currentStep;

          return (
            <div key={step.num} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? 'co-step-done shadow-xs'
                    : isActive
                    ? 'co-step-active ring-4 ring-emerald-500/20 shadow-md scale-110'
                    : 'co-step-pending border border-slate-200'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.num}
              </div>
              <span
                className={`text-[11px] mt-2 font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-emerald-700'
                    : isDone
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}

        {/* Connecting Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0">
          <div
            className="h-full bg-[#00A651] transition-all duration-500"
            style={{
              width:
                currentStep === 1
                  ? '0%'
                  : currentStep === 2
                  ? '33%'
                  : currentStep === 3
                  ? '66%'
                  : '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TrustRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-[11px] text-slate-500">
      <span className="flex items-center gap-1.5 font-medium">
        <Lock className="w-3.5 h-3.5 text-emerald-600" /> Secure 256-bit Encryption
      </span>
      <span className="flex items-center gap-1.5 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified M-Pesa Checkout
      </span>
      <span className="flex items-center gap-1.5 font-medium">
        <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Instant eBook Downloads
      </span>
    </div>
  );
}

// ── Shared page wrapper ────────────────────────────────────────────────────────
function PageWrap({ children }) {
  return (
    <div className="min-h-[80vh] bg-slate-50/50 flex items-center justify-center p-4 py-12">
      <style>{styles}</style>
      {children}
    </div>
  );
}

// ── Phone number normalization helper ──────────────────────────────────────────
function validateKenyanPhone(input) {
  const digits = input.trim().replace(/\D/g, '');
  if (!digits) return { valid: false, error: 'Phone number is required' };

  if (digits.startsWith('254') && digits.length === 12) {
    return { valid: true, clean: digits };
  }
  if ((digits.startsWith('07') || digits.startsWith('01')) && digits.length === 10) {
    return { valid: true, clean: '254' + digits.substring(1) };
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return { valid: true, clean: '254' + digits };
  }
  return { valid: false, error: 'Enter a valid Kenyan number (e.g. 0712 345 678)' };
}

// ── Main Checkout Component ───────────────────────────────────────────────────
export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // STK Push state
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Purchased books metadata for direct download links
  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);

  // Pending payment tracking & polling
  const [pendingPaymentId, setPendingPaymentId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef(null);

  // Derive current step for visual 4-step progress
  // Step 1: Phone input
  // Step 2: STK initiation indicator
  // Step 3: Awaiting PIN entry
  // Step 4: Real-time confirmation success
  let currentStep = 1;
  if (orderComplete) {
    currentStep = 4;
  } else if (pendingPaymentId && isPolling) {
    currentStep = 3;
  } else if (isProcessing) {
    currentStep = 2;
  }

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
          if (count >= 5) {
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
    }, 4500);
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
    if (phoneError) setPhoneError('');
  };

  // Live validation feedback
  const phoneValidation = validateKenyanPhone(phoneNumber);
  const isPhoneValid = phoneNumber.trim().length >= 9 && phoneValidation.valid;

  // Submit STK Push
  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = validateKenyanPhone(phoneNumber);
    if (!val.valid) {
      setPhoneError(val.error);
      return;
    }

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
          items: cart.map((item) => ({
            bookId: item.id,
            quantity: item.quantity || 1,
          })),
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
        success('Order created! Books are available in your dashboard.');
      }
    } catch (err) {
      const msg =
        err.message ||
        'Unable to send M-PESA prompt. Please verify your phone number and try again.';
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
          <div className="w-16 h-16 rounded-xl mx-auto mb-5 flex items-center justify-center bg-blue-50 text-[#1E90FF]">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Your cart is empty</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Choose from our curated eBooks collection before proceeding to checkout.
          </p>
          <Link to="/library">
            <button className="co-pay-btn w-full py-3 rounded-xl text-sm font-bold shadow-md">
              Browse Library Catalog
            </button>
          </Link>
        </div>
      </PageWrap>
    );
  }

  // ── Step 4: Real-time confirmation feedback upon webhook/callback success ────
  if (orderComplete) {
    return (
      <PageWrap>
        <div className="max-w-md w-full co-slide-up">
          <InteractiveStepIndicator currentStep={4} />

          <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xl text-center">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
              <div className="co-pulse-ring" style={{ animationDelay: '0s' }} />
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25"
                style={{ background: 'linear-gradient(135deg,#00A651,#007A3D)' }}
              >
                <Check className="w-10 h-10 text-white stroke-[3]" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[#00A651] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 4: Payment Confirmed</span>
            </div>

            <h1 className="text-2xl font-black text-black mb-1 tracking-tight">
              Payment Confirmed!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Your M-Pesa payment was received successfully! Your eBooks are now permanently unlocked and ready in your library.
            </p>

            {confirmedReceipt && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-left">
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    M-PESA Confirmation Receipt
                  </p>
                  <p className="font-mono text-sm font-extrabold text-emerald-950 mt-0.5">
                    {confirmedReceipt}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                  ✓ Verified
                </span>
              </div>
            )}

            {/* Direct download and reading links */}
            <div className="space-y-3 mb-6">
              {purchasedBooks.length > 0 ? (
                purchasedBooks.map((book, i) => (
                  <a
                    key={book.id || i}
                    href={book.pdfUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className={`co-pay-btn w-full py-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-3 px-4 shadow-md ${
                      !book.pdfUrl ? 'pointer-events-none opacity-60' : ''
                    }`}
                  >
                    {book.coverImage && (
                      <img
                        src={book.coverImage}
                        alt=""
                        className="w-8 h-10 object-cover rounded shadow-2xs flex-shrink-0"
                      />
                    )}
                    <span className="flex-1 text-left truncate font-bold">{book.title}</span>
                    <Download className="w-4 h-4 flex-shrink-0" />
                  </a>
                ))
              ) : (
                <Link to="/dashboard">
                  <button className="co-pay-btn w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
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
                <BookOpen className="w-4 h-4" />
                <span>Open in My Library Dashboard</span>
              </Link>
              <Link
                to="/library"
                className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline"
              >
                Continue exploring more books
              </Link>
            </div>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Payment failed view ──────────────────────────────────────────────────────
  if (paymentFailed) {
    return (
      <PageWrap>
        <div className="max-w-md w-full co-slide-up">
          <InteractiveStepIndicator currentStep={3} />

          <div className="bg-white rounded-xl border border-red-200 p-6 sm:p-8 shadow-xl text-center">
            <div className="w-20 h-20 rounded-xl mx-auto mb-5 flex items-center justify-center bg-red-50 border border-red-100 text-[#F40009]">
              <XCircle className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-black text-black mb-2">Payment Not Completed</h1>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              {failureReason ||
                'The M-PESA payment prompt was cancelled or timed out. No funds were deducted. Please verify your phone and try again.'}
            </p>

            <div className="space-y-3">
              <button
                className="co-pay-btn w-full py-3.5 rounded-xl text-sm font-bold shadow-md"
                onClick={handleRetry}
              >
                Try Again with M-PESA
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

  // ── Step 3: Awaiting PIN prompt completion ──────────────────────────────────
  if (pendingPaymentId && isPolling) {
    const elapsed = pollCount * 5;
    const progressPct = Math.min((elapsed / 60) * 100, 100);
    const userStep = elapsed < 8 ? 1 : elapsed < 25 ? 2 : 3;

    const realTimeSteps = [
      {
        label: 'Prompt Sent to Your Phone',
        desc: `Payment request sent to ${phoneNumber}`,
        done: elapsed >= 1
      },
      {
        label: 'Enter Your M-Pesa PIN',
        desc: 'Look at your mobile screen, input your 4-digit PIN, and press OK',
        done: elapsed >= 25
      },
      {
        label: 'Confirming Payment',
        desc: 'Verifying your payment and preparing your eBooks...',
        done: false
      }
    ];

    return (
      <PageWrap>
        <div className="max-w-md w-full co-slide-up">
          <InteractiveStepIndicator currentStep={3} />

          <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xl">
            {/* Header */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-emerald-50 border-2 border-[#00A651]/30">
                  <Smartphone className="w-9 h-9 text-[#00A651]" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-[#00A651] animate-pulse" />
                </span>
              </div>

              <div className="flex gap-1.5 mt-4">
                <span className="co-dot" />
                <span className="co-dot" />
                <span className="co-dot" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[#00A651] text-xs font-bold uppercase tracking-wider mt-3 mb-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Step 3: Enter Your M-Pesa PIN</span>
              </div>

              <h1 className="text-xl font-black text-black mt-2 mb-1">
                Check Your Phone Screen
              </h1>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                An M-PESA prompt has been sent to{' '}
                <strong className="text-slate-800 font-mono">{phoneNumber}</strong>. Please enter
                your PIN to authorize <strong className="text-slate-800">{formatPrice(cartTotal)}</strong>.
              </p>
            </div>

            {/* Live step-by-step progress */}
            <div className="co-card p-4 mb-4 space-y-3 bg-slate-50/60 border border-slate-100">
              {realTimeSteps.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 transition-all ${
                      s.done
                        ? 'bg-[#00A651] text-white'
                        : i + 1 === userStep
                        ? 'border-2 border-[#00A651] text-[#00A651] bg-emerald-50'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {s.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-xs font-bold ${
                        s.done
                          ? 'text-[#00A651]'
                          : i + 1 === userStep
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                  {i + 1 === userStep && !s.done && (
                    <span className="text-[10px] font-extrabold text-[#00A651] bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300 flex-shrink-0 mt-0.5">
                      ACTIVE
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="co-card p-3 mb-4 border border-slate-100">
              <div className="flex justify-between text-[11px] text-slate-500 mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00A651]" /> Listening for
                  PIN authorization…
                </span>
                <span className="font-mono text-slate-600 font-bold">{elapsed}s</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height: 5 }}>
                <div
                  className="co-progress-bar rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Amount banner */}
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
              <span className="text-xs text-emerald-800 font-medium">Total to approve</span>
              <span className="text-base font-extrabold text-[#00A651]">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer py-1.5 text-center font-semibold"
            >
              Cancel / Change Phone Number
            </button>
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Step 1 & 2: Phone Number Entry & STK Push Initiation ────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <style>{styles}</style>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1E90FF] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>

        {/* 4-Step Visual Indicator */}
        <InteractiveStepIndicator currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT: Payment Form (STK Push Only) ── */}
          <div className="lg:col-span-7 co-slide-up">
            <div className="co-card overflow-hidden shadow-sm">
              {/* Green header strip */}
              <div className="co-mpesa-gradient px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
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
                  <ShieldCheck className="w-3 h-3" /> SECURE CHECKOUT
                </span>
              </div>

              <div className="p-6 sm:p-8">
                {/* Step 1 Visual Status Banner */}
                <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1E90FF] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Step 1: Phone Number Entry &amp; Validation
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Enter your active Safaricom M-PESA number. You will receive an instant prompt on your phone to complete payment.
                    </p>
                  </div>
                </div>

                {/* STK Push Phone Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        M-PESA Phone Number
                      </label>
                      {isPhoneValid && (
                        <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Valid Kenyan Number
                        </span>
                      )}
                    </div>

                    <div
                      className={`co-phone-wrap flex items-center border rounded-xl overflow-hidden transition-all bg-white ${
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
                        id="mpesa-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="0712 345 678 or 0112 345 678"
                        required
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3.5 text-sm bg-white text-slate-900 placeholder-slate-400 font-medium"
                        style={{ border: 'none', outline: 'none' }}
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

                  {/* Step 2 Indicator (When Submitting / Initiating) */}
                  {isProcessing && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center animate-in fade-in duration-200">
                      <div className="flex items-center justify-center gap-2 mb-1 text-emerald-800 font-bold text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#00A651]" />
                        <span>Step 2: Sending Prompt to Phone…</span>
                      </div>
                      <p className="text-xs text-emerald-700">
                        Sending M-Pesa prompt to your phone. Please keep this window open.
                      </p>
                    </div>
                  )}

                  {/* Pay button */}
                  <button
                    id="pay-now-btn"
                    type="submit"
                    disabled={isProcessing}
                    className="co-pay-btn w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20 active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Sending Prompt to Phone…</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 text-white" />
                        <span>Pay {formatPrice(cartTotal)} with M-PESA</span>
                      </>
                    )}
                  </button>
                </form>

                <TrustRow />
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="co-card p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs text-slate-500 font-normal">{cart.length} item{cart.length === 1 ? '' : 's'}</span>
              </h3>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-3">
                    <img
                      src={
                        item.coverImage ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'
                      }
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded shadow-2xs flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-400">by {item.author}</p>
                      <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Delivery</span>
                  <span className="text-emerald-600 font-bold">FREE (eBook)</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Due</span>
                  <span className="text-[#00A651]">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-500 space-y-1.5 shadow-2xs">
              <p className="font-bold text-slate-700">Satisfaction &amp; Safety Guarantee</p>
              <p className="leading-relaxed">
                All purchases are backed by permanent account library storage. If you encounter any issue, customer support is available 24/7 via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
