import { LocationScorer } from '../../src/recommendations/scoring/location.scorer';

describe('LocationScorer', () => {
  it('should award 15/15 points for exact location match', () => {
    const result = LocationScorer.score('Gurugram', 'Gurugram', false, 15);

    expect(result.score).toBe(15);
    expect(result.max).toBe(15);
    expect(result.text).toBe('15/15');
    expect(result.explanation).toContain('Exact location match');
  });

  it('should award 15/15 points for case/whitespace insensitive location match', () => {
    const result = LocationScorer.score('  gurugram  ', 'GURUGRAM', false, 15);

    expect(result.score).toBe(15);
    expect(result.text).toBe('15/15');
  });

  it('should award 10/15 points when locations differ but remote work is allowed', () => {
    const result = LocationScorer.score('Bengaluru', 'Gurugram', true, 15);

    expect(result.score).toBe(10);
    expect(result.max).toBe(15);
    expect(result.text).toBe('10/15');
    expect(result.explanation).toContain('remote work is allowed');
  });

  it('should award 0/15 points when locations differ and remote work is NOT allowed', () => {
    const result = LocationScorer.score('Bengaluru', 'Gurugram', false, 15);

    expect(result.score).toBe(0);
    expect(result.max).toBe(15);
    expect(result.text).toBe('0/15');
    expect(result.explanation).toContain('remote work is not permitted');
  });

  it('should award 15/15 points if job location is remote', () => {
    const result = LocationScorer.score('Pune', 'Remote', true, 15);

    expect(result.score).toBe(15);
    expect(result.text).toBe('15/15');
  });
});
