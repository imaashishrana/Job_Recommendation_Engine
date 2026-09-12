import { RecommendationScoringEngine } from '../../src/recommendations/scoring/scoring.engine';
import {
  CandidateProfile,
  JobProfile,
  SkillRequirementType,
} from '../../src/recommendations/scoring/scoring.types';

describe('RecommendationScoringEngine', () => {
  const candidate: CandidateProfile = {
    id: 1,
    name: 'Ashish',
    skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    yearsOfExperience: 2.5,
    location: 'Gurugram',
    expectedSalary: 1400000,
  };

  const jobA: JobProfile = {
    id: 101,
    title: 'Senior Software Engineer',
    requiredSkills: [
      { name: 'TypeScript', type: SkillRequirementType.MUST_HAVE },
      { name: 'Node.js', type: SkillRequirementType.MUST_HAVE },
      { name: 'PostgreSQL', type: SkillRequirementType.MUST_HAVE },
      { name: 'Docker', type: SkillRequirementType.NICE_TO_HAVE },
      { name: 'Kubernetes', type: SkillRequirementType.NICE_TO_HAVE },
    ],
    minYearsExperience: 3, // Candidate has 2.5 yrs -> (2.5/3)*20 = 16.67
    location: 'Gurugram', // Exact match -> 15
    salaryRange: { min: 1200000, max: 1800000 }, // Expected 14L in range -> 15
    remoteAllowed: false,
  };

  const jobB_missingMustHave: JobProfile = {
    id: 102,
    title: 'Python Lead Engineer',
    requiredSkills: [
      { name: 'Python', type: SkillRequirementType.MUST_HAVE },
      { name: 'TypeScript', type: SkillRequirementType.MUST_HAVE },
    ],
    minYearsExperience: 2,
    location: 'Gurugram',
    salaryRange: { min: 1500000, max: 2000000 },
    remoteAllowed: true,
  };

  const jobC_remoteAllowed: JobProfile = {
    id: 103,
    title: 'Fullstack Engineer',
    requiredSkills: [
      { name: 'TypeScript', type: SkillRequirementType.MUST_HAVE },
      { name: 'Node.js', type: SkillRequirementType.MUST_HAVE },
    ],
    minYearsExperience: 2, // Candidate (2.5) >= 2 -> 20/20
    location: 'Bengaluru', // Mismatch but remoteAllowed -> 10/15
    salaryRange: { min: 1000000, max: 1500000 }, // Expected 14L in range -> 15/15
    remoteAllowed: true,
  };

  const jobD_salaryMismatch: JobProfile = {
    id: 104,
    title: 'Junior Backend Developer',
    requiredSkills: [
      { name: 'TypeScript', type: SkillRequirementType.MUST_HAVE },
      { name: 'Node.js', type: SkillRequirementType.MUST_HAVE },
    ],
    minYearsExperience: 1, // 20/20
    location: 'Gurugram', // 15/15
    salaryRange: { min: 600000, max: 1000000 }, // Expected 14L > 10L max -> 0/15
    remoteAllowed: false,
  };

  describe('evaluateMatch', () => {
    it('should compute correct breakdown and score for eligible job', () => {
      const evaluation = RecommendationScoringEngine.evaluateMatch(candidate, jobA);

      expect(evaluation.isEligible).toBe(true);
      // Skills: 35 (must-have) + (1/2 * 15) = 42.5
      // Experience: (2.5/3) * 20 = 16.67
      // Location: 15
      // Salary: 15
      // Total: 42.5 + 16.67 + 15 + 15 = 89.17
      expect(evaluation.totalScore).toBe(89.17);
      expect(evaluation.breakdownSummary.skills).toBe('42.5/50');
      expect(evaluation.breakdownSummary.experience).toBe('16.67/20');
      expect(evaluation.breakdownSummary.location).toBe('15/15');
      expect(evaluation.breakdownSummary.salary).toBe('15/15');
      expect(evaluation.explanations.length).toBe(4);
    });

    it('should mark ineligible when must-have skills are missing', () => {
      const evaluation = RecommendationScoringEngine.evaluateMatch(candidate, jobB_missingMustHave);

      expect(evaluation.isEligible).toBe(false);
      expect(evaluation.totalScore).toBe(0);
      expect(evaluation.rejectionReason).toContain('lacks must-have skill(s): Python');
    });
  });

  describe('rankJobsForCandidate', () => {
    it('should exclude jobs where candidate lacks must-have skills', () => {
      const recommendations = RecommendationScoringEngine.rankJobsForCandidate(candidate, [
        jobA,
        jobB_missingMustHave,
        jobC_remoteAllowed,
        jobD_salaryMismatch,
      ]);

      const jobIds = recommendations.map((r) => r.jobId);
      expect(jobIds).not.toContain(102); // Job B must be excluded
      expect(jobIds.length).toBe(3);
    });

    it('should rank jobs strictly in descending order of match score', () => {
      const recommendations = RecommendationScoringEngine.rankJobsForCandidate(candidate, [
        jobC_remoteAllowed, // Skills: 50, Exp: 20, Loc: 10, Sal: 15 -> Total: 95
        jobD_salaryMismatch, // Skills: 50, Exp: 20, Loc: 15, Sal: 0 -> Total: 85
        jobA, // Total: 89.17
      ]);

      expect(recommendations[0].jobId).toBe(103); // 95
      expect(recommendations[1].jobId).toBe(101); // 89.17
      expect(recommendations[2].jobId).toBe(104); // 85
    });

    it('should respect top-N limit query parameter', () => {
      const recommendations = RecommendationScoringEngine.rankJobsForCandidate(
        candidate,
        [jobA, jobC_remoteAllowed, jobD_salaryMismatch],
        { limit: 2 },
      );

      expect(recommendations.length).toBe(2);
      expect(recommendations[0].jobId).toBe(103);
      expect(recommendations[1].jobId).toBe(101);
    });

    it('should allow custom scoring weights', () => {
      const customWeights = {
        skills: 40,
        experience: 30,
        location: 10,
        salary: 20,
      };

      const recommendations = RecommendationScoringEngine.rankJobsForCandidate(
        candidate,
        [jobA],
        { weights: customWeights },
      );

      expect(recommendations[0].details.skills.max).toBe(40);
      expect(recommendations[0].details.experience.max).toBe(30);
      expect(recommendations[0].details.location.max).toBe(10);
      expect(recommendations[0].details.salary.max).toBe(20);
    });
  });

  describe('rankCandidatesForJob (Reverse Recommendation bonus)', () => {
    it('should rank candidates for a specific job in descending order', () => {
      const candidate1: CandidateProfile = {
        id: 1,
        name: 'Perfect Match',
        skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes'],
        yearsOfExperience: 5,
        location: 'Gurugram',
        expectedSalary: 1400000,
      };

      const candidate2: CandidateProfile = {
        id: 2,
        name: 'Junior Fit',
        skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
        yearsOfExperience: 1.5,
        location: 'Gurugram',
        expectedSalary: 1300000,
      };

      const candidate3_missingSkill: CandidateProfile = {
        id: 3,
        name: 'Missing PostgreSQL',
        skills: ['TypeScript', 'Node.js'],
        yearsOfExperience: 4,
        location: 'Gurugram',
        expectedSalary: 1300000,
      };

      const results = RecommendationScoringEngine.rankCandidatesForJob(jobA, [
        candidate1,
        candidate2,
        candidate3_missingSkill,
      ]);

      expect(results.length).toBe(2); // candidate 3 excluded
      expect(results[0].candidateId).toBe(1);
      expect(results[0].score).toBe(100);
      expect(results[1].candidateId).toBe(2);
    });
  });
});
