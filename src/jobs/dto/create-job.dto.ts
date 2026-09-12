import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SkillRequirementType } from '../../recommendations/scoring/scoring.types';

export class RequiredSkillDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SkillRequirementType, {
    message: 'type must be either must-have or nice-to-have',
  })
  type: SkillRequirementType;
}

export class SalaryRangeDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsNumber()
  @Min(0)
  max: number;
}

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequiredSkillDto)
  requiredSkills: RequiredSkillDto[];

  @IsNumber()
  @Min(0)
  minYearsExperience: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @ValidateNested()
  @Type(() => SalaryRangeDto)
  salaryRange: SalaryRangeDto;

  @IsBoolean()
  @IsOptional()
  remoteAllowed?: boolean;
}
