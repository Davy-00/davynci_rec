/**
 * Demo seed script: Creates 5 jobs with 30 applicants each (150 total)
 * Usage:  API_URL=<base_url>/api npx tsx src/scripts/seedDemo5Jobs.ts
 */

const API = process.env.API_URL || "http://localhost:4000/api";

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
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// ─── 5 Job Definitions ──────────────────────────────────────────────────────

const JOBS = [
  {
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "Remote (Africa)",
    workType: "remote" as const,
    description:
      "Lead frontend development for our fintech platform serving millions of users. Architect scalable React applications, mentor junior developers, and drive technical excellence across the team.",
    responsibilities: [
      "Architect and build React/Next.js applications serving 1M+ users",
      "Lead code reviews and mentor junior frontend developers",
      "Collaborate with design and product teams on UX decisions",
      "Optimize web performance, accessibility, and SEO",
      "Establish frontend best practices and coding standards",
    ],
    requirements: {
      requiredSkills: ["React", "TypeScript", "Next.js", "CSS/Tailwind"],
      preferredSkills: ["Redux", "GraphQL", "Jest", "Cypress", "Webpack"],
      yearsOfExperience: 4,
      educationLevel: "Bachelor's",
      educationField: "Computer Science",
    },
    niceToHave: ["Open source contributions", "Fintech experience", "Leadership experience", "Design systems"],
    formQuestions: [
      "Describe a complex frontend architecture decision you made and its impact",
      "How do you approach performance optimization in React applications?",
    ],
  },
  {
    title: "Backend Engineer (Node.js)",
    department: "Engineering",
    location: "Nairobi, Kenya (Hybrid)",
    workType: "hybrid" as const,
    description:
      "Design and build scalable APIs and microservices for our growing payment platform. You'll work with Node.js, PostgreSQL, and cloud infrastructure to process millions of transactions.",
    responsibilities: [
      "Design and implement RESTful and GraphQL APIs",
      "Manage PostgreSQL databases and write complex queries",
      "Build CI/CD pipelines and monitoring systems",
      "Write comprehensive unit and integration tests",
      "Optimize database performance and query efficiency",
    ],
    requirements: {
      requiredSkills: ["Node.js", "TypeScript", "PostgreSQL", "REST APIs"],
      preferredSkills: ["Docker", "AWS/GCP", "Redis", "GraphQL", "Kafka"],
      yearsOfExperience: 3,
      educationLevel: "Bachelor's",
      educationField: "Computer Science or related",
    },
    niceToHave: ["Microservices architecture", "Event-driven systems", "Payment processing experience"],
    formQuestions: [
      "Describe your experience with database optimization and query tuning",
      "How do you ensure API reliability at scale?",
    ],
  },
  {
    title: "Data Analyst",
    department: "Data",
    location: "Lagos, Nigeria",
    workType: "onsite" as const,
    description:
      "Analyze business data to drive product decisions and growth. Build dashboards, run experiments, and deliver actionable insights to stakeholders across the company.",
    responsibilities: [
      "Build dashboards and reports using BI tools",
      "Analyze user behavior and product metrics",
      "Design and evaluate A/B tests",
      "Present findings to leadership and product teams",
      "Maintain data quality and documentation",
    ],
    requirements: {
      requiredSkills: ["SQL", "Python", "Data Visualization", "Excel"],
      preferredSkills: ["Tableau", "Power BI", "R", "Statistics", "dbt"],
      yearsOfExperience: 2,
      educationLevel: "Bachelor's",
      educationField: "Statistics, Math, or Computer Science",
    },
    niceToHave: ["Machine learning basics", "Experiment design", "Fintech domain knowledge"],
    formQuestions: [
      "Walk us through a data analysis project that drove business impact",
      "How do you validate the quality of your data before analysis?",
    ],
  },
  {
    title: "Product Manager",
    department: "Product",
    location: "Remote (Africa)",
    workType: "remote" as const,
    description:
      "Lead product development from ideation to launch. Work closely with engineering, design, and business teams to build products that solve real problems for African businesses.",
    responsibilities: [
      "Define product vision, strategy, and roadmap",
      "Conduct user research and competitive analysis",
      "Write detailed product requirements and user stories",
      "Prioritize features based on business impact and user needs",
      "Measure product success and iterate based on data",
    ],
    requirements: {
      requiredSkills: ["Product Strategy", "User Research", "Agile/Scrum", "Data Analysis"],
      preferredSkills: ["SQL", "Figma", "A/B Testing", "Growth Marketing"],
      yearsOfExperience: 3,
      educationLevel: "Bachelor's",
      educationField: "Business, Engineering, or related",
    },
    niceToHave: ["Fintech experience", "Technical background", "Startup experience", "MBA"],
    formQuestions: [
      "Describe a product you launched from 0 to 1. What was your approach?",
      "How do you prioritize when you have limited engineering resources?",
    ],
  },
  {
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Kigali, Rwanda",
    workType: "hybrid" as const,
    description:
      "Build and maintain our cloud infrastructure, CI/CD pipelines, and developer tooling. Enable the engineering team to ship faster and more reliably.",
    responsibilities: [
      "Manage AWS/GCP cloud infrastructure with IaC",
      "Build and maintain CI/CD pipelines",
      "Implement monitoring, logging, and alerting",
      "Optimize infrastructure costs and performance",
      "Ensure security and compliance standards",
    ],
    requirements: {
      requiredSkills: ["Docker", "Kubernetes", "AWS/GCP", "CI/CD", "Terraform"],
      preferredSkills: ["Python", "Go", "Prometheus", "Grafana", "GitHub Actions"],
      yearsOfExperience: 3,
      educationLevel: "Bachelor's",
      educationField: "Computer Science or related",
    },
    niceToHave: ["Multi-cloud experience", "Security certifications", "SRE practices"],
    formQuestions: [
      "Describe your approach to incident response and post-mortems",
      "How do you balance infrastructure stability with deployment velocity?",
    ],
  },
];

