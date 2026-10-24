/**
 * Chat Moderation & Anti-Fraud Service
 * Prevents scamming, off-platform redirection (WhatsApp, phone, social),
 * payment fraud (IBAN, kapora, EFT), and abusive/profane language.
 */

// Profanity / Abuse term list
const PROFANITY_LIST = [
  'amk', 'aq', 'orospu', 'piç', 'pic', 'sik', 'sikerim', 'sikeyim', 'yarrak', 'yarak',
  'oç', 'o.ç', 'göt', 'götlek', 'kahpe', 'puşt', 'pust', 'ibne', 'pezevenk', 'şerefsiz',
  'serefsiz', 'haysiyetsiz', 'aptal', 'salak', 'gerizekalı', 'gerizekali', 'ahmak', 'it'
];

// Fraud & Escrow / Bank terms
const FRAUD_KEYWORDS = [
  'kapora',
  'ön ödeme',
  'on odeme',
  'acil para',
  'para gönder',
  'para gonder',
  'havale yap',
  'eft yap',
  'fast ile gönder',
  'western union',
  'papara no',
  'kripto',
  'usdt',
  'hesap numarama at',
  'hesabıma at',
  'hesabima at'
];

// External redirection terms (encouraging leaving platform)
const REDIRECT_KEYWORDS = [
  'whatsapp',
  'wp den yaz',
  'wpden yaz',
  'wp den',
  'telegram',
  't.me/',
  'wa.me/',
  'instagramdan ekle',
  'ig den yaz',
  'insta:'
];

// Phone Number Regexes:
// 1. Matches formats like 05xx xxx xx xx, +905xxxxxxxxx, (05xx) xxx-xx-xx
const PHONE_REGEX = /(?:\+?90|0)?\s*\(?5[0-9]{2}\)?[\s\.-]*[0-9]{3}[\s\.-]*[0-9]{2}[\s\.-]*[0-9]{2}/;

// 2. Continuous 10 or 11 digits starting with 05 or 5
const RAW_PHONE_REGEX = /(?:05|5)[0-9]{9}\b/;

// 3. Spaced out phone evasion: e.g. "0 5 3 2 1 2 3 4 5 6 7"
const SPATIAL_DIGITS_REGEX = /(?:0\s*5|5)\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]/;

// IBAN Regex: TR followed by 24 digits (with optional spaces)
const IBAN_REGEX = /TR\s*[0-9]{2}\s*(?:[0-9]{4}\s*){5}[0-9]{2}/i;

// URL Regex (phishing or external links)
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(?:com|net|org|xyz|tk|me|site|link|info)[^\s]*)/i;

export interface ModerationCheckResult {
  isValid: boolean;
  reason?: string;
  category?: 'PHONE' | 'IBAN' | 'FRAUD' | 'PROFANITY' | 'LINK' | 'REDIRECT';
}

/**
 * Normalizes text for better keyword and evasion detection.
 */
function normalizeForModeration(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c');
}

/**
 * Evaluates whether a chat message is allowed to be sent.
 */
export function validateChatMessage(text: string): ModerationCheckResult {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      reason: 'Mesaj içeriği boş olamaz.',
    };
  }

  // 0. Character limit & ReDoS prevention (max 1000 chars)
  if (text.trim().length > 1000) {
    return {
      isValid: false,
      reason: 'Mesajınız çok uzun. Bir mesajda en fazla 1.000 karakter gönderebilirsiniz.',
    };
  }

  const cleanText = text.trim();
  const normalized = normalizeForModeration(cleanText);

  // 1. Check IBAN
  if (IBAN_REGEX.test(cleanText) || normalized.includes('iban:') || normalized.includes('iban no')) {
    return {
      isValid: false,
      category: 'IBAN',
      reason: 'Güvenliğiniz için sohbet üzerinden IBAN veya banka hesap bilgisi paylaşımı yapılamaz. Kapora dolandırıcılığına karşı dikkatli olunuz.',
    };
  }

  // 2. Check Fraud / Kapora Keywords
  for (const keyword of FRAUD_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return {
        isValid: false,
        category: 'FRAUD',
        reason: 'UniLive üzerinde kapora, ön ödeme veya harici para transferi talepleri yasaktır.',
      };
    }
  }

  // 3. Check External Redirection (WhatsApp / Telegram / Instagram)
  for (const term of REDIRECT_KEYWORDS) {
    if (normalized.includes(term)) {
      return {
        isValid: false,
        category: 'REDIRECT',
        reason: 'Kullanıcıları platform dışına (WhatsApp, Telegram vb.) yönlendirmek güvenlik gerekçesiyle engellenmiştir.',
      };
    }
  }

  // 4. Check Phone Numbers
  if (PHONE_REGEX.test(cleanText) || RAW_PHONE_REGEX.test(cleanText) || SPATIAL_DIGITS_REGEX.test(cleanText)) {
    return {
      isValid: false,
      category: 'PHONE',
      reason: 'Güvenliğiniz için mesajlaşma üzerinden doğrudan telefon numarası paylaşamazsınız. Tüm iletişimi UniLive içinden sürdürünüz.',
    };
  }

  // 5. Check Phishing / External URLs
  if (URL_REGEX.test(cleanText)) {
    return {
      isValid: false,
      category: 'LINK',
      reason: 'Sohbet içerisinde harici bağlantı veya link paylaşımı güvenlik nedeniyle kısıtlanmıştır.',
    };
  }

  // 6. Check Profanity / Slurs
  // Split into tokens to prevent false positives on harmless substrings
  const tokens = normalized.split(/[^a-z0-9]/).filter(Boolean);
  for (const token of tokens) {
    if (PROFANITY_LIST.includes(token)) {
      return {
        isValid: false,
        category: 'PROFANITY',
        reason: 'Mesajınız topluluk kurallarına aykırı veya uygunsuz ifadeler içerdiği için gönderilemedi.',
      };
    }
  }

  return { isValid: true };
}
