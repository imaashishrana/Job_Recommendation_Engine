import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'simple-array' })
  skills: string[];

  @Column({ type: 'float', name: 'years_of_experience', default: 0 })
  yearsOfExperience: number;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'numeric', name: 'expected_salary', transformer: {
    to: (value: number) => value,
    from: (value: string | number) => Number(value) || 0,
  } })
  expectedSalary: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
