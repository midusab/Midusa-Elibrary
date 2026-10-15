import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiLock, FiCheckCircle, FiShoppingCart,
  FiSmartphone, FiShield, FiRefreshCw, FiXCircle, FiClock,
  FiZap, FiDownload, FiStar, FiBookOpen, FiCopy, FiCheck,
  FiTag, FiChevronDown, FiChevronUp, FiAlertCircle
} from 'react-icons/fi';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import { createOrder, getPaymentConfig, validateMpesaReceipt } from '../services/api';
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
        <FiZap className="w-3 h-3 text-emerald-500" /> Instant Real-Time Delivery
      </span>
    </div>
  );
}

// ── Shared page wrapper (declared outside render) ───────────────────────────
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

  // Payment configuration (Till Number & Business name)
  const [paymentConfig, setPaymentConfig] = useState({
    tillNumber: '1820548',
    storeNumber: '1352040',
    businessName: 'MidusaELibrary',
    transactionType: 'CustomerBuyGoodsOnline',
  });

  // Active payment mode: 'express' (STK Push) | 'till' (Manual Buy Goods)
  const [activeTab, setActiveTab] = useState('express');
  const [copiedTill, setCopiedTill] = useState(false);

  // STK Push state
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Manual Receipt Code Validation state
  const [receiptCode, setReceiptCode] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [showCodeInputInPolling, setShowCodeInputInPolling] = useState(false);

  // Purchased books metadata for download links
  const [purchasedBooks, setPurchasedBooks] = useState([]);

  // Pending payment tracking
  const [pendingPaymentId, setPendingPaymentId] = useState(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef(null);

  // Fetch dynamic payment configuration from backend
  useEffect(() => {
    let isMounted = true;
    getPaymentConfig().then((cfg) => {
      if (isMounted && cfg) {
        setPaymentConfig((prev) => ({ ...prev, ...cfg }));
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleCopyTill = () => {
    if (!paymentConfig.tillNumber) return;
    navigator.clipboard.writeText(paymentConfig.tillNumber);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2500);
  };

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
          setConfirmedReceipt(payment.mpesa_receipt_number || payment.mpesaReceipt || null);
          setPurchasedBooks(books || []);
          setOrderComplete(true);
          clearCart();
          success('Payment confirmed! Your books are ready to download.');
        } else if (payment.status === 'failed') {
          if (count >= 8) {
            clearInterval(pollIntervalRef.current);
            setIsPolling(false);
            setPaymentFailed(true);
            error('Payment was not completed. You may try again or validate via receipt code.');
          }
        }

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

  // Submit STK Push
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

      setCurrentOrderId(orderResult.id);

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
            `M-PESA prompt sent from Till ${paymentConfig.tillNumber}! Enter your PIN on your phone.`
        );
        startPolling(paymentId, books);
      } else {
        setPurchasedBooks(books);
        setOrderComplete(true);
        clearCart();
        success('Order created! Books are available in your dashboard.');
      }
    } catch (err) {
      error(err.message || 'Payment processing failed. Please try again or use the Till Number.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Real-time manual receipt validation
  const handleValidateReceipt = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = receiptCode.trim().toUpperCase();

    if (!cleanCode) {
      setReceiptError('Please enter the 10-character M-PESA code from your SMS (e.g. QA12BC34DE)');
      return;
    }

    if (!/^[A-Z0-9]{8,14}$/.test(cleanCode)) {
      setReceiptError('Invalid format. Safaricom codes are typically 10 letters/numbers (e.g. TI89ABCDEF)');
      return;
    }

    if (!user) {
      error('Please sign in to validate your purchase');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    setIsValidatingCode(true);
    setReceiptError('');

    try {
      let orderIdToUse = currentOrderId;
      let booksToUse = purchasedBooks;

      // If order not yet created, create it now in pending status
      if (!orderIdToUse) {
        const orderResult = await createOrder(
          {
            items: cart.map(item => ({
              bookId: item.id,
              quantity: item.quantity || 1,
            })),
            phoneNumber: phoneNumber.trim() || '254700000000',
            paymentMethod: 'mpesa_buygoods',
          },
          user.token
        );

        orderIdToUse = orderResult.id;
        setCurrentOrderId(orderIdToUse);

        booksToUse = (orderResult.items || []).map(it => ({
          id: it.bookId || it.book_id,
          title: it.book?.title || it.title || 'Book',
          pdfUrl: it.book?.pdfUrl || it.book?.pdf_url || null,
          coverImage: it.book?.coverImage || it.book?.cover_url || null,
        }));
      }

      const result = await validateMpesaReceipt(
        {
          orderId: orderIdToUse,
          receiptCode: cleanCode,
          phoneNumber: phoneNumber.trim(),
        },
        user.token
      );

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setIsPolling(false);
      setConfirmedReceipt(cleanCode);

      if (booksToUse && booksToUse.length > 0) {
        setPurchasedBooks(booksToUse);
      } else {
        setPurchasedBooks(
          cart.map(c => ({
            id: c.id,
            title: c.title,
            pdfUrl: c.pdfUrl || c.pdf_url,
            coverImage: c.coverImage || c.cover_url,
          }))
        );
      }

      setOrderComplete(true);
      clearCart();
      success(result.message || 'Payment validated! Your books are ready to download.');
    } catch (err) {
      setReceiptError(err.message || 'Could not validate M-PESA code. Please verify the code and try again.');
      error(err.message || 'Code validation failed');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRetry = () => {
    setPaymentFailed(false);
    setPendingPaymentId(null);
    setPendingMessage('');
    setIsPolling(false);
    setPollCount(0);
    setReceiptError('');
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

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
        <div className="max-w-md w-full co-slide-up">
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
              Your real-time M-PESA payment was validated successfully.
            </p>
          </div>

          {/* Receipt banner */}
          {confirmedReceipt && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  M-PESA Receipt
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
              <Link to="/dashboard">
                <button className="co-pay-btn w-full py-3.5 rounded-lg text-sm flex items-center justify-center gap-2">
                  <FiBookOpen className="w-4 h-4" /> Go to My Library
                </button>
              </Link>
            )}
          </div>

          {/* Dashboard link */}
          <div className="text-center mb-4">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <FiBookOpen className="w-3.5 h-3.5" /> View all your titles in My Library
            </Link>
          </div>

          {/* M-PESA SMS reminder */}
          <div className="co-card p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FiSmartphone className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Payment credited to <strong className="text-slate-700">{paymentConfig.businessName}</strong> (Till: {paymentConfig.tillNumber}). Keep your SMS receipt for your records.
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Prompt Not Completed</h1>
          <p className="text-sm text-slate-500 mb-6">
            The STK push prompt timed out or was cancelled. If you already completed payment on your phone, enter your receipt code below.
          </p>

          {/* Fallback receipt validation */}
          <div className="co-card p-4 mb-4 text-left">
            <p className="text-xs font-bold text-slate-800 mb-1">Already sent money via M-PESA?</p>
            <p className="text-[11px] text-slate-500 mb-3">
              Enter the M-PESA confirmation code from your SMS to validate immediately:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. TI89ABCDEF"
                value={receiptCode}
                onChange={(e) => {
                  setReceiptCode(e.target.value.toUpperCase());
                  setReceiptError('');
                }}
                className="flex-1 px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-[#00A651]"
              />
              <button
                type="button"
                onClick={handleValidateReceipt}
                disabled={isValidatingCode || !receiptCode.trim()}
                className="co-pay-btn px-4 py-2 rounded-lg text-xs"
              >
                {isValidatingCode ? 'Checking…' : 'Validate'}
              </button>
            </div>
            {receiptError && (
              <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {receiptError}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <button
              className="co-pay-btn w-full py-3 rounded-lg text-sm"
              onClick={handleRetry}
            >
              Try STK Push Again
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
    const userStep = elapsed < 8 ? 1 : elapsed < 25 ? 2 : 3;
    const paymentSteps = [
      { label: 'Prompt Sent from Till', desc: `Buy Goods Till ${paymentConfig.tillNumber} (${paymentConfig.businessName})`, done: elapsed >= 1 },
      { label: 'Enter Your PIN', desc: 'Check phone screen and enter your M-PESA PIN', done: elapsed >= 25 },
      { label: 'Real-Time Validation', desc: 'Validating payment with Safaricom servers', done: false },
    ];

    return (
      <PageWrap>
        <div className="max-w-md w-full co-slide-up">
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
            <h1 className="text-xl font-bold text-slate-900 mt-3 mb-1 text-center">
              Action Required on Your Phone
            </h1>
            <p className="text-xs text-slate-500 text-center">
              {pendingMessage || `Prompt sent from Till ${paymentConfig.tillNumber}! Enter your PIN.`}
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
                <FiRefreshCw className="w-3 h-3 animate-spin text-[#00A651]" /> Validating in real time…
              </span>
              <span className="font-mono">{elapsed}s</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full" style={{ height: 4 }}>
              <div className="co-progress-bar rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Amount reminder */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
            <div>
              <span className="text-[11px] text-emerald-700 block">Buy Goods Till</span>
              <span className="font-mono text-xs font-bold text-emerald-900">{paymentConfig.tillNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-700 block">Amount to confirm</span>
              <span className="text-base font-extrabold text-[#00A651]">{formatPrice(cartTotal)}</span>
            </div>
          </div>

          {/* Real-time Code Input Toggle in polling view */}
          <div className="co-card p-3.5 mb-4">
            <button
              type="button"
              onClick={() => setShowCodeInputInPolling(!showCodeInputInPolling)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
            >
              <span>Already entered PIN or paid via Till?</span>
              {showCodeInputInPolling ? <FiChevronUp className="w-4 h-4 text-slate-500" /> : <FiChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showCodeInputInPolling && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 mb-2">
                  Paste the M-PESA confirmation code from your Safaricom SMS:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. TI89ABCDEF"
                    value={receiptCode}
                    onChange={(e) => {
                      setReceiptCode(e.target.value.toUpperCase());
                      setReceiptError('');
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-[#00A651]"
                  />
                  <button
                    type="button"
                    onClick={handleValidateReceipt}
                    disabled={isValidatingCode || !receiptCode.trim()}
                    className="co-pay-btn px-4 py-2 rounded-lg text-xs"
                  >
                    {isValidatingCode ? 'Validating…' : 'Validate'}
                  </button>
                </div>
                {receiptError && (
                  <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" /> {receiptError}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="w-full text-xs text-slate-400 hover:text-[#F40009] transition-colors cursor-pointer py-2 text-center"
          >
            Cancel and try another method
          </button>
        </div>
      </PageWrap>
    );
  }

  // ── Timeout / Still pending ──────────────────────────────────────────────────
  if (pendingPaymentId && !isPolling && !orderComplete && !paymentFailed) {
    return (
      <PageWrap>
        <div className="max-w-md w-full text-center co-slide-up">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-slate-50 border border-slate-200">
            <FiClock className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Validate Your M-PESA Code</h1>
          <p className="text-sm text-slate-500 mb-6">
            If you confirmed payment on your phone, enter your M-PESA transaction code to instantly unlock your books.
          </p>

          <div className="co-card p-4 mb-5 text-left">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              M-PESA Transaction Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. TI89ABCDEF"
                value={receiptCode}
                onChange={(e) => {
                  setReceiptCode(e.target.value.toUpperCase());
                  setReceiptError('');
                }}
                className="flex-1 px-3 py-2.5 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-[#00A651]"
              />
              <button
                type="button"
                onClick={handleValidateReceipt}
                disabled={isValidatingCode || !receiptCode.trim()}
                className="co-pay-btn px-4 py-2.5 rounded-lg text-xs"
              >
                {isValidatingCode ? 'Validating…' : 'Validate & Claim'}
              </button>
            </div>
            {receiptError && (
              <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {receiptError}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <Link to="/dashboard">
              <button className="w-full py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                Check My Library
              </button>
            </Link>
            <button
              className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-2 cursor-pointer"
              onClick={handleRetry}
            >
              Start Over
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

          {/* ── LEFT: Payment Options ─────────────────────────────────────────── */}
          <div className="lg:col-span-7 co-slide-up">
            <div className="co-card overflow-hidden">

              {/* Green header strip */}
              <div className="co-mpesa-gradient px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <FiSmartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-none">Lipa Na M-PESA</p>
                    <p className="text-white/70 text-[10px] mt-0.5">
                      Buy Goods Till: <span className="font-mono font-bold text-white">{paymentConfig.tillNumber}</span>
                    </p>
                  </div>
                </div>
                <span
                  className="co-badge text-white/90 border border-white/30"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <FiShield className="w-2.5 h-2.5" /> REAL-TIME VALIDATION
                </span>
              </div>

              {/* Payment Mode Selector Tabs */}
              <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('express')}
                  className={`py-3.5 px-4 text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'express'
                      ? 'bg-white text-[#00A651] border-b-2 border-[#00A651]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FiSmartphone className="w-4 h-4" />
                  <span>M-PESA Express (STK)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('till')}
                  className={`py-3.5 px-4 text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'till'
                      ? 'bg-white text-[#00A651] border-b-2 border-[#00A651]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FiTag className="w-4 h-4" />
                  <span>Pay via Till Number</span>
                </button>
              </div>

              <div className="p-6">

                {/* TAB 1: M-PESA EXPRESS (STK Push) */}
                {activeTab === 'express' && (
                  <div>
                    {/* How it works */}
                    <div
                      className="rounded-xl p-4 mb-6 border border-slate-100"
                      style={{ background: '#f8fafc' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          How M-PESA Express Works
                        </p>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Automated
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          'Enter your Safaricom M-PESA phone number below',
                          `Prompt for ${formatPrice(cartTotal)} arrives from Till ${paymentConfig.tillNumber}`,
                          'Enter your M-PESA PIN to approve payment',
                          'Books unlock immediately in real time',
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

                    {/* STK Form */}
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
                            Prompt will be sent for{' '}
                            <strong className="text-slate-700">{formatPrice(cartTotal)}</strong> to Till{' '}
                            <strong className="font-mono text-slate-800">{paymentConfig.tillNumber}</strong>.
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
                            Send Prompt for {formatPrice(cartTotal)}
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 2: MANUAL BUY GOODS TILL NUMBER + VALIDATION */}
                {activeTab === 'till' && (
                  <div className="space-y-5">
                    {/* Branded Till Box */}
                    <div className="rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full">
                          Lipa Na M-PESA • Buy Goods
                        </span>
                        <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                          <FiShield className="w-3.5 h-3.5 text-emerald-600" />
                          {paymentConfig.businessName}
                        </span>
                      </div>

                      <div className="text-center py-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Buy Goods Till Number
                        </p>
                        <div className="inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-emerald-300 shadow-sm">
                          <span className="font-mono text-3xl font-black text-emerald-950 tracking-wider">
                            {paymentConfig.tillNumber}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyTill}
                            className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                            title="Copy Till Number"
                          >
                            {copiedTill ? (
                              <FiCheck className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <FiCopy className="w-4 h-4 text-emerald-700" />
                            )}
                          </button>
                        </div>
                        {copiedTill && (
                          <p className="text-[11px] font-bold text-emerald-700 mt-1.5 animate-fadeIn">
                            ✓ Till number copied to clipboard!
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900">
                        <span>Amount to enter:</span>
                        <span className="font-extrabold text-sm text-emerald-950">
                          {formatPrice(cartTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Step-by-step instructions */}
                    <div className="rounded-xl p-4 border border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                        Steps to Pay on Your Phone:
                      </p>
                      <ol className="space-y-2 text-xs text-slate-600">
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-emerald-600">1.</span>
                          <span>Open M-PESA menu & select <strong>Lipa na M-PESA</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-emerald-600">2.</span>
                          <span>Choose <strong>Buy Goods and Services</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-emerald-600">3.</span>
                          <span>Enter Till Number: <strong className="font-mono text-slate-900">{paymentConfig.tillNumber}</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-emerald-600">4.</span>
                          <span>Enter Amount: <strong className="text-slate-900">{formatPrice(cartTotal)}</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-emerald-600">5.</span>
                          <span>Enter your PIN & press Send. You will receive an SMS from Safaricom.</span>
                        </li>
                      </ol>
                    </div>

                    {/* Real-Time Payment Code Validation Form */}
                    <div className="co-card p-5 border-2 border-emerald-600/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Step 2: Validate Payment & Claim Books
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-4">
                        Enter the 10-character M-PESA transaction code from your SMS to validate immediately:
                      </p>

                      <form onSubmit={handleValidateReceipt} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                            M-PESA Transaction Code
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. TI89ABCDEF or QA12BC34DE"
                            value={receiptCode}
                            onChange={(e) => {
                              setReceiptCode(e.target.value.toUpperCase());
                              if (receiptError) setReceiptError('');
                            }}
                            maxLength={14}
                            required
                            className="w-full px-3.5 py-3 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20"
                          />
                        </div>

                        {receiptError && (
                          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] flex items-center gap-2">
                            <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{receiptError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isValidatingCode || !receiptCode.trim()}
                          className="co-pay-btn w-full py-3.5 rounded-lg text-sm flex items-center justify-center gap-2"
                        >
                          {isValidatingCode ? (
                            <>
                              <span
                                className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                                style={{ animation: 'co-spin-slow 0.8s linear infinite' }}
                              />
                              Validating with Safaricom…
                            </>
                          ) : (
                            <>
                              <FiCheckCircle className="w-4 h-4" />
                              Validate & Unlock Books
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

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
                  'Instant access after real-time validation',
                  'Lifetime access — download anytime',
                  `Lipa na M-PESA Till: ${paymentConfig.tillNumber}`,
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
