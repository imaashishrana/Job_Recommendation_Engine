import { DimensionScore } from './scoring.types';

/**
 * LocationScorer
 * Evaluates candidate location fit against job location and remote policy:
 * 1. Exact location match -> 100% score (15/15)
 * 2. Location mismatch with remote allowed -> ~66.7% score (10/15)
 * 3. Location mismatch with no remote allowed -> 0% score (0/15)
 */
export class LocationScorer {
  /**
   * Calculates location score.
   * @param candidateLocation City/location of the candidate.
   * @param jobLocation City/location of the job posting.
   * @param remoteAllowed Whether remote work is permitted for the job.
   * @param maxWeight Maximum weight for location dimension (default 15).
   */
  public static score(
    candidateLocation: string,
    jobLocation: string,
    remoteAllowed: boolean,
    maxWeight: number = 15,
  ): DimensionScore {
    const candLoc = (candidateLocation || '').trim().toLowerCase();
    const jLoc = (jobLocation || '').trim().toLowerCase();

    // Check for exact location match or both being 'remote'
    const isExactMatch =
      candLoc === jLoc ||
      (candLoc === 'remote' && remoteAllowed) ||
      (jLoc === 'remote' && candLoc !== '');

    if (isExactMatch) {
      return {
        score: maxWeight,
        max: maxWeight,
        text: `${maxWeight}/${maxWeight}`,
        explanation: `Exact location match (${candidateLocation || 'Unspecified'}).`,
      };
    }

    // Location mismatch but job supports remote work
    if (remoteAllowed) {
      // 10 / 15 proportional ratio
      const remoteScore = Number((maxWeight * (10 / 15)).toFixed(2));
      return {
        score: remoteScore,
        max: maxWeight,
        text: `${remoteScore}/${maxWeight}`,
        explanation: `Location mismatch (${candidateLocation} vs ${jobLocation}), but remote work is allowed.`,
      };
    }

    // Location mismatch and onsite only
    return {
      score: 0,
      max: maxWeight,
      text: `0/${maxWeight}`,
      explanation: `Location mismatch (${candidateLocation} vs ${jobLocation}) and remote work is not permitted.`,
    };
  }
}
