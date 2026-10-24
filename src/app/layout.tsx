import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL || 'https://unilive.app'),
  title: 'UNILIVE — Öğrenciden Öğrenciye Güvenli ve Ekonomik Kampüs Yaşamı',
  description:
    'Üniversite öğrencileri için kiralık ev, oda, ev arkadaşı ve ikinci el eşya platformu. Kampüsüne yakın ilanları keşfet, doğrulanmış öğrencilerle iletişime geç.',
  keywords: [
    'öğrenci evi',
    'kiralık oda',
    'ev arkadaşı',
    'ikinci el eşya',
    'İTÜ kiralık ev',
    'Kadıköy öğrenci evi',
    'UNILIVE',
  ],
  openGraph: {
    title: 'UNILIVE — Kampüs Yaşamı & Öğrenci İlan Platformu',
    description: 'Öğrenciden öğrenciye güvenli kampüs pazaryeri. Evini bul, ev arkadaşını seç, eşyaları uygun fiyata güvenle al.',
    siteName: 'UNILIVE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNILIVE — Kampüs Yaşamı & Öğrenci İlan Platformu',
    description: 'Öğrenciden öğrenciye güvenli ve ekonomik kampüs yaşamı.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className="bg-slate-50 text-slate-900 flex flex-col min-h-screen antialiased selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
