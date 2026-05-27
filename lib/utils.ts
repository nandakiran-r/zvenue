/**
 * Safely format a price amount to Indian locale string with ₹ symbol.
 * Returns "₹0" if the amount is null, undefined, or NaN.
 */
export function formatPrice(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}
