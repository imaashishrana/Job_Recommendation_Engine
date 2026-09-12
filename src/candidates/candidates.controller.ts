import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { Candidate } from './candidate.entity';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCandidateDto: CreateCandidateDto): Promise<Candidate> {
    return await this.candidatesService.create(createCandidateDto);
  }

  @Get()
  async findAll(): Promise<Candidate[]> {
    return await this.candidatesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Candidate> {
    return await this.candidatesService.findById(id);
  }
}
