# Job Match Recommendation API

A production-grade, explainable Job Recommendation Engine API built with **NestJS**, **TypeScript**, **TypeORM**, and **PostgreSQL**. The engine matches candidates to job postings based on skill alignment, experience depth, geographic fit, and salary compatibility using a deterministic, rule-based scoring algorithm.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Data Model](#data-model)
5. [Scoring Engine Methodology](#scoring-engine-methodology)
   - [Weighting Logic & Reasoning](#weighting-logic--reasoning)
   - [1. Must-Have Skills (Hard Gate)](#1-must-have-skills-hard-gate)
   - [2. Skill Score Calculation (50 pts)](#2-skill-score-calculation-50-pts)
   - [3. Experience Score Calculation (20 pts)](#3-experience-score-calculation-20-pts)
   - [4. Location Score Calculation (15 pts)](#4-location-score-calculation-15-pts)
   - [5. Salary Score Calculation (15 pts)](#5-salary-score-calculation-15-pts)
6. [API Reference](#api-reference)
   - [1. Create Candidate Profile](#1-create-candidate-profile)
   - [2. Create Job Posting](#2-create-job-posting)
   - [3. Get Job Recommendations for Candidate](#3-get-job-recommendations-for-candidate)
   - [4. Reverse Recommendations: Best Candidates for a Job (Bonus)](#4-reverse-recommendations-best-candidates-for-a-job-bonus)
   - [5. Configurable Weights (Bonus)](#5-configurable-weights-bonus)
7. [Getting Started & Local Setup](#getting-started--local-setup)
8. [Running with Docker & Docker Compose](#running-with-docker--docker-compose)
9. [Running Tests](#running-tests)
10. [Assumptions & Future Enhancements](#assumptions--future-enhancements)
11. [AI Usage Statement](#ai-usage-statement)

---

## Overview

Recruiting platforms often struggle between opaque "black box" machine learning models and inflexible binary keyword search. This project implements a **transparent, rule-based recommendation engine** that:
- **Filters strictly** on non-negotiable requirements (`must-have` skills).
- **Scores progressively** on flexible attributes (experience, nice-to-have skills, location, and salary).
- **Explains every recommendation** with an itemized score breakdown and human-readable rationale.

---

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js framework with modular architecture and TypeScript-first support)
- **Language**: TypeScript (Strict typing, interfaces, and compile-time guarantees)
- **Database**: PostgreSQL
- **ORM**: [TypeORM](https://typeorm.io/) (Entity mapping, relationships, data transformations)
- **Validation**: `class-validator` & `class-transformer` (Strict runtime payload verification)
- **Testing**: [Jest](https://jestjs.io/) & `ts-jest` (Unit tests covering domain scoring logic and edge cases)
- **Containerization**: Docker & Docker Compose

---

## Architecture

The system follows a **clean, modular monolith** design pattern. The recommendation scoring engine is isolated as a **pure domain logic layer** independent of database and HTTP transport concerns:

```
                            ┌────────────────────────┐
                            │       HTTP Client      │
                            │   (cURL, Postman, Web) │
                            └───────────┬────────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │    NestJS Controllers  │
                            │  (Validation & Pipes)  │
                            └───────────┬────────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │    Domain Services     │
                            │ (Candidates/Jobs/Recs) │
                            └───────────┬────────────┘
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  ▼                                           ▼
      ┌─────────────────────────┐               ┌──────────────────────────┐
      │   TypeORM Repositories  │               │   Pure Scoring Engine    │
      │   (PostgreSQL Database) │               │   - Must-have Filter     │
      └─────────────────────────┘               │   - Skill Normalizer     │
                                                │   - Experience Scorer    │
                                                │   - Location Scorer      │
                                                │   - Salary Scorer        │
                                                └──────────────────────────┘
```

---

## Data Model

### Candidate
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | Auto-increment primary key |
| `name` | `string` | Candidate full name |
| `skills` | `string[]` | Array of skill strings possessed by candidate |
| `yearsOfExperience` | `number` | Total relevant industry experience in years |
| `location` | `string` | City / base location of the candidate |
| `expectedSalary` | `number` | Annual expected compensation (e.g. INR / USD) |

### Job Posting
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | Auto-increment primary key |
| `title` | `string` | Job title |
| `minYearsExperience` | `number` | Minimum required experience |
| `location` | `string` | Job location |
| `salaryMin` | `number` | Minimum budget ceiling |
| `salaryMax` | `number` | Maximum budget ceiling |
| `remoteAllowed` | `boolean` | Indicates if remote work is supported |
| `skills` | `JobSkill[]` | 1:N related skills marked `must-have` or `nice-to-have` |

---

## Scoring Engine Methodology

### Weighting Logic & Reasoning

The overall score is calibrated out of **100 maximum points**:

| Dimension | Default Max Points | Allocation % | Key Rationale |
| :--- | :---: | :---: | :--- |
| **Skills** | **50** | **50%** | The core requirement for any role is technical/functional capability. Without the required skill competencies, a candidate cannot perform the job, regardless of seniority or location. |
| **Experience** | **20** | **20%** | Experience indicates domain maturity and execution autonomy. It is weighted heavily but scored proportionally so high-potential candidates slightly below tenure requirements remain discoverable. |
| **Location** | **15** | **15%** | Geographic compatibility impacts daily work, but modern remote flexibility lowers hard geographical barriers. Remote-friendly roles allow candidates outside the primary city to match well. |
| **Salary Fit** | **15** | **15%** | Compensation alignment ensures practical feasibility. A role with budget ceiling below candidate expectation cannot close, while roles within or above expectation achieve full score. |
| **Total** | **100** | **100%** | Comprehensive, explainable score from 0 to 100. |

---

### 1. Must-Have Skills (Hard Gate)

- **Rule**: `must-have` skills are non-negotiable. If a candidate is missing even **one** must-have skill, the job is **immediately rejected** (`score = 0`, excluded from the recommendation output).
- **Skill Normalization**: Skills are canonicalized prior to matching (whitespace trimmed, lowercased, and mapped across common aliases such as `ts` -> `typescript`, `node` -> `node.js`, `postgres` -> `postgresql`).

### 2. Skill Score Calculation (50 pts)

Once the candidate passes all must-have skills:
- **Must-have allocation**: 70% of skill weight (**35 pts**) is awarded for matching all must-have skills.
- **Nice-to-have allocation**: 30% of skill weight (**15 pts**) is awarded proportionally based on the coverage of nice-to-have skills:
  $$\text{niceToHaveScore} = \left(\frac{\text{matchedNiceToHave}}{\text{totalNiceToHave}}\right) \times 15$$
- *Edge cases*:
  - If a job specifies only `must-have` skills, matching all must-haves awards the full **50/50** points.
  - If a job specifies only `nice-to-have` skills, nice-to-have matches scale across the entire **50** points.

### 3. Experience Score Calculation (20 pts)

- **Formula**:
  $$\text{experienceScore} = \min\left(\frac{\text{candidateYears}}{\text{minYearsExperience}}, 1.0\right) \times 20$$
- **Why penalize rather than exclude?**
  > Hard-excluding candidates who fall 6 months or 1 year below a formal minimum experience requirement filters out exceptional talent who possess the exact skill match and compensation fit. Proportional penalization rewards senior candidates with full points while keeping high-performing candidates eligible at a lower total score.

### 4. Location Score Calculation (15 pts)

- **Priority Hierarchy**:
  1. **Exact Location Match**: **15 pts** (100% of location weight)
  2. **Location Mismatch + Remote Allowed**: **10 pts** (66.7% of location weight)
  3. **Location Mismatch + Onsite Only**: **0 pts** (0% of location weight)

### 5. Salary Score Calculation (15 pts)

- **Logic**:
  - If `expectedSalary <= salaryRange.max`: **15 pts** (Job budget can accommodate or comfortably exceed candidate's expectation).
  - If `expectedSalary > salaryRange.max`: **0 pts** (Job budget ceiling is below candidate expectation, creating an irreconcilable gap).

---

## API Reference

### 1. Create Candidate Profile
`POST /candidates`

**Request Body:**
```json
{
  "name": "Ashish Rana",
  "skills": ["typescript", "node.js", "postgresql", "docker", "nestjs"],
  "yearsOfExperience": 2.5,
  "location": "Gurugram",
  "expectedSalary": 1400000
}
```

**Response (`201 Created`):**
```json
{
  "id": 1,
  "name": "Ashish Rana",
  "skills": ["typescript", "node.js", "postgresql", "docker", "nestjs"],
  "yearsOfExperience": 2.5,
  "location": "Gurugram",
  "expectedSalary": 1400000,
  "createdAt": "2026-09-12T05:30:00.000Z",
  "updatedAt": "2026-09-12T05:30:00.000Z"
}
```

---

### 2. Create Job Posting
`POST /jobs`

**Request Body:**
```json
{
  "title": "Backend Engineer (Node/NestJS)",
  "requiredSkills": [
    { "name": "typescript", "type": "must-have" },
    { "name": "node.js", "type": "must-have" },
    { "name": "postgresql", "type": "must-have" },
    { "name": "nestjs", "type": "nice-to-have" },
    { "name": "docker", "type": "nice-to-have" }
  ],
  "minYearsExperience": 2,
  "location": "Gurugram",
  "salaryRange": {
    "min": 1200000,
    "max": 1800000
  },
  "remoteAllowed": false
}
```

**Response (`201 Created`):**
```json
{
  "id": 1,
  "title": "Backend Engineer (Node/NestJS)",
  "minYearsExperience": 2,
  "location": "Gurugram",
  "salaryMin": 1200000,
  "salaryMax": 1800000,
  "remoteAllowed": false,
  "skills": [
    { "id": 1, "jobId": 1, "name": "typescript", "type": "must-have" },
    { "id": 2, "jobId": 1, "name": "node.js", "type": "must-have" },
    { "id": 3, "jobId": 1, "name": "postgresql", "type": "must-have" },
    { "id": 4, "jobId": 1, "name": "nestjs", "type": "nice-to-have" },
    { "id": 5, "jobId": 1, "name": "docker", "type": "nice-to-have" }
  ],
  "createdAt": "2026-09-12T05:30:00.000Z",
  "updatedAt": "2026-09-12T05:30:00.000Z"
}
```

---

### 3. Get Job Recommendations for Candidate
`GET /candidates/:id/recommendations?limit=10`

**Response (`200 OK`):**
```json
{
  "candidate": {
    "id": 1,
    "name": "Ashish Rana",
    "skills": ["typescript", "node.js", "postgresql", "docker", "nestjs"],
    "location": "Gurugram"
  },
  "totalMatches": 2,
  "recommendations": [
    {
      "jobId": 1,
      "title": "Backend Engineer (Node/NestJS)",
      "score": 100,
      "breakdown": {
        "skills": "50/50",
        "experience": "20/20",
        "location": "15/15",
        "salary": "15/15"
      },
      "details": {
        "skills": {
          "score": 50,
          "max": 50,
          "passedMustHave": true,
          "missingMustHaves": [],
          "matchedMustHaves": ["typescript", "node.js", "postgresql"],
          "matchedNiceToHaves": ["nestjs", "docker"],
          "totalMustHaves": 3,
          "totalNiceToHaves": 2,
          "text": "50/50",
          "explanation": "Matched all 3 must-have skills and 2/2 nice-to-have skills (nestjs, docker)"
        },
        "experience": {
          "score": 20,
          "max": 20,
          "text": "20/20",
          "explanation": "Meets or exceeds required experience (2.5 years vs 2 years required)."
        },
        "location": {
          "score": 15,
          "max": 15,
          "text": "15/15",
          "explanation": "Exact location match (Gurugram)."
        },
        "salary": {
          "score": 15,
          "max": 15,
          "text": "15/15",
          "explanation": "Expected salary (1,400,000) falls cleanly inside job budget [1,200,000 - 1,800,000]."
        }
      },
      "explanations": [
        "Matched all 3 must-have skills and 2/2 nice-to-have skills (nestjs, docker)",
        "Meets or exceeds required experience (2.5 years vs 2 years required).",
        "Exact location match (Gurugram).",
        "Expected salary (1,400,000) falls cleanly inside job budget [1,200,000 - 1,800,000]."
      ]
    }
  ]
}
```

---

### 4. Reverse Recommendations: Best Candidates for a Job (Bonus)
`GET /jobs/:id/recommendations?limit=10`

Returns the highest matching qualified candidates for a given job posting.

---

### 5. Configurable Weights (Bonus)
Scoring weights can be customized dynamically using query parameters:
```http
GET /candidates/1/recommendations?limit=5&skillWeight=40&experienceWeight=30&locationWeight=15&salaryWeight=15
```

---

## Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18+ (Node 20+ recommended)
- **PostgreSQL**: v14+ running locally (or via Docker)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/imaashishrana/Job_Recommendation_Engine.git
cd Job_Recommendation_Engine

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Run database seed (populates sample candidates & jobs)
npm run seed

# 5. Start development server
npm run start:dev
```
The API will be running on `http://localhost:3000`.

---

## Running with Docker & Docker Compose

To start both PostgreSQL and the NestJS API with a single command:

```bash
# Build and run containers
docker-compose up --build -d

# View logs
docker-compose logs -f api
```

The database initializes automatically with persistent storage in the `pgdata` Docker volume.

---

## Running Tests

The test suite covers unit tests for skill normalization, must-have gating, nice-to-have bonuses, experience penalization, location hierarchy, salary bounds, descending ranking, and reverse views:

```bash
# Run all unit tests
npm test

# Run tests with code coverage report
npm run test:cov
```

---

## Assumptions & Future Enhancements

### Assumptions Made:
1. **Single Currency**: All salaries are evaluated in the same base currency units.
2. **Skill Equivalence**: Skill aliases (`ts` -> `typescript`, `reactjs` -> `react`) are normalized through canonical dictionaries.
3. **Experience Linearity**: Candidates below experience requirements are penalized linearly rather than quadratically or with hard step functions.
4. **Budget Ceiling Strictness**: Jobs with budget ceilings lower than candidate expectations receive zero points on the salary dimension because offers below expectation rarely close in practice.

### What to do differently with more time:
1. **Semantic Skill Graph**: Integrate hierarchical taxonomy / ontologies (e.g. knowing `NestJS` implies `Node.js` and `TypeScript`).
2. **Geographical Proximity Scoring**: Use geocoding/distance calculations (e.g. Haversine distance) rather than exact string equality for neighboring cities.
3. **Authentication & Multi-Tenancy**: Add JWT authentication with role-based access control (Candidates vs Recruiters).
4. **Audit Log & Analytics**: Track recommendation click-through rates and feedback to tune default weights dynamically.

---

## AI Usage Statement

In accordance with the assignment guidelines:
- **How AI Tools Were Used**:
  - **Unit Testing**: Assisted in brainstorming edge cases and formatting the Jest unit test matrix (such as missing must-have combinations, experience boundary limits, and budget overlap scenarios).
  - **Documentation & Formatting**: Assisted in organizing and formatting the `README.md` structure and API examples for clear readability.
  - **Error Checking**: Used as an auxiliary tool for syntax checks, error inspection, and code readability review.
