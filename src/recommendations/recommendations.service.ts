import { Injectable } from '@nestjs/common';
import { CandidatesService } from '../candidates/candidates.service';
import { JobsService } from '../jobs/jobs.service';
import { RecommendationScoringEngine } from './scoring/scoring.engine';
import {
  CandidateProfile,
  JobProfile,
  JobRecommendationResult,
  CandidateRecommendationResult,
  ScoringWeights,
  DEFAULT_WEIGHTS,
} from './scoring/scoring.types';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly jobsService: JobsService,
  ) {}

  /**
   * Retrieves recommended jobs for a specific candidate.
   */
  async getJobRecommendations(
    candidateId: number,
    query: RecommendationQueryDto,
  ): Promise<{
    candidate: { id: number; name: string; skills: string[]; location: string };
    totalMatches: number;
    recommendations: JobRecommendationResult[];
  }> {
    const candidateEntity = await this.candidatesService.findById(candidateId);
    const jobsEntities = await this.jobsService.findAll();

    const candidateProfile: CandidateProfile = {
      id: candidateEntity.id,
      name: candidateEntity.name,
      skills: candidateEntity.skills || [],
      yearsOfExperience: Number(candidateEntity.yearsOfExperience) || 0,
      location: candidateEntity.location,
      expectedSalary: Number(candidateEntity.expectedSalary) || 0,
    };

    const jobProfiles: JobProfile[] = jobsEntities.map((job) => ({
      id: job.id,
      title: job.title,
      requiredSkills: (job.skills || []).map((s) => ({
        name: s.name,
        type: s.type as any,
      })),
      minYearsExperience: Number(job.minYearsExperience) || 0,
      location: job.location,
      salaryRange: {
        min: Number(job.salaryMin) || 0,
        max: Number(job.salaryMax) || 0,
      },
      remoteAllowed: job.remoteAllowed,
    }));

    const weights = this.buildWeights(query);

    const recommendations = RecommendationScoringEngine.rankJobsForCandidate(
      candidateProfile,
      jobProfiles,
      {
        limit: query.limit,
        weights,
      },
    );

    return {
      candidate: {
        id: candidateEntity.id,
        name: candidateEntity.name,
        skills: candidateEntity.skills || [],
        location: candidateEntity.location,
      },
      totalMatches: recommendations.length,
      recommendations,
    };
  }

  /**
   * Reverse recommendation bonus: Retrieves best-fit candidates for a job posting.
   */
  async getCandidateRecommendations(
    jobId: number,
    query: RecommendationQueryDto,
  ): Promise<{
    job: { id: number; title: string; location: string };
    totalMatches: number;
    recommendations: CandidateRecommendationResult[];
  }> {
    const jobEntity = await this.jobsService.findById(jobId);
    const candidatesEntities = await this.candidatesService.findAll();

    const jobProfile: JobProfile = {
      id: jobEntity.id,
      title: jobEntity.title,
      requiredSkills: (jobEntity.skills || []).map((s) => ({
        name: s.name,
        type: s.type as any,
      })),
      minYearsExperience: Number(jobEntity.minYearsExperience) || 0,
      location: jobEntity.location,
      salaryRange: {
        min: Number(jobEntity.salaryMin) || 0,
        max: Number(jobEntity.salaryMax) || 0,
      },
      remoteAllowed: jobEntity.remoteAllowed,
    };

    const candidateProfiles: CandidateProfile[] = candidatesEntities.map((c) => ({
      id: c.id,
      name: c.name,
      skills: c.skills || [],
      yearsOfExperience: Number(c.yearsOfExperience) || 0,
      location: c.location,
      expectedSalary: Number(c.expectedSalary) || 0,
    }));

    const weights = this.buildWeights(query);

    const recommendations = RecommendationScoringEngine.rankCandidatesForJob(
      jobProfile,
      candidateProfiles,
      {
        limit: query.limit,
        weights,
      },
    );

    return {
      job: {
        id: jobEntity.id,
        title: jobEntity.title,
        location: jobEntity.location,
      },
      totalMatches: recommendations.length,
      recommendations,
    };
  }

  private buildWeights(query: RecommendationQueryDto): ScoringWeights {
    return {
      skills: query.skillWeight !== undefined ? query.skillWeight : DEFAULT_WEIGHTS.skills,
      experience:
        query.experienceWeight !== undefined ? query.experienceWeight : DEFAULT_WEIGHTS.experience,
      location:
        query.locationWeight !== undefined ? query.locationWeight : DEFAULT_WEIGHTS.location,
      salary: query.salaryWeight !== undefined ? query.salaryWeight : DEFAULT_WEIGHTS.salary,
    };
  }
}
