import type { Metadata, Viewport } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Rapide', template: '%s | Rapide' },
  description: 'Rapide - La plateforme de livraison premium au Benin. Livraison rapide, service fiable.',
  keywords: ['livraison', 'Benin', 'Cotonou', 'Rapide', 'delivery', 'moto', 'express'],
  authors: [{ name: 'Rapide Team' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'Rapide',
    title: 'Rapide - Livraison Premium au Benin',
    description: 'Livraison rapide et fiable partout au Benin.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#149a85',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
