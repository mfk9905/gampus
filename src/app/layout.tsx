import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { env } from '@/lib/env';

const BASE_URL = (env.NEXT_PUBLIC_APP_URL || 'https://gampus.app').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'GAMPÜS — Öğrenci Evi, Kiralık Oda & Güvenli Kampüs Pazaryeri',
    template: '%s | Gampüs',
  },
  description:
    'GAMPÜS (gampus): Üniversite öğrencileri için doğrulanmış öğrenci evi, kiralık oda, ev arkadaşı ve ikinci el eşya platformu. Kampüsüne yakın ilanları keşfet, öğrencilerle güvenle iletişime geç.',
  applicationName: 'Gampüs',
  keywords: [
    'gampüs',
    'gampus',
    'gampus app',
    'gampüs app',
    'gampus öğrenci',
    'gampüs kiralık',
    'kampüs pazaryeri',
    'öğrenci evi',
    'öğrenciye kiralık oda',
    'ev arkadaşı',
    'öğrenci ev arkadaşı',
    'ikinci el öğrenci eşyası',
    'kampüs yaşamı',
    'üniversite kiralık daire',
    'kadıköy öğrenci evi',
    'beşiktaş öğrenci evi',
    'itü kiralık ev',
    'ytü ev arkadaşı',
    'marmara kiralık oda',
    'boğaziçi kiralık ev',
    'bau kiralık oda',
  ],
  authors: [{ name: 'Gampüs' }],
  creator: 'Gampüs Ekibi',
  publisher: 'Gampüs',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'GAMPÜS (gampus) — Kampüs Yaşamı & Öğrenci İlan Platformu',
    description:
      'Öğrenciden öğrenciye güvenli kampüs pazaryeri. Evini bul, ev arkadaşını seç, eşyaları güvenle al ve sat.',
    url: BASE_URL,
    siteName: 'Gampüs',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GAMPÜS (gampus) — Kampüs Yaşamı & Öğrenci İlan Platformu',
    description: 'Öğrenciden öğrenciye güvenli ve ekonomik kampüs yaşamı.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'GAMPÜS',
      alternateName: ['gampus', 'Gampus', 'gampüs', 'Gampüs App', 'gampus app', 'GAMPUS'],
      description:
        'Üniversite öğrencileri için doğrulanmış öğrenci evi, kiralık oda, ev arkadaşı ve ikinci el eşya platformu.',
      inLanguage: 'tr-TR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_URL}/explore?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'Gampüs',
      alternateName: ['gampus', 'GAMPÜS'],
      url: BASE_URL,
      logo: `${BASE_URL}/icon.png`,
      sameAs: [
        'https://instagram.com/gampusapp',
        'https://twitter.com/gampusapp',
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 flex flex-col min-h-screen antialiased selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