// ─── Applicant Generator ────────────────────────────────────────────────────

interface ApplicantSeed {
  fullName: string;
  email: string;
  location: string;
  headline: string;
  yearsOfExperience: number;
  skills: string;
  skillsJson: string;
  experienceJson: string;
  educationJson: string;
  projectsJson: string;
  availabilityStatus: string;
  availabilityType: string;
}

function mkApplicant(
  name: string,
  email: string,
  location: string,
  headline: string,
  yoe: number,
  skills: { name: string; level: string; yearsUsed: number }[],
  experience: { company: string; role: string; startDate: string; endDate: string; description: string; technologies: string[] }[],
  education: { institution: string; degree: string; fieldOfStudy: string; startYear: number; endYear: number }[],
  projects: { name: string; description: string; technologies: string[]; role: string }[],
): ApplicantSeed {
  return {
    fullName: name,
    email,
    location,
    headline,
    yearsOfExperience: yoe,
    skills: skills.map((s) => s.name).join(", "),
    skillsJson: JSON.stringify(skills),
    experienceJson: JSON.stringify(experience),
    educationJson: JSON.stringify(education),
    projectsJson: JSON.stringify(projects),
    availabilityStatus: "Available",
    availabilityType: "Full-time",
  };
}

// ─── Generate 150 Diverse Applicants (30 per job) ───────────────────────────

const FIRST_NAMES = [
  "Alice", "James", "Fatima", "David", "Amina", "Samuel", "Grace", "Emmanuel", "Sophie", "Kwame",
  "Blessing", "Moussa", "Chioma", "Peter", "Ngozi", "Yves", "Aisha", "Daniel", "Josephine", "Ibrahim",
  "Adama", "Linda", "Eric", "Rose", "Thabo", "Nyasha", "Zainab", "Prosper", "Kofi", "Amara",
  "Wanjiku", "Omar", "Felix", "Halima", "Tendai", "Oluwaseun", "Kevin", "Ruth", "Nadia", "Joseph",
  "Miriam", "Charles", "Patricia", "Michael", "Agnes", "Simon", "Esther", "Bob", "Martha", "John",
  "Vivian", "Patrick", "Dorothy", "Frank", "Helen", "George", "Joy", "Victor", "Sarah", "Abdul",
  "Cynthia", "Mark", "Naomi", "Paul", "Rachel", "Stephen", "Tina", "Andrew", "Uche", "Brian",
  "Nancy", "Collins", "Peace", "Dennis", "Stella", "Gregory", "Ann", "Hassan", "Betty", "Isaac",
];

