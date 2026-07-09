import { formatNaira } from '@/lib/money';

/** Builds a wa.me deep link with a pre-filled message. Safe for client + server. */
export function buildWhatsAppLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildInquiryMessage(args: { title: string; price: number; url: string }): string {
  return `Hi, I'm interested in the ${args.title} (${formatNaira(args.price)}) — ${args.url}`;
}

export function buildAddonWhatsAppMessage(args: {
  title: string;
  price: number;
  url: string;
  addonName: string;
  addonPrice: number;
}): string {
  return `Hi, I'd like the ${args.title} (${formatNaira(args.price)}) plus the ${args.addonName} (+${formatNaira(args.addonPrice)}) — ${args.url}`;
}
