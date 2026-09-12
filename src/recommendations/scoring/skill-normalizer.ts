/**
 * Skill Normalizer Utility
 * Standardizes skill names across casing, whitespace, and common technology aliases.
 */
export class SkillNormalizer {
  private static readonly ALIAS_MAP: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    node: 'node.js',
    nodejs: 'node.js',
    'node js': 'node.js',
    nest: 'nestjs',
    'nest js': 'nestjs',
    react: 'react',
    reactjs: 'react',
    'react.js': 'react',
    vue: 'vue',
    vuejs: 'vue',
    'vue.js': 'vue',
    angularjs: 'angular',
    postgres: 'postgresql',
    psql: 'postgresql',
    golang: 'go',
    py: 'python',
    k8s: 'kubernetes',
    docker: 'docker',
    aws: 'aws',
    gcp: 'gcp',
    azure: 'azure',
  };

  /**
   * Normalizes an individual skill name.
   */
  public static normalize(skill: string): string {
    if (!skill || typeof skill !== 'string') {
      return '';
    }

    const trimmedLower = skill.trim().toLowerCase();
    return this.ALIAS_MAP[trimmedLower] || trimmedLower;
  }

  /**
   * Converts a list of skills into a normalized Set for O(1) membership checks.
   */
  public static normalizeList(skills: string[]): Set<string> {
    if (!skills || !Array.isArray(skills)) {
      return new Set<string>();
    }

    const normalizedSet = new Set<string>();
    for (const skill of skills) {
      const normalized = this.normalize(skill);
      if (normalized) {
        normalizedSet.add(normalized);
      }
    }
    return normalizedSet;
  }

  /**
   * Checks if a candidate's normalized skills include the target skill.
   */
  public static hasSkill(candidateSkillSet: Set<string>, targetSkill: string): boolean {
    const normalizedTarget = this.normalize(targetSkill);
    return candidateSkillSet.has(normalizedTarget);
  }
}
