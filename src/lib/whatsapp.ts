/** Builds a wa.me deep link with a pre-filled message. Safe for client + server. */
export function buildWhatsAppLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