const LAST_NAMES = [
  "Uwimana", "Okonkwo", "Hassan", "Mensah", "Diallo", "Abebe", "Mutua", "Nwachukwu", "Niyonzima", "Asante",
  "Adeyemi", "Traore", "Igwe", "Kamau", "Okafor", "Habimana", "Mohammed", "Osei", "Wambui", "Sow",
  "Keita", "Nyamwanga", "Tetteh", "Kamanzi", "Molefe", "Chirwa", "Osman", "Chirenje", "Appiah", "Faye",
  "Ngugi", "Diop", "Mugisha", "Juma", "Moyo", "Bakare", "Musyoka", "Nakamura", "Razafy", "Nkurunziza",
  "Ogutu", "Kimani", "Adhiambo", "Owusu", "Nyambura", "Mugabe", "Achieng", "Mugisha", "Otieno", "Banda",
  "Ochieng", "Kariuki", "Wanjiru", "Mwangi", "Achieng", "Omondi", "Kamau", "Mutua", "Wambui", "Hassan",
  "Muthoni", "Kipchirchir", "Langat", "Kiptoo", "Chebet", "Jepchirchir", "Koech", "Kiprotich", "Tanui", "Korir",
  "Oduor", "Onyango", "Odhiambo", "Oloo", "Okoth", "Owino", "Odongo", "Ochieng", "Ongoro", "Otieno",
];

const LOCATIONS = [
  "Kigali, Rwanda", "Lagos, Nigeria", "Nairobi, Kenya", "Accra, Ghana", "Dakar, Senegal",
  "Addis Ababa, Ethiopia", "Kampala, Uganda", "Dar es Salaam, Tanzania", "Lusaka, Zambia",
  "Harare, Zimbabwe", "Bujumbura, Burundi", "Kumasi, Ghana", "Mombasa, Kenya", "Abuja, Nigeria",
  "Ibadan, Nigeria", "Kisumu, Kenya", "Nakuru, Kenya", "Conakry, Guinea", "Bamako, Mali",
  "Antananarivo, Madagascar", "Lilongwe, Malawi", "Khartoum, Sudan", "Johannesburg, South Africa",
];

const COMPANIES = [
  "TechCorp Africa", "AfriPay", "Safaricom", "Hubtel", "Wave Mobile Money", "Telebirr",
  "Flutterwave", "Paystack", "Irembo", "MTN", "Andela", "Orange Money", "Access Bank",
  "Equity Bank", "GTBank", "BK Group", "Vodacom", "Fidelity Bank", "Twiga Foods",
  "AfriDelivery", "Orange CI", "SafeBoda", "Zeepay", "AC Group", "Interswitch",
  "WariPay", "Jumia", "Econet", "Steward Bank", "Dangote Group", "KCB Bank",
  "Airtel Money", "RwandAir", "Tigo", "M-PESA", "Telma", "BujaCode",
];

const UNIVERSITIES = [
  "University of Rwanda", "University of Lagos", "University of Nairobi", "KNUST", "Université Cheikh Anta Diop",
  "Addis Ababa University", "Jomo Kenyatta University", "University of Ibadan", "University of Ghana",
  "Université du Burundi", "University of Dar es Salaam", "Makerere University", "Strathmore University",
  "Ashesi University", "Carnegie Mellon University Africa", "MIT", "Stanford University", "École Polytechnique",
  "University of Zimbabwe", "University of Zambia", "Covenant University", "Moringa School",
  "WeThinkCode_ Bootcamp", "University of Khartoum", "INP-HB", "Kenyatta University",
];

const SKILL_POOLS: Record<string, string[]> = {
  frontend: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux", "GraphQL", "Jest", "Cypress", "Webpack", "CSS", "JavaScript"],
  backend: ["Node.js", "TypeScript", "PostgreSQL", "REST APIs", "Docker", "AWS", "Redis", "GraphQL", "Kafka", "Python", "Go"],
  data: ["SQL", "Python", "Tableau", "Power BI", "Excel", "R", "Statistics", "Data Visualization", "dbt", "Pandas", "Machine Learning"],
  product: ["Product Strategy", "User Research", "Agile/Scrum", "Data Analysis", "A/B Testing", "Figma", "SQL", "Growth Marketing", "Roadmapping"],
  devops: ["Docker", "Kubernetes", "AWS", "GCP", "CI/CD", "Terraform", "Prometheus", "Grafana", "GitHub Actions", "Python", "Go"],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ["example.com", "email.com", "mail.com"];
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, "");
  return `${cleanFirst}.${cleanLast}${randomInt(1, 99)}@${randomChoice(domains)}`;
}

