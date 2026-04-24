# Da Vinci Recruiter

An AI-powered talent screening platform that helps recruiters objectively evaluate and rank candidates, with transparent reasoning and bias auditing for every decision.

**Live app:** [https://frontend-nine-alpha-49.vercel.app](https://frontend-nine-alpha-49.vercel.app)

---

## What It Does

**For Recruiters (HR Portal):**
1. Create a job opening with requirements, skills, and custom screening questions
2. Candidates apply through the public portal with structured profiles
3. Click **Run AI Screening** to get a ranked top-10 shortlist
4. Review evidence-based scores with per-candidate strengths, gaps, and fit summary
5. Use auto-generated interview questions tailored to each candidate's profile
6. Review the Bias Guard audit to ensure fair, defensible decisions

**For Candidates (Public Portal):**
1. Browse open positions at `/portal`
2. Apply with a structured profile — skills, experience, projects, education
3. Receive a consistent evaluation with transparent criteria

---

## Core Features

- **AI Ranking** — Scores candidates across skills (40%), experience (30%), education (15%), and overall fit (15%)
- **Evidence-Based Reasoning** — Every score includes specific evidence from the candidate's profile
- **Bias Guard** — A second independent AI pass audits each ranking for institution bias, career-gap penalties, company-type favoritism, and demographic signal risk
- **Interview Questions** — 5 tailored questions per shortlisted candidate (technical, behavioral, gap probes, cultural fit)
- **Multi-tenancy** — Each recruiter sees only their own jobs and candidates
- **Recruiter Feedback Loop** — Accept/reject decisions stored per candidate for future calibration

---

## Architecture

```
frontend/   — Next.js 14 + Redux Toolkit + Tailwind CSS  → Vercel
backend/    — Node.js + Express + TypeScript              → Railway
shared/     — Shared TypeScript types
            — MongoDB Atlas (jobs, applicants, screening results)
```

**AI:** Google Gemini 2.5 Flash — primary ranking + bias audit + interview generation

---

## AI Decision Flow

```
1. Job + All Applicants → Gemini (weighted scoring prompt)
   Skills 40% · Experience 30% · Education 15% · Fit 15%
   → Ranked shortlist with strengths, gaps, recommendation

2. Shortlist → Gemini (bias audit prompt)
   → BiasAuditReport: riskLevel + flagged patterns

3. Per candidate → Gemini (interview question prompt)
   → 5 tailored questions per candidate
```

---

## Setup

```bash
# Install all dependencies
npm run install:all

# Backend
cd backend
cp .env.example .env   # fill in GEMINI_API_KEY and MONGO_URI
npm run dev

# Frontend
cd frontend
cp .env.local.example .env.local
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | Frontend origin for CORS |
| `JWT_SECRET` | Secret for signing JWTs |
| `PORT` | Server port (default 4000) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## Notes

- Gemini output is JSON-validated with safe fallbacks for malformed responses
- Candidate profile text is capped at 8,000 characters to manage token usage
- Bias Guard is advisory — it flags concerns but does not reorder rankings automatically
- Screening runs asynchronously; the UI polls for status updates in real time
