
function getMpesaTimestamp() {
  const date = new Date();

  return (
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0") +
    String(date.getHours()).padStart(2, "0") +
    String(date.getMinutes()).padStart(2, "0") +
    String(date.getSeconds()).padStart(2, "0")
  );
}

async function stkPush({
  phoneNumber,
  amount,
  accountReference,
  transactionDesc,
}) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error("Missing M-Pesa STK Push configuration");
  }

  if (!Number.isInteger(amount) || amount < 1) {
    throw new Error("Amount must be a positive integer in KES");
  }

  const timestamp = getMpesaTimestamp();

  const password = Buffer.from(
    `${shortcode}${passkey}${timestamp}`
  ).toString("base64");

  const token = await getAccessToken();

  const response = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

module.exports = {
  getAccessToken,
  stkPush,
};
