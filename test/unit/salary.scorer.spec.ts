import { SalaryScorer } from '../../src/recommendations/scoring/salary.scorer';

describe('SalaryScorer', () => {
  it('should award 15/15 points when expected salary is within the job range', () => {
    // Expected: 14 LPA, Job: 12 - 18 LPA
    const result = SalaryScorer.score(1400000, { min: 1200000, max: 1800000 }, 15);

    expect(result.score).toBe(15);
    expect(result.max).toBe(15);
    expect(result.text).toBe('15/15');
    expect(result.explanation).toContain('falls cleanly inside job budget');
  });

  it('should award 15/15 points when expected salary is below minimum range (job pays comfortably above)', () => {
    // Expected: 10 LPA, Job: 12 - 18 LPA
    const result = SalaryScorer.score(1000000, { min: 1200000, max: 1800000 }, 15);

    expect(result.score).toBe(15);
    expect(result.text).toBe('15/15');
    expect(result.explanation).toContain('comfortably exceeds candidate expectation');
  });

  it('should award 0/15 points when job max budget is below candidate expected salary', () => {
    // Expected: 14 LPA, Job: 8 - 12 LPA (Max budget 12 LPA < Expected 14 LPA)
    const result = SalaryScorer.score(1400000, { min: 800000, max: 1200000 }, 15);

    expect(result.score).toBe(0);
    expect(result.max).toBe(15);
    expect(result.text).toBe('0/15');
    expect(result.explanation).toContain('is below candidate expected salary');
  });

  it('should award 15/15 points when expected salary matches max range boundary exactly', () => {
    const result = SalaryScorer.score(1800000, { min: 1200000, max: 1800000 }, 15);

    expect(result.score).toBe(15);
    expect(result.text).toBe('15/15');
  });

  it('should award full points when job has open/unspecified salary budget', () => {
    const result = SalaryScorer.score(1500000, { min: 0, max: 0 }, 15);

    expect(result.score).toBe(15);
    expect(result.explanation).toContain('open/unspecified salary budget');
  });
});
