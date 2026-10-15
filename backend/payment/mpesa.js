const axios = require('axios');

/**
 * Safaricom Daraja M-Pesa Client Module
 */

const getBaseUrl = () => {
  return process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
};

/**
 * Format phone number to Safaricom standard: 254XXXXXXXXX
 */
function formatPhoneNumber(phone) {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // Remove all non-numeric characters (spaces, +, -, etc.)
  let cleaned = String(phone).replace(/\D/g, '');

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // e.g. 0712345678 -> 254712345678
    cleaned = '254' + cleaned.substring(1);
  } else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    // e.g. 712345678 -> 254712345678
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('254') && cleaned.length === 12) {
    // Already in correct format
  } else {
    throw new Error('Invalid Kenyan phone number format. Use format 07XXXXXXXX or 254XXXXXXXXX');
  }

  return cleaned;
}

/**
 * Generate Safaricom M-Pesa Timestamp (YYYYMMDDHHmmss)
 */
function getMpesaTimestamp() {
  const date = new Date();
  return (
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0')
  );
}

// Token cache to avoid requesting new OAuth token on every call
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtain Daraja OAuth 2.0 Access Token
 */
async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const baseUrl = getBaseUrl();

  if (!consumerKey || !consumerSecret) {
    throw new Error('Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET in environment variables');
  }

  // Return cached token if valid (with 60-second safety margin)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const response = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    if (!response.data || !response.data.access_token) {
      throw new Error('Failed to retrieve access token from Safaricom response');
    }

    cachedToken = response.data.access_token;
    // Safaricom token is typically valid for 3599 seconds (~1 hour)
    const expiresInMs = (parseInt(response.data.expires_in, 10) || 3599) * 1000;
    tokenExpiresAt = Date.now() + expiresInMs;

    return cachedToken;
  } catch (error) {
    const errorMsg = error.response?.data?.errorMessage || error.message;
    console.error('Error fetching M-Pesa access token:', errorMsg);
    throw new Error(`Safaricom OAuth error: ${errorMsg}`);
  }
}

/**
 * Trigger STK Push (Lipa Na M-Pesa Online)
 * Supports both Buy Goods (CustomerBuyGoodsOnline) and Paybill (CustomerPayBillOnline)
 */
async function stkPush({
  phoneNumber,
  amount,
  accountReference = 'Elibrary',
  transactionDesc = 'Book Purchase',
}) {
  // Support both Paybill and Buy Goods Till numbers
  const shortcode = process.env.MPESA_STORE_NUMBER || process.env.MPESA_SHORTCODE;
  const tillNumber = process.env.MPESA_TILL_NUMBER || process.env.MPESA_SHORTCODE;
  const transactionType = process.env.MPESA_TRANSACTION_TYPE || 'CustomerBuyGoodsOnline';
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  const baseUrl = getBaseUrl();

  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error('Missing M-Pesa configuration: MPESA_SHORTCODE, MPESA_PASSKEY, or MPESA_CALLBACK_URL');
  }

  const parsedAmount = Math.round(Number(amount));
  if (isNaN(parsedAmount) || parsedAmount < 1) {
    throw new Error('Amount must be a positive integer in KES (minimum KES 1)');
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const timestamp = getMpesaTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const token = await getAccessToken();

  // For Buy Goods: PartyB is the Till Number, BusinessShortCode is the Store / ShortCode
  // For Paybill: PartyB is the ShortCode
  const partyB = transactionType === 'CustomerBuyGoodsOnline' ? tillNumber : shortcode;
  // For Buy Goods STK push, AccountReference can be the Till Number or short order reference
  const accRef = transactionType === 'CustomerBuyGoodsOnline'
    ? String(accountReference || tillNumber).substring(0, 12)
    : String(accountReference || 'Elibrary').substring(0, 12);

  try {
    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: parsedAmount,
      PartyA: formattedPhone,
      PartyB: partyB,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accRef,
      TransactionDesc: String(transactionDesc).substring(0, 100),
    };

    console.log(`[M-PESA STK PUSH] Initiating ${transactionType} to ${formattedPhone} for KES ${parsedAmount} (Shortcode: ${shortcode}, PartyB: ${partyB})`);

    const response = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    return {
      success: true,
      data: response.data,
      merchantRequestId: response.data.MerchantRequestID,
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage,
      phoneNumber: formattedPhone,
      amount: parsedAmount,
      transactionType,
      tillNumber: partyB,
    };
  } catch (error) {
    const safaricomError = error.response?.data?.errorMessage || error.response?.data?.ResponseDescription || error.message;
    console.error('Error initiating STK push:', safaricomError);
    throw new Error(`M-Pesa STK Push failed: ${safaricomError}`);
  }
}

/**
 * Query status of an STK Push transaction
 */
async function stkPushQuery({ checkoutRequestId }) {
  if (!checkoutRequestId) {
    throw new Error('checkoutRequestId is required for STK Push query');
  }

  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const baseUrl = getBaseUrl();

  if (!shortcode || !passkey) {
    throw new Error('Missing MPESA_SHORTCODE or MPESA_PASSKEY');
  }

  const timestamp = getMpesaTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const token = await getAccessToken();

  try {
    const response = await axios.post(
      `${baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return {
      success: true,
      data: response.data,
      resultCode: parseInt(response.data.ResultCode, 10),
      resultDesc: response.data.ResultDesc,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.errorMessage || error.message;
    console.error('Error querying STK push status:', errorMsg);
    throw new Error(`M-Pesa query failed: ${errorMsg}`);
  }
}

/**
 * Register C2B Validation and Confirmation URLs with Safaricom Daraja
 * Needed for Buy Goods / Paybill real-time payment notifications
 */
async function registerC2BUrl({
  shortCode,
  responseType = 'Completed',
  confirmationUrl,
  validationUrl,
} = {}) {
  const baseUrl = getBaseUrl();
  const token = await getAccessToken();

  const sc = shortCode || process.env.MPESA_STORE_NUMBER || process.env.MPESA_SHORTCODE;
  if (!sc) {
    throw new Error('ShortCode is required to register C2B URLs');
  }

  // Auto-generate standard callback endpoints if not explicitly provided
  let baseCallback = process.env.MPESA_CALLBACK_URL || '';
  baseCallback = baseCallback.replace(/\/callback\/?$/, '').replace(/\/mpesa\/callback\/?$/, '');

  const confirmUrl = confirmationUrl || `${baseCallback}/c2b/confirmation`;
  const validUrl = validationUrl || `${baseCallback}/c2b/validation`;

  const payload = {
    ShortCode: sc,
    ResponseType: responseType,
    ConfirmationURL: confirmUrl,
    ValidationURL: validUrl,
  };

  console.log(`[M-PESA C2B] Registering URLs with Safaricom for Shortcode: ${sc}`, payload);

  try {
    const response = await axios.post(
      `${baseUrl}/mpesa/c2b/v1/registerurl`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    console.log('[M-PESA C2B] Register URL response:', response.data);
    return {
      success: true,
      data: response.data,
      shortCode: sc,
      confirmationUrl: confirmUrl,
      validationUrl: validUrl,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.errorMessage || error.response?.data?.ResponseDescription || error.message;
    console.error('Error registering C2B URLs with Safaricom:', errorMsg);
    throw new Error(`Failed to register C2B URLs: ${errorMsg}`);
  }
}

module.exports = {
  getAccessToken,
  stkPush,
  stkPushQuery,
  registerC2BUrl,
  formatPhoneNumber,
  getMpesaTimestamp,
};

