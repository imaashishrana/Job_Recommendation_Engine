import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';

@Controller()
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  /**
   * Main Endpoint: Recommendations for a Candidate
   * GET /candidates/:id/recommendations?limit=10&skillWeight=50...
   */
  @Get('candidates/:id/recommendations')
  async getJobRecommendations(
    @Param('id', ParseIntPipe) candidateId: number,
    @Query() query: RecommendationQueryDto,
  ) {
    return await this.recommendationsService.getJobRecommendations(candidateId, query);
  }

  /**
   * Bonus Endpoint: Reverse Recommendations for a Job Posting
   * GET /jobs/:id/recommendations?limit=10...
   */
  @Get('jobs/:id/recommendations')
  async getCandidateRecommendations(
    @Param('id', ParseIntPipe) jobId: number,
    @Query() query: RecommendationQueryDto,
  ) {
    return await this.recommendationsService.getCandidateRecommendations(jobId, query);
  }
}
