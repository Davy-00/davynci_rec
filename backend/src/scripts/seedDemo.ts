/**
 * Demo seed script: Creates 3 jobs and 50 diverse applicants.
 * Usage:  cd backend && npx tsx src/scripts/seedDemo.ts
 */

const API = "http://localhost:4000/api";

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

// ─── Job definitions ────────────────────────────────────────────────────────

const JOBS = [
  {
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "Kigali, Rwanda",
    workType: "remote" as const,
    description:
      "Build beautiful, performant UIs for our fintech platform using React and Next.js. You will lead frontend architecture decisions and mentor junior developers.",
    responsibilities: [
      "Architect and build React/Next.js applications",
      "Code review and mentor junior developers",
      "Collaborate with design and product teams",
      "Optimize web performance and accessibility",
    ],
    requirements: {
      requiredSkills: ["React", "TypeScript", "Next.js", "CSS/Tailwind"],
      preferredSkills: ["Redux", "GraphQL", "Jest", "Cypress"],
      yearsOfExperience: 4,
      educationLevel: "Bachelor's",
      educationField: "Computer Science",
    },
    niceToHave: ["Open source contributions", "Fintech experience", "Leadership experience"],
  },
  {
    title: "Backend Engineer (Node.js)",
    department: "Engineering",
    location: "Nairobi, Kenya",
    workType: "hybrid" as const,
    description:
      "Design and build scalable APIs and microservices for our growing platform. You will work with Node.js, PostgreSQL, and cloud infrastructure.",
    responsibilities: [
      "Design and implement RESTful and GraphQL APIs",
      "Manage PostgreSQL databases and write migrations",
      "Build CI/CD pipelines and monitoring",
      "Write unit and integration tests",
    ],
    requirements: {
      requiredSkills: ["Node.js", "TypeScript", "PostgreSQL", "REST APIs"],
      preferredSkills: ["Docker", "AWS/GCP", "Redis", "GraphQL"],
      yearsOfExperience: 3,
      educationLevel: "Bachelor's",
      educationField: "Computer Science or related",
    },
    niceToHave: ["Microservices architecture", "Event-driven systems"],
  },
  {
    title: "Data Analyst",
    department: "Data",
    location: "Lagos, Nigeria",
    workType: "onsite" as const,
    description:
      "Analyze business data to drive product decisions. Build dashboards, run experiments, and deliver insights to stakeholders across the company.",
    responsibilities: [
      "Build dashboards and reports using BI tools",
      "Analyze user behavior and product metrics",
      "Design and evaluate A/B tests",
      "Present findings to leadership",
    ],
    requirements: {
      requiredSkills: ["SQL", "Python", "Data Visualization", "Excel"],
      preferredSkills: ["Tableau", "Power BI", "R", "Statistics"],
      yearsOfExperience: 2,
      educationLevel: "Bachelor's",
      educationField: "Statistics, Math, or Computer Science",
    },
    niceToHave: ["Machine learning basics", "Experiment design"],
  },
];

// ─── Applicant pool (50 diverse people) ─────────────────────────────────────

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

