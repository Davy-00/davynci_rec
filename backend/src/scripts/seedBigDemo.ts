/**
 * Big Demo Seed
 * ─────────────
 * 1. Login as HR admin
 * 2. Create 2 jobs (Senior Frontend Dev + Backend Engineer)
 * 3. List both jobs
 * 4. Apply 100 applicants to Job 1, 100 applicants to Job 2
 *
 * Usage:  cd backend && npx tsx src/scripts/seedBigDemo.ts
 */

import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const API = process.env.API_URL || "http://localhost:4000/api";
const HR_USER = process.env.HR_USERNAME || "admin";
const HR_PASS = process.env.HR_PASSWORD || "admin123";

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function api(
  method: string,
  endpoint: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// ─── 2 Jobs ───────────────────────────────────────────────────────────────────

const JOBS = [
  {
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "Kigali, Rwanda",
    workType: "remote",
    description:
      "Build beautiful, performant UIs for our fintech platform using React and Next.js. " +
      "Lead frontend architecture decisions and mentor junior developers.",
    responsibilities: [
      "Architect and build React/Next.js applications",
      "Code review and mentor junior developers",
      "Collaborate with design and product teams",
      "Optimize web performance and accessibility",
      "Define component library and design-system standards",
    ],
    requirements: {
      requiredSkills: ["React", "TypeScript", "Next.js"],
      preferredSkills: ["Redux", "GraphQL", "Jest", "Tailwind CSS"],
      yearsOfExperience: 4,
      educationLevel: "Bachelor's",
      educationField: "Computer Science",
    },
    niceToHave: ["Open source contributions", "Fintech experience", "Leadership experience"],
    status: "active",
  },
  {
    title: "Backend Engineer (Node.js)",
    department: "Engineering",
    location: "Nairobi, Kenya",
    workType: "hybrid",
    description:
      "Design and build scalable APIs and microservices for our growing platform. " +
      "Work with Node.js, PostgreSQL, and cloud infrastructure.",
    responsibilities: [
      "Design and implement RESTful and GraphQL APIs",
      "Manage PostgreSQL databases and write migrations",
      "Build CI/CD pipelines and monitoring",
      "Write unit and integration tests",
      "Collaborate with frontend team on API contracts",
    ],
    requirements: {
      requiredSkills: ["Node.js", "TypeScript", "PostgreSQL", "REST APIs"],
      preferredSkills: ["Docker", "AWS", "Redis", "GraphQL"],
      yearsOfExperience: 3,
      educationLevel: "Bachelor's",
      educationField: "Computer Science or related",
    },
    niceToHave: ["Microservices architecture", "Event-driven systems"],
    status: "active",
  },
];

// ─── Name / location banks for synthetic applicants ──────────────────────────

const FIRST_NAMES = [
  "Alice","James","Fatima","David","Amina","Samuel","Grace","Emmanuel","Sophie","Kwame",
  "Blessing","Moussa","Chioma","Peter","Ngozi","Yves","Aisha","Daniel","Josephine","Ibrahim",
  "Adama","Linda","Eric","Nadia","Felix","Rose","Kofi","Mary","Luca","Safi",
  "Omar","Diane","Pascal","Olivia","Paul","Elena","Hassan","Anna","Michael","Chloe",
  "Victor","Zara","Karim","Layla","Julian","Stella","Ahmed","Nina","Tobias","Sara",
  "Kwesi","Precious","Ike","Mercy","Ola","Tina","Ben","Joy","Mark","Faith",
  "Steve","Grace","Chris","Hope","Tom","Love","Dan","Peace","Sam","Gift",
  "Rick","Irene","Jack","Lydia","Alan","Esther","Leo","Ruth","Max","Eve",
  "Noah","Abby","Liam","Clara","Ethan","Sophie","Mason","Nora","Owen","Maya",
  "Lucas","Ella","Ryan","Isla","Jake","Mia","Luke","Zoe","Kyle","Amy",
];

const LAST_NAMES = [
  "Uwimana","Okonkwo","Hassan","Mensah","Diallo","Abebe","Mutua","Nwachukwu","Niyonzima","Asante",
  "Adeyemi","Traore","Igwe","Kamau","Okafor","Habimana","Mohammed","Osei","Wambui","Sow",
  "Keita","Nyamwanga","Tetteh","Mokgosi","Onyekwere","Mwangi","Adjei","Dube","Banda","Kariuki",
  "Nkosi","Abubakar","Owusu","Juma","Diarra","Yeboah","Musoke","Ndlovu","Balde","Konaté",
  "Traoré","Coulibaly","Diop","Fall","Ndiaye","Mbaye","Sène","Gaye","Wade","Faye",
  "Kone","Sissoko","Camara","Cisse","Sanogo","Coulibaly","Dembele","Coulibaly","Barry","Bah",
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Martinez",
  "Nakamura","Tanaka","Suzuki","Yamamoto","Sato","Kobayashi","Kato","Ito","Watanabe","Yamada",
  "Kim","Park","Lee","Choi","Jung","Han","Oh","Shin","Kwon","Yoon",
  "Chen","Wang","Zhang","Liu","Yang","Huang","Zhao","Wu","Zhou","Sun",
];

const LOCATIONS = [
  "Kigali, Rwanda","Lagos, Nigeria","Nairobi, Kenya","Accra, Ghana","Addis Ababa, Ethiopia",
  "Dakar, Senegal","Kampala, Uganda","Dar es Salaam, Tanzania","Abidjan, Côte d'Ivoire","Bamako, Mali",
  "Lusaka, Zambia","Harare, Zimbabwe","Cape Town, South Africa","Johannesburg, South Africa","Cairo, Egypt",
  "Casablanca, Morocco","Tunis, Tunisia","Algiers, Algeria","Abuja, Nigeria","Conakry, Guinea",
  "Maputo, Mozambique","Antananarivo, Madagascar","Port Louis, Mauritius","Windhoek, Namibia","Gaborone, Botswana",
  "Remote","Remote (Africa)","Remote (Europe)","Remote (Global)","Hybrid",
];

const UNIVERSITIES = [
  "University of Rwanda","University of Nairobi","University of Lagos","KNUST","University of Ghana",
  "Addis Ababa University","Makerere University","University of Dar es Salaam","Strathmore University","Covenant University",
  "University of Ibadan","Kenyatta University","Jomo Kenyatta University","University of Cape Town","Wits University",
  "Cairo University","American University in Cairo","University of Morocco","Tunis El Manar University","Cheikh Anta Diop University",
  "MIT","Stanford","Carnegie Mellon","Georgia Tech","University of Toronto",
  "University of Edinburgh","Imperial College London","ETH Zurich","TU Berlin","Paris Saclay",
];

const COMPANIES = [
  "Flutterwave","Paystack","Andela","Interswitch","Jumia","Safaricom","Equity Bank","KCB Bank",
  "MTN","Airtel","Orange","Vodacom","Wave","M-PESA","Irembo","BK Group",
  "Access Bank","GTBank","Zenith Bank","First Bank","UBA","Stanbic","Absa","Standard Chartered",
  "TechCorp Africa","AfriPay","Hubtel","Twiga Foods","SafeBoda","AfriDelivery",
  "Andela","Ushahidi","BRCK","Cellulant","DPO Group","Paga","OPay","PalmPay",
  "Google","Meta","Microsoft","Amazon","IBM","Oracle","SAP","Accenture",
  "Deloitte","PwC","McKinsey","BCG","Thoughtworks","Pivotal","Publicis Sapient","Capgemini",
];

// ─── Skill banks ─────────────────────────────────────────────────────────────

const FRONTEND_SKILLS = ["React","TypeScript","Next.js","Vue","Angular","Svelte","Tailwind CSS","CSS","SCSS","JavaScript","HTML","Redux","MobX","GraphQL","Jest","Cypress","Webpack","Vite","Storybook","Figma"];
const BACKEND_SKILLS = ["Node.js","TypeScript","Python","Java","Go","Rust","PostgreSQL","MongoDB","MySQL","Redis","Docker","Kubernetes","AWS","GCP","Azure","REST APIs","GraphQL","gRPC","RabbitMQ","Kafka"];
const LEVELS = ["Beginner","Intermediate","Advanced","Expert"] as const;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}

