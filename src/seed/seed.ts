import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Candidate } from '../candidates/candidate.entity';
import { Job } from '../jobs/job.entity';
import { JobSkill } from '../jobs/job-skill.entity';
import { SkillRequirementType } from '../recommendations/scoring/scoring.types';

dotenv.config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'job_match_db',
    entities: [Candidate, Job, JobSkill],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Connected to database for seeding...');

  const candidateRepo = dataSource.getRepository(Candidate);
  const jobRepo = dataSource.getRepository(Job);
  const jobSkillRepo = dataSource.getRepository(JobSkill);

  // Clean existing tables
  await jobSkillRepo.delete({});
  await jobRepo.delete({});
  await candidateRepo.delete({});

  console.log('Seeding Candidates...');
  const candidates = await candidateRepo.save([
    {
      name: 'Ashish Rana',
      skills: ['typescript', 'node.js', 'postgresql', 'docker', 'nestjs'],
      yearsOfExperience: 2.5,
      location: 'Gurugram',
      expectedSalary: 1400000,
    },
    {
      name: 'Priya Sharma',
      skills: ['python', 'django', 'postgresql', 'aws', 'docker'],
      yearsOfExperience: 4.0,
      location: 'Bengaluru',
      expectedSalary: 1800000,
    },
    {
      name: 'Rohan Gupta',
      skills: ['react', 'typescript', 'javascript', 'html', 'css'],
      yearsOfExperience: 1.5,
      location: 'Delhi',
      expectedSalary: 900000,
    },
    {
      name: 'Sneha Patel',
      skills: ['typescript', 'node.js', 'angular', 'postgresql'],
      yearsOfExperience: 3.0,
      location: 'Gurugram',
      expectedSalary: 1600000,
    },
  ]);

  console.log(`Seeded ${candidates.length} candidates.`);

  console.log('Seeding Jobs...');
  const jobsData = [
    {
      title: 'Backend Engineer (Node/NestJS)',
      minYearsExperience: 2,
      location: 'Gurugram',
      salaryMin: 1200000,
      salaryMax: 1800000,
      remoteAllowed: false,
      skills: [
        { name: 'typescript', type: SkillRequirementType.MUST_HAVE },
        { name: 'node.js', type: SkillRequirementType.MUST_HAVE },
        { name: 'postgresql', type: SkillRequirementType.MUST_HAVE },
        { name: 'nestjs', type: SkillRequirementType.NICE_TO_HAVE },
        { name: 'docker', type: SkillRequirementType.NICE_TO_HAVE },
      ],
    },
    {
      title: 'Senior Python / Cloud Architect',
      minYearsExperience: 5,
      location: 'Bengaluru',
      salaryMin: 2000000,
      salaryMax: 2800000,
      remoteAllowed: true,
      skills: [
        { name: 'python', type: SkillRequirementType.MUST_HAVE },
        { name: 'aws', type: SkillRequirementType.MUST_HAVE },
        { name: 'kubernetes', type: SkillRequirementType.NICE_TO_HAVE },
      ],
    },
    {
      title: 'Frontend Developer (React / TS)',
      minYearsExperience: 1,
      location: 'Remote',
      salaryMin: 800000,
      salaryMax: 1200000,
      remoteAllowed: true,
      skills: [
        { name: 'react', type: SkillRequirementType.MUST_HAVE },
        { name: 'typescript', type: SkillRequirementType.MUST_HAVE },
        { name: 'css', type: SkillRequirementType.NICE_TO_HAVE },
      ],
    },
    {
      title: 'Fullstack TypeScript Specialist',
      minYearsExperience: 3,
      location: 'Mumbai',
      salaryMin: 1500000,
      salaryMax: 2200000,
      remoteAllowed: true,
      skills: [
        { name: 'typescript', type: SkillRequirementType.MUST_HAVE },
        { name: 'node.js', type: SkillRequirementType.MUST_HAVE },
        { name: 'docker', type: SkillRequirementType.NICE_TO_HAVE },
      ],
    },
    {
      title: 'Junior Go Backend Developer',
      minYearsExperience: 1,
      location: 'Gurugram',
      salaryMin: 600000,
      salaryMax: 1000000,
      remoteAllowed: false,
      skills: [
        { name: 'go', type: SkillRequirementType.MUST_HAVE },
        { name: 'docker', type: SkillRequirementType.NICE_TO_HAVE },
      ],
    },
  ];

  for (const jobData of jobsData) {
    const job = await jobRepo.save({
      title: jobData.title,
      minYearsExperience: jobData.minYearsExperience,
      location: jobData.location,
      salaryMin: jobData.salaryMin,
      salaryMax: jobData.salaryMax,
      remoteAllowed: jobData.remoteAllowed,
    });

    const skills = jobData.skills.map((s) =>
      jobSkillRepo.create({
        jobId: job.id,
        name: s.name,
        type: s.type,
      }),
    );
    await jobSkillRepo.save(skills);
  }

  console.log(`Seeded ${jobsData.length} jobs with required skills.`);
  console.log('Database seeding completed successfully!');
  await dataSource.destroy();
}

runSeed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
