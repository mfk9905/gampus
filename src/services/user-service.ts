import { prisma } from '@/lib/db/prisma';
import { hashPassword, comparePassword, createToken } from '@/lib/auth';
import { calculateDistance } from '@/lib/utils/distance';
import { sendStudentOtpEmail, sendStudentVerifiedEmail } from '@/lib/email';

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      university: true,
      listings: {
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
          _count: { select: { favorites: true, contacts: true } },
        },
      },
      favorites: {
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: {
              images: true,
              university: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  studentVerified: true,
                  phoneVerified: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: { listings: true, favorites: true },
      },
    },
  });

  if (!user) return null;

  // Format favorites with calculated distance
  const formattedFavorites = user.favorites.map((fav) => {
    let distanceKm: number | null = null;
    if (fav.listing.university && fav.listing.latitude && fav.listing.longitude) {
      distanceKm = calculateDistance(
        fav.listing.university.latitude,
        fav.listing.university.longitude,
        fav.listing.latitude,
        fav.listing.longitude
      );
    }
    return {
      ...fav,
      listing: {
        ...fav.listing,
        distanceKm,
        isFavorited: true,
      },
    };
  });

  return {
    ...user,
    favorites: formattedFavorites,
  };
}

export async function requestStudentVerificationOtp(userId: string, eduEmail: string) {
  const cleanEduEmail = eduEmail.toLowerCase().trim();
  if (!cleanEduEmail.endsWith('.edu.tr')) {
    throw new Error('Lütfen geçerli bir .edu.tr uzantılı öğrenci e-postası giriniz.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, studentVerified: true },
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı.');
  }

  if (user.studentVerified) {
    throw new Error('Hesabınız zaten onaylı öğrenci statüsündedir.');
  }

  // 6 haneli OTP kodu üret (örn: 593821)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerli

  await prisma.user.update({
    where: { id: userId },
    data: {
      studentVerifyOtp: otp,
      studentVerifyOtpExpiry: expiry,
      pendingEduEmail: cleanEduEmail,
    },
  });

  await sendStudentOtpEmail({
    to: cleanEduEmail,
    name: user.name,
    otp,
  });

  return {
    success: true,
    message: `${cleanEduEmail} adresinize 6 haneli doğrulama kodu gönderildi.`,
    devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
  };
}

export async function confirmStudentVerificationOtp(userId: string, otp: string) {
  const cleanOtp = otp.trim();
  if (!cleanOtp || cleanOtp.length !== 6) {
    throw new Error('Geçersiz doğrulama kodu. 6 haneli kodu eksiksiz giriniz.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      studentVerifyOtp: true,
      studentVerifyOtpExpiry: true,
      pendingEduEmail: true,
      studentVerified: true,
    },
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı.');
  }

  if (user.studentVerified) {
    return { success: true, message: 'Öğrenci rozetiniz zaten aktif.' };
  }

  if (!user.studentVerifyOtp || !user.studentVerifyOtpExpiry) {
    throw new Error('Aktif bir doğrulama kodu bulunamadı. Lütfen yeni kod talep ediniz.');
  }

  if (new Date() > user.studentVerifyOtpExpiry) {
    throw new Error('Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod talep ediniz.');
  }

  if (user.studentVerifyOtp !== cleanOtp) {
    throw new Error('Girdiğiniz kod hatalı. Lütfen kontrol edip tekrar deneyiniz.');
  }

  // Başarılı: Öğrenci rozetini aktif et ve kodları temizle
  await prisma.user.update({
    where: { id: userId },
    data: {
      studentVerified: true,
      studentVerifyOtp: null,
      studentVerifyOtpExpiry: null,
    },
  });

  if (user.pendingEduEmail) {
    await sendStudentVerifiedEmail({
      to: user.pendingEduEmail,
      name: user.name,
    });
  }

  return {
    success: true,
    message: 'Tebrikler! Öğrenci rozetiniz başarıyla aktifleştirildi.',
  };
}

export async function verifyStudentEmail(userId: string, eduEmail: string) {
  return await requestStudentVerificationOtp(userId, eduEmail);
}
