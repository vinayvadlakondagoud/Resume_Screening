const API_BASE = "/api";

class ApiError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    throw new ApiError(text, res.status);
  }
  return res.json();
}

export { ApiError };

export async function listJobs() {
  const res = await fetch(`${API_BASE}/jobs`);
  return handleResponse(res);
}

export interface CandidateSummary {
  rank: number;
  candidate_name: string;
  score: number;
}

export interface JobSummary {
  job_id: string;
  title: string;
  extracted_skills: string[];
  created_at: string;
  candidate_count: number;
  average_score: number;
  top_score: number;
  top_candidate_name?: string;
  top_candidates?: CandidateSummary[];
}

export async function getJobSummaries(): Promise<JobSummary[]> {
  const res = await fetch(`${API_BASE}/jobs/summary`);
  return handleResponse(res);
}

export async function createJob(title: string, description: string) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  return handleResponse(res);
}

export async function createJobFromFile(title: string, file: File) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/jobs/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function uploadResumes(jobId: string, files: File[]) {
  const formData = new FormData();
  formData.append("job_id", jobId);
  files.forEach((f) => formData.append("files", f));
  const res = await fetch(`${API_BASE}/upload/resumes`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function runScreening(jobId: string) {
  const res = await fetch(`${API_BASE}/screening/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId }),
  });
  return handleResponse(res);
}

export async function getResults(jobId: string, minScore = 0, search = "", signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (minScore > 0) params.set("min_score", String(minScore));
  if (search) params.set("search", search);
  const res = await fetch(`${API_BASE}/screening/results/${jobId}?${params}`, { signal });
  return handleResponse(res);
}

export async function getFileUrl(resumeId: string) {
  return `${API_BASE}/files/${resumeId}`;
}

async function downloadExport(jobId: string, format: string) {
  const res = await fetch(`${API_BASE}/screening/export/${jobId}?format=${format}`);
  if (!res.ok) throw new ApiError("Export failed", res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `results_${jobId}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function deleteJob(jobId: string) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, { method: "DELETE" });
  return handleResponse(res);
}

export function exportResultsCSV(jobId: string) {
  return downloadExport(jobId, "csv");
}

export function exportResultsXLSX(jobId: string) {
  return downloadExport(jobId, "xlsx");
}