const APPLICANTS: ApplicantSeed[] = [
  // ── STRONG FRONTEND CANDIDATES (1-6) ──────────────────────────────────────
  mkApplicant("Alice Uwimana", "alice.uwimana@example.com", "Kigali, Rwanda",
    "Senior Frontend Engineer at TechCorp", 7,
    [{ name: "React", level: "Expert", yearsUsed: 6 }, { name: "TypeScript", level: "Expert", yearsUsed: 5 }, { name: "Next.js", level: "Expert", yearsUsed: 4 }, { name: "Tailwind CSS", level: "Advanced", yearsUsed: 3 }, { name: "Redux", level: "Advanced", yearsUsed: 4 }, { name: "Jest", level: "Advanced", yearsUsed: 4 }],
    [{ company: "TechCorp Africa", role: "Senior Frontend Engineer", startDate: "2021-01", endDate: "Present", description: "Led 5-person frontend team building fintech dashboard serving 200k users. Reduced bundle size 60%.", technologies: ["React", "Next.js", "TypeScript", "Tailwind"] }],
    [{ institution: "University of Rwanda", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2015, endYear: 2019 }],
    [{ name: "Rwanda Pay Dashboard", description: "Real-time payment analytics for 50k+ merchants", technologies: ["Next.js", "TypeScript", "D3.js"], role: "Lead Developer" }]),

  mkApplicant("James Okonkwo", "james.okonkwo@example.com", "Lagos, Nigeria",
    "Lead Frontend Developer at AfriPay", 6,
    [{ name: "React", level: "Expert", yearsUsed: 5 }, { name: "TypeScript", level: "Advanced", yearsUsed: 4 }, { name: "Next.js", level: "Advanced", yearsUsed: 3 }, { name: "CSS/Tailwind", level: "Expert", yearsUsed: 5 }, { name: "GraphQL", level: "Intermediate", yearsUsed: 2 }],
    [{ company: "AfriPay", role: "Lead Frontend Developer", startDate: "2020-03", endDate: "Present", description: "Built payment gateway UI handling $2M daily. Mentored 4 junior devs.", technologies: ["React", "TypeScript", "Styled Components"] }],
    [{ institution: "University of Lagos", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2014, endYear: 2018 }],
    [{ name: "AfriPay Merchant Portal", description: "Self-service merchant dashboard with real-time analytics", technologies: ["React", "TypeScript", "Chart.js"], role: "Lead Developer" }]),

  mkApplicant("Fatima Hassan", "fatima.hassan@example.com", "Nairobi, Kenya",
    "Frontend Engineer at Safaricom", 5,
    [{ name: "React", level: "Advanced", yearsUsed: 4 }, { name: "TypeScript", level: "Advanced", yearsUsed: 3 }, { name: "Next.js", level: "Advanced", yearsUsed: 2 }, { name: "Tailwind CSS", level: "Advanced", yearsUsed: 3 }, { name: "Redux", level: "Intermediate", yearsUsed: 2 }, { name: "Cypress", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "Safaricom", role: "Frontend Engineer", startDate: "2021-06", endDate: "Present", description: "Developed M-PESA web portal used by millions. Improved Lighthouse score from 45 to 92.", technologies: ["React", "Next.js", "TypeScript"] }],
    [{ institution: "University of Nairobi", degree: "Bachelor's", fieldOfStudy: "Software Engineering", startYear: 2016, endYear: 2020 }],
    [{ name: "M-PESA Web Portal", description: "Mobile money web interface for 30M+ users", technologies: ["React", "Next.js", "PWA"], role: "Frontend Engineer" }]),

  mkApplicant("David Mensah", "david.mensah@example.com", "Accra, Ghana",
    "Senior React Developer at Hubtel", 5,
    [{ name: "React", level: "Expert", yearsUsed: 5 }, { name: "TypeScript", level: "Advanced", yearsUsed: 3 }, { name: "Next.js", level: "Intermediate", yearsUsed: 2 }, { name: "CSS/Tailwind", level: "Advanced", yearsUsed: 4 }, { name: "Jest", level: "Advanced", yearsUsed: 3 }],
    [{ company: "Hubtel", role: "Senior React Developer", startDate: "2022-01", endDate: "Present", description: "Built checkout and payments UI for e-commerce platform processing 500k transactions/month.", technologies: ["React", "TypeScript", "Material UI"] }],
    [{ institution: "KNUST", degree: "Bachelor's", fieldOfStudy: "Computer Engineering", startYear: 2015, endYear: 2019 }],
    [{ name: "Hubtel Checkout", description: "E-commerce checkout flow handling multiple payment methods", technologies: ["React", "TypeScript", "Stripe"], role: "Lead Frontend" }]),

  mkApplicant("Amina Diallo", "amina.diallo@example.com", "Dakar, Senegal",
    "Frontend Architect at Wave", 8,
    [{ name: "React", level: "Expert", yearsUsed: 7 }, { name: "TypeScript", level: "Expert", yearsUsed: 6 }, { name: "Next.js", level: "Expert", yearsUsed: 5 }, { name: "Tailwind CSS", level: "Expert", yearsUsed: 4 }, { name: "Redux", level: "Expert", yearsUsed: 5 }, { name: "GraphQL", level: "Advanced", yearsUsed: 3 }, { name: "Cypress", level: "Advanced", yearsUsed: 3 }],
    [{ company: "Wave Mobile Money", role: "Frontend Architect", startDate: "2019-01", endDate: "Present", description: "Architected micro-frontend system serving 10M users across 6 African countries. Reduced page load 70%.", technologies: ["React", "Next.js", "TypeScript", "Micro-frontends"] }],
    [{ institution: "Université Cheikh Anta Diop", degree: "Master's", fieldOfStudy: "Computer Science", startYear: 2012, endYear: 2017 }],
    [{ name: "Wave Web Platform", description: "Multi-country mobile money web app with micro-frontend architecture", technologies: ["React", "Next.js", "Module Federation"], role: "Architect" }]),

  mkApplicant("Samuel Abebe", "samuel.abebe@example.com", "Addis Ababa, Ethiopia",
    "Mid-level Frontend Developer at Telebirr", 3,
    [{ name: "React", level: "Advanced", yearsUsed: 3 }, { name: "TypeScript", level: "Intermediate", yearsUsed: 2 }, { name: "CSS", level: "Advanced", yearsUsed: 3 }, { name: "Redux", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "Telebirr", role: "Frontend Developer", startDate: "2023-01", endDate: "Present", description: "Built admin dashboard for mobile money platform. Implemented responsive designs for 3 products.", technologies: ["React", "JavaScript", "Bootstrap"] }],
    [{ institution: "Addis Ababa University", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2017, endYear: 2021 }],
    [{ name: "Telebirr Admin Panel", description: "Internal admin dashboard for mobile money operations", technologies: ["React", "Bootstrap", "Chart.js"], role: "Developer" }]),

  // ── STRONG BACKEND CANDIDATES (7-12) ──────────────────────────────────────
  mkApplicant("Grace Mutua", "grace.mutua@example.com", "Nairobi, Kenya",
    "Senior Backend Engineer at Flutterwave", 6,
    [{ name: "Node.js", level: "Expert", yearsUsed: 5 }, { name: "TypeScript", level: "Expert", yearsUsed: 4 }, { name: "PostgreSQL", level: "Expert", yearsUsed: 5 }, { name: "Docker", level: "Advanced", yearsUsed: 3 }, { name: "AWS", level: "Advanced", yearsUsed: 3 }, { name: "Redis", level: "Advanced", yearsUsed: 2 }],
    [{ company: "Flutterwave", role: "Senior Backend Engineer", startDate: "2020-06", endDate: "Present", description: "Built payment processing APIs handling 1M+ transactions/day. Designed event-driven architecture.", technologies: ["Node.js", "TypeScript", "PostgreSQL", "RabbitMQ"] }],
    [{ institution: "Jomo Kenyatta University", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2014, endYear: 2018 }],
    [{ name: "Payment Gateway API", description: "High-throughput payment processing system for Africa", technologies: ["Node.js", "PostgreSQL", "Redis"], role: "Lead Backend" }]),

  mkApplicant("Emmanuel Nwachukwu", "emmanuel.nwachukwu@example.com", "Lagos, Nigeria",
    "Backend Developer at Paystack", 5,
    [{ name: "Node.js", level: "Expert", yearsUsed: 5 }, { name: "TypeScript", level: "Advanced", yearsUsed: 3 }, { name: "PostgreSQL", level: "Advanced", yearsUsed: 4 }, { name: "REST APIs", level: "Expert", yearsUsed: 5 }, { name: "Docker", level: "Intermediate", yearsUsed: 2 }, { name: "GraphQL", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "Paystack", role: "Backend Developer", startDate: "2021-01", endDate: "Present", description: "Built recurring billing engine and webhook delivery system. Reduced API latency by 40%.", technologies: ["Node.js", "TypeScript", "PostgreSQL", "Redis"] }],
    [{ institution: "University of Ibadan", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2015, endYear: 2019 }],
    [{ name: "Recurring Billing Engine", description: "Automated subscription management for 50k merchants", technologies: ["Node.js", "PostgreSQL", "Bull Queue"], role: "Backend Developer" }]),

  mkApplicant("Sophie Niyonzima", "sophie.niyonzima@example.com", "Kigali, Rwanda",
    "API Engineer at Irembo", 4,
    [{ name: "Node.js", level: "Advanced", yearsUsed: 4 }, { name: "TypeScript", level: "Advanced", yearsUsed: 3 }, { name: "PostgreSQL", level: "Advanced", yearsUsed: 3 }, { name: "REST APIs", level: "Advanced", yearsUsed: 4 }, { name: "AWS", level: "Intermediate", yearsUsed: 2 }],
    [{ company: "Irembo", role: "API Engineer", startDate: "2022-03", endDate: "Present", description: "Built government service APIs serving 2M+ citizens. Implemented OAuth2 and rate limiting.", technologies: ["Node.js", "Express", "PostgreSQL"] }],
    [{ institution: "University of Rwanda", degree: "Bachelor's", fieldOfStudy: "Information Technology", startYear: 2016, endYear: 2020 }],
    [{ name: "Government Services API", description: "Digital public services platform for Rwanda", technologies: ["Node.js", "PostgreSQL", "OAuth2"], role: "API Engineer" }]),

  mkApplicant("Kwame Asante", "kwame.asante@example.com", "Accra, Ghana",
    "Senior Node.js Developer at MTN", 7,
    [{ name: "Node.js", level: "Expert", yearsUsed: 7 }, { name: "TypeScript", level: "Expert", yearsUsed: 5 }, { name: "PostgreSQL", level: "Expert", yearsUsed: 6 }, { name: "Redis", level: "Advanced", yearsUsed: 4 }, { name: "Docker", level: "Advanced", yearsUsed: 4 }, { name: "AWS", level: "Advanced", yearsUsed: 3 }, { name: "GraphQL", level: "Advanced", yearsUsed: 2 }],
    [{ company: "MTN Ghana", role: "Senior Node.js Developer", startDate: "2019-06", endDate: "Present", description: "Architected microservices platform for mobile money. System handles 5M+ daily transactions.", technologies: ["Node.js", "TypeScript", "PostgreSQL", "Kubernetes"] }],
    [{ institution: "University of Ghana", degree: "Master's", fieldOfStudy: "Computer Science", startYear: 2013, endYear: 2018 }],
    [{ name: "MoMo Microservices Platform", description: "Distributed mobile money backend system", technologies: ["Node.js", "Kubernetes", "PostgreSQL"], role: "Architect" }]),

  mkApplicant("Blessing Adeyemi", "blessing.adeyemi@example.com", "Lagos, Nigeria",
    "Junior Backend Developer at Andela", 2,
    [{ name: "Node.js", level: "Intermediate", yearsUsed: 2 }, { name: "TypeScript", level: "Intermediate", yearsUsed: 1 }, { name: "PostgreSQL", level: "Intermediate", yearsUsed: 1 }, { name: "REST APIs", level: "Intermediate", yearsUsed: 2 }],
    [{ company: "Andela", role: "Junior Backend Developer", startDate: "2024-01", endDate: "Present", description: "Built RESTful APIs for internal tools. Wrote unit tests improving coverage from 40% to 80%.", technologies: ["Node.js", "Express", "PostgreSQL"] }],
    [{ institution: "Covenant University", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2018, endYear: 2022 }],
    [{ name: "Internal Tools API", description: "Employee management REST API", technologies: ["Node.js", "Express", "Jest"], role: "Developer" }]),

  mkApplicant("Moussa Traore", "moussa.traore@example.com", "Bamako, Mali",
    "Backend Engineer at Orange Money", 4,
    [{ name: "Node.js", level: "Advanced", yearsUsed: 3 }, { name: "PostgreSQL", level: "Advanced", yearsUsed: 4 }, { name: "REST APIs", level: "Advanced", yearsUsed: 4 }, { name: "Docker", level: "Intermediate", yearsUsed: 2 }, { name: "Redis", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "Orange Money Mali", role: "Backend Engineer", startDate: "2022-06", endDate: "Present", description: "Built transaction processing APIs for mobile banking. Implemented fraud detection rules.", technologies: ["Node.js", "PostgreSQL", "Redis"] }],
    [{ institution: "Université de Bamako", degree: "Bachelor's", fieldOfStudy: "Software Engineering", startYear: 2015, endYear: 2019 }],
    [{ name: "Fraud Detection System", description: "Rule-based fraud screening for mobile transactions", technologies: ["Node.js", "PostgreSQL", "Redis"], role: "Backend Engineer" }]),

  // ── STRONG DATA ANALYST CANDIDATES (13-18) ────────────────────────────────
  mkApplicant("Chioma Igwe", "chioma.igwe@example.com", "Lagos, Nigeria",
    "Senior Data Analyst at Access Bank", 5,
    [{ name: "SQL", level: "Expert", yearsUsed: 5 }, { name: "Python", level: "Expert", yearsUsed: 4 }, { name: "Tableau", level: "Expert", yearsUsed: 4 }, { name: "Excel", level: "Expert", yearsUsed: 5 }, { name: "Data Visualization", level: "Expert", yearsUsed: 4 }, { name: "Statistics", level: "Advanced", yearsUsed: 3 }],
    [{ company: "Access Bank", role: "Senior Data Analyst", startDate: "2021-01", endDate: "Present", description: "Led analytics team tracking KPIs for 50M+ customer base. Built executive dashboards driving $10M+ decisions.", technologies: ["SQL", "Python", "Tableau", "Excel"] }],
    [{ institution: "University of Lagos", degree: "Master's", fieldOfStudy: "Statistics", startYear: 2015, endYear: 2020 }],
    [{ name: "Customer Churn Analysis", description: "ML-powered churn prediction reducing attrition by 15%", technologies: ["Python", "SQL", "Scikit-learn"], role: "Lead Analyst" }]),

  mkApplicant("Peter Kamau", "peter.kamau@example.com", "Nairobi, Kenya",
    "Data Analyst at Equity Bank", 4,
    [{ name: "SQL", level: "Expert", yearsUsed: 4 }, { name: "Python", level: "Advanced", yearsUsed: 3 }, { name: "Power BI", level: "Expert", yearsUsed: 3 }, { name: "Excel", level: "Expert", yearsUsed: 4 }, { name: "Data Visualization", level: "Advanced", yearsUsed: 3 }],
    [{ company: "Equity Bank", role: "Data Analyst", startDate: "2022-03", endDate: "Present", description: "Built automated reporting pipeline saving 20 hours/week. Designed A/B testing framework for digital banking.", technologies: ["SQL", "Python", "Power BI"] }],
    [{ institution: "Strathmore University", degree: "Bachelor's", fieldOfStudy: "Mathematics & Computer Science", startYear: 2016, endYear: 2020 }],
    [{ name: "Automated Reporting Pipeline", description: "ETL pipeline generating daily KPI reports", technologies: ["Python", "SQL", "Power BI"], role: "Data Analyst" }]),

  mkApplicant("Ngozi Okafor", "ngozi.okafor@example.com", "Abuja, Nigeria",
    "Business Intelligence Analyst at GTBank", 3,
    [{ name: "SQL", level: "Advanced", yearsUsed: 3 }, { name: "Python", level: "Intermediate", yearsUsed: 2 }, { name: "Tableau", level: "Advanced", yearsUsed: 3 }, { name: "Excel", level: "Expert", yearsUsed: 3 }, { name: "Data Visualization", level: "Advanced", yearsUsed: 3 }, { name: "R", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "GTBank", role: "BI Analyst", startDate: "2023-01", endDate: "Present", description: "Created real-time dashboards for transaction monitoring. Supported product team with user behavior analysis.", technologies: ["SQL", "Tableau", "Python"] }],
    [{ institution: "University of Nigeria Nsukka", degree: "Bachelor's", fieldOfStudy: "Statistics", startYear: 2017, endYear: 2021 }],
    [{ name: "Transaction Monitoring Dashboard", description: "Real-time transaction analytics for fraud team", technologies: ["Tableau", "SQL", "Python"], role: "BI Analyst" }]),

  mkApplicant("Yves Habimana", "yves.habimana@example.com", "Kigali, Rwanda",
    "Data Analyst at BK Group", 3,
    [{ name: "SQL", level: "Advanced", yearsUsed: 3 }, { name: "Python", level: "Advanced", yearsUsed: 2 }, { name: "Excel", level: "Expert", yearsUsed: 3 }, { name: "Power BI", level: "Advanced", yearsUsed: 2 }, { name: "Data Visualization", level: "Advanced", yearsUsed: 2 }],
    [{ company: "BK Group", role: "Data Analyst", startDate: "2023-06", endDate: "Present", description: "Analyzed loan portfolio performance. Built predictive models for credit risk scoring.", technologies: ["SQL", "Python", "Power BI"] }],
    [{ institution: "University of Rwanda", degree: "Bachelor's", fieldOfStudy: "Applied Mathematics", startYear: 2017, endYear: 2021 }],
    [{ name: "Credit Risk Model", description: "Predictive scoring model for loan applications", technologies: ["Python", "SQL", "Scikit-learn"], role: "Data Analyst" }]),

  mkApplicant("Aisha Mohammed", "aisha.mohammed@example.com", "Dar es Salaam, Tanzania",
    "Senior Analytics Engineer at Vodacom", 6,
    [{ name: "SQL", level: "Expert", yearsUsed: 6 }, { name: "Python", level: "Expert", yearsUsed: 5 }, { name: "Tableau", level: "Expert", yearsUsed: 5 }, { name: "Excel", level: "Expert", yearsUsed: 6 }, { name: "Statistics", level: "Expert", yearsUsed: 5 }, { name: "R", level: "Advanced", yearsUsed: 3 }, { name: "Power BI", level: "Advanced", yearsUsed: 2 }],
    [{ company: "Vodacom Tanzania", role: "Senior Analytics Engineer", startDate: "2020-01", endDate: "Present", description: "Built company-wide analytics platform. Led team of 4 analysts. Designed experiments driving 25% revenue increase.", technologies: ["SQL", "Python", "Tableau", "dbt"] }],
    [{ institution: "University of Dar es Salaam", degree: "Master's", fieldOfStudy: "Statistics", startYear: 2014, endYear: 2019 }],
    [{ name: "Revenue Optimization Platform", description: "A/B testing and analytics platform for mobile products", technologies: ["Python", "SQL", "Tableau", "dbt"], role: "Lead Analyst" }]),

  mkApplicant("Daniel Osei", "daniel.osei@example.com", "Kumasi, Ghana",
    "Junior Data Analyst at Fidelity Bank", 1,
    [{ name: "SQL", level: "Intermediate", yearsUsed: 1 }, { name: "Excel", level: "Advanced", yearsUsed: 2 }, { name: "Python", level: "Beginner", yearsUsed: 0.5 }, { name: "Data Visualization", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "Fidelity Bank Ghana", role: "Junior Data Analyst", startDate: "2025-01", endDate: "Present", description: "Assisted with monthly reporting. Learning Python for data automation.", technologies: ["Excel", "SQL", "Power BI"] }],
    [{ institution: "KNUST", degree: "Bachelor's", fieldOfStudy: "Mathematics", startYear: 2020, endYear: 2024 }],
    [{ name: "Monthly Reports Automation", description: "Automated Excel report generation for branch managers", technologies: ["Excel", "VBA", "SQL"], role: "Junior Analyst" }]),

  // ── CROSS-SKILL CANDIDATES (strong in 2 areas) (19-24) ────────────────────
  mkApplicant("Josephine Wambui", "josephine.wambui@example.com", "Nairobi, Kenya",
    "Full-Stack Developer at Twiga Foods", 5,
    [{ name: "React", level: "Advanced", yearsUsed: 4 }, { name: "Node.js", level: "Advanced", yearsUsed: 4 }, { name: "TypeScript", level: "Advanced", yearsUsed: 3 }, { name: "PostgreSQL", level: "Advanced", yearsUsed: 3 }, { name: "Next.js", level: "Intermediate", yearsUsed: 2 }, { name: "Docker", level: "Intermediate", yearsUsed: 2 }],
    [{ company: "Twiga Foods", role: "Full-Stack Developer", startDate: "2021-06", endDate: "Present", description: "Built end-to-end supply chain platform. Both React frontend and Node.js APIs.", technologies: ["React", "Node.js", "PostgreSQL", "TypeScript"] }],
    [{ institution: "Kenyatta University", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2015, endYear: 2019 }],
    [{ name: "Supply Chain Platform", description: "End-to-end logistics tracking for agricultural produce", technologies: ["React", "Node.js", "PostgreSQL"], role: "Full-Stack Developer" }]),

  mkApplicant("Ibrahim Sow", "ibrahim.sow@example.com", "Conakry, Guinea",
    "Full-Stack Engineer at AfriDelivery", 4,
    [{ name: "React", level: "Advanced", yearsUsed: 3 }, { name: "Next.js", level: "Intermediate", yearsUsed: 2 }, { name: "Node.js", level: "Advanced", yearsUsed: 4 }, { name: "TypeScript", level: "Advanced", yearsUsed: 3 }, { name: "PostgreSQL", level: "Intermediate", yearsUsed: 2 }, { name: "CSS/Tailwind", level: "Intermediate", yearsUsed: 2 }],
    [{ company: "AfriDelivery", role: "Full-Stack Engineer", startDate: "2022-01", endDate: "Present", description: "Built delivery tracking app from scratch. Real-time map UI + logistics APIs.", technologies: ["React", "Node.js", "PostgreSQL", "Socket.io"] }],
    [{ institution: "Université Gamal Abdel Nasser", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2016, endYear: 2020 }],
    [{ name: "AfriDelivery Tracker", description: "Real-time delivery tracking with maps and notifications", technologies: ["React", "Node.js", "Socket.io"], role: "Lead Developer" }]),

  mkApplicant("Adama Keita", "adama.keita@example.com", "Abidjan, Côte d'Ivoire",
    "Data Engineer & Analyst at Orange CI", 4,
    [{ name: "Python", level: "Expert", yearsUsed: 4 }, { name: "SQL", level: "Expert", yearsUsed: 4 }, { name: "Node.js", level: "Intermediate", yearsUsed: 2 }, { name: "Data Visualization", level: "Advanced", yearsUsed: 3 }, { name: "PostgreSQL", level: "Advanced", yearsUsed: 3 }, { name: "Docker", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "Orange Côte d'Ivoire", role: "Data Engineer", startDate: "2022-01", endDate: "Present", description: "Built data pipelines for 5M subscriber analytics. Also maintained Node.js APIs for data access.", technologies: ["Python", "SQL", "Node.js", "Airflow"] }],
    [{ institution: "INP-HB", degree: "Master's", fieldOfStudy: "Data Science", startYear: 2016, endYear: 2021 }],
    [{ name: "Subscriber Analytics Pipeline", description: "Real-time data pipeline for telecom analytics", technologies: ["Python", "Airflow", "PostgreSQL"], role: "Data Engineer" }]),

  mkApplicant("Linda Nyamwanga", "linda.nyamwanga@example.com", "Kampala, Uganda",
    "Analytics & Frontend Developer at SafeBoda", 3,
    [{ name: "React", level: "Intermediate", yearsUsed: 2 }, { name: "Python", level: "Advanced", yearsUsed: 3 }, { name: "SQL", level: "Advanced", yearsUsed: 3 }, { name: "Data Visualization", level: "Advanced", yearsUsed: 3 }, { name: "Tableau", level: "Intermediate", yearsUsed: 2 }, { name: "TypeScript", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "SafeBoda", role: "Analytics Developer", startDate: "2023-01", endDate: "Present", description: "Built analytics dashboards with React frontend. Also ran A/B experiments for rider growth.", technologies: ["React", "Python", "SQL", "Tableau"] }],
    [{ institution: "Makerere University", degree: "Bachelor's", fieldOfStudy: "Statistics", startYear: 2018, endYear: 2022 }],
    [{ name: "Rider Growth Dashboard", description: "Analytics dashboard tracking rider acquisition and retention", technologies: ["React", "Python", "SQL"], role: "Analytics Developer" }]),

  mkApplicant("Eric Tetteh", "eric.tetteh@example.com", "Accra, Ghana",
    "Backend & Data Engineer at Zeepay", 5,
    [{ name: "Node.js", level: "Advanced", yearsUsed: 4 }, { name: "Python", level: "Advanced", yearsUsed: 3 }, { name: "PostgreSQL", level: "Expert", yearsUsed: 5 }, { name: "SQL", level: "Expert", yearsUsed: 5 }, { name: "Docker", level: "Advanced", yearsUsed: 3 }, { name: "AWS", level: "Intermediate", yearsUsed: 2 }],
    [{ company: "Zeepay", role: "Backend & Data Engineer", startDate: "2021-01", endDate: "Present", description: "Built remittance APIs and analytics warehouse. Migrated legacy system to microservices.", technologies: ["Node.js", "Python", "PostgreSQL", "AWS"] }],
    [{ institution: "Ashesi University", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2014, endYear: 2018 }],
    [{ name: "Remittance Analytics Warehouse", description: "Data warehouse for cross-border payment analytics", technologies: ["Python", "PostgreSQL", "dbt", "AWS"], role: "Data Engineer" }]),

  mkApplicant("Rose Kamanzi", "rose.kamanzi@example.com", "Kigali, Rwanda",
    "Full-Stack Developer & Analyst at AC Group", 3,
    [{ name: "React", level: "Intermediate", yearsUsed: 2 }, { name: "Node.js", level: "Intermediate", yearsUsed: 2 }, { name: "SQL", level: "Advanced", yearsUsed: 3 }, { name: "Python", level: "Intermediate", yearsUsed: 2 }, { name: "Excel", level: "Advanced", yearsUsed: 3 }],
    [{ company: "AC Group Rwanda", role: "Software Developer & Analyst", startDate: "2023-03", endDate: "Present", description: "Built internal dashboards and reporting tools. Juggled app development and data analysis.", technologies: ["React", "Node.js", "SQL", "Python"] }],
    [{ institution: "Carnegie Mellon University Africa", degree: "Master's", fieldOfStudy: "Information Technology", startYear: 2020, endYear: 2022 }],
    [{ name: "HR Analytics Dashboard", description: "Internal tool for workforce analytics and reporting", technologies: ["React", "Python", "SQL"], role: "Developer" }]),

  // ── WEAK/MISMATCHED CANDIDATES (25-34) ────────────────────────────────────
  mkApplicant("Bob Mugisha", "bob.mugisha@example.com", "Nairobi, Kenya",
    "Junior PHP Developer", 1,
    [{ name: "PHP", level: "Intermediate", yearsUsed: 1 }, { name: "HTML/CSS", level: "Intermediate", yearsUsed: 1 }, { name: "MySQL", level: "Beginner", yearsUsed: 0.5 }],
    [{ company: "Local Web Agency", role: "Junior Developer", startDate: "2025-01", endDate: "Present", description: "Built WordPress sites for local businesses. Learning web development.", technologies: ["PHP", "WordPress", "MySQL"] }],
    [{ institution: "Moringa School", degree: "Certificate", fieldOfStudy: "Web Development", startYear: 2024, endYear: 2024 }],
    [{ name: "Client Websites", description: "Portfolio of 5 WordPress sites for local businesses", technologies: ["PHP", "WordPress"], role: "Developer" }]),

  mkApplicant("Martha Otieno", "martha.otieno@example.com", "Mombasa, Kenya",
    "Graphic Designer", 3,
    [{ name: "Figma", level: "Expert", yearsUsed: 3 }, { name: "Photoshop", level: "Advanced", yearsUsed: 3 }, { name: "HTML/CSS", level: "Beginner", yearsUsed: 0.5 }],
    [{ company: "Creative Studio Mombasa", role: "Graphic Designer", startDate: "2023-01", endDate: "Present", description: "Designed brand identities, social media graphics, and marketing materials.", technologies: ["Figma", "Photoshop", "Illustrator"] }],
    [{ institution: "Technical University of Mombasa", degree: "Diploma", fieldOfStudy: "Graphic Design", startYear: 2019, endYear: 2021 }],
    [{ name: "Brand Identity Projects", description: "Complete brand packages for 10+ local businesses", technologies: ["Figma", "Adobe Suite"], role: "Lead Designer" }]),

  mkApplicant("John Banda", "john.banda@example.com", "Lusaka, Zambia",
    "IT Support Technician", 2,
    [{ name: "Windows Server", level: "Intermediate", yearsUsed: 2 }, { name: "Networking", level: "Intermediate", yearsUsed: 2 }, { name: "Excel", level: "Intermediate", yearsUsed: 2 }],
    [{ company: "ZamTech Solutions", role: "IT Support", startDate: "2024-01", endDate: "Present", description: "Managed office IT infrastructure. Provided tech support for 100+ employees.", technologies: ["Windows", "Active Directory", "Office 365"] }],
    [{ institution: "University of Zambia", degree: "Bachelor's", fieldOfStudy: "Information Technology", startYear: 2018, endYear: 2022 }],
    [{ name: "Office IT Setup", description: "Complete office network setup and documentation", technologies: ["Cisco", "Windows Server"], role: "IT Admin" }]),

  mkApplicant("Miriam Ogutu", "miriam.ogutu@example.com", "Kisumu, Kenya",
    "Marketing Coordinator", 2,
    [{ name: "Social Media Marketing", level: "Advanced", yearsUsed: 2 }, { name: "Content Writing", level: "Advanced", yearsUsed: 2 }, { name: "Excel", level: "Intermediate", yearsUsed: 2 }, { name: "Google Analytics", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "Lake Region Marketing", role: "Marketing Coordinator", startDate: "2024-01", endDate: "Present", description: "Managed social media for 10 clients. Grew follower base 200%.", technologies: ["Hootsuite", "Google Analytics", "Canva"] }],
    [{ institution: "Maseno University", degree: "Bachelor's", fieldOfStudy: "Marketing", startYear: 2019, endYear: 2023 }],
    [{ name: "Social Media Campaign", description: "Multi-platform marketing campaign for regional brand", technologies: ["Hootsuite", "Canva"], role: "Campaign Manager" }]),

  mkApplicant("Charles Kimani", "charles.kimani@example.com", "Nairobi, Kenya",
    "Intern Mobile Developer", 0.5,
    [{ name: "Flutter", level: "Beginner", yearsUsed: 0.5 }, { name: "Dart", level: "Beginner", yearsUsed: 0.5 }, { name: "Git", level: "Beginner", yearsUsed: 0.5 }],
    [{ company: "Startup Garage", role: "Mobile Dev Intern", startDate: "2025-06", endDate: "Present", description: "Learning Flutter development. Built simple todo app for practice.", technologies: ["Flutter", "Dart", "Firebase"] }],
    [{ institution: "Zetech University", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2021, endYear: 2025 }],
    [{ name: "Todo App", description: "Simple task management mobile application", technologies: ["Flutter", "Firebase"], role: "Intern" }]),

  mkApplicant("Patricia Adhiambo", "patricia.adhiambo@example.com", "Nairobi, Kenya",
    "Fresh Graduate — Computer Science", 0,
    [{ name: "Java", level: "Intermediate", yearsUsed: 1 }, { name: "Python", level: "Beginner", yearsUsed: 0.5 }, { name: "SQL", level: "Beginner", yearsUsed: 0.5 }],
    [{ company: "University Lab", role: "Research Assistant", startDate: "2025-01", endDate: "2025-06", description: "Assisted professor with data collection for research project.", technologies: ["Java", "MySQL"] }],
    [{ institution: "University of Nairobi", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2021, endYear: 2025 }],
    [{ name: "Capstone Project", description: "Student attendance tracking system", technologies: ["Java", "MySQL", "Swing"], role: "Developer" }]),

  mkApplicant("Michael Owusu", "michael.owusu@example.com", "Accra, Ghana",
    "Mechanical Engineer", 5,
    [{ name: "AutoCAD", level: "Expert", yearsUsed: 5 }, { name: "SolidWorks", level: "Advanced", yearsUsed: 4 }, { name: "Excel", level: "Advanced", yearsUsed: 5 }],
    [{ company: "Ghana Engineering Co.", role: "Mechanical Engineer", startDate: "2021-01", endDate: "Present", description: "Designed manufacturing equipment and managed factory floor projects.", technologies: ["AutoCAD", "SolidWorks", "MATLAB"] }],
    [{ institution: "KNUST", degree: "Bachelor's", fieldOfStudy: "Mechanical Engineering", startYear: 2014, endYear: 2018 }],
    [{ name: "Factory Automation", description: "Designed automated production line for beverage company", technologies: ["AutoCAD", "PLC Programming"], role: "Lead Engineer" }]),

  mkApplicant("Agnes Nyambura", "agnes.nyambura@example.com", "Nakuru, Kenya",
    "Accountant with some Excel skills", 4,
    [{ name: "QuickBooks", level: "Expert", yearsUsed: 4 }, { name: "Excel", level: "Advanced", yearsUsed: 4 }, { name: "SAP", level: "Intermediate", yearsUsed: 2 }],
    [{ company: "Nakuru Textiles", role: "Accountant", startDate: "2022-01", endDate: "Present", description: "Managed company books and financial reporting. Some data analysis in Excel.", technologies: ["QuickBooks", "Excel", "SAP"] }],
    [{ institution: "Egerton University", degree: "Bachelor's", fieldOfStudy: "Accounting", startYear: 2016, endYear: 2020 }],
    [{ name: "Financial Dashboard", description: "Excel-based financial reporting dashboard", technologies: ["Excel", "VBA"], role: "Accountant" }]),

  mkApplicant("Simon Mugabe", "simon.mugabe@example.com", "Harare, Zimbabwe",
    "Mobile Developer (Android)", 3,
    [{ name: "Kotlin", level: "Advanced", yearsUsed: 3 }, { name: "Android", level: "Advanced", yearsUsed: 3 }, { name: "Java", level: "Intermediate", yearsUsed: 2 }, { name: "Firebase", level: "Intermediate", yearsUsed: 2 }],
    [{ company: "EcoCash", role: "Android Developer", startDate: "2023-01", endDate: "Present", description: "Built mobile banking features for EcoCash app with 5M+ users.", technologies: ["Kotlin", "Android", "Firebase"] }],
    [{ institution: "University of Zimbabwe", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2017, endYear: 2021 }],
    [{ name: "EcoCash Mobile Features", description: "New payment features in Android mobile money app", technologies: ["Kotlin", "Android", "Room DB"], role: "Android Developer" }]),

  mkApplicant("Esther Achieng", "esther.achieng@example.com", "Nairobi, Kenya",
    "Project Manager in Tech", 6,
    [{ name: "Jira", level: "Expert", yearsUsed: 5 }, { name: "Agile/Scrum", level: "Expert", yearsUsed: 5 }, { name: "Excel", level: "Advanced", yearsUsed: 6 }, { name: "SQL", level: "Beginner", yearsUsed: 0.5 }],
    [{ company: "Safaricom", role: "Technical Project Manager", startDate: "2020-01", endDate: "Present", description: "Led 3 engineering teams. Managed product roadmap for digital banking initiatives.", technologies: ["Jira", "Confluence", "Slack"] }],
    [{ institution: "United States International University", degree: "MBA", fieldOfStudy: "Project Management", startYear: 2016, endYear: 2019 }],
    [{ name: "Digital Banking Launch", description: "Managed launch of new digital banking product across 3 markets", technologies: ["Jira", "Confluence"], role: "Project Manager" }]),

  // ── MID-LEVEL CANDIDATES (35-42) ──────────────────────────────────────────
  mkApplicant("Joseph Nkurunziza", "joseph.nkurunziza@example.com", "Bujumbura, Burundi",
    "Frontend Developer at BujaCode", 2,
    [{ name: "React", level: "Intermediate", yearsUsed: 2 }, { name: "JavaScript", level: "Intermediate", yearsUsed: 2 }, { name: "CSS", level: "Intermediate", yearsUsed: 2 }, { name: "TypeScript", level: "Beginner", yearsUsed: 0.5 }],
    [{ company: "BujaCode", role: "Frontend Developer", startDate: "2024-01", endDate: "Present", description: "Built client web apps using React. Working on improving TypeScript skills.", technologies: ["React", "JavaScript", "Bootstrap"] }],
    [{ institution: "Université du Burundi", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2019, endYear: 2023 }],
    [{ name: "E-commerce Frontend", description: "Product catalog and shopping cart for local store", technologies: ["React", "JavaScript"], role: "Frontend Developer" }]),

  mkApplicant("Nadia Razafy", "nadia.razafy@example.com", "Antananarivo, Madagascar",
    "React Developer at Telma", 3,
    [{ name: "React", level: "Advanced", yearsUsed: 3 }, { name: "TypeScript", level: "Intermediate", yearsUsed: 2 }, { name: "CSS/Tailwind", level: "Advanced", yearsUsed: 3 }, { name: "Next.js", level: "Beginner", yearsUsed: 0.5 }],
    [{ company: "Telma Madagascar", role: "React Developer", startDate: "2023-01", endDate: "Present", description: "Built customer portal for telecom company. Focused on responsive design and accessibility.", technologies: ["React", "TypeScript", "Tailwind"] }],
    [{ institution: "Université d'Antananarivo", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2017, endYear: 2021 }],
    [{ name: "Customer Portal", description: "Self-service portal for telecom subscribers", technologies: ["React", "TypeScript", "Tailwind"], role: "Frontend Developer" }]),

  mkApplicant("Tendai Moyo", "tendai.moyo@example.com", "Harare, Zimbabwe",
    "Node.js Developer at Steward Bank", 3,
    [{ name: "Node.js", level: "Advanced", yearsUsed: 3 }, { name: "TypeScript", level: "Intermediate", yearsUsed: 2 }, { name: "PostgreSQL", level: "Intermediate", yearsUsed: 2 }, { name: "REST APIs", level: "Advanced", yearsUsed: 3 }],
    [{ company: "Steward Bank", role: "Node.js Developer", startDate: "2023-06", endDate: "Present", description: "Built banking APIs for mobile app. Implemented transaction processing with audit trails.", technologies: ["Node.js", "TypeScript", "PostgreSQL"] }],
    [{ institution: "University of Zimbabwe", degree: "Bachelor's", fieldOfStudy: "Software Engineering", startYear: 2017, endYear: 2021 }],
    [{ name: "Banking API", description: "Mobile banking REST API with transaction history", technologies: ["Node.js", "PostgreSQL", "Express"], role: "Backend Developer" }]),

  mkApplicant("Oluwaseun Bakare", "oluwaseun.bakare@example.com", "Ibadan, Nigeria",
    "Data Analyst at Dangote Group", 2,
    [{ name: "SQL", level: "Advanced", yearsUsed: 2 }, { name: "Excel", level: "Expert", yearsUsed: 3 }, { name: "Python", level: "Intermediate", yearsUsed: 1 }, { name: "Power BI", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "Dangote Group", role: "Data Analyst", startDate: "2024-01", endDate: "Present", description: "Analyzed production data and supply chain metrics. Built Excel dashboards for factory managers.", technologies: ["SQL", "Excel", "Power BI"] }],
    [{ institution: "University of Ibadan", degree: "Bachelor's", fieldOfStudy: "Industrial Mathematics", startYear: 2019, endYear: 2023 }],
    [{ name: "Production Analytics", description: "Supply chain and production efficiency dashboards", technologies: ["Excel", "SQL", "Power BI"], role: "Data Analyst" }]),

  mkApplicant("Kevin Musyoka", "kevin.musyoka@example.com", "Nairobi, Kenya",
    "Mid Frontend Developer at KCB", 3,
    [{ name: "React", level: "Advanced", yearsUsed: 3 }, { name: "TypeScript", level: "Intermediate", yearsUsed: 2 }, { name: "Next.js", level: "Intermediate", yearsUsed: 1 }, { name: "CSS/Tailwind", level: "Advanced", yearsUsed: 2 }, { name: "Jest", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "KCB Bank", role: "Frontend Developer", startDate: "2023-06", endDate: "Present", description: "Built internet banking UI. Migrated legacy jQuery codebase to React, improving load times 3x.", technologies: ["React", "TypeScript", "Tailwind"] }],
    [{ institution: "Strathmore University", degree: "Bachelor's", fieldOfStudy: "Informatics & Computer Science", startYear: 2017, endYear: 2021 }],
    [{ name: "Internet Banking UI", description: "Modern React-based internet banking interface", technologies: ["React", "TypeScript", "Tailwind"], role: "Frontend Developer" }]),

  mkApplicant("Ruth Nakamura", "ruth.nakamura@example.com", "Kampala, Uganda",
    "Backend Developer at Airtel Money", 2,
    [{ name: "Node.js", level: "Intermediate", yearsUsed: 2 }, { name: "PostgreSQL", level: "Intermediate", yearsUsed: 2 }, { name: "REST APIs", level: "Intermediate", yearsUsed: 2 }, { name: "TypeScript", level: "Beginner", yearsUsed: 1 }],
    [{ company: "Airtel Money Uganda", role: "Backend Developer", startDate: "2024-01", endDate: "Present", description: "Built internal APIs for transaction reconciliation. Migrating from JavaScript to TypeScript.", technologies: ["Node.js", "Express", "PostgreSQL"] }],
    [{ institution: "Makerere University", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2019, endYear: 2023 }],
    [{ name: "Reconciliation API", description: "Automated transaction matching system", technologies: ["Node.js", "PostgreSQL"], role: "Backend Developer" }]),

  mkApplicant("Felix Mugisha", "felix.mugisha@example.com", "Kigali, Rwanda",
    "Junior Data Analyst at RwandAir", 1,
    [{ name: "SQL", level: "Intermediate", yearsUsed: 1 }, { name: "Excel", level: "Advanced", yearsUsed: 2 }, { name: "Python", level: "Beginner", yearsUsed: 0.5 }, { name: "Data Visualization", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "RwandAir", role: "Junior Analyst", startDate: "2025-03", endDate: "Present", description: "Tracking flight occupancy and revenue metrics. Building weekly reports for management.", technologies: ["Excel", "SQL", "Google Sheets"] }],
    [{ institution: "University of Rwanda", degree: "Bachelor's", fieldOfStudy: "Economics", startYear: 2020, endYear: 2024 }],
    [{ name: "Flight Occupancy Tracker", description: "Weekly occupancy and revenue reporting tool", technologies: ["Excel", "SQL"], role: "Analyst" }]),

  mkApplicant("Halima Juma", "halima.juma@example.com", "Dar es Salaam, Tanzania",
    "Mid-Level Python Developer at Tigo", 3,
    [{ name: "Python", level: "Advanced", yearsUsed: 3 }, { name: "SQL", level: "Advanced", yearsUsed: 3 }, { name: "Data Visualization", level: "Intermediate", yearsUsed: 2 }, { name: "Django", level: "Advanced", yearsUsed: 2 }, { name: "Docker", level: "Beginner", yearsUsed: 0.5 }],
    [{ company: "Tigo Tanzania", role: "Python Developer", startDate: "2023-01", endDate: "Present", description: "Built data APIs and automation scripts. Maintained Django-based internal tools.", technologies: ["Python", "Django", "PostgreSQL"] }],
    [{ institution: "University of Dar es Salaam", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2017, endYear: 2021 }],
    [{ name: "Data Automation Suite", description: "Automated data collection and reporting tools", technologies: ["Python", "Django", "PostgreSQL"], role: "Developer" }]),

  // ── SENIOR/OVERQUALIFIED (43-46) ──────────────────────────────────────────
  mkApplicant("Dr. Kofi Appiah", "kofi.appiah@example.com", "Accra, Ghana",
    "VP of Engineering at Interswitch", 15,
    [{ name: "Node.js", level: "Expert", yearsUsed: 10 }, { name: "Python", level: "Expert", yearsUsed: 12 }, { name: "PostgreSQL", level: "Expert", yearsUsed: 10 }, { name: "AWS", level: "Expert", yearsUsed: 8 }, { name: "System Architecture", level: "Expert", yearsUsed: 10 }, { name: "Team Leadership", level: "Expert", yearsUsed: 8 }],
    [{ company: "Interswitch", role: "VP of Engineering", startDate: "2018-01", endDate: "Present", description: "Led 50+ engineers across 4 teams. Architected pan-African payment infrastructure processing $1B+ annually.", technologies: ["Node.js", "Python", "PostgreSQL", "Kubernetes", "AWS"] }],
    [{ institution: "MIT", degree: "PhD", fieldOfStudy: "Computer Science", startYear: 2005, endYear: 2011 }],
    [{ name: "Pan-African Payment System", description: "Continental-scale payment processing infrastructure", technologies: ["Microservices", "Kubernetes", "AWS"], role: "Chief Architect" }]),

  mkApplicant("Amara Faye", "amara.faye@example.com", "Dakar, Senegal",
    "CTO at WariPay", 12,
    [{ name: "React", level: "Expert", yearsUsed: 8 }, { name: "Node.js", level: "Expert", yearsUsed: 10 }, { name: "TypeScript", level: "Expert", yearsUsed: 7 }, { name: "PostgreSQL", level: "Expert", yearsUsed: 9 }, { name: "System Design", level: "Expert", yearsUsed: 10 }, { name: "Docker", level: "Expert", yearsUsed: 6 }],
    [{ company: "WariPay", role: "CTO", startDate: "2017-01", endDate: "Present", description: "Built engineering team from 2 to 30. Led platform serving 3M users. Raised $15M Series A.", technologies: ["React", "Node.js", "PostgreSQL", "AWS", "Kubernetes"] }],
    [{ institution: "École Polytechnique", degree: "Master's", fieldOfStudy: "Computer Science", startYear: 2008, endYear: 2013 }],
    [{ name: "WariPay Platform", description: "Full fintech platform for West African remittances", technologies: ["React", "Node.js", "PostgreSQL", "AWS"], role: "CTO & Architect" }]),

  mkApplicant("Wanjiku Ngugi", "wanjiku.ngugi@example.com", "Nairobi, Kenya",
    "Principal Data Scientist at M-PESA", 10,
    [{ name: "Python", level: "Expert", yearsUsed: 10 }, { name: "SQL", level: "Expert", yearsUsed: 10 }, { name: "Statistics", level: "Expert", yearsUsed: 10 }, { name: "Tableau", level: "Expert", yearsUsed: 7 }, { name: "R", level: "Expert", yearsUsed: 8 }, { name: "Machine Learning", level: "Expert", yearsUsed: 7 }],
    [{ company: "Safaricom M-PESA", role: "Principal Data Scientist", startDate: "2018-01", endDate: "Present", description: "Led data science team of 8. Built ML models for fraud detection saving $50M/year. Designed experiments for 30M+ users.", technologies: ["Python", "SQL", "Tableau", "TensorFlow"] }],
    [{ institution: "Stanford University", degree: "PhD", fieldOfStudy: "Statistics", startYear: 2010, endYear: 2016 }],
    [{ name: "M-PESA Fraud Detection", description: "ML-based fraud prevention system for mobile money", technologies: ["Python", "TensorFlow", "SQL"], role: "Lead Data Scientist" }]),

  mkApplicant("Omar Diop", "omar.diop@example.com", "Dakar, Senegal",
    "Engineering Director at Jumia", 11,
    [{ name: "React", level: "Expert", yearsUsed: 7 }, { name: "Node.js", level: "Expert", yearsUsed: 8 }, { name: "TypeScript", level: "Expert", yearsUsed: 6 }, { name: "Next.js", level: "Advanced", yearsUsed: 4 }, { name: "AWS", level: "Expert", yearsUsed: 7 }, { name: "PostgreSQL", level: "Expert", yearsUsed: 8 }],
    [{ company: "Jumia", role: "Director of Engineering", startDate: "2019-01", endDate: "Present", description: "Managed 40 engineers. Led platform migration to Next.js serving 20M monthly visitors across 11 markets.", technologies: ["React", "Node.js", "Next.js", "PostgreSQL", "AWS"] }],
    [{ institution: "Carnegie Mellon University", degree: "Master's", fieldOfStudy: "Software Engineering", startYear: 2009, endYear: 2013 }],
    [{ name: "Jumia Platform Migration", description: "Next.js migration serving 20M visitors/month", technologies: ["Next.js", "Node.js", "AWS"], role: "Engineering Director" }]),

  // ── CAREER SWITCHERS & UNIQUE PROFILES (47-50) ────────────────────────────
  mkApplicant("Thabo Molefe", "thabo.molefe@example.com", "Johannesburg, South Africa",
    "Bootcamp Graduate — Career Switcher from Finance", 1,
    [{ name: "React", level: "Intermediate", yearsUsed: 1 }, { name: "JavaScript", level: "Intermediate", yearsUsed: 1 }, { name: "Node.js", level: "Beginner", yearsUsed: 0.5 }, { name: "SQL", level: "Intermediate", yearsUsed: 1 }, { name: "Excel", level: "Expert", yearsUsed: 7 }],
    [{ company: "WeThinkCode_", role: "Software Development Student", startDate: "2025-01", endDate: "Present", description: "Intensive 12-month coding bootcamp. Built 5 full-stack projects. Previously worked 7 years in banking.", technologies: ["React", "Node.js", "JavaScript", "SQL"] }],
    [{ institution: "WeThinkCode_ Bootcamp", degree: "Certificate", fieldOfStudy: "Full-Stack Development", startYear: 2025, endYear: 2025 }],
    [{ name: "Budget Tracker App", description: "Personal finance tracking app built during bootcamp", technologies: ["React", "Node.js", "PostgreSQL"], role: "Solo Developer" }]),

  mkApplicant("Nyasha Chirwa", "nyasha.chirwa@example.com", "Lilongwe, Malawi",
    "Self-Taught Developer & Data Enthusiast", 2,
    [{ name: "Python", level: "Advanced", yearsUsed: 2 }, { name: "SQL", level: "Advanced", yearsUsed: 2 }, { name: "React", level: "Beginner", yearsUsed: 0.5 }, { name: "Data Visualization", level: "Intermediate", yearsUsed: 1 }, { name: "Excel", level: "Advanced", yearsUsed: 3 }],
    [{ company: "Freelance", role: "Data Analyst & Developer", startDate: "2024-01", endDate: "Present", description: "Self-taught developer. Built data analysis tools for local NGOs. Active open-source contributor.", technologies: ["Python", "SQL", "Pandas", "Matplotlib"] }],
    [{ institution: "University of Malawi", degree: "Bachelor's", fieldOfStudy: "Economics", startYear: 2018, endYear: 2022 }],
    [{ name: "NGO Data Dashboard", description: "Data visualization tool for health NGO tracking outcomes", technologies: ["Python", "Dash", "PostgreSQL"], role: "Solo Developer" }]),

  mkApplicant("Zainab Osman", "zainab.osman@example.com", "Khartoum, Sudan",
    "Full-Stack Developer (Remote Freelancer)", 3,
    [{ name: "React", level: "Advanced", yearsUsed: 2 }, { name: "Node.js", level: "Advanced", yearsUsed: 3 }, { name: "TypeScript", level: "Intermediate", yearsUsed: 2 }, { name: "PostgreSQL", level: "Intermediate", yearsUsed: 2 }, { name: "Next.js", level: "Intermediate", yearsUsed: 1 }, { name: "Tailwind CSS", level: "Intermediate", yearsUsed: 1 }],
    [{ company: "Freelance (Upwork/Toptal)", role: "Full-Stack Developer", startDate: "2023-01", endDate: "Present", description: "Completed 20+ freelance projects. Top-rated on Upwork with 5-star reviews. Built apps for clients in US, UK, UAE.", technologies: ["React", "Node.js", "TypeScript", "PostgreSQL"] }],
    [{ institution: "University of Khartoum", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2017, endYear: 2021 }],
    [{ name: "Client Project Portfolio", description: "20+ full-stack projects for international clients", technologies: ["React", "Node.js", "Next.js", "PostgreSQL"], role: "Freelance Developer" }]),

  mkApplicant("Prosper Chirenje", "prosper.chirenje@example.com", "Harare, Zimbabwe",
    "DevOps Engineer with Backend Skills", 4,
    [{ name: "Docker", level: "Expert", yearsUsed: 4 }, { name: "AWS", level: "Expert", yearsUsed: 4 }, { name: "Node.js", level: "Intermediate", yearsUsed: 2 }, { name: "Python", level: "Advanced", yearsUsed: 3 }, { name: "PostgreSQL", level: "Intermediate", yearsUsed: 2 }, { name: "Kubernetes", level: "Advanced", yearsUsed: 3 }],
    [{ company: "Econet Wireless", role: "DevOps Engineer", startDate: "2022-01", endDate: "Present", description: "Managed CI/CD pipelines and Kubernetes clusters. Also wrote backend services and automation scripts.", technologies: ["Docker", "Kubernetes", "AWS", "Node.js", "Python"] }],
    [{ institution: "University of Zimbabwe", degree: "Bachelor's", fieldOfStudy: "Computer Science", startYear: 2015, endYear: 2019 }],
    [{ name: "CI/CD Platform", description: "Company-wide CI/CD pipeline with automated deployments", technologies: ["Docker", "Kubernetes", "AWS", "GitHub Actions"], role: "DevOps Lead" }]),
];

