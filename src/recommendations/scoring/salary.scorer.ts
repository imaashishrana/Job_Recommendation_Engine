import { DimensionScore, SalaryRange } from './scoring.types';

/**
 * SalaryScorer
 * Evaluates candidate salary expectations against job salary budget [min, max]:
 * 1. Expected salary <= salaryMax: Full score (15/15) - job meets or exceeds expectation.
 * 2. Expected salary > salaryMax: 0 points (0/15) - job ceiling is below candidate expectation.
 */
export class SalaryScorer {
  /**
   * Calculates salary fit score.
   * @param expectedSalary Candidate's expected annual salary.
   * @param salaryRange Job's offered salary range { min, max }.
   * @param maxWeight Maximum weight for salary dimension (default 15).
   */
  public static score(
    expectedSalary: number,
    salaryRange: SalaryRange,
    maxWeight: number = 15,
  ): DimensionScore {
    const expected = Math.max(0, expectedSalary || 0);
    const min = Math.max(0, salaryRange?.min || 0);
    const max = Math.max(min, salaryRange?.max || 0);

    // If job does not specify a max budget, award full score
    if (max === 0 && min === 0) {
      return {
        score: maxWeight,
        max: maxWeight,
        text: `${maxWeight}/${maxWeight}`,
        explanation: 'Job has an open/unspecified salary budget.',
      };
    }

    // Expected salary is within budget ceiling
    if (expected <= max) {
      let explanation: string;
      if (expected >= min) {
        explanation = `Expected salary (${expected.toLocaleString()}) falls cleanly inside job budget [${min.toLocaleString()} - ${max.toLocaleString()}].`;
      } else {
        explanation = `Job budget [${min.toLocaleString()} - ${max.toLocaleString()}] comfortably exceeds candidate expectation (${expected.toLocaleString()}).`;
      }

      return {
        score: maxWeight,
        max: maxWeight,
        text: `${maxWeight}/${maxWeight}`,
        explanation,
      };
    }

    // Expected salary exceeds job ceiling
    const gap = expected - max;
    return {
      score: 0,
      max: maxWeight,
      text: `0/${maxWeight}`,
      explanation: `Job max budget (${max.toLocaleString()}) is below candidate expected salary (${expected.toLocaleString()}) by ${gap.toLocaleString()}.`,
    };
  }
}
