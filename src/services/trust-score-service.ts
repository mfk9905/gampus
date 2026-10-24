import { prisma } from '@/lib/db/prisma';

export interface TrustScoreBreakdown {
  totalScore: number;
  studentVerifiedPoints: number;
  phoneVerifiedPoints: number;
  reviewPoints: number;
  transactionPoints: number;
  accountAgePoints: number;
  reviewCount: number;
  averageRating: number;
}

/**
 * Calculates UNILIVE Trust Score 2.0 (0 to 100) for a user.
 */
export async function calculateTrustScore(userId: string): Promise<TrustScoreBreakdown> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      receivedReviews: true,
      listings: {
        where: { status: { in: ['SOLD', 'RENTED'] } },
      },
    },
  });

  if (!user) {
    return {
      totalScore: 0,
      studentVerifiedPoints: 0,
      phoneVerifiedPoints: 0,
      reviewPoints: 0,
      transactionPoints: 0,
      accountAgePoints: 0,
      reviewCount: 0,
      averageRating: 0,
    };
  }

  // 1. Student Verification (+30 pts)
  const studentVerifiedPoints = user.studentVerified ? 30 : 0;

  // 2. Phone Verification (+10 pts)
  const phoneVerifiedPoints = user.phoneVerified ? 10 : 0;

  // 3. User Reviews (+25 pts max)
  let reviewPoints = 0;
  let averageRating = 0;
  const reviewCount = user.receivedReviews.length;

  if (reviewCount > 0) {
    const sum = user.receivedReviews.reduce((acc, r) => acc + r.rating, 0);
    averageRating = sum / reviewCount;
    // Scale 1-5 rating to 25 points, weighted by review volume
    const volumeMultiplier = Math.min(1, reviewCount / 3);
    reviewPoints = Math.round((averageRating / 5) * 25 * volumeMultiplier);
  }

  // 4. Completed Transactions / Handovers (+20 pts max)
  const completedCount = user.listings.length;
  const transactionPoints = Math.min(20, completedCount * 10);

  // 5. Account Age (+7 pts max)
  const daysOld = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const accountAgePoints = Math.min(7, Math.floor(daysOld / 30) * 2 + 1);

  const totalScore = Math.min(
    100,
    studentVerifiedPoints + phoneVerifiedPoints + reviewPoints + transactionPoints + accountAgePoints
  );

  return {
    totalScore,
    studentVerifiedPoints,
    phoneVerifiedPoints,
    reviewPoints,
    transactionPoints,
    accountAgePoints,
    reviewCount,
    averageRating: parseFloat(averageRating.toFixed(1)),
  };
}
