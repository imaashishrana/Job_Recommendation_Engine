import { RequiredSkill, SkillDimensionScore, SkillRequirementType } from './scoring.types';
import { SkillNormalizer } from './skill-normalizer';

/**
 * SkillScorer
 * Evaluates candidates against job skill requirements:
 * 1. Must-have skills act as a hard filter (100% required to qualify).
 * 2. Nice-to-have skills contribute to the remaining score budget.
 */
export class SkillScorer {
  /**
   * Calculates the skill score for a candidate against required job skills.
   * @param candidateSkills List of skill names the candidate possesses.
   * @param requiredSkills List of required job skills with their requirement type.
   * @param maxWeight Maximum weight for the skills dimension (default 50).
   */
  public static score(
    candidateSkills: string[],
    requiredSkills: RequiredSkill[],
    maxWeight: number = 50,
  ): SkillDimensionScore {
    const candidateSkillSet = SkillNormalizer.normalizeList(candidateSkills);

    const mustHaveSkills: RequiredSkill[] = [];
    const niceToHaveSkills: RequiredSkill[] = [];

    for (const req of requiredSkills) {
      const typeStr = (req.type || '').toString().toLowerCase();
      if (typeStr === SkillRequirementType.MUST_HAVE || typeStr === 'must-have') {
        mustHaveSkills.push(req);
      } else {
        niceToHaveSkills.push(req);
      }
    }

    const matchedMustHaves: string[] = [];
    const missingMustHaves: string[] = [];

    for (const mustHave of mustHaveSkills) {
      if (SkillNormalizer.hasSkill(candidateSkillSet, mustHave.name)) {
        matchedMustHaves.push(mustHave.name);
      } else {
        missingMustHaves.push(mustHave.name);
      }
    }

    const matchedNiceToHaves: string[] = [];
    for (const niceToHave of niceToHaveSkills) {
      if (SkillNormalizer.hasSkill(candidateSkillSet, niceToHave.name)) {
        matchedNiceToHaves.push(niceToHave.name);
      }
    }

    const passedMustHave = missingMustHaves.length === 0;

    // If hard filter fails, zero points are awarded and eligible = false
    if (!passedMustHave) {
      return {
        score: 0,
        max: maxWeight,
        passedMustHave: false,
        missingMustHaves,
        matchedMustHaves,
        matchedNiceToHaves,
        totalMustHaves: mustHaveSkills.length,
        totalNiceToHaves: niceToHaveSkills.length,
        text: `0/${maxWeight}`,
        explanation: `Missing required must-have skills: ${missingMustHaves.join(', ')}`,
      };
    }

    // Determine weight allocation between must-have and nice-to-have
    let mustHaveWeight = maxWeight;
    let niceToHaveWeight = 0;

    if (mustHaveSkills.length > 0 && niceToHaveSkills.length > 0) {
      // 70% for must-have baseline, 30% for nice-to-have bonus
      mustHaveWeight = Number((maxWeight * 0.7).toFixed(2));
      niceToHaveWeight = Number((maxWeight - mustHaveWeight).toFixed(2));
    } else if (mustHaveSkills.length === 0 && niceToHaveSkills.length > 0) {
      mustHaveWeight = 0;
      niceToHaveWeight = maxWeight;
    }

    // Since passedMustHave is true, all must-haves are satisfied
    const mustHaveScore = mustHaveSkills.length > 0 ? mustHaveWeight : 0;

    // Nice-to-have score is proportional to the number of nice-to-have skills matched
    const niceToHaveScore =
      niceToHaveSkills.length > 0
        ? (matchedNiceToHaves.length / niceToHaveSkills.length) * niceToHaveWeight
        : 0;

    // If neither must-haves nor nice-to-haves were specified, award full weight
    const totalRawScore =
      mustHaveSkills.length === 0 && niceToHaveSkills.length === 0
        ? maxWeight
        : mustHaveScore + niceToHaveScore;

    const finalScore = Number(Math.min(totalRawScore, maxWeight).toFixed(2));

    let explanation = `Matched all ${mustHaveSkills.length} must-have skills`;
    if (niceToHaveSkills.length > 0) {
      explanation += ` and ${matchedNiceToHaves.length}/${niceToHaveSkills.length} nice-to-have skills (${matchedNiceToHaves.join(', ') || 'none'})`;
    }

    return {
      score: finalScore,
      max: maxWeight,
      passedMustHave: true,
      missingMustHaves: [],
      matchedMustHaves,
      matchedNiceToHaves,
      totalMustHaves: mustHaveSkills.length,
      totalNiceToHaves: niceToHaveSkills.length,
      text: `${finalScore}/${maxWeight}`,
      explanation,
    };
  }
}
