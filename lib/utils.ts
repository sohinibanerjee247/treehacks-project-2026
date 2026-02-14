/**
 * Small utilities. Add formatters, validators, etc. here.
 */

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatMoney(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

export function formatOdds(cents: number): string {
  return cents + "¢";
}
