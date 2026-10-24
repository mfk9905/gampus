import { z } from 'zod';

export function sanitizeInput(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'İsim en az 2 karakter olmalıdır.')
    .max(50, 'İsim en fazla 50 karakter olabilir.')
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\.\-]+$/, 'Ad Soyad yalnızca harflerden oluşmalıdır.')
    .transform((val) => sanitizeInput(val)),
  email: z
    .string()
    .email('Geçerli bir e-posta adresi giriniz.')
    .max(100, 'E-posta en fazla 100 karakter olabilir.')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır.')
    .max(100, 'Şifre en fazla 100 karakter olabilir.'),
  phone: z
    .string()
    .regex(/^(\+90|0)?[5][0-9]{9}$|^(\+?[0-9\s-]{10,15})$/, 'Geçerli bir telefon numarası giriniz (Örn: 05321234567).')
    .max(15, 'Telefon numarası en fazla 15 karakter olabilir.')
    .optional()
    .or(z.literal('')),
  universityId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Geçerli bir e-posta adresi giriniz.')
    .max(100)
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, 'Şifre girilmesi zorunludur.').max(100, 'Şifre en fazla 100 karakter olabilir.'),
});

export const createListingSchema = z.object({
  category: z.enum(['HOUSE', 'ROOM', 'ROOMMATE', 'FURNITURE', 'HOUSE_PACKAGE']),
  title: z
    .string()
    .min(5, 'Başlık en az 5 karakter olmalıdır.')
    .max(120, 'Başlık en fazla 120 karakter olabilir.')
    .transform((val) => sanitizeInput(val)),
  description: z
    .string()
    .min(10, 'Açıklama en az 10 karakter olmalıdır.')
    .max(3000, 'Açıklama en fazla 3000 karakter olabilir.')
    .transform((val) => sanitizeInput(val)),
  price: z.number().positive('Fiyat 0\'dan büyük olmalıdır.').max(1000000, 'Geçerli bir fiyat giriniz.'),
  district: z.string().min(2, 'İlçe zorunludur.').max(50).transform((val) => sanitizeInput(val)),
  locationText: z.string().min(3, 'Konum detayı zorunludur.').max(200).transform((val) => sanitizeInput(val)),
  universityId: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  condition: z.enum(['NEW', 'GOOD', 'USED']).optional(),
  images: z.array(z.string()).min(1, 'En az 1 fotoğraf yüklemelisiniz.').max(10, 'En fazla 10 fotoğraf yükleyebilirsiniz.'),
  // Optional V2 fields
  monthlyRent: z.number().optional(),
  deposit: z.number().optional(),
  handoverDate: z.string().optional(),
  roommatesCount: z.number().optional(),
  lookingForCount: z.number().optional(),
  landlordContractStatus: z.string().optional(),
  furnitureIncluded: z.boolean().optional(),
  furniturePrice: z.number().optional(),
  allowPhoneCalls: z.boolean().optional(),
  packageItems: z.array(z.object({
    name: z.string().transform((val) => sanitizeInput(val)),
    description: z.string().optional().transform((val) => val ? sanitizeInput(val) : undefined),
    estimatedValue: z.number().optional(),
  })).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SOLD', 'RENTED', 'PASSIVE']),
});

export const updateListingSchema = createListingSchema.partial();

export const reportSchema = z.object({
  listingId: z.string(),
  reason: z.string().min(2, 'Nedeni belirtiniz.').max(100, 'Şikayet nedeni en fazla 100 karakter olabilir.'),
  description: z.string().max(1000, 'Açıklama en fazla 1000 karakter olabilir.').optional(),
});

export const savedSearchSchema = z.object({
  name: z.string().min(2, 'Arama adı en az 2 karakter olmalıdır.').max(100, 'Arama adı en fazla 100 karakter olabilir.'),
  category: z.enum(['HOUSE', 'ROOM', 'ROOMMATE', 'FURNITURE', 'HOUSE_PACKAGE']).optional().nullable(),
  universityId: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  minPrice: z.number().optional().nullable(),
  maxPrice: z.number().optional().nullable(),
  condition: z.enum(['NEW', 'GOOD', 'USED']).optional().nullable(),
});

export const reviewSchema = z.object({
  reviewedUserId: z.string(),
  listingId: z.string().optional(),
  rating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  accuracyRating: z.number().min(1).max(5),
  reliabilityRating: z.number().min(1).max(5),
  comment: z.string().max(500, 'Yorum en fazla 500 karakter olabilir.').optional(),
});

export const roommateProfileSchema = z.object({
  universityId: z.string().optional(),
  budget: z.number().optional(),
  moveInDate: z.string().optional(),
  sleepSchedule: z.string().max(100).optional(),
  cleanliness: z.string().max(100).optional(),
  smoking: z.string().max(100).optional(),
  pets: z.string().max(100).optional(),
  socialStyle: z.string().max(100).optional(),
  studyHabits: z.string().max(100).optional(),
  bio: z.string().max(1000, 'Biyografi en fazla 1000 karakter olabilir.').optional(),
});

