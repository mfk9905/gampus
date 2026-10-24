import { RoommateProfile } from '@prisma/client';

export interface MatchResult {
  matchPercentage: number;
  matchedCriteriaCount: number;
  totalCriteriaCount: number;
  details: string[];
}

/**
 * Calculates roommate lifestyle compatibility match percentage between two profiles.
 */
export function calculateRoommateMatch(
  targetProfile: Partial<RoommateProfile>,
  candidateProfile: Partial<RoommateProfile>
): MatchResult {
  let matched = 0;
  let total = 0;
  const details: string[] = [];

  // 1. Budget Overlap
  if (targetProfile.budget && candidateProfile.budget) {
    total++;
    const diff = Math.abs(targetProfile.budget - candidateProfile.budget);
    if (diff <= 1500) {
      matched++;
      details.push('Bütçe beklentileriniz uyumlu');
    }
  }

  // 2. Sleep Schedule
  if (targetProfile.sleepSchedule && candidateProfile.sleepSchedule) {
    total++;
    if (targetProfile.sleepSchedule === candidateProfile.sleepSchedule) {
      matched++;
      details.push('Uyku saatleriniz eşleşiyor');
    }
  }

  // 3. Cleanliness
  if (targetProfile.cleanliness && candidateProfile.cleanliness) {
    total++;
    if (targetProfile.cleanliness === candidateProfile.cleanliness) {
      matched++;
      details.push('Temizlik düzeniniz uyumlu');
    }
  }

  // 4. Smoking
  if (targetProfile.smoking && candidateProfile.smoking) {
    total++;
    if (targetProfile.smoking === candidateProfile.smoking) {
      matched++;
      details.push('Sigara kullanım tercihiniz aynı');
    }
  }

  // 5. Pets
  if (targetProfile.pets && candidateProfile.pets) {
    total++;
    if (targetProfile.pets === candidateProfile.pets) {
      matched++;
      details.push('Evcil hayvan yaklaşımınız uyumlu');
    }
  }

  // 6. Social Style
  if (targetProfile.socialStyle && candidateProfile.socialStyle) {
    total++;
    if (targetProfile.socialStyle === candidateProfile.socialStyle) {
      matched++;
      details.push('Sosyal yaşam tarzınız benzer');
    }
  }

  if (total === 0) {
    return {
      matchPercentage: 75,
      matchedCriteriaCount: 3,
      totalCriteriaCount: 4,
      details: ['Genel kampüs yaşam tercihleri uyumlu'],
    };
  }

  const matchPercentage = Math.round((matched / total) * 100);

  return {
    matchPercentage: Math.max(50, Math.min(99, matchPercentage)),
    matchedCriteriaCount: matched,
    totalCriteriaCount: total,
    details,
  };
}
