"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PaperclipIcon,
  PlusIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL;

interface FormQuestion {
  id: string;
  question: string;
}

interface JobMeta {
  title: string;
  department?: string;
  formQuestions?: FormQuestion[];
}

type FormStage = "form" | "submitting" | "success" | "error";
type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";
type LanguageLevel = "Basic" | "Conversational" | "Fluent" | "Native";
type AvailabilityStatus = "Available" | "Open to Opportunities" | "Not Available";
type AvailabilityType = "Full-time" | "Part-time" | "Contract";

interface SkillEntry {
  name: string;
  level: SkillLevel;
  yearsOfExperience: string;
}

interface LanguageEntry {
  name: string;
  proficiency: LanguageLevel;
}

interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string;
  isCurrent: boolean;
}

interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

interface CertificationEntry {
  name: string;
  issuer: string;
  issueDate: string;
}

interface ProjectEntry {
  name: string;
  description: string;
  technologies: string;
  role: string;
  link: string;
  startDate: string;
  endDate: string;
}

export default function PortalApplyPage() {
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  const [job, setJob] = useState<JobMeta | null>(null);
  const [stage, setStage] = useState<FormStage>("form");
  const [errorMsg, setErrorMsg] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  const [skillEntries, setSkillEntries] = useState<SkillEntry[]>([
    { name: "", level: "Intermediate", yearsOfExperience: "" },
  ]);
  const [languageEntries, setLanguageEntries] = useState<LanguageEntry[]>([]);
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([
    {
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      description: "",
      technologies: "",
      isCurrent: false,
    },
  ]);
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([
    { institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" },
  ]);
  const [certificationEntries, setCertificationEntries] = useState<CertificationEntry[]>([]);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>([
    {
      name: "",
      description: "",
      technologies: "",
      role: "",
      link: "",
      startDate: "",
      endDate: "",
    },
  ]);

  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("Open to Opportunities");
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>("Full-time");
  const [availabilityStartDate, setAvailabilityStartDate] = useState("");

  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    axios
      .get(`${API}/jobs/${id}`)
      .then((r) =>
        setJob({
          title: r.data.data.title,
          department: r.data.data.department,
          formQuestions: r.data.data.formQuestions ?? [],
        })
      )
      .catch(() => {});
  }, [id]);

  function setAnswer(qId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  const hasRequiredSections =
    skillEntries.some((item) => item.name.trim()) &&
    experienceEntries.some((item) => item.company.trim() && item.role.trim() && item.startDate.trim()) &&
    educationEntries.some((item) => item.institution.trim() && item.degree.trim() && item.fieldOfStudy.trim()) &&
    projectEntries.some((item) => item.name.trim() && item.description.trim() && item.role.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !headline.trim() ||
      !location.trim() ||
      !hasRequiredSections
    ) {
      setErrorMsg("Please complete the required talent profile fields before submitting.");
      setStage("error");
      return;
    }

    setStage("submitting");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("jobId", id!);
    formData.append("firstName", firstName.trim());
    formData.append("lastName", lastName.trim());
    formData.append("email", email.trim());
    formData.append("headline", headline.trim());
    formData.append("location", location.trim());
    if (phone.trim()) formData.append("phone", phone.trim());
    if (bio.trim()) formData.append("bio", bio.trim());

    formData.append(
      "skillsJson",
      JSON.stringify(
        skillEntries
          .filter((item) => item.name.trim())
          .map((item) => ({
            name: item.name.trim(),
            level: item.level,
            yearsOfExperience: item.yearsOfExperience ? Number(item.yearsOfExperience) : undefined,
          }))
      )
    );

    formData.append(
      "languagesJson",
      JSON.stringify(
        languageEntries
          .filter((item) => item.name.trim())
          .map((item) => ({
            name: item.name.trim(),
            proficiency: item.proficiency,
          }))
      )
    );

    formData.append(
      "experienceJson",
      JSON.stringify(
        experienceEntries
          .filter((item) => item.company.trim() && item.role.trim() && item.startDate.trim())
          .map((item) => ({
            company: item.company.trim(),
            role: item.role.trim(),
            startDate: item.startDate,
            endDate: item.isCurrent ? "Present" : item.endDate || undefined,
            description: item.description.trim() || undefined,
            technologies: item.technologies
              .split(",")
              .map((tech) => tech.trim())
              .filter(Boolean),
            isCurrent: item.isCurrent,
          }))
      )
    );

    formData.append(
      "educationJson",
      JSON.stringify(
        educationEntries
          .filter((item) => item.institution.trim() && item.degree.trim() && item.fieldOfStudy.trim())
          .map((item) => ({
            institution: item.institution.trim(),
            degree: item.degree.trim(),
            fieldOfStudy: item.fieldOfStudy.trim(),
            startYear: item.startYear ? Number(item.startYear) : undefined,
            endYear: item.endYear ? Number(item.endYear) : undefined,
          }))
      )
    );

    formData.append(
      "certificationsJson",
      JSON.stringify(
        certificationEntries
          .filter((item) => item.name.trim() && item.issuer.trim())
          .map((item) => ({
            name: item.name.trim(),
            issuer: item.issuer.trim(),
            issueDate: item.issueDate || undefined,
          }))
      )
    );

    formData.append(
      "projectsJson",
      JSON.stringify(
        projectEntries
          .filter((item) => item.name.trim() && item.description.trim() && item.role.trim())
          .map((item) => ({
            name: item.name.trim(),
            description: item.description.trim(),
            technologies: item.technologies
              .split(",")
              .map((tech) => tech.trim())
              .filter(Boolean),
            role: item.role.trim(),
            link: item.link.trim() || undefined,
            startDate: item.startDate || undefined,
            endDate: item.endDate || undefined,
          }))
      )
    );

    formData.append(
      "availabilityJson",
      JSON.stringify({
        status: availabilityStatus,
        type: availabilityType,
        startDate: availabilityStartDate || undefined,
      })
    );

    formData.append(
      "socialLinksJson",
      JSON.stringify({
        linkedin: linkedin.trim() || undefined,
        github: github.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
      })
    );

    if (resume) formData.append("resume", resume);

    const filled: Record<string, string> = {};
    (job?.formQuestions ?? []).forEach((q) => {
      if (answers[q.id]?.trim()) filled[q.id] = answers[q.id].trim();
    });
    formData.append("formAnswersJson", JSON.stringify(filled));

    try {
      await axios.post(`${API}/applicants/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStage("success");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || "Submission failed. Please try again.");
      setStage("error");
    }
  }

  if (stage === "success") {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Application submitted!</h1>
        <p className="text-sm text-slate-500 mb-8">
          Thank you, <span className="text-slate-300 font-semibold">{firstName}</span>. Your structured talent profile for
          <span className="text-slate-300"> {job?.title}</span> has been received.
        </p>
        <Link
          href="/portal"
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Browse more positions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link
        href={`/portal/jobs/${id}`}
        className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-400 font-semibold uppercase tracking-widest mb-8 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to job
      </Link>

      <div className="fade-rise">
        <p className="text-[10px] tracking-[0.3em] text-cyan-400/70 uppercase font-semibold mb-2">
          {job?.department || "Apply"}
        </p>
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">
          {job?.title ?? "Apply for this role"}
        </h1>
        <p className="text-xs text-slate-600 mb-10">
          Complete your standardized talent profile for stronger AI screening and fairer ranking.
        </p>

        {stage === "error" && (
          <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-400/20 rounded-xl p-4 mb-6 text-sm text-red-400">
            <AlertCircleIcon className="w-4 h-4 mt-0.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
              Basic information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="First Name" required value={firstName} onChange={setFirstName} placeholder="Jane" />
              <Field label="Last Name" required value={lastName} onChange={setLastName} placeholder="Smith" />
              <Field label="Email" required type="email" value={email} onChange={setEmail} placeholder="jane@email.com" />
              <Field label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="+250 7xx xxx xxx" />
              <Field label="Location" required value={location} onChange={setLocation} placeholder="Kigali, Rwanda" />
              <Field label="Headline" required value={headline} onChange={setHeadline} placeholder="Backend Engineer – Node.js & AI Systems" />
            </div>
            <div className="mt-3">
              <Textarea
                label="Bio"
                value={bio}
                onChange={setBio}
                placeholder="Share your professional background, strengths, and achievements."
                rows={4}
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Skills</h2>
              <AddRowButton
                label="Add skill"
                onClick={() =>
                  setSkillEntries((prev) => [...prev, { name: "", level: "Intermediate", yearsOfExperience: "" }])
                }
              />
            </div>
            <div className="space-y-3">
              {skillEntries.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-3">
                  <div className="md:col-span-5">
                    <Field
                      label="Skill"
                      required={index === 0}
                      value={item.name}
                      onChange={(value) =>
                        setSkillEntries((prev) => prev.map((row, i) => (i === index ? { ...row, name: value } : row)))
                      }
                      placeholder="Node.js"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <SelectField
                      label="Level"
                      value={item.level}
                      onChange={(value) =>
                        setSkillEntries((prev) => prev.map((row, i) => (i === index ? { ...row, level: value as SkillLevel } : row)))
                      }
                      options={["Beginner", "Intermediate", "Advanced", "Expert"]}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Field
                      label="Years"
                      type="number"
                      value={item.yearsOfExperience}
                      onChange={(value) =>
                        setSkillEntries((prev) => prev.map((row, i) => (i === index ? { ...row, yearsOfExperience: value } : row)))
                      }
                      placeholder="3"
                      min={0}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end justify-end">
                    {skillEntries.length > 1 && (
                      <RemoveRowButton onClick={() => setSkillEntries((prev) => prev.filter((_, i) => i !== index))} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Languages</h2>
              <AddRowButton
                label="Add language"
                onClick={() => setLanguageEntries((prev) => [...prev, { name: "", proficiency: "Conversational" }])}
              />
            </div>
            <div className="space-y-3">
              {languageEntries.length === 0 && <p className="text-xs text-slate-600">Optional but helpful for screening context.</p>}
              {languageEntries.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-3">
                  <div className="md:col-span-6">
                    <Field
                      label="Language"
                      value={item.name}
                      onChange={(value) =>
                        setLanguageEntries((prev) => prev.map((row, i) => (i === index ? { ...row, name: value } : row)))
                      }
                      placeholder="English"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <SelectField
                      label="Proficiency"
                      value={item.proficiency}
                      onChange={(value) =>
                        setLanguageEntries((prev) => prev.map((row, i) => (i === index ? { ...row, proficiency: value as LanguageLevel } : row)))
                      }
                      options={["Basic", "Conversational", "Fluent", "Native"]}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end justify-end">
                    <RemoveRowButton onClick={() => setLanguageEntries((prev) => prev.filter((_, i) => i !== index))} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Work experience</h2>
              <AddRowButton
                label="Add experience"
                onClick={() =>
                  setExperienceEntries((prev) => [
                    ...prev,
                    {
                      company: "",
                      role: "",
                      startDate: "",
                      endDate: "",
                      description: "",
                      technologies: "",
                      isCurrent: false,
                    },
                  ])
                }
              />
            </div>
            <div className="space-y-3">
              {experienceEntries.map((item, index) => (
                <div key={index} className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-slate-300">Experience {index + 1}</p>
                    {experienceEntries.length > 1 && (
                      <RemoveRowButton onClick={() => setExperienceEntries((prev) => prev.filter((_, i) => i !== index))} />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Company" required={index === 0} value={item.company} onChange={(value) => setExperienceEntries((prev) => prev.map((row, i) => (i === index ? { ...row, company: value } : row)))} placeholder="Acme Ltd" />
                    <Field label="Role" required={index === 0} value={item.role} onChange={(value) => setExperienceEntries((prev) => prev.map((row, i) => (i === index ? { ...row, role: value } : row)))} placeholder="Backend Engineer" />
                    <Field label="Start Date" required={index === 0} type="month" value={item.startDate} onChange={(value) => setExperienceEntries((prev) => prev.map((row, i) => (i === index ? { ...row, startDate: value } : row)))} />
                    <Field label="End Date" type="month" value={item.endDate} onChange={(value) => setExperienceEntries((prev) => prev.map((row, i) => (i === index ? { ...row, endDate: value } : row)))} />
                  </div>
                  <Field label="Technologies" value={item.technologies} onChange={(value) => setExperienceEntries((prev) => prev.map((row, i) => (i === index ? { ...row, technologies: value } : row)))} placeholder="Node.js, PostgreSQL, Docker" />
                  <Textarea label="Description" value={item.description} onChange={(value) => setExperienceEntries((prev) => prev.map((row, i) => (i === index ? { ...row, description: value } : row)))} placeholder="Key responsibilities and achievements" rows={3} />
                  <label className="inline-flex items-center gap-2 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={item.isCurrent}
                      onChange={(e) =>
                        setExperienceEntries((prev) => prev.map((row, i) => (i === index ? { ...row, isCurrent: e.target.checked } : row)))
                      }
                      className="rounded border-white/[0.08] bg-[#0d0d1a]"
                    />
                    I currently work here
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Education</h2>
              <AddRowButton
                label="Add education"
                onClick={() =>
                  setEducationEntries((prev) => [...prev, { institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" }])
                }
              />
            </div>
            <div className="space-y-3">
              {educationEntries.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-3">
                  <div className="md:col-span-4">
                    <Field label="Institution" required={index === 0} value={item.institution} onChange={(value) => setEducationEntries((prev) => prev.map((row, i) => (i === index ? { ...row, institution: value } : row)))} placeholder="University Name" />
                  </div>
                  <div className="md:col-span-3">
                    <Field label="Degree" required={index === 0} value={item.degree} onChange={(value) => setEducationEntries((prev) => prev.map((row, i) => (i === index ? { ...row, degree: value } : row)))} placeholder="Bachelor's" />
                  </div>
                  <div className="md:col-span-3">
                    <Field label="Field of Study" required={index === 0} value={item.fieldOfStudy} onChange={(value) => setEducationEntries((prev) => prev.map((row, i) => (i === index ? { ...row, fieldOfStudy: value } : row)))} placeholder="Computer Science" />
                  </div>
                  <div className="md:col-span-1">
                    <Field label="Start" type="number" value={item.startYear} onChange={(value) => setEducationEntries((prev) => prev.map((row, i) => (i === index ? { ...row, startYear: value } : row)))} placeholder="2020" min={1900} />
                  </div>
                  <div className="md:col-span-1">
                    <Field label="End" type="number" value={item.endYear} onChange={(value) => setEducationEntries((prev) => prev.map((row, i) => (i === index ? { ...row, endYear: value } : row)))} placeholder="2024" min={1900} />
                  </div>
                  <div className="md:col-span-12 flex justify-end">
                    {educationEntries.length > 1 && (
                      <RemoveRowButton onClick={() => setEducationEntries((prev) => prev.filter((_, i) => i !== index))} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Projects</h2>
              <AddRowButton
                label="Add project"
                onClick={() =>
                  setProjectEntries((prev) => [
                    ...prev,
                    { name: "", description: "", technologies: "", role: "", link: "", startDate: "", endDate: "" },
                  ])
                }
              />
            </div>
            <div className="space-y-3">
              {projectEntries.map((item, index) => (
                <div key={index} className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-slate-300">Project {index + 1}</p>
                    {projectEntries.length > 1 && (
                      <RemoveRowButton onClick={() => setProjectEntries((prev) => prev.filter((_, i) => i !== index))} />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Project Name" required={index === 0} value={item.name} onChange={(value) => setProjectEntries((prev) => prev.map((row, i) => (i === index ? { ...row, name: value } : row)))} placeholder="AI Recruitment System" />
                    <Field label="Role" required={index === 0} value={item.role} onChange={(value) => setProjectEntries((prev) => prev.map((row, i) => (i === index ? { ...row, role: value } : row)))} placeholder="Backend Engineer" />
                    <Field label="Link" value={item.link} onChange={(value) => setProjectEntries((prev) => prev.map((row, i) => (i === index ? { ...row, link: value } : row)))} placeholder="https://..." />
                    <Field label="Technologies" value={item.technologies} onChange={(value) => setProjectEntries((prev) => prev.map((row, i) => (i === index ? { ...row, technologies: value } : row)))} placeholder="Next.js, Node.js, Gemini API" />
                    <Field label="Start Date" type="month" value={item.startDate} onChange={(value) => setProjectEntries((prev) => prev.map((row, i) => (i === index ? { ...row, startDate: value } : row)))} />
                    <Field label="End Date" type="month" value={item.endDate} onChange={(value) => setProjectEntries((prev) => prev.map((row, i) => (i === index ? { ...row, endDate: value } : row)))} />
                  </div>
                  <Textarea label="Description" value={item.description} onChange={(value) => setProjectEntries((prev) => prev.map((row, i) => (i === index ? { ...row, description: value } : row)))} placeholder="Describe the problem, your work, and the outcome." rows={3} />
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Certifications</h2>
              <AddRowButton
                label="Add certification"
                onClick={() => setCertificationEntries((prev) => [...prev, { name: "", issuer: "", issueDate: "" }])}
              />
            </div>
            <div className="space-y-3">
              {certificationEntries.length === 0 && <p className="text-xs text-slate-600">Optional professional certifications.</p>}
              {certificationEntries.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-3">
                  <div className="md:col-span-5">
                    <Field label="Name" value={item.name} onChange={(value) => setCertificationEntries((prev) => prev.map((row, i) => (i === index ? { ...row, name: value } : row)))} placeholder="AWS Certified Developer" />
                  </div>
                  <div className="md:col-span-4">
                    <Field label="Issuer" value={item.issuer} onChange={(value) => setCertificationEntries((prev) => prev.map((row, i) => (i === index ? { ...row, issuer: value } : row)))} placeholder="Amazon" />
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Issue Date" type="month" value={item.issueDate} onChange={(value) => setCertificationEntries((prev) => prev.map((row, i) => (i === index ? { ...row, issueDate: value } : row)))} />
                  </div>
                  <div className="md:col-span-1 flex items-end justify-end">
                    <RemoveRowButton onClick={() => setCertificationEntries((prev) => prev.filter((_, i) => i !== index))} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Availability & links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <SelectField label="Status" value={availabilityStatus} onChange={(value) => setAvailabilityStatus(value as AvailabilityStatus)} options={["Available", "Open to Opportunities", "Not Available"]} />
              <SelectField label="Type" value={availabilityType} onChange={(value) => setAvailabilityType(value as AvailabilityType)} options={["Full-time", "Part-time", "Contract"]} />
              <Field label="Start Date" type="date" value={availabilityStartDate} onChange={setAvailabilityStartDate} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/..." />
              <Field label="GitHub" value={github} onChange={setGithub} placeholder="https://github.com/..." />
              <Field label="Portfolio" value={portfolio} onChange={setPortfolio} placeholder="https://yourportfolio.com" />
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Resume / CV</h2>
            <div
              className={clsx(
                "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center cursor-pointer transition-colors",
                resume
                  ? "border-cyan-400/30 bg-cyan-400/[0.03]"
                  : "border-white/[0.08] hover:border-white/20 bg-transparent"
              )}
              onClick={() => fileRef.current?.click()}
            >
              {resume ? (
                <div className="flex items-center gap-2.5">
                  <PaperclipIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-300 font-medium truncate max-w-xs">{resume.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setResume(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="ml-1 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500 text-center">Drop your PDF here or click to upload</p>
                  <p className="text-[10px] text-slate-700 mt-1">PDF · max 10 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            />
          </section>

          {(job?.formQuestions ?? []).length > 0 && (
            <section>
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">A few questions</h2>
              <div className="space-y-4">
                {(job?.formQuestions ?? []).map((q, i) => (
                  <Textarea
                    key={q.id}
                    label={`${i + 1}. ${q.question}`}
                    value={answers[q.id] ?? ""}
                    onChange={(value) => setAnswer(q.id, value)}
                    rows={3}
                    placeholder="Your answer..."
                  />
                ))}
              </div>
            </section>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={stage === "submitting"}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/20"
            >
              {stage === "submitting" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit talent profile"
              )}
            </button>
            <p className="text-center text-[10px] text-slate-700 mt-3">
              Core profile fields are required to support accurate AI-based screening.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
    >
      <PlusIcon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

function RemoveRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] text-red-400 hover:text-red-300 font-semibold transition-colors"
    >
      Remove
    </button>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-slate-500">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...(min !== undefined ? { min } : {})}
        className={clsx(
          "bg-[#0d0d1a] border border-white/[0.07] focus:border-cyan-400/40 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-700 focus:outline-none transition-all duration-200",
          (type === "date" || type === "month") && [
            "[color-scheme:dark]",
            // Calendar icon styling - much more visible and polished
            "[&::-webkit-calendar-picker-indicator]:opacity-100",
            "[&::-webkit-calendar-picker-indicator]:brightness-0",
            "[&::-webkit-calendar-picker-indicator]:invert",
            "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
            "[&::-webkit-calendar-picker-indicator]:hover:opacity-80",
            "[&::-webkit-calendar-picker-indicator]:transition-opacity",
            "[&::-webkit-calendar-picker-indicator]:w-4",
            "[&::-webkit-calendar-picker-indicator]:h-4",
            "[&::-webkit-calendar-picker-indicator]:mr-0.5",
            // Better focus states
            "focus:bg-[#12121f]",
            "focus:shadow-[0_0_0_3px_rgba(34,211,238,0.1)]",
            // Hover state
            "hover:border-white/[0.12]",
          ]
        )}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#0d0d1a] border border-white/[0.07] focus:border-cyan-400/40 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none transition-colors"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#0d0d1a] text-slate-100">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="bg-[#0d0d1a] border border-white/[0.07] focus:border-cyan-400/40 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-700 focus:outline-none transition-colors resize-none"
      />
    </label>
  );
}
