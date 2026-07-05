import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Box from '@mui/material/Box';
import { ThemeRegistry } from '@/components/ThemeRegistry';
import { TopNavBar } from '@/components/TopNavBar';
import { TrustBanner } from '@/components/TrustBanner';
import { Footer } from '@/components/Footer';
import { WhatsAppFab } from '@/components/WhatsAppButton';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Certified Preowned Laptops in Nigeria | Jaysmart',
    template: '%s | Jaysmart',
  },
  description: '300+ tested preowned laptops with 7-day warranty. Nationwide delivery across Nigeria.',
};

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={inter.variable}>
      <body>
        <ThemeRegistry>
          <TopNavBar />
          <Box sx={{ pt: 10 }}>
            <TrustBanner />
            <main>{children}</main>
            <Footer />
          </Box>
          <WhatsAppFab />
        </ThemeRegistry>
      </body>
    </html>
  );
}
