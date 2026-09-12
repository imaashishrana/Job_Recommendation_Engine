import { Module } from '@nestjs/common';
import { CandidatesModule } from '../candidates/candidates.module';
import { JobsModule } from '../jobs/jobs.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [CandidatesModule, JobsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
