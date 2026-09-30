/**
 * Currency formatter for Kenyan Shillings (KES / KSh)
 */
export function formatPrice(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'KSh 0';
  }

  const num = Number(amount);
  // If the number is small (e.g. legacy USD price < 100), convert to KES (~130 KES/USD)
  const kesAmount = num > 0 && num < 100 ? Math.round(num * 130) : Math.round(num);

  return `KSh ${kesAmount.toLocaleString()}`;
}
