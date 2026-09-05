const NAIRA_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export function koboToNaira(kobo: number): number {
  if (!Number.isInteger(kobo)) {
    throw new Error(`kobo must be an integer, got ${kobo}`);
  }
  return kobo / 100;
}

/**
 * Round a possibly-dirty kobo amount to a whole number.
 *
 * `price` is a plain Payload number field, so a stray decimal (or a NaN from a
 * bad import) can reach the storefront. Display must never throw over it — a
 * single odd price would take down every product card on the page.
 */
function toWholeKobo(kobo: number): number {
  return Number.isFinite(kobo) ? Math.round(kobo) : 0;
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function formatNaira(kobo: number): string {
  return NAIRA_FORMATTER.format(koboToNaira(toWholeKobo(kobo)));
}
