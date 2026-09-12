import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Job } from './job.entity';
import { SkillRequirementType } from '../recommendations/scoring/scoring.types';

@Entity('job_skills')
export class JobSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'job_id' })
  jobId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: SkillRequirementType.MUST_HAVE,
  })
  type: string;

  @ManyToOne(() => Job, (job) => job.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;
}
