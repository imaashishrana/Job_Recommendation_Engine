import { ExperienceScorer } from '../../src/recommendations/scoring/experience.scorer';

describe('ExperienceScorer', () => {
  it('should award full 20 points when candidate meets exact experience requirement', () => {
    const result = ExperienceScorer.score(3, 3, 20);

    expect(result.score).toBe(20);
    expect(result.max).toBe(20);
    expect(result.text).toBe('20/20');
    expect(result.explanation).toContain('Meets or exceeds required experience');
  });

  it('should award full 20 points when candidate exceeds experience requirement', () => {
    const result = ExperienceScorer.score(5, 3, 20);

    expect(result.score).toBe(20);
    expect(result.text).toBe('20/20');
  });

  it('should proportionally penalize (not exclude) candidates below required experience', () => {
    // 2 years vs 3 required -> (2/3) * 20 = 13.33
    const result = ExperienceScorer.score(2, 3, 20);

    expect(result.score).toBe(13.33);
    expect(result.max).toBe(20);
    expect(result.text).toBe('13.33/20');
    expect(result.explanation).toContain('Below required experience (2 years vs 3 years required)');
  });

  it('should award full points when job has 0 minimum experience requirement', () => {
    const result = ExperienceScorer.score(1, 0, 20);

    expect(result.score).toBe(20);
    expect(result.explanation).toContain('no minimum experience requirement');
  });

  it('should award 0 points when candidate has 0 experience for a job requiring experience', () => {
    const result = ExperienceScorer.score(0, 4, 20);

    expect(result.score).toBe(0);
    expect(result.text).toBe('0/20');
  });
});
