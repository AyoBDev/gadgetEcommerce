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

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function formatNaira(kobo: number): string {
  return NAIRA_FORMATTER.format(koboToNaira(kobo));
}
