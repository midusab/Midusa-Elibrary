/**
 * Currency formatter for Kenyan Shillings (KES / KSh)
 */
export function formatPrice(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'KSh 0';
  }

  const num = Math.round(Number(amount));
  return `KSh ${num.toLocaleString()}`;
}
