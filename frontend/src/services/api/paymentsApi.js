import { API_BASE_URL, authHeader } from './client';

/**
 * Fetch public payment configuration (Till number, business name, etc.)
 */
export async function getPaymentConfig() {
  try {
    const res = await fetch(`${API_BASE_URL}/payments/config`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch payment config:', err.message);
  }
  // Safe default fallback
  return {
    tillNumber: '1820548',
    storeNumber: '1352040',
    businessName: 'MidusaELibrary',
    transactionType: 'CustomerBuyGoodsOnline',
  };
}

/**
 * Validate customer M-Pesa receipt code in real time
 */
export async function validateMpesaReceipt({ orderId, receiptCode, phoneNumber }, token) {
  const res = await fetch(`${API_BASE_URL}/payments/validate-receipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
    },
    body: JSON.stringify({ orderId, receiptCode, phoneNumber }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to validate M-PESA receipt code');
  }
  return data;
}

/**
 * Poll payment status by payment ID or CheckoutRequestID
 */
export async function getPaymentStatus(paymentId, token) {
  const res = await fetch(`${API_BASE_URL}/payments/status/${paymentId}`, {
    headers: { ...authHeader(token) },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.payment;
}
