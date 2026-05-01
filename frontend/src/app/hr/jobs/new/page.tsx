"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch } from "@/store/hooks";
import { createJob } from "@/store/jobsSlice";
import toast from "react-hot-toast";
import { PlusIcon, XIcon, ArrowLeftIcon } from "lucide-react";
import clsx from "clsx";

export default function NewJobPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    workType: "remote" as "remote" | "hybrid" | "onsite",
    description: "",
    responsibilities: [""],
    requiredSkills: [""],
    preferredSkills: [""],
    yearsOfExperience: 0,
    educationLevel: "",
    niceToHave: [""],
    formQuestions: [""],
    status: "active" as "draft" | "active",
  });

  const [submitting, setSubmitting] = useState(false);

  function updateListItem(
    field: "responsibilities" | "requiredSkills" | "preferredSkills" | "niceToHave" | "formQuestions",
    idx: number,
    val: string
  ) {
    setForm((f) => {
      const arr = [...f[field]];
      arr[idx] = val;
      return { ...f, [field]: arr };
    });
  }

  function addListItem(
    field: "responsibilities" | "requiredSkills" | "preferredSkills" | "niceToHave" | "formQuestions"
  ) {
    setForm((f) => ({ ...f, [field]: [...f[field], ""] }));
  }

  function removeListItem(
    field: "responsibilities" | "requiredSkills" | "preferredSkills" | "niceToHave" | "formQuestions",
    idx: number
  ) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await dispatch(
        createJob({
          title: form.title,
          department: form.department,
          location: form.location,
          workType: form.workType,
          description: form.description,
          responsibilities: form.responsibilities.filter(Boolean),
          requirements: {
            yearsOfExperience: form.yearsOfExperience,
            requiredSkills: form.requiredSkills.filter(Boolean),
            preferredSkills: form.preferredSkills.filter(Boolean),
          },
          niceToHave: form.niceToHave.filter(Boolean),
          formQuestions: form.formQuestions
            .filter(Boolean)
            .map((q, i) => ({ id: `q${i + 1}`, question: q })),
          status: form.status,
        })
      ).unwrap();

      toast.success("Job created!");
      router.push(`/hr/jobs/${result._id}`);
    } catch {
      toast.error("Failed to create job");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div>
        <Link
          href="/hr"
          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 text-xs font-medium transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-3 h-3" />
          Dashboard
        </Link>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-10">Create New Job</h1>

        <form onSubmit={handleSubmit} className="space-y-10">
          <Section label="Basic Information">
            <GhostInput
              label="Job Title"
              value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
              required
              placeholder="e.g. Senior Frontend Engineer"
            />
            <GhostInput
              label="Department"
              value={form.department}
              onChange={(v) => setForm((f) => ({ ...f, department: v }))}
              placeholder="e.g. Engineering"
            />
            <GhostInput
              label="Location"
              value={form.location}
              onChange={(v) => setForm((f) => ({ ...f, location: v }))}
              placeholder="e.g. Kigali, Rwanda"
            />

            <div>
              <label className="block text-[9px] tracking-[0.22em] text-slate-600 dark:text-slate-400 uppercase font-semibold mb-2">
                Work Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {(["remote", "hybrid", "onsite"] as const).map((wt) => (
                  <button
                    key={wt}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, workType: wt }))}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize",
                      form.workType === wt
                        ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                        : "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.1]"
                    )}
                  >
                    {wt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[9px] tracking-[0.22em] text-slate-600 dark:text-slate-400 uppercase font-semibold mb-2">
                Description
              </label>
              <textarea
                className="w-full bg-transparent border border-slate-200 dark:border-white/[0.12] focus:border-cyan-400/40 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors resize-none min-h-[100px]"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
                placeholder="Describe the role, team, and impact..."
              />
            </div>

            <div>
              <label className="block text-[9px] tracking-[0.22em] text-slate-600 dark:text-slate-400 uppercase font-semibold mb-2">
                Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {(["active", "draft"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize",
                      form.status === s
                        ? s === "active"
                          ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                          : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                        : "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.1]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section label="Requirements">
            <div>
              <label className="block text-[9px] tracking-[0.22em] text-slate-600 uppercase font-semibold mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                min={0}
                className="w-24 bg-transparent border-b border-slate-200 dark:border-white/[0.12] focus:border-cyan-400 py-2 text-slate-900 dark:text-slate-100 focus:outline-none transition-colors text-sm tabular-nums"
                value={form.yearsOfExperience}
                onChange={(e) =>
                  setForm((f) => ({ ...f, yearsOfExperience: Number(e.target.value) }))
                }
              />
            </div>

            <GhostInput
              label="Education Level"
              value={form.educationLevel}
              onChange={(v) => setForm((f) => ({ ...f, educationLevel: v }))}
              placeholder="e.g. bachelor, master"
            />

            <TagListField
              label="Required Skills"
              items={form.requiredSkills}
              onChange={(i, v) => updateListItem("requiredSkills", i, v)}
              onAdd={() => addListItem("requiredSkills")}
              onRemove={(i) => removeListItem("requiredSkills", i)}
              placeholder="e.g. React, TypeScript"
            />

            <TagListField
              label="Preferred Skills"
              items={form.preferredSkills}
              onChange={(i, v) => updateListItem("preferredSkills", i, v)}
              onAdd={() => addListItem("preferredSkills")}
              onRemove={(i) => removeListItem("preferredSkills", i)}
              placeholder="e.g. Docker, AWS"
            />
          </Section>

          <Section label="Responsibilities">
            <TagListField
              label=""
              items={form.responsibilities}
              onChange={(i, v) => updateListItem("responsibilities", i, v)}
              onAdd={() => addListItem("responsibilities")}
              onRemove={(i) => removeListItem("responsibilities", i)}
              placeholder="e.g. Lead frontend architecture"
            />
          </Section>

          <Section label="Nice to Have">
            <TagListField
              label=""
              items={form.niceToHave}
              onChange={(i, v) => updateListItem("niceToHave", i, v)}
              onAdd={() => addListItem("niceToHave")}
              onRemove={(i) => removeListItem("niceToHave", i)}
              placeholder="e.g. Open source contributions"
            />
          </Section>

          <Section label="Application Questions">
            <p className="text-[10px] text-slate-600 dark:text-slate-400 -mt-3">Questions applicants will answer when applying. Leave empty for none.</p>
            <TagListField
              label=""
              items={form.formQuestions}
              onChange={(i, v) => updateListItem("formQuestions", i, v)}
              onAdd={() => addListItem("formQuestions")}
              onRemove={(i) => removeListItem("formQuestions", i)}
              placeholder="e.g. Why are you interested in this role?"
            />
          </Section>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-900 rounded-xl text-sm font-bold transition-colors"
            >
              {submitting ? "Creating..." : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] tracking-[0.24em] text-slate-600 dark:text-slate-400 uppercase font-semibold mb-5 pb-3 border-b border-slate-200 dark:border-white/[0.12]">
        {label}
      </p>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function GhostInput({
  label, value, onChange, required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[9px] tracking-[0.18em] text-slate-600 dark:text-slate-400 uppercase font-semibold mb-2">
          {label}
        </label>
      )}
      <input
        type="text"
        className="w-full bg-transparent border-b border-slate-200 dark:border-white/[0.12] focus:border-cyan-400 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}

function TagListField({
  label, items, onChange, onAdd, onRemove, placeholder,
}: {
  label: string; items: string[]; onChange: (i: number, v: string) => void;
  onAdd: () => void; onRemove: (i: number) => void; placeholder?: string;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[9px] tracking-[0.18em] text-slate-600 dark:text-slate-400 uppercase font-semibold mb-2">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 bg-transparent border-b border-slate-200 dark:border-white/[0.12] focus:border-cyan-400 py-1.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors text-sm"
              value={item}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={placeholder}
            />
            {items.length > 1 && (
              <button type="button" onClick={() => onRemove(i)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-400 transition-colors">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-cyan-400 transition-colors font-medium">
        <PlusIcon className="w-3.5 h-3.5" />
        Add
      </button>
    </div>
  );
}
