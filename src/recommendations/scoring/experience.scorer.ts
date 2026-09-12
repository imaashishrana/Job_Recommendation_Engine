import { DimensionScore } from './scoring.types';

/**
 * ExperienceScorer
 * Evaluates candidates based on their years of experience relative to minimum job requirements.
 * Candidates with less experience are penalized proportionally rather than excluded.
 */
export class ExperienceScorer {
  /**
   * Calculates experience score.
   * @param candidateYears Years of experience candidate possesses.
   * @param minRequiredYears Minimum years of experience required by the job.
   * @param maxWeight Maximum weight for experience dimension (default 20).
   */
  public static score(
    candidateYears: number,
    minRequiredYears: number,
    maxWeight: number = 20,
  ): DimensionScore {
    const candidateExp = Math.max(0, candidateYears || 0);
    const requiredExp = Math.max(0, minRequiredYears || 0);

    // If job has no minimum experience requirement, award full points
    if (requiredExp === 0) {
      return {
        score: maxWeight,
        max: maxWeight,
        text: `${maxWeight}/${maxWeight}`,
        explanation: `Job has no minimum experience requirement (Candidate has ${candidateExp} years).`,
      };
    }

    // Proportional calculation capped at 1.0 (100% of maxWeight)
    const ratio = Math.min(candidateExp / requiredExp, 1.0);
    const calculatedScore = Number((ratio * maxWeight).toFixed(2));

    let explanation: string;
    if (candidateExp >= requiredExp) {
      explanation = `Meets or exceeds required experience (${candidateExp} years vs ${requiredExp} years required).`;
    } else {
      explanation = `Below required experience (${candidateExp} years vs ${requiredExp} years required) - scored proportionally.`;
    }

    return {
      score: calculatedScore,
      max: maxWeight,
      text: `${calculatedScore}/${maxWeight}`,
      explanation,
    };
  }
}