function generateApplicant(jobType: string, index: number): ApplicantSeed {
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const email = generateEmail(firstName, lastName);
  const location = randomChoice(LOCATIONS);
  
  // Determine experience level based on job requirements
  let yoe: number;
  let skillLevel: string;
  
  if (jobType === "senior") {
    yoe = randomInt(4, 12);
    skillLevel = randomChoice(["Expert", "Expert", "Advanced"]);
  } else if (jobType === "mid") {
    yoe = randomInt(2, 5);
    skillLevel = randomChoice(["Advanced", "Intermediate", "Advanced"]);
  } else {
    yoe = randomInt(0, 3);
    skillLevel = randomChoice(["Intermediate", "Beginner", "Intermediate"]);
  }

  // Generate skills based on job type
  let relevantSkills: string[];
  let headline: string;
  
  switch (jobType) {
    case "frontend":
    case "senior":
      relevantSkills = SKILL_POOLS.frontend;
      headline = `${skillLevel === "Expert" ? "Senior" : skillLevel === "Advanced" ? "Mid-Level" : "Junior"} Frontend Developer at ${randomChoice(COMPANIES)}`;
      break;
    case "backend":
      relevantSkills = SKILL_POOLS.backend;
      headline = `${skillLevel === "Expert" ? "Senior" : skillLevel === "Advanced" ? "Mid-Level" : "Junior"} Backend Engineer at ${randomChoice(COMPANIES)}`;
      break;
    case "data":
      relevantSkills = SKILL_POOLS.data;
      headline = `${skillLevel === "Expert" ? "Senior" : skillLevel === "Advanced" ? "Mid-Level" : "Junior"} Data Analyst at ${randomChoice(COMPANIES)}`;
      break;
    case "product":
      relevantSkills = SKILL_POOLS.product;
      headline = `${skillLevel === "Expert" ? "Senior" : skillLevel === "Advanced" ? "Mid-Level" : "Associate"} Product Manager at ${randomChoice(COMPANIES)}`;
      break;
    case "devops":
      relevantSkills = SKILL_POOLS.devops;
      headline = `${skillLevel === "Expert" ? "Senior" : skillLevel === "Advanced" ? "Mid-Level" : "Junior"} DevOps Engineer at ${randomChoice(COMPANIES)}`;
      break;
    default:
      relevantSkills = SKILL_POOLS.frontend;
      headline = `Software Developer at ${randomChoice(COMPANIES)}`;
  }

  const numSkills = randomInt(4, 7);
  const selectedSkills = randomSubset(relevantSkills, numSkills);
  const skills = selectedSkills.map((name, i) => ({
    name,
    level: i < 3 ? skillLevel : randomChoice(["Intermediate", "Advanced"]),
    yearsUsed: Math.max(1, yoe - randomInt(0, 2)),
  }));

  // Generate experience
  const numJobs = randomInt(1, 4);
  const experience = [];
  let currentYear = 2025;
  
  for (let i = 0; i < numJobs; i++) {
    const jobYears = i === 0 ? randomInt(1, 4) : randomInt(1, 3);
    const endYear = currentYear;
    const startYear = currentYear - jobYears;
    
    experience.push({
      company: randomChoice(COMPANIES),
      role: headline.split(" at ")[0],
      startDate: `${startYear}-${String(randomInt(1, 12)).padStart(2, "0")}`,
      endDate: i === 0 ? "Present" : `${endYear}-${String(randomInt(1, 12)).padStart(2, "0")}`,
      description: `Worked on ${randomChoice(["scalable systems", "user-facing features", "data pipelines", "cloud infrastructure", "mobile applications"])} serving ${randomChoice(["thousands", "millions", "hundreds of thousands"])} of users.`,
      technologies: randomSubset(selectedSkills, randomInt(3, 5)),
    });
    
    currentYear = startYear;
  }

  // Generate education
  const education = [{
    institution: randomChoice(UNIVERSITIES),
    degree: randomChoice(["Bachelor's", "Bachelor's", "Master's", "Bachelor's"]),
    fieldOfStudy: randomChoice(["Computer Science", "Software Engineering", "Information Technology", "Mathematics", "Statistics", "Engineering"]),
    startYear: 2015 + randomInt(0, 8),
    endYear: 2019 + randomInt(0, 8),
  }];

  // Generate projects
  const projects = [{
    name: `${randomChoice(["Customer", "Payment", "Analytics", "Management", "Tracking"])} ${randomChoice(["Portal", "Platform", "Dashboard", "System", "App"])}`,
    description: `Built a ${randomChoice(["scalable", "user-friendly", "high-performance", "data-driven"])} solution for ${randomChoice(["enterprise clients", "end users", "internal teams", "customers"])}.`,
    technologies: randomSubset(selectedSkills, randomInt(3, 5)),
    role: randomChoice(["Lead Developer", "Developer", "Contributor", "Solo Developer"]),
  }];

  return mkApplicant(fullName, email, location, headline, yoe, skills, experience, education, projects);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 DAVINCI AI SCREENER — 5 JOBS DEMO SEED\n");
  console.log("=".repeat(60));

  // 1. Auth
  const demoUser = "demo_recruiter";
  const demoPass = "DemoPass123!";
  let token = "";

  let { status, data } = await api("POST", "/auth/login", { username: demoUser, password: demoPass });
  if (status === 200) {
    token = data.token;
    console.log(`✅ Logged in as "${demoUser}"`);
  } else {
    ({ status, data } = await api("POST", "/auth/signup", { username: demoUser, password: demoPass }));
    if (status === 201) {
      token = data.token;
      console.log(`✅ Created & logged in as "${demoUser}"`);
    } else {
      console.error("❌ Auth failed:", data);
      process.exit(1);
    }
  }

  // 2. Create 5 jobs
  console.log("\n📋 Creating 5 jobs...");
  const jobIds: string[] = [];

  for (const job of JOBS) {
  const { status, data } = await api("POST", "/jobs", { ...job, status: "active" } as any, token);
    if (status === 201) {
      jobIds.push(data.data._id);
      console.log(`  ✅ "${job.title}" → ${data.data._id}`);
    } else {
      console.error(`  ❌ Failed to create "${job.title}":`, data);
      process.exit(1);
    }
  }

  // 3. Generate and submit 30 applicants per job (150 total)
  console.log("\n👥 Generating and submitting 150 applicants (30 per job)...");
  
  const jobTypes = ["frontend", "backend", "data", "product", "devops"];
  
  for (let jobIdx = 0; jobIdx < 5; jobIdx++) {
    const jobType = jobTypes[jobIdx];
    const jobTitle = JOBS[jobIdx].title;
    const jobId = jobIds[jobIdx];
    
    // Generate 30 applicants for this job
    const applicants: ApplicantSeed[] = [];
    for (let i = 0; i < 30; i++) {
      applicants.push(generateApplicant(jobType, i));
    }
    
    // Submit in batches of 10
    const batchSize = 10;
    for (let i = 0; i < applicants.length; i += batchSize) {
      const batch = applicants.slice(i, i + batchSize);
      const { status, data } = await api("POST", "/applicants/davinci", {
        jobId,
        profiles: batch,
      }, token);

      if (status === 201) {
        console.log(`  ✅ "${jobTitle}": batch ${Math.floor(i / batchSize) + 1}/3 — ${batch.length} applicants`);
      } else {
        console.error(`  ❌ "${jobTitle}" batch failed:`, JSON.stringify(data).slice(0, 200));
      }
    }
    console.log(`  → 30 total applicants for "${jobTitle}"`);
  }

  // 4. Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n🎉 SEED COMPLETE!\n");
  console.log("Jobs created:");
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}. ${JOBS[i].title} (30 applicants) → ID: ${jobIds[i]}`);
  }
  console.log(`\nTotal applicants: 150 (30 per job)`);
  console.log(`\nLogin: username="${demoUser}" password="${demoPass}"`);
  console.log("Go to https://frontend-nine-alpha-49.vercel.app/hr/login to start screening!\n");
}

main().catch((err) => {
  console.error("💥 Seed failed:", err);
  process.exit(1);
});
