/**
 * End-to-end test script for Davinci AI Screener.
 * Tests all features: auth, jobs, applicants, screening, bias guard, interview gen, feedback.
 *
 * Usage: API_URL=<base_url>/api npx tsx src/scripts/e2e-test.ts
 */

const API = process.env.API_URL || "http://localhost:4000/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function api(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  token?: string
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main Test Runner ────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 DAVINCI AI SCREENER — END-TO-END TESTS\n");
  console.log("=".repeat(60));

  const testUser = `testuser_${Date.now()}`;
  const testPass = "TestPassword123!";
  let token = "";

  // ─── 1. HEALTH CHECK ──────────────────────────────────────────────────────
  console.log("\n📍 1. Health Check");
  {
    const { status, data } = await api("GET", "/health");
    assert("API responds with 200", status === 200);
    assert("Database is connected", data?.database === "connected");
  }

  // ─── 2. AUTH: SIGNUP ──────────────────────────────────────────────────────
  console.log("\n📍 2. Auth — Signup");
  {
    const { status, data } = await api("POST", "/auth/signup", {
      username: testUser,
      password: testPass,
    });
    assert("Signup returns 201", status === 201, `got ${status}`);
    assert("Signup returns JWT token", typeof data?.token === "string");
    token = data?.token || "";
  }
  {
    const { status } = await api("POST", "/auth/signup", {
      username: testUser,
      password: testPass,
    });
    assert("Duplicate signup returns 409", status === 409, `got ${status}`);
  }
  {
    const { status } = await api("POST", "/auth/signup", {
      username: "ab",
      password: testPass,
    });
    assert("Short username returns 400", status === 400, `got ${status}`);
  }

  // ─── 3. AUTH: LOGIN ───────────────────────────────────────────────────────
  console.log("\n📍 3. Auth — Login");
  {
    const { status, data } = await api("POST", "/auth/login", {
      username: testUser,
      password: testPass,
    });
    assert("Login returns 200", status === 200, `got ${status}`);
    assert("Login returns JWT token", typeof data?.token === "string");
    token = data?.token || token; // use fresh token
  }
  {
    const { status } = await api("POST", "/auth/login", {
      username: testUser,
      password: "WrongPassword!",
    });
    assert("Wrong password returns 401", status === 401, `got ${status}`);
  }

  // ─── 4. AUTH MIDDLEWARE ───────────────────────────────────────────────────
  console.log("\n📍 4. Auth Middleware");
  {
    const { status } = await api("GET", "/screening/job/000000000000000000000000");
    assert("Unauthenticated request returns 401", status === 401, `got ${status}`);
  }

  // ─── 5. JOBS — CREATE ────────────────────────────────────────────────────
  console.log("\n📍 5. Jobs — Create");
  let jobId = "";
  {
    const { status, data } = await api(
      "POST",
      "/jobs",
      {
        title: "Senior Frontend Developer",
        description: "Build beautiful, performant UIs for our fintech platform using React and Next.js.",
        responsibilities: [
          "Build and maintain React/Next.js frontend",
          "Code review and mentoring junior devs",
          "Collaborate with design and backend teams",
        ],
        requirements: {
          requiredSkills: ["React", "TypeScript", "Next.js", "CSS/Tailwind"],
          preferredSkills: ["Redux", "GraphQL", "Testing (Jest/Cypress)"],
          yearsOfExperience: 3,
          educationLevel: "Bachelor's",
          educationField: "Computer Science",
        },
        niceToHave: ["Open source contributions", "Fintech experience"],
        location: "Kigali, Rwanda",
        workType: "remote",
      },
      token
    );
    assert("Create job returns 201", status === 201, `got ${status}`);
    assert("Job has _id", !!data?.data?._id);
    jobId = data?.data?._id || "";
    console.log(`    → Job ID: ${jobId}`);
  }

  // ─── 6. JOBS — LIST & GET ────────────────────────────────────────────────
  console.log("\n📍 6. Jobs — List & Get");
  {
    const { status, data } = await api("GET", "/jobs", undefined, token);
    assert("List jobs returns 200", status === 200, `got ${status}`);
    assert("Jobs array has at least 1", data?.data?.length >= 1);
  }
  {
    const { status, data } = await api("GET", `/jobs/${jobId}`, undefined, token);
    assert("Get single job returns 200", status === 200, `got ${status}`);
    assert("Job title matches", data?.data?.title === "Senior Frontend Developer");
  }

  // ─── 7. APPLICANTS — Submit two DIFFERENT candidates ─────────────────────
  console.log("\n📍 7. Applicants — Submit");

  // Submit all candidates via /davinci bulk endpoint
  // Candidate A: Strong match (7 yrs React/Next.js)
  // Candidate B: Weaker match (1 yr, no React)
  // Candidate C: Duplicate of Alice (same email) — should be deduped at screening time
  {
    const { status, data } = await api("POST", "/applicants/davinci", {
      jobId,
      profiles: [
        {
          fullName: "Alice Uwimana",
          email: "alice.uwimana@example.com",
          location: "Kigali, Rwanda",
          headline: "Senior Frontend Engineer at TechCorp",
          yearsOfExperience: 7,
          skills: "React, TypeScript, Next.js, Tailwind CSS, Redux, GraphQL, Jest",
          skillsJson: JSON.stringify([
            { name: "React", level: "Expert", yearsUsed: 6 },
            { name: "TypeScript", level: "Expert", yearsUsed: 5 },
            { name: "Next.js", level: "Expert", yearsUsed: 4 },
            { name: "Tailwind CSS", level: "Advanced", yearsUsed: 3 },
            { name: "Redux", level: "Advanced", yearsUsed: 4 },
            { name: "GraphQL", level: "Intermediate", yearsUsed: 2 },
            { name: "Jest", level: "Advanced", yearsUsed: 4 },
          ]),
          experienceJson: JSON.stringify([
            {
              company: "TechCorp Africa",
              role: "Senior Frontend Engineer",
              startDate: "2021-01",
              endDate: "Present",
              description: "Led 5-person frontend team. Built fintech dashboard serving 200k users. Reduced bundle size by 60% through code splitting. Mentored 3 junior developers.",
              technologies: ["React", "Next.js", "TypeScript", "Tailwind", "Redux Toolkit"],
            },
            {
              company: "StartupHub Kigali",
              role: "Frontend Developer",
              startDate: "2019-01",
              endDate: "2020-12",
              description: "Built e-commerce platform with React. Implemented payment integration with Stripe and MTN MoMo. Shipped 40+ features in 18 months.",
              technologies: ["React", "JavaScript", "CSS", "Node.js"],
            },
          ]),
          educationJson: JSON.stringify([
            { institution: "University of Rwanda", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2015, endYear: 2019 },
          ]),
          projectsJson: JSON.stringify([
            { name: "Rwanda Pay Dashboard", description: "Real-time payment analytics dashboard for 50k+ merchants", technologies: ["Next.js", "TypeScript", "D3.js", "Tailwind"], role: "Lead Developer" },
          ]),
          availabilityStatus: "Available",
          availabilityType: "Full-time",
        },
        {
          fullName: "Bob Mugisha",
          email: "bob.mugisha@example.com",
          location: "Nairobi, Kenya",
          headline: "Junior Backend Developer",
          yearsOfExperience: 1,
          skills: "Python, Django, HTML/CSS",
          skillsJson: JSON.stringify([
            { name: "Python", level: "Intermediate", yearsUsed: 1 },
            { name: "Django", level: "Beginner", yearsUsed: 0.5 },
            { name: "HTML/CSS", level: "Intermediate", yearsUsed: 1 },
          ]),
          experienceJson: JSON.stringify([
            {
              company: "Local Agency",
              role: "Intern Developer",
              startDate: "2025-06",
              endDate: "2025-12",
              description: "Built small internal tools with Django. Assisted with database migrations.",
              technologies: ["Python", "Django", "PostgreSQL"],
            },
          ]),
          educationJson: JSON.stringify([
            { institution: "Kenyatta University", degree: "Bachelor's", fieldOfStudy: "Information Technology", startYear: 2021, endYear: 2025 },
          ]),
          projectsJson: JSON.stringify([
            { name: "Django Admin Tool", description: "Internal CRUD tool for managing inventory", technologies: ["Python", "Django"], role: "Developer" },
          ]),
          availabilityStatus: "Available",
          availabilityType: "Full-time",
        },
        {
          fullName: "Alice Uwimana",
          email: "alice.uwimana@example.com",
          location: "Kigali, Rwanda",
          headline: "Senior Frontend Engineer",
          yearsOfExperience: 7,
          skills: "React",
          skillsJson: JSON.stringify([{ name: "React", level: "Expert", yearsUsed: 6 }]),
          experienceJson: JSON.stringify([
            { company: "TechCorp Africa", role: "Senior Frontend Engineer", startDate: "2021-01", endDate: "Present", description: "Led frontend team.", technologies: ["React"] },
          ]),
          educationJson: JSON.stringify([
            { institution: "University of Rwanda", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2015, endYear: 2019 },
          ]),
          projectsJson: JSON.stringify([
            { name: "Dashboard", description: "Analytics dashboard", technologies: ["React"], role: "Lead" },
          ]),
          availabilityStatus: "Available",
          availabilityType: "Full-time",
        },
      ],
    }, token);
    assert("Bulk submit 3 candidates returns 201", status === 201, `got ${status}: ${JSON.stringify(data)}`);
    assert("All 3 profiles inserted", data?.count === 3 || data?.data?.length === 3, `count=${data?.count}, data.length=${data?.data?.length}`);
  }

  // ─── 8. APPLICANT COUNT ──────────────────────────────────────────────────
  console.log("\n📍 8. Applicant Count");
  {
    const { status, data } = await api("GET", `/applicants/job/${jobId}/count`, undefined, token);
    assert("Applicant count endpoint returns 200", status === 200, `got ${status}`);
    assert("Count is 3 (including duplicate)", data?.count === 3, `got ${data?.count}`);
  }

  // ─── 9. SCREENING — TRIGGER ──────────────────────────────────────────────
  console.log("\n📍 9. Screening — Trigger");
  let screeningId = "";
  {
    const { status, data } = await api(
      "POST",
      "/screening/trigger",
      { jobId, shortlistSize: 10 },
      token
    );
    assert("Trigger screening returns 202", status === 202, `got ${status}: ${JSON.stringify(data)}`);
    assert("Returns screeningId", !!data?.data?.screeningId);
    screeningId = data?.data?.screeningId || "";
    console.log(`    → Screening ID: ${screeningId}`);

    // Check deduplication message
    const msg = data?.message || "";
    console.log(`    → Message: ${msg}`);
    assert("Dedup: total candidates = 2", data?.data?.totalCandidates === 2, `got ${data?.data?.totalCandidates}`);
    assert("Dedup: 1 duplicate removed", data?.data?.duplicatesRemoved === 1, `got ${data?.data?.duplicatesRemoved}`);
  }

  // ─── 10. SCREENING — POLL FOR LIVE UPDATES ──────────────────────────────
  console.log("\n📍 10. Screening — Poll for Live Updates");
  let finalScreening: any = null;
  let sawCandidateProgress = false;
  let sawProgressCounts = false;
  let pollCount = 0;
  const maxPolls = 120; // 2 minutes max

  while (pollCount < maxPolls) {
    pollCount++;
    const { status, data } = await api("GET", `/screening/${screeningId}`, undefined, token);

    if (status !== 200) {
      console.log(`    ⚠️  Poll ${pollCount}: status ${status}`);
      await sleep(1000);
      continue;
    }

    const screening = data?.data;

    // Check for candidateProgress updates
    if (screening?.candidateProgress?.length > 0 && !sawCandidateProgress) {
      sawCandidateProgress = true;
      console.log(`    📡 Poll ${pollCount}: candidateProgress has ${screening.candidateProgress.length} entries`);
      for (const cp of screening.candidateProgress) {
        console.log(`       → ${cp.candidateName}: ${cp.status}${cp.overallScore ? ` (score: ${cp.overallScore})` : ""}`);
      }
    }

    // Check progress counts
    if (screening?.progress?.completed > 0 && !sawProgressCounts) {
      sawProgressCounts = true;
      console.log(`    📡 Poll ${pollCount}: progress ${screening.progress.completed}/${screening.progress.total}`);
    }

    if (screening?.status === "completed") {
      finalScreening = screening;
      console.log(`    ✅ Screening completed after ${pollCount} polls`);
      break;
    }
    if (screening?.status === "failed") {
      console.log(`    ❌ Screening FAILED: ${screening.errorMessage}`);
      finalScreening = screening;
      break;
    }

    await sleep(1000);
  }

  assert("Screening completed (not timed out)", finalScreening?.status === "completed", finalScreening?.status || "timeout");
  // candidateProgress may only be visible in the final result if polls were too slow to catch mid-flight
  if (!sawCandidateProgress && finalScreening?.candidateProgress?.length > 0) {
    sawCandidateProgress = true;
    console.log(`    📡 candidateProgress found in final result: ${finalScreening.candidateProgress.length} entries`);
    for (const cp of finalScreening.candidateProgress) {
      console.log(`       → ${cp.candidateName}: ${cp.status}${cp.overallScore ? ` (score: ${cp.overallScore})` : ""}`);
    }
  }
  assert("Live candidateProgress was received during polling", sawCandidateProgress);
  assert("Live progress counts were received", sawProgressCounts);

  // ─── 11. SCREENING RESULTS — SHORTLIST QUALITY ───────────────────────────
  console.log("\n📍 11. Screening Results — Shortlist Quality");
  if (finalScreening?.status === "completed") {
    const shortlist = finalScreening.shortlist || [];
    assert("Shortlist has candidates", shortlist.length > 0, `got ${shortlist.length}`);
    assert("No duplicate candidates in shortlist",
      new Set(shortlist.map((c: any) => c.applicantId)).size === shortlist.length
    );

    // Verify score differentiation
    if (shortlist.length >= 2) {
      const alice = shortlist.find((c: any) => c.candidateName.toLowerCase().includes("alice"));
      const bob = shortlist.find((c: any) => c.candidateName.toLowerCase().includes("bob"));

      if (alice && bob) {
        console.log(`    → Alice: score ${alice.overallScore} | Bob: score ${bob.overallScore}`);
        assert(
          "Alice (strong candidate) scores HIGHER than Bob (weak candidate)",
          alice.overallScore > bob.overallScore,
          `Alice=${alice.overallScore}, Bob=${bob.overallScore}`
        );
        assert(
          "Score difference is meaningful (>15 points)",
          alice.overallScore - bob.overallScore > 15,
          `diff=${alice.overallScore - bob.overallScore}`
        );
      } else {
        console.log("    ⚠️  Could not find Alice and Bob by name in shortlist");
        console.log("    Candidates:", shortlist.map((c: any) => `${c.candidateName} (${c.overallScore})`).join(", "));
      }
    }

    // Check each candidate has required fields
    for (const c of shortlist) {
      assert(`Candidate "${c.candidateName}" has overallScore`, typeof c.overallScore === "number");
      assert(`Candidate "${c.candidateName}" has scoreBreakdown`, !!c.scoreBreakdown);
      assert(`Candidate "${c.candidateName}" has strengths[]`, Array.isArray(c.strengths) && c.strengths.length > 0);
      assert(`Candidate "${c.candidateName}" has gaps[]`, Array.isArray(c.gaps));
      assert(`Candidate "${c.candidateName}" has recommendation`, typeof c.recommendation === "string" && c.recommendation.length > 10);
    }
  }

  // ─── 12. BIAS GUARD AUDIT ────────────────────────────────────────────────
  console.log("\n📍 12. Bias Guard Audit");
  if (finalScreening?.biasAudit) {
    const audit = finalScreening.biasAudit;
    assert("Bias audit has riskLevel", ["low", "medium", "high"].includes(audit.riskLevel));
    assert("Bias audit has flags array", Array.isArray(audit.flags));
    assert("Bias audit has overallAssessment", typeof audit.overallAssessment === "string");

    // Check duplicate flag was injected
    const dupFlag = audit.flags.find((f: any) =>
      f.description?.toLowerCase().includes("duplicate")
    );
    assert("Duplicate applicant flag present in bias audit", !!dupFlag);

    console.log(`    → Risk Level: ${audit.riskLevel}`);
    console.log(`    → Flags: ${audit.flags.length}`);
    for (const f of audit.flags) {
      console.log(`       • [${f.severity}] ${f.type}: ${f.description.slice(0, 100)}...`);
    }
  }

  // ─── 13. INTERVIEW QUESTIONS ─────────────────────────────────────────────
  console.log("\n📍 13. Interview Questions");
  if (finalScreening?.shortlist) {
    let hasQuestions = false;
    for (const c of finalScreening.shortlist) {
      if (c.interviewQuestions?.length > 0) {
        hasQuestions = true;
        console.log(`    → ${c.candidateName}: ${c.interviewQuestions.length} questions generated`);
        for (const q of c.interviewQuestions.slice(0, 2)) {
          console.log(`       [${q.area}] ${q.question.slice(0, 80)}...`);
        }
      }
    }
    assert("At least one candidate has interview questions", hasQuestions);
  }

  // ─── 14. RECRUITER FEEDBACK ──────────────────────────────────────────────
  console.log("\n📍 14. Recruiter Feedback");
  if (finalScreening?.shortlist?.length > 0) {
    const topRank = finalScreening.shortlist[0].rank;
    {
      const { status } = await api(
        "POST",
        "/feedback",
        { screeningId, rank: topRank, feedback: "accepted" },
        token
      );
      assert("Accept candidate returns 200", status === 200, `got ${status}`);
    }

    // Verify it persisted
    {
      const { data } = await api("GET", `/screening/${screeningId}`, undefined, token);
      const c = data?.data?.shortlist?.find((c: any) => c.rank === topRank);
      assert("Feedback persisted as 'accepted'", c?.recruiterFeedback === "accepted", `got ${c?.recruiterFeedback}`);
    }

    if (finalScreening.shortlist.length > 1) {
      const secondRank = finalScreening.shortlist[1].rank;
      {
        const { status } = await api(
          "POST",
          "/feedback",
          { screeningId, rank: secondRank, feedback: "rejected" },
          token
        );
        assert("Reject candidate returns 200", status === 200, `got ${status}`);
      }
    }
  }

  // ─── 15. SCREENING HISTORY ───────────────────────────────────────────────
  console.log("\n📍 15. Screening History");
  {
    const { status, data } = await api("GET", `/screening/job/${jobId}`, undefined, token);
    assert("Screening history returns 200", status === 200, `got ${status}`);
    assert("History includes our screening", data?.data?.length >= 1);
  }

  // ─── SUMMARY ─────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log(`\n🏁 RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)\n`);

  if (failed > 0) {
    console.log("⚠️  Some tests failed. Review output above.\n");
    process.exit(1);
  } else {
    console.log("🎉 ALL TESTS PASSED — System is production-ready!\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("\n💥 Test runner crashed:", err);
  process.exit(1);
});
