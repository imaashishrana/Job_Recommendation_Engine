import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  skills: string[];

  @IsNumber()
  @Min(0)
  yearsOfExperience: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @Min(0)
  expectedSalary: number;
}
