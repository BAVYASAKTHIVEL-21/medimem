"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { CogneePill, SectionLabel, Badge } from "@/components/ui";
import { IconUpload, IconFileText, IconCloud, IconNetwork, IconAlertTriangle, IconDatabase } from "@/components/Icons";
import { api } from "@/lib/api";
import { cacheClearPatient } from "@/lib/cache";

export default function UploadPage() {
  const router   = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [patient,   setPatient]   = useState<any>(null);
  const [docs,      setDocs]      = useState<any[]>([]);
  const [drag,      setDrag]      = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [phase,     setPhase]     = useState("");
  const [error,     setError]     = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medimem_active_patient");
      if (saved) {
        const p = JSON.parse(saved);
        setPatient(p);
        setDocs(p.docs || []);
      } else {
        router.push("/patients/list");
      }
    } catch {}
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleFile = async (file: File) => {
    if (!patient) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files supported"); return;
    }
    setError("");
    setUploading(true);
    setProgress(0);
    setPhase("Extracting text from PDF...");

    // Animate 0 → 90 while waiting — stops at 90 until real response
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 90;
        }
        if (prev < 25) { setPhase("Extracting text from PDF...");    return prev + 5;   }
        if (prev < 50) { setPhase("Sending chunks to Cognee Cloud..."); return prev + 3; }
        if (prev < 70) { setPhase("Building knowledge graph...");    return prev + 2;   }
        if (prev < 85) { setPhase("Scanning for risks...");          return prev + 1;   }
        setPhase("Almost done...");
        return prev + 0.5;
      });
    }, 350);

    try {
      await api.uploadDoc(patient.id, file);

      // Only hits 100 when backend actually responds
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setPhase("Ingested into Cognee Cloud!");

      // Refresh patient data and clear stale memory caches
      cacheClearPatient(patient.id);
      const updated = await api.getPatient(patient.id);
      localStorage.setItem("medimem_active_patient", JSON.stringify(updated));
      setPatient(updated);
      setDocs(updated.docs || []);

      setTimeout(() => { setUploading(false); setProgress(0); setPhase(""); }, 2000);
    } catch (e: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setError(e.message || "Upload failed. Please try again.");
      setUploading(false); setProgress(0); setPhase("");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  if (!patient) return null;

  const totalChunks = docs.reduce((s: number, d: any) => s + (d.chunks || 0), 0);
  const totalSize   = docs.reduce((s: number, d: any) => {
    const mb = parseFloat(d.size?.replace("MB","") || "0");
    return s + mb;
  }, 0);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <div className="page-header">
          <div>
            <div className="text-[17px] font-bold text-white">Upload Documents</div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              {patient.name} · Add records to Cognee Cloud memory
            </div>
          </div>
          <CogneePill />
        </div>

        <div className="page-content">
          {error && (
            <div className="bg-rose-dark border border-rose/30 rounded-xl px-4 py-2.5 text-[12px] text-rose mb-4 flex items-center gap-2">
              <IconAlertTriangle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">

            {/* ── LEFT ─────────────────────────── */}
            <div className="flex flex-col gap-4">

              {/* Drop zone */}
              <label
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                className={`dropzone ${drag ? "over" : ""} ${uploading ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}
              >
                <input type="file" accept=".pdf" className="hidden" onChange={onFileInput} />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-teal-dark border border-teal/30">
                  <IconCloud size={26} className="text-teal" />
                </div>
                <div className="text-[16px] font-semibold text-white mb-2">
                  {uploading ? "Processing..." : "Drop PDF files here"}
                </div>
                <p className="text-[12px] text-ink-muted mb-5 leading-relaxed">
                  Lab reports, prescriptions,<br />discharge summaries, scan reports
                </p>
                {!uploading && (
                  <div className="btn-primary mx-auto pointer-events-none">
                    <IconUpload size={13} /> Browse files
                  </div>
                )}
                <p className="text-[10px] text-ink-muted mt-3">PDF files only · Max 50MB</p>
              </label>

              {/* Progress card */}
              {uploading && (
                <div className="card animate-fade-in">
                  <SectionLabel>Upload in progress</SectionLabel>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-[12px] text-ink-muted">{phase}</div>
                    <span className="text-[13px] font-bold text-teal">
                      {Math.min(100, Math.floor(progress))}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-line-strong overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal transition-all duration-300"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-ink-muted mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse flex-shrink-0" />
                    Session will appear at platform.cognee.ai/sessions
                  </div>
                </div>
              )}

              {/* Cognee status card */}
              <div className="rounded-2xl p-4 border" style={{ background: "#130f2e", borderColor: "#8b7ff530" }}>
                <div className="flex items-center gap-2 mb-3">
                  <IconNetwork size={13} className="text-violet" />
                  <span className="text-[11px] font-semibold text-violet">Cognee Cloud — memory status</span>
                </div>
                {[
                  ["Documents ingested",  docs.length,                                    "#00d4a0"],
                  ["Total chunks",        totalChunks,                                    "#8b7ff5"],
                  ["Knowledge graph",     totalChunks > 0 ? "Active" : "Empty",          "#00d4a0"],
                  ["Total size",          totalSize > 0 ? `${totalSize.toFixed(2)} MB` : "—", "#4090e0"],
                ].map(([k, v, c]) => (
                  <div key={String(k)} className="flex justify-between py-2 border-b last:border-0"
                    style={{ borderColor: "#2a2060" }}>
                    <span className="text-[11px] text-ink-muted">{k}</span>
                    <span className="text-[12px] font-bold" style={{ color: String(c) }}>{v}</span>
                  </div>
                ))}
                <a href="https://platform.cognee.ai/sessions" target="_blank" rel="noreferrer"
                  className="btn-violet w-full mt-3 justify-center text-[12px] no-underline">
                  <IconNetwork size={13} /> View sessions in Cognee Cloud
                </a>
              </div>
            </div>

            {/* ── RIGHT ────────────────────────── */}
            <div className="card flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Ingested documents</SectionLabel>
                <span className="badge badge-teal">{docs.length} in memory</span>
              </div>

              {docs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center py-10">
                  <div>
                    <IconFileText size={32} className="text-ink-muted mx-auto mb-2" />
                    <div className="text-[12px] text-ink-muted">No documents yet</div>
                    <div className="text-[11px] text-ink-muted mt-1">Upload a PDF to get started</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                  {docs.map((doc: any, i: number) => (
                    <div key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
                      style={{ background: "#001f17", borderColor: "#00d4a030" }}>
                      <IconFileText size={16} color="#00d4a0" className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-white truncate">{doc.name}</div>
                        <div className="text-[10px] text-ink-muted mt-0.5">
                          {doc.uploaded_at?.split("T")[0] || "—"} · {doc.chunks} chunks · {doc.size}
                        </div>
                      </div>
                      <Badge label="Ingested" variant="teal" />
                    </div>
                  ))}
                </div>
              )}

              {/* Real stats — no fake % */}
              {docs.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-line flex-shrink-0">
                  {[
                    ["Total chunks",  totalChunks],
                    ["Documents",     docs.length],
                    ["Total size",    totalSize > 0 ? `${totalSize.toFixed(1)}MB` : "—"],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="bg-bg-input rounded-xl p-2.5 text-center">
                      <div className="text-[15px] font-bold text-teal">{v}</div>
                      <div className="text-[9px] text-ink-muted mt-1">{k}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}