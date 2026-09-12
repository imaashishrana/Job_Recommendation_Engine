import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { JobSkill } from './job-skill.entity';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobSkill)
    private readonly jobSkillRepository: Repository<JobSkill>,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<Job> {
    const job = this.jobRepository.create({
      title: createJobDto.title,
      minYearsExperience: createJobDto.minYearsExperience || 0,
      location: createJobDto.location,
      salaryMin: createJobDto.salaryRange?.min || 0,
      salaryMax: createJobDto.salaryRange?.max || 0,
      remoteAllowed: createJobDto.remoteAllowed ?? false,
    });

    const savedJob = await this.jobRepository.save(job);

    if (createJobDto.requiredSkills && createJobDto.requiredSkills.length > 0) {
      const skills = createJobDto.requiredSkills.map((skillDto) =>
        this.jobSkillRepository.create({
          jobId: savedJob.id,
          name: skillDto.name,
          type: skillDto.type,
        }),
      );
      savedJob.skills = await this.jobSkillRepository.save(skills);
    } else {
      savedJob.skills = [];
    }

    return savedJob;
  }

  async findAll(): Promise<Job[]> {
    return await this.jobRepository.find({
      relations: ['skills'],
    });
  }

  async findById(id: number): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['skills'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} was not found.`);
    }
    return job;
  }
}
