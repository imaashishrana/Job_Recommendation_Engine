import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobSkill } from './job-skill.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'float', name: 'min_years_experience', default: 0 })
  minYearsExperience: number;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({
    type: 'numeric',
    name: 'salary_min',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value) || 0,
    },
  })
  salaryMin: number;

  @Column({
    type: 'numeric',
    name: 'salary_max',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value) || 0,
    },
  })
  salaryMax: number;

  @Column({ type: 'boolean', name: 'remote_allowed', default: false })
  remoteAllowed: boolean;

  @OneToMany(() => JobSkill, (jobSkill) => jobSkill.job, {
    cascade: true,
    eager: true,
  })
  skills: JobSkill[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
