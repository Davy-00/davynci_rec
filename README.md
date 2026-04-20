# Davinci AI Screener

AI-powered talent screening platform that ranks your top 10 candidates with intelligent reasoning.

## What It Does

**For Recruiters:**
1. Post a job opening (title, requirements, skills needed)
2. Candidates apply through the public portal with their profiles
3. Click "Run AI Screening" to get your top 10 ranked candidates
4. See detailed reasons why each person qualified — skills match, experience depth, gaps
5. Get 5 custom interview questions for each candidate, ready to use
6. Review bias audit to ensure fair evaluation

**For Job Seekers:**
1. Visit the public portal at `/portal`
2. Browse open positions  
3. Click "Apply Now" and submit your structured profile (skills, experience, projects, education)
4. Get evaluated fairly by AI with transparent scoring

## Core Features

- **Intelligent AI Ranking:** Analyzes skills (40%), experience (30%), education (15%), and overall relevance (15%)
- **Evidence-Based Scoring:** Each candidate gets specific reasons for their score with concrete examples
- **Bias Guard:** Independent audit pass flags potential bias in institution favoritism, career gaps, name/gender signals
- **Interview Questions:** 5 tailored questions per shortlisted candidate targeting their strengths and gaps
- **Multi-tenancy:** Each recruiter account is isolated — you only see your own jobs and candidates

## Quick Demo Flow

**Setup (one-time):**
1. Visit `http://localhost:3000/hr/signup`
2. Create your recruiter account (username + password)
3. You'll be redirected to your empty dashboard

**Live Demo:**
1. Click "New Job" → Fill in job details (title: "Senior Frontend Engineer", required skills: React, TypeScript, etc.)
2. Post the job
3. Open the portal at `http://localhost:3000/portal` (in a new tab or incognito to simulate a candidate)
4. Click on your job → "Apply Now"
5. Fill out the structured application form (or upload CSV with multiple candidates)
6. Go back to your HR dashboard → Open the job → You'll see "X applications received"
7. Select "Top 10" and click "Run AI Screening"
8. Watch AI analyze each candidate in real-time
9. View ranked shortlist with:
   - Overall score + breakdown (skills, experience, education, relevance)
   - Specific strengths with evidence (e.g., "6 years React, built 3 production apps")
   - Honest gaps (e.g., "No Redux Toolkit experience but has Context API")
   - Clear recommendation for next steps
   - 5 interview questions targeting their profile
10. Review Bias Guard audit for any red flags in the ranking process

## Why This Works

- Solves a real hiring pain point: manual resume screening takes hours
- AI scoring is transparent (breakdown shows why someone ranked #3 vs #8)
- Bias audit catches potential issues before they become problems
- Structured profiles make comparisons fair and consistent
- Outputs interview questions, so recruiters can act immediately

## Architecture

```
frontend/   — Next.js 14 + Redux + Tailwind CSS  → Vercel
backend/    — Node.js + Express + TypeScript      → Railway / Render
shared/     — Shared TypeScript types
MongoDB Atlas — Jobs, Applicants, Screening Results
```

## Key Features

### 1. Bias Guard
After ranking candidates, a second AI pass audits for common bias patterns: school favoritism, company-type bias, career gap penalties, language issues in reasoning. Returns a risk level and flagged concerns.

### 2. Interview Question Generator
For each shortlisted candidate, generates 5 custom questions based on their profile gaps and strengths. Questions are categorized: technical, behavioral, gap_probe, cultural_fit.

### 3. Recruiter Feedback Loop
Accept/reject feedback on each candidate gets stored. Future versions can use this data to calibrate scoring weights.

## AI Decision Flow

```
1. Job + All Applicants → Gemini 1.5 Pro (single prompt, weighted scoring)
   Weights: Skills 40% · Experience 30% · Education 15% · Relevance 15%
   → Ranked shortlist with strengths, gaps, recommendation

2. Shortlist → Gemini 1.5 Pro (bias audit prompt)
   → BiasAuditReport: riskLevel + flagged patterns

3. Per candidate → Gemini 1.5 Flash (interview question prompt)
   → 5 tailored questions per candidate (technical, behavioral, gap_probe)
```

## Setup

```bash
# Install all
npm run install:all

# Backend
cd backend
cp .env.example .env   # fill in GEMINI_API_KEY + MONGO_URI
npm run dev

# Frontend
cd frontend
cp .env.local.example .env.local
npm run dev
```

## Environment Variables

### Backend
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | Frontend origin for CORS |
| `PORT` | Server port (default 4000) |

### Frontend
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

## Assumptions & Limitations
- Gemini output is JSON-validated with safe fallbacks for malformed responses.
- Resume text is capped at 8,000 characters to stay within token budget.
- Bias audit is advisory only — it does not automatically reorder rankings.
- Feedback loop stores preferences but does not yet retrain model weights between sessions (designed for future integration).
