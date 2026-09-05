import { validations } from 'payload';
import type { NumberFieldSingleValidation } from 'payload';

/**
 * Money is stored as integer kobo (Naira × 100).
 *
 * A fractional amount is not just untidy — `formatNaira` renders every price on
 * the storefront, so a stray decimal reaching the database used to be a
 * site-wide display hazard. Reject it at the collection boundary so bad values
 * can't be written by the REST API, a seed script, or an import.
 *
 * Delegates to Payload's built-in number validation first so `required`, `min`,
 * and `max` keep working — a custom `validate` replaces the default entirely.
 */
export const validateKobo: NumberFieldSingleValidation = (value, args) => {
  const builtIn = validations.number(value, args);
  if (builtIn !== true) return builtIn;

  // Empty optional fields are already accepted by the built-in validation.
  if (value === null || value === undefined) return true;

  if (!Number.isFinite(value)) {
    return 'Enter a valid amount in kobo.';
  }
  if (!Number.isInteger(value)) {
    return 'Amount must be a whole number of kobo (Naira × 100) — no decimals.';
  }
  return true;
};