// ─── Distribution: which applicants go to which jobs ────────────────────────
// Each person applies to 1-2 jobs for realism
const JOB_APPLICANT_MAP: number[][] = [
  // Job 0: Senior Frontend Developer — all frontend + cross-skill + some weak + some senior
  [0, 1, 2, 3, 4, 5, 19, 20, 23, 25, 26, 28, 29, 30, 31, 34, 35, 39, 43, 46, 48],
  // Job 1: Backend Engineer — all backend + cross-skill + some weak + some senior
  [6, 7, 8, 9, 10, 11, 19, 20, 21, 24, 25, 27, 29, 30, 37, 40, 42, 43, 44, 47, 49],
  // Job 2: Data Analyst — all data + cross-skill + some weak + some senior
  [12, 13, 14, 15, 16, 17, 21, 22, 23, 28, 31, 32, 33, 36, 38, 41, 42, 44, 45, 47],
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 DAVINCI AI SCREENER — DEMO SEED\n");
  console.log("=".repeat(50));

  // 1. Auth — login or signup
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

  // 2. Create 3 jobs
  console.log("\n📋 Creating 3 jobs...");
  const jobIds: string[] = [];

  for (const job of JOBS) {
    const { status, data } = await api("POST", "/jobs", job as any, token);
    if (status === 201) {
      jobIds.push(data.data._id);
      console.log(`  ✅ "${job.title}" → ${data.data._id}`);
    } else {
      console.error(`  ❌ Failed to create "${job.title}":`, data);
      process.exit(1);
    }
  }

  // 3. Submit applicants to each job
  console.log("\n👥 Submitting 50 applicants across 3 jobs...");
  const batchSize = 10; // submit in batches to avoid huge payloads

  for (let jobIdx = 0; jobIdx < 3; jobIdx++) {
    const applicantIndices = JOB_APPLICANT_MAP[jobIdx];
    const profiles = applicantIndices.map((i) => APPLICANTS[i]);
    const jobTitle = JOBS[jobIdx].title;
    const jobId = jobIds[jobIdx];

    // Submit in batches
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      const { status, data } = await api("POST", "/applicants/davinci", {
        jobId,
        profiles: batch,
      }, token);

      if (status === 201) {
        console.log(`  ✅ "${jobTitle}": batch ${Math.floor(i / batchSize) + 1} — ${batch.length} applicants`);
      } else {
        console.error(`  ❌ "${jobTitle}" batch failed:`, JSON.stringify(data).slice(0, 200));
      }
    }
    console.log(`  → ${applicantIndices.length} total applicants for "${jobTitle}"`);
  }

  // 4. Summary
  console.log("\n" + "=".repeat(50));
  console.log("\n🎉 SEED COMPLETE!\n");
  console.log("Jobs created:");
  for (let i = 0; i < 3; i++) {
    console.log(`  ${i + 1}. ${JOBS[i].title} (${JOB_APPLICANT_MAP[i].length} applicants) → ID: ${jobIds[i]}`);
  }
  console.log(`\nTotal unique applicants: ${APPLICANTS.length}`);
  console.log(`\nLogin: username="${demoUser}" password="${demoPass}"`);
  console.log("Go to http://localhost:3000/hr/login to start screening!\n");
}

main().catch((err) => {
  console.error("💥 Seed failed:", err);
  process.exit(1);
});
