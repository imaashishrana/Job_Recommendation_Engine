import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RecommendationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skillWeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experienceWeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  locationWeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryWeight?: number;
}