function weightedLevel(yoe: number): typeof LEVELS[number] {
  if (yoe >= 6) return Math.random() < 0.7 ? "Expert" : "Advanced";
  if (yoe >= 4) return Math.random() < 0.6 ? "Advanced" : "Expert";
  if (yoe >= 2) return Math.random() < 0.5 ? "Intermediate" : "Advanced";
  return Math.random() < 0.6 ? "Intermediate" : "Beginner";
}

// ─── Generate applicant profile ───────────────────────────────────────────────

function generateApplicant(
  index: number,
  role: "frontend" | "backend"
): Record<string, unknown> {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`;
  const location = pick(LOCATIONS);
  const yoe = randInt(1, 10);
  const company = pick(COMPANIES);
  const university = pick(UNIVERSITIES);
  const skillPool = role === "frontend" ? FRONTEND_SKILLS : BACKEND_SKILLS;

  // Always include the core required skills (with some probability of missing them)
  const coreSkills = role === "frontend"
    ? ["React","TypeScript","Next.js"]
    : ["Node.js","TypeScript","PostgreSQL","REST APIs"];

  // Give ~70% of applicants the core skills, ~30% partial coverage
  const hasCore = Math.random() < 0.7;
  const selectedCore = hasCore ? coreSkills : pickN(coreSkills, randInt(1, coreSkills.length - 1));
  const extraSkills = pickN(skillPool.filter(s => !selectedCore.includes(s)), randInt(2, 5));
  const allSkills = [...new Set([...selectedCore, ...extraSkills])];

  const skills = allSkills.map((name) => ({
    name,
    level: weightedLevel(yoe),
    yearsUsed: Math.min(randInt(1, yoe), yoe),
  }));

  const roleTitle = role === "frontend"
    ? pick(["Frontend Developer","React Developer","UI Engineer","Frontend Engineer","Senior Frontend Developer","Lead Frontend Developer","UI/UX Developer"])
    : pick(["Backend Developer","Node.js Engineer","API Developer","Backend Engineer","Senior Backend Developer","Platform Engineer","Software Engineer"]);

  const experience = [
    {
      company,
      role: roleTitle,
      startDate: `${2025 - yoe}-0${randInt(1,9)}`,
      endDate: yoe > 1 ? "Present" : `${2024}-12`,
      description: role === "frontend"
        ? `Built and maintained React/Next.js applications. Improved performance and code quality. Collaborated with design and backend teams.`
        : `Designed and implemented RESTful APIs. Managed PostgreSQL databases and wrote migrations. Built CI/CD pipelines.`,
      technologies: pickN(allSkills, Math.min(4, allSkills.length)),
    }
  ];

  if (yoe > 3) {
    experience.push({
      company: pick(COMPANIES),
      role: role === "frontend" ? "Junior Frontend Developer" : "Junior Backend Developer",
      startDate: `${2025 - yoe - 2}-06`,
      endDate: `${2025 - yoe}-01`,
      description: role === "frontend"
        ? "Developed React components and helped maintain the company's web platform."
        : "Assisted in building backend services and writing API integrations.",
      technologies: pickN(allSkills, 2),
    });
  }

  const education = [
    {
      institution: university,
      degree: yoe >= 6 && Math.random() < 0.3 ? "Master's" : "Bachelor's",
      fieldOfStudy: role === "frontend"
        ? pick(["Computer Science","Software Engineering","Information Technology","Web Development"])
        : pick(["Computer Science","Software Engineering","Computer Engineering","Information Systems"]),
      startYear: 2025 - yoe - 4,
      endYear: 2025 - yoe,
    }
  ];

  const projectName = role === "frontend"
    ? pick(["E-commerce Dashboard","Portfolio Platform","FinTech UI","Admin Panel","Analytics Dashboard","Mobile Banking App","Design System","Landing Page Builder"])
    : pick(["Payments API","Auth Service","Notification System","Data Pipeline","Microservices Platform","CMS Backend","Event Bus","Search Service"]);

  const projects = [
    {
      name: projectName,
      description: role === "frontend"
        ? `Built a ${projectName.toLowerCase()} using ${pickN(allSkills,2).join(" and ")}. Achieved high performance and accessibility scores.`
        : `Developed a scalable ${projectName.toLowerCase()} using ${pickN(allSkills,2).join(" and ")}. Handled high throughput with minimal latency.`,
      technologies: pickN(allSkills, randInt(2, 4)),
      role: yoe >= 5 ? "Lead Developer" : "Developer",
    }
  ];

  return {
    fullName: name,
    email,
    location,
    headline: `${roleTitle} with ${yoe} years of experience`,
    yearsOfExperience: yoe,
    skills: allSkills.join(", "),
    skillsJson: JSON.stringify(skills),
    experienceJson: JSON.stringify(experience),
    educationJson: JSON.stringify(education),
    projectsJson: JSON.stringify(projects),
    availabilityStatus: pick(["Available","Open to offers","Not actively looking"]),
    availabilityType: pick(["Full-time","Contract","Either"]),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function applyApplicants(
  jobId: string,
  role: "frontend" | "backend",
  token: string,
  count: number,
  offset: number
) {
  const BATCH_SIZE = 10;
  let applied = 0;

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const profiles = Array.from({ length: Math.min(BATCH_SIZE, count - i) }, (_, j) =>
      generateApplicant(offset + i + j, role)
    );

    const res = await api("POST", "/applicants/davinci", { jobId, profiles }, token);
    if (res.status !== 201 && res.status !== 200) {
      console.error(`  ❌ Batch failed (offset ${i}):`, res.data?.error || res.status);
    } else {
      applied += profiles.length;
      process.stdout.write(`\r  ✅ Applied ${applied}/${count}...`);
    }
  }
  console.log(); // newline after progress
}

async function main() {
  console.log("=== DaVinci Recruiter — Big Demo Seed ===\n");

  // 1. Login
  console.log(`🔐 Logging in as ${HR_USER}...`);
  const loginRes = await api("POST", "/auth/login", { username: HR_USER, password: HR_PASS });
  if (!loginRes.data?.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
  }
  const token: string = loginRes.data.token;
  console.log("   ✅ Logged in\n");

  // 2. Create 2 jobs
  console.log("📋 Creating 2 jobs...");
  const jobIds: string[] = [];
  for (const job of JOBS) {
    const res = await api("POST", "/jobs", job, token);
    if (!res.data?.data?._id) {
      throw new Error(`Failed to create job "${job.title}": ${JSON.stringify(res.data)}`);
    }
    const id = res.data.data._id;
    jobIds.push(id);
    console.log(`   ✅ Created: "${job.title}" (${id})`);
  }
  console.log();

  // 3. List both jobs
  console.log("📂 Listing all jobs...");
  const listRes = await api("GET", "/jobs", undefined, token);
  const allJobs: any[] = listRes.data?.data || [];
  const ourJobs = allJobs.filter((j: any) => jobIds.includes(String(j._id)));
  console.log(`   Found ${allJobs.length} total jobs, showing our 2:\n`);
  for (const j of ourJobs) {
    console.log(`   • [${j._id}] ${j.title} — ${j.location} (${j.workType}) | Status: ${j.status}`);
    console.log(`     Required: ${j.requirements?.requiredSkills?.join(", ")}`);
    console.log(`     Min experience: ${j.requirements?.yearsOfExperience} yrs`);
  }
  console.log();

  // 4. Apply 100 applicants to Job 1 (Frontend)
  console.log(`👥 Applying 100 applicants to Job 1: "${JOBS[0].title}"...`);
  await applyApplicants(jobIds[0], "frontend", token, 100, 0);
  console.log(`   ✅ 100 applicants submitted to Job 1\n`);

  // 5. Apply 100 applicants to Job 2 (Backend)
  console.log(`👥 Applying 100 applicants to Job 2: "${JOBS[1].title}"...`);
  await applyApplicants(jobIds[1], "backend", token, 100, 100);
  console.log(`   ✅ 100 applicants submitted to Job 2\n`);

  // 6. Confirm counts
  console.log("📊 Confirming applicant counts...");
  for (let i = 0; i < jobIds.length; i++) {
    const countRes = await api("GET", `/applicants/job/${jobIds[i]}/count`, undefined, token);
    console.log(`   ${JOBS[i].title}: ${countRes.data?.count ?? "?"} applicants`);
  }

  console.log("\n🎉 Done! Both jobs are live with 100 applicants each.");
  console.log(`   Job 1 ID: ${jobIds[0]}`);
  console.log(`   Job 2 ID: ${jobIds[1]}`);
}

main().catch((err) => {
  console.error("\n❌ Seed error:", err.message || err);
  process.exit(1);
});
