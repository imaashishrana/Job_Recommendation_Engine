import { SkillNormalizer } from '../../src/recommendations/scoring/skill-normalizer';

describe('SkillNormalizer', () => {
  it('should trim and lowercase standard skills', () => {
    expect(SkillNormalizer.normalize('  TypeScript  ')).toBe('typescript');
    expect(SkillNormalizer.normalize('PYTHON')).toBe('python');
  });

  it('should map common tech aliases to canonical names', () => {
    expect(SkillNormalizer.normalize('ts')).toBe('typescript');
    expect(SkillNormalizer.normalize('js')).toBe('javascript');
    expect(SkillNormalizer.normalize('node')).toBe('node.js');
    expect(SkillNormalizer.normalize('nodejs')).toBe('node.js');
    expect(SkillNormalizer.normalize('reactjs')).toBe('react');
    expect(SkillNormalizer.normalize('vuejs')).toBe('vue');
    expect(SkillNormalizer.normalize('postgres')).toBe('postgresql');
    expect(SkillNormalizer.normalize('psql')).toBe('postgresql');
    expect(SkillNormalizer.normalize('golang')).toBe('go');
    expect(SkillNormalizer.normalize('k8s')).toBe('kubernetes');
    expect(SkillNormalizer.normalize('nest')).toBe('nestjs');
  });

  it('should normalize a list of skills into a Set', () => {
    const list = ['TS', 'NodeJS', 'Postgres', 'Docker', ''];
    const set = SkillNormalizer.normalizeList(list);

    expect(set.has('typescript')).toBe(true);
    expect(set.has('node.js')).toBe(true);
    expect(set.has('postgresql')).toBe(true);
    expect(set.has('docker')).toBe(true);
    expect(set.size).toBe(4);
  });

  it('should handle null, undefined, or empty inputs gracefully', () => {
    expect(SkillNormalizer.normalize('')).toBe('');
    expect(SkillNormalizer.normalize(null as any)).toBe('');
    expect(SkillNormalizer.normalizeList(null as any).size).toBe(0);
  });
});
