import { useCallback, useState } from "react";
import { showToast } from "./Toast";

interface Props {
  files: File[];
  setFiles: (files: File[]) => void;
  loading: boolean;
  onUpload: () => void;
  onBack: () => void;
}

const ALLOWED = [".pdf", ".doc", ".docx"];
const MAX_SIZE = 5 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function UploadForm({ files, setFiles, loading, onUpload, onBack }: Props) {
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid: File[] = [];
    const errors: string[] = [];
    Array.from(incoming).forEach((f) => {
      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
      if (!ALLOWED.includes(ext)) {
        errors.push(`"${f.name}" — unsupported format`);
        return;
      }
      if (f.size > MAX_SIZE) {
        errors.push(`"${f.name}" — exceeds 5MB`);
        return;
      }
      valid.push(f);
    });
    if (errors.length) showToast(errors.join("\n"), "error");
    if (valid.length) {
      setFiles([...files, ...valid]);
      showToast(`Added ${valid.length} file${valid.length > 1 ? "s" : ""}`, "success");
    }
  }, [files, setFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const removeFile = (i: number) => setFiles(files.filter((_, idx) => idx !== i));

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Upload Resumes</h2>
          <p className="text-sm text-slate-500 mt-1">Drag & drop or browse to add PDF/DOCX files.</p>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          dragging ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]" : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            dragging ? "bg-indigo-200" : "bg-slate-200"
          }`}>
            <svg className={`w-6 h-6 ${dragging ? "text-indigo-600" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className={`text-sm font-medium ${dragging ? "text-indigo-600" : "text-slate-600"}`}>
            {dragging ? "Drop files here" : "Drag & drop resume files here"}
          </p>
          <p className="text-xs text-slate-400">or</p>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Browse Files
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
              className="hidden"
            />
          </label>
          <p className="text-xs text-slate-400">PDF, DOC, DOCX &middot; Max 5MB each</p>
        </div>
      </div>

      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">{files.length} file{files.length > 1 ? "s" : ""} ({formatSize(totalSize)})</p>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-xl text-sm group hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate text-slate-700">{f.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{formatSize(f.size)}</span>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="px-5 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
          Back
        </button>
        <button
          onClick={onUpload}
          disabled={loading || files.length === 0}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
          ) : (
            `Screen ${files.length} Candidate${files.length !== 1 ? "s" : ""}`
          )}
        </button>
      </div>
    </div>
  );
}
