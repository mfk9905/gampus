export const PREMIUM_TIERS = [
  { days: 3, price: 49, label: '3 Günlük Öne Çıkar' },
  { days: 7, price: 79, label: '7 Günlük Öne Çıkar (Popüler)' },
  { days: 15, price: 149, label: '15 Günlük Öne Çıkar' },
  { days: 30, price: 249, label: '30 Günlük Öne Çıkar' },
] as const;

export const SUSPICIOUS_KEYWORDS = [
  'kapora',
  'iban',
  'acil ödeme',
  'ön ödeme',
  'kimlik gönder',
  'para gönder',
  'western union',
  'havale',
  'eft yap',
  'kredi kartı'
];
