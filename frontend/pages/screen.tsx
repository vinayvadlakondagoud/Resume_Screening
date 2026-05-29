import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import UploadForm from "../components/UploadForm";
import { createJob, createJobFromFile, listJobs, uploadResumes, runScreening } from "../utils/api";
import { showToast } from "../components/Toast";

const STEPS = [
  { num: 1, label: "Job Description" },
  { num: 2, label: "Upload Resumes" },
  { num: 3, label: "Results" },
];

interface JobItem {
  job_id: string;
  title: string;
  extracted_skills: string[];
}

export default function ScreenPage() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdInputMode, setJdInputMode] = useState<"paste" | "upload">("paste");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [screening, setScreening] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [jobId, setJobId] = useState<string | null>(null);
  const [existingJobs, setExistingJobs] = useState<JobItem[]>([]);
  const [showExisting, setShowExisting] = useState(false);
  const jdFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listJobs()
      .then((jobs) => setExistingJobs(jobs))
      .catch(() => {});
  }, []);

  const handleJobSubmit = async () => {
    setLoading(true);
    try {
      let job;
      if (jdInputMode === "upload" && jdFile) {
        job = await createJobFromFile(jobTitle || "Uploaded JD", jdFile);
      } else if (jdInputMode === "paste" && jobDescription.trim()) {
        job = await createJob(jobTitle || "Untitled Position", jobDescription);
      } else {
        setLoading(false);
        return;
      }
      setJobId(job.job_id);
      setStep(2);
      showToast("Job created successfully", "success");
    } catch {
      showToast("Failed to create job. Is the backend running?", "error");
    }
    setLoading(false);
  };

  const handleSelectExisting = (j: JobItem) => {
    setJobId(j.job_id);
    setJobTitle(j.title);
    setJobDescription("");
    setStep(2);
    setShowExisting(false);
    showToast(`Using: ${j.title}`, "info");
  };

  const handleUpload = async () => {
    if (!jobId || files.length === 0) return;
    setLoading(true);
    try {
      await uploadResumes(jobId, files);
      setStep(3);
      setScreening(true);
      await runScreening(jobId);
      showToast(`Screened ${files.length} resumes`, "success");
      setScreening(false);
      router.push(`/results/${jobId}`);
    } catch {
      showToast("Upload or screening failed", "error");
      setScreening(false);
      setStep(2);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold hover:bg-indigo-700 transition">R</Link>
            <h1 className="text-lg font-bold tracking-tight">New Screening</h1>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-0 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  step === s.num ? "bg-indigo-600 text-white shadow-md" : step > s.num ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s.num ? "bg-white/20" : step > s.num ? "bg-emerald-500 text-white" : "bg-slate-300 text-white"
                  }`}>
                    {step > s.num ? "\u2713" : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-8 h-0.5 mx-1 ${step > s.num ? "bg-emerald-400" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Enter Job Description</h2>
                <p className="text-sm text-slate-500 mt-1">Paste text, upload a file, or pick a previous job.</p>
              </div>

              {existingJobs.length > 0 && (
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-sm font-semibold text-indigo-800">Previous Jobs</span>
                      <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{existingJobs.length}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowExisting(!showExisting)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                    >
                      {showExisting ? "Collapse" : "Browse"}
                    </button>
                  </div>
                  {showExisting && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {existingJobs.map((j) => (
                        <button
                          key={j.job_id}
                          onClick={() => handleSelectExisting(j)}
                          className="text-left bg-white rounded-xl px-4 py-3 border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700">{j.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{j.extracted_skills.length} skills extracted</p>
                            </div>
                            <svg className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          {j.extracted_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {j.extracted_skills.slice(0, 3).map((s) => (
                                <span key={s} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-medium">{s}</span>
                              ))}
                              {j.extracted_skills.length > 3 && (
                                <span className="text-[10px] text-slate-400">+{j.extracted_skills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <input
                type="text"
                placeholder="Job Title (optional)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setJdInputMode("paste")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    jdInputMode === "paste" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setJdInputMode("upload")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    jdInputMode === "upload" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  Upload File
                </button>
              </div>

              {jdInputMode === "paste" ? (
                <textarea
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={10}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
                />
              ) : (
                <div
                  onClick={() => jdFileRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-indigo-400 cursor-pointer transition bg-slate-50/50"
                >
                  {jdFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-slate-700">{jdFile.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setJdFile(null); }}
                        className="text-slate-400 hover:text-red-500 ml-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-slate-500">Click to upload JD file (PDF, DOC, DOCX)</p>
                    </div>
                  )}
                  <input
                    ref={jdFileRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) setJdFile(e.target.files[0]); }}
                  />
                </div>
              )}

              <button
                onClick={handleJobSubmit}
                disabled={loading || (jdInputMode === "paste" ? !jobDescription.trim() : !jdFile)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</span>
                ) : (
                  "Continue to Upload Resumes"
                )}
              </button>
            </div>
          )}

          {screening && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-5 relative">
                <div className="w-16 h-16 border-4 border-indigo-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin" />
                <svg className="absolute inset-0 w-16 h-16 p-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Screening in Progress</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                We&rsquo;re analyzing {files.length} resume{files.length !== 1 ? "s" : ""} against the job description. This usually takes a few seconds.
              </p>
              <div className="mt-6 flex justify-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {step >= 2 && jobId && !screening && (
            <UploadForm
              files={files}
              setFiles={setFiles}
              loading={loading}
              onUpload={handleUpload}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
