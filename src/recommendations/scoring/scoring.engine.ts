import {
  CandidateProfile,
  CandidateRecommendationResult,
  DEFAULT_WEIGHTS,
  JobProfile,
  JobRecommendationResult,
  ScoringResult,
  ScoringWeights,
} from './scoring.types';
import { SkillScorer } from './skill.scorer';
import { ExperienceScorer } from './experience.scorer';
import { LocationScorer } from './location.scorer';
import { SalaryScorer } from './salary.scorer';

/**
 * RecommendationScoringEngine
 * Pure, decoupled scoring orchestrator for calculating explainable match scores
 * between Candidates and Job Postings.
 */
export class RecommendationScoringEngine {
  /**
   * Scores a single candidate against a single job posting.
   */
  public static evaluateMatch(
    candidate: CandidateProfile,
    job: JobProfile,
    weights: ScoringWeights = DEFAULT_WEIGHTS,
  ): ScoringResult {
    const effectiveWeights: ScoringWeights = {
      skills: weights?.skills ?? DEFAULT_WEIGHTS.skills,
      experience: weights?.experience ?? DEFAULT_WEIGHTS.experience,
      location: weights?.location ?? DEFAULT_WEIGHTS.location,
      salary: weights?.salary ?? DEFAULT_WEIGHTS.salary,
    };

    // 1. Skill evaluation (including hard must-have gating)
    const skillScore = SkillScorer.score(
      candidate.skills,
      job.requiredSkills || [],
      effectiveWeights.skills,
    );

    // 2. Experience evaluation (proportional penalty)
    const experienceScore = ExperienceScorer.score(
      candidate.yearsOfExperience,
      job.minYearsExperience,
      effectiveWeights.experience,
    );

    // 3. Location evaluation (exact > remote > mismatch)
    const locationScore = LocationScorer.score(
      candidate.location,
      job.location,
      job.remoteAllowed,
      effectiveWeights.location,
    );

    // 4. Salary evaluation (budget overlap)
    const salaryScore = SalaryScorer.score(
      candidate.expectedSalary,
      job.salaryRange,
      effectiveWeights.salary,
    );

    // Hard filter: reject if any must-have skill is missing
    if (!skillScore.passedMustHave) {
      return {
        isEligible: false,
        rejectionReason: `Candidate lacks must-have skill(s): ${skillScore.missingMustHaves.join(', ')}`,
        totalScore: 0,
        breakdownSummary: {
          skills: `0/${effectiveWeights.skills}`,
          experience: experienceScore.text,
          location: locationScore.text,
          salary: salaryScore.text,
        },
        breakdown: {
          skills: skillScore,
          experience: experienceScore,
          location: locationScore,
          salary: salaryScore,
        },
        explanations: [
          `Rejected: Candidate is missing must-have skill(s): ${skillScore.missingMustHaves.join(', ')}.`,
        ],
      };
    }

    // Calculate total score rounded to 2 decimals
    const totalRaw =
      skillScore.score + experienceScore.score + locationScore.score + salaryScore.score;
    const totalScore = Number(totalRaw.toFixed(2));

    const explanations: string[] = [
      skillScore.explanation,
      experienceScore.explanation,
      locationScore.explanation,
      salaryScore.explanation,
    ];

    return {
      isEligible: true,
      totalScore,
      breakdownSummary: {
        skills: skillScore.text,
        experience: experienceScore.text,
        location: locationScore.text,
        salary: salaryScore.text,
      },
      breakdown: {
        skills: skillScore,
        experience: experienceScore,
        location: locationScore,
        salary: salaryScore,
      },
      explanations,
    };
  }

  /**
   * Recommends and ranks jobs for a candidate.
   * Hard-filters disqualified jobs, sorts descending by match score, and applies top-N limit.
   */
  public static rankJobsForCandidate(
    candidate: CandidateProfile,
    jobs: JobProfile[],
    options?: { limit?: number; weights?: ScoringWeights },
  ): JobRecommendationResult[] {
    const weights = options?.weights || DEFAULT_WEIGHTS;
    const results: JobRecommendationResult[] = [];

    for (const job of jobs) {
      const evaluation = this.evaluateMatch(candidate, job, weights);

      // Exclude disqualified jobs from the recommendations
      if (!evaluation.isEligible) {
        continue;
      }

      results.push({
        jobId: job.id ?? 0,
        title: job.title ?? 'Untitled Position',
        score: evaluation.totalScore,
        breakdown: evaluation.breakdownSummary,
        details: evaluation.breakdown,
        explanations: evaluation.explanations,
      });
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    // Apply top-N limit if specified
    if (options?.limit && options.limit > 0) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Reverse recommendation: Ranks candidates for a given job posting.
   */
  public static rankCandidatesForJob(
    job: JobProfile,
    candidates: CandidateProfile[],
    options?: { limit?: number; weights?: ScoringWeights },
  ): CandidateRecommendationResult[] {
    const weights = options?.weights || DEFAULT_WEIGHTS;
    const results: CandidateRecommendationResult[] = [];

    for (const candidate of candidates) {
      const evaluation = this.evaluateMatch(candidate, job, weights);

      if (!evaluation.isEligible) {
        continue;
      }

      results.push({
        candidateId: candidate.id ?? 0,
        name: candidate.name ?? 'Anonymous Candidate',
        score: evaluation.totalScore,
        breakdown: evaluation.breakdownSummary,
        details: evaluation.breakdown,
        explanations: evaluation.explanations,
      });
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    if (options?.limit && options.limit > 0) {
      return results.slice(0, options.limit);
    }

    return results;
  }
}
