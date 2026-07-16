import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import Box from '@mui/material/Box';
import { ThemeRegistry } from '@/components/ThemeRegistry';
import { StoreProvider } from '@/components/StoreProvider';
import { TopNavBar } from '@/components/TopNavBar';
import { TrustBanner } from '@/components/TrustBanner';
import { Footer } from '@/components/Footer';
import { WhatsAppFab } from '@/components/WhatsAppButton';
import { getSettings, resolveWhatsAppNumber } from '@/lib/settings';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Certified UK Used Laptops in Nigeria | Jaysmart',
    template: '%s | Jaysmart',
  },
  description: '300+ tested UK used laptops with 7-day warranty. Nationwide delivery across Nigeria.',
};

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const whatsappNumber = resolveWhatsAppNumber(settings);

  return (
    <html lang="en-NG" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </head>
      <body>
        <ThemeRegistry>
          <StoreProvider>
            <TopNavBar whatsappNumber={whatsappNumber} />
            <Box sx={{ pt: 10 }}>
              <TrustBanner />
              <main>{children}</main>
              <Footer settings={settings} />
            </Box>
            <WhatsAppFab whatsappNumber={whatsappNumber} />
          </StoreProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
