import { SUSPICIOUS_KEYWORDS } from '@/config/constants';

export interface ModerationResult {
  riskScore: number;
  detectedKeywords: string[];
  requiresAdminReview: boolean;
}

/**
 * Calculates a risk score (0 - 100) for a listing based on description and title.
 */
export function evaluateListingRisk(title: string, description: string): ModerationResult {
  const combinedText = `${title} ${description}`.toLowerCase();
  const detectedKeywords: string[] = [];

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      detectedKeywords.push(keyword);
    }
  }

  let riskScore = 0;
  if (detectedKeywords.length > 0) {
    // Each suspicious keyword adds 35 points, capped at 100
    riskScore = Math.min(100, detectedKeywords.length * 35);
  }

  return {
    riskScore,
    detectedKeywords,
    requiresAdminReview: riskScore >= 50,
  };
}
