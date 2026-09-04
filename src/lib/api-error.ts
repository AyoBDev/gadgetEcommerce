/**
 * Payload's REST layer reports validation problems as
 * `{ errors: [{ message, path }] }` and generic failures as `{ message }`.
 * Reading only the top-level `message` hides the useful field-level detail
 * (e.g. "slug must be unique"), so prefer the specific errors when present.
 */
export function formatApiError(json: unknown, fallback: string): string {
  if (!json || typeof json !== 'object') return fallback;

  const { errors, message } = json as {
    errors?: unknown;
    message?: unknown;
  };

  if (Array.isArray(errors) && errors.length > 0) {
    const parts = errors
      .map((e) => {
        if (!e || typeof e !== 'object') return null;
        const { message: m, label, path } = e as {
          message?: unknown;
          label?: unknown;
          path?: unknown;
        };
        if (typeof m !== 'string' || !m) return null;
        // Payload sends a human-readable `label` ("Price") alongside the raw
        // `path` ("price"); prefer it, and fall back to the path.
        const name =
          typeof label === 'string' && label
            ? label
            : typeof path === 'string' && path
              ? path
              : null;
        return name ? `${name}: ${m}` : m;
      })
      .filter((p): p is string => Boolean(p));
    if (parts.length > 0) return parts.join(' · ');
  }

  return typeof message === 'string' && message ? message : fallback;
}
