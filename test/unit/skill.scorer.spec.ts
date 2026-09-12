import { SkillScorer } from '../../src/recommendations/scoring/skill.scorer';
import { RequiredSkill, SkillRequirementType } from '../../src/recommendations/scoring/scoring.types';

describe('SkillScorer', () => {
  const mustHave = (name: string): RequiredSkill => ({
    name,
    type: SkillRequirementType.MUST_HAVE,
  });

  const niceToHave = (name: string): RequiredSkill => ({
    name,
    type: SkillRequirementType.NICE_TO_HAVE,
  });

  describe('Hard filter behavior (Must-Have Skills)', () => {
    it('should reject (passedMustHave = false, score = 0) when candidate misses a must-have skill', () => {
      const candidateSkills = ['TypeScript', 'Node.js'];
      const requiredSkills = [mustHave('TypeScript'), mustHave('Node.js'), mustHave('PostgreSQL')];

      const result = SkillScorer.score(candidateSkills, requiredSkills, 50);

      expect(result.passedMustHave).toBe(false);
      expect(result.score).toBe(0);
      expect(result.missingMustHaves).toEqual(['PostgreSQL']);
      expect(result.matchedMustHaves).toEqual(['TypeScript', 'Node.js']);
      expect(result.text).toBe('0/50');
      expect(result.explanation).toContain('Missing required must-have skills: PostgreSQL');
    });

    it('should pass hard filter when candidate has all must-have skills with case/alias differences', () => {
      const candidateSkills = ['ts', 'nodejs', 'postgres'];
      const requiredSkills = [mustHave('TypeScript'), mustHave('Node.js'), mustHave('PostgreSQL')];

      const result = SkillScorer.score(candidateSkills, requiredSkills, 50);

      expect(result.passedMustHave).toBe(true);
      expect(result.missingMustHaves).toHaveLength(0);
      expect(result.score).toBe(50); // No nice-to-haves, so full 50 pts
      expect(result.text).toBe('50/50');
    });
  });

  describe('Nice-to-have skill boosting', () => {
    it('should give 35 base points for must-haves and boost with nice-to-have matches', () => {
      const candidateSkills = ['TypeScript', 'Node.js', 'Docker'];
      const requiredSkills = [
        mustHave('TypeScript'),
        mustHave('Node.js'),
        niceToHave('Docker'),
        niceToHave('Kubernetes'),
      ];

      const result = SkillScorer.score(candidateSkills, requiredSkills, 50);

      expect(result.passedMustHave).toBe(true);
      // 35 pts (must-have) + (1/2 * 15 pts = 7.5 pts) = 42.5 pts
      expect(result.score).toBe(42.5);
      expect(result.matchedNiceToHaves).toEqual(['Docker']);
      expect(result.text).toBe('42.5/50');
    });

    it('should award full 50 points when all must-have and all nice-to-have skills match', () => {
      const candidateSkills = ['TypeScript', 'Node.js', 'Docker', 'Kubernetes'];
      const requiredSkills = [
        mustHave('TypeScript'),
        mustHave('Node.js'),
        niceToHave('Docker'),
        niceToHave('Kubernetes'),
      ];

      const result = SkillScorer.score(candidateSkills, requiredSkills, 50);

      expect(result.passedMustHave).toBe(true);
      expect(result.score).toBe(50);
      expect(result.matchedNiceToHaves).toEqual(['Docker', 'Kubernetes']);
    });

    it('should award 35 points when all must-haves match but zero nice-to-haves match', () => {
      const candidateSkills = ['TypeScript', 'Node.js'];
      const requiredSkills = [
        mustHave('TypeScript'),
        mustHave('Node.js'),
        niceToHave('AWS'),
        niceToHave('GCP'),
      ];

      const result = SkillScorer.score(candidateSkills, requiredSkills, 50);

      expect(result.passedMustHave).toBe(true);
      expect(result.score).toBe(35);
      expect(result.matchedNiceToHaves).toEqual([]);
    });
  });

  describe('Edge cases', () => {
    it('should handle jobs with only nice-to-have skills', () => {
      const candidateSkills = ['TypeScript'];
      const requiredSkills = [niceToHave('TypeScript'), niceToHave('Docker')];

      const result = SkillScorer.score(candidateSkills, requiredSkills, 50);

      expect(result.passedMustHave).toBe(true);
      expect(result.score).toBe(25); // 1/2 of 50
    });

    it('should handle jobs with empty skill requirements', () => {
      const candidateSkills = ['TypeScript'];
      const requiredSkills: RequiredSkill[] = [];

      const result = SkillScorer.score(candidateSkills, requiredSkills, 50);

      expect(result.passedMustHave).toBe(true);
      expect(result.score).toBe(50);
    });
  });
});
