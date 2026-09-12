export enum SkillRequirementType {
  MUST_HAVE = 'must-have',
  NICE_TO_HAVE = 'nice-to-have',
}

export interface RequiredSkill {
  name: string;
  type: SkillRequirementType | 'must-have' | 'nice-to-have';
}

export interface SalaryRange {
  min: number;
  max: number;
}

export interface CandidateProfile {
  id?: number;
  name?: string;
  skills: string[];
  yearsOfExperience: number;
  location: string;
  expectedSalary: number;
}

export interface JobProfile {
  id?: number;
  title?: string;
  requiredSkills: RequiredSkill[];
  minYearsExperience: number;
  location: string;
  salaryRange: SalaryRange;
  remoteAllowed: boolean;
}

export interface ScoringWeights {
  skills: number;
  experience: number;
  location: number;
  salary: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  skills: 50,
  experience: 20,
  location: 15,
  salary: 15,
};

export interface DimensionScore {
  score: number;
  max: number;
  text: string;
  explanation: string;
}

export interface SkillDimensionScore extends DimensionScore {
  passedMustHave: boolean;
  missingMustHaves: string[];
  matchedMustHaves: string[];
  matchedNiceToHaves: string[];
  totalMustHaves: number;
  totalNiceToHaves: number;
}

export interface ScoreBreakdown {
  skills: SkillDimensionScore;
  experience: DimensionScore;
  location: DimensionScore;
  salary: DimensionScore;
}

export interface ScoringResult {
  isEligible: boolean;
  rejectionReason?: string;
  totalScore: number;
  breakdownSummary: {
    skills: string;
    experience: string;
    location: string;
    salary: string;
  };
  breakdown: ScoreBreakdown;
  explanations: string[];
}

export interface JobRecommendationResult {
  jobId: number;
  title: string;
  score: number;
  breakdown: {
    skills: string;
    experience: string;
    location: string;
    salary: string;
  };
  details: ScoreBreakdown;
  explanations: string[];
}

export interface CandidateRecommendationResult {
  candidateId: number;
  name: string;
  score: number;
  breakdown: {
    skills: string;
    experience: string;
    location: string;
    salary: string;
  };
  details: ScoreBreakdown;
  explanations: string[];
}
