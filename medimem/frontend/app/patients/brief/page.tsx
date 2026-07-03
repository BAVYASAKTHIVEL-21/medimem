"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

import { IconRefresh, IconDatabase, IconMessageCircle } from "@/components/Icons";
import Link from "next/link";
import { api } from "@/lib/api";

export default function BriefPage() {
  const router = useRouter();
  const [patient,     setPatient]     = useState<any>(null);
  const [brief,       setBrief]       = useState<any>(null);
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medimem_active_patient");
      if (!saved) { router.push("/patients/list"); return; }
      const p = JSON.parse(saved);
      setPatient(p);

      // Load from cache — DO NOT auto-generate
      const cached = localStorage.getItem(`brief_${p.id}`);
      if (cached) {
        try { setBrief(JSON.parse(cached)); } catch {}
      }
      // If no cache → show empty state with Generate button
    } catch {}
  }, []);

  const generateBrief = async (isRefresh = false) => {
    if (!patient) return;

    if (isRefresh) {
      // Show old brief while refreshing in background
      setRefreshing(true);
    } else {
      // First time — show loader
      setLoading(true);
    }
    setError("");

    try {
      const data = await api.getBrief(patient.id);
      setBrief(data.brief);
      localStorage.setItem(`brief_${patient.id}`, JSON.stringify(data.brief));
    } catch (e: any) {
      setError(e.message || "Failed to generate brief. Upload documents first.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const COLORS: Record<number, { color: string; bg: string }> = {
    1: { color:"#00d4a0", bg:"#001f17" },
    2: { color:"#4090e0", bg:"#041525" },
    3: { color:"#e05a3a", bg:"#280e06" },
    4: { color:"#f0a030", bg:"#1e1200" },
    5: { color:"#8b7ff5", bg:"#130f2e" },
  };

  const riskColor = brief?.risk_level === "High" ? "#e05a3a"
                  : brief?.risk_level === "Low"  ? "#00d4a0"
                  : "#f0a030";
  const riskPct   = brief?.risk_level === "High" ? 85
                  : brief?.risk_level === "Low"  ? 25
                  : 55;

  if (!patient) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <div className="page-header">
          <div>
            <div className="text-[17px] font-bold text-white">Pre-Visit Brief</div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              AI-generated summary · {patient.name}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {/* Refreshing indicator */}
            {refreshing && (
              <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                <span className="w-3 h-3 rounded-full border-2 border-teal/20 border-t-teal animate-spin-slow"/>
                Updating...
              </div>
            )}
            {brief && (
              <button onClick={() => generateBrief(true)}
                disabled={loading || refreshing}
                className="btn-secondary">
                <IconRefresh size={13}
                  className={refreshing ? "animate-spin-slow" : ""}/>
                Regenerate
              </button>
            )}
          </div>
        </div>

        <div className="page-content">
          {error && (
            <div className="bg-rose-dark border border-rose/30 rounded-xl px-4 py-3 text-[12px] text-rose mb-4">
              {error}
            </div>
          )}

          {/* First time loading — show spinner */}
          {loading && !brief && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-teal/20 border-t-teal animate-spin-slow"/>
              <div className="text-[13px] text-ink-muted">
                Recalling patient memory from Cognee Cloud...
              </div>
            </div>
          )}

          {/* No brief yet — show generate button */}
          {!loading && !brief && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-dark border border-teal/30 flex items-center justify-center">
                <IconDatabase size={28} className="text-teal"/>
              </div>
              <div className="text-center">
                <div className="text-[16px] font-semibold text-white mb-2">
                  No brief generated yet
                </div>
                <div className="text-[12px] text-ink-muted mb-6">
                  Click below to generate a 5-point clinical summary from Cognee memory
                </div>
              </div>
              {!patient.docs?.length ? (
                <div className="text-center">
                  <div className="text-[12px] text-rose mb-3">
                    No documents uploaded yet
                  </div>
                  <Link href="/patients/upload">
                    <button className="btn-primary">Upload documents first</button>
                  </Link>
                </div>
              ) : (
                <button onClick={() => generateBrief(false)}
                  className="btn-primary px-8 py-3 text-[14px]">
                  <IconDatabase size={16}/> Generate Pre-Visit Brief
                </button>
              )}
            </div>
          )}

          {/* Brief content — shown immediately from cache, updates in background */}
          {brief && (
            <div className="grid grid-cols-[1fr_1.3fr] gap-4">

              {/* LEFT */}
              <div className="flex flex-col gap-4">
                <div className="card">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-teal-dark border border-teal/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-[13px] font-bold text-teal">
                        {patient.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}
                      </span>
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white">Patient Summary</div>
                      <div className="text-[11px] text-ink-muted">
                        {patient.name} · {patient.age} yrs · {patient.gender}
                      </div>
                      <div className="text-[10px] text-teal mt-0.5">
                        {refreshing ? "Updating from Cognee Cloud..." : "Cached · click Regenerate to refresh"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="text-[10px] text-ink-muted mb-2 uppercase tracking-widest">
                        Risk level
                      </div>
                      <div style={{
                        width:80, height:80, borderRadius:"50%",
                        border:`3px solid ${riskColor}`,
                        background:`${riskColor}18`,
                        display:"flex", flexDirection:"column",
                        alignItems:"center", justifyContent:"center",
                        flexShrink:0,
                      }}>
                        <span style={{ fontSize:11, fontWeight:700, color:riskColor }}>
                          {brief.risk_level || "Moderate"}
                        </span>
                        <span style={{ fontSize:9, color:riskColor, opacity:0.7, marginTop:2 }}>
                          Risk
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-ink-muted uppercase tracking-widest mb-3">
                        Suggested focus
                      </div>
                      {(brief.suggested_focus || []).map((item:string) => (
                        <div key={item} className="flex items-center gap-1.5 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0"/>
                          <span className="text-[11px] text-teal">{item}</span>
                        </div>
                      ))}
                      {brief.risk_reason && (
                        <div className="text-[10px] text-ink-muted mt-3 italic">
                          {brief.risk_reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Memory source */}
                <div className="rounded-2xl p-4 border"
                  style={{ background:"#001f17", borderColor:"#00d4a030" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <IconDatabase size={12} className="text-teal"/>
                    <span className="text-[10px] text-ink-muted uppercase tracking-widest">
                      Memory source
                    </span>
                  </div>
                  <p className="text-[12px] text-sage leading-relaxed">
                    Generated from{" "}
                    <strong className="text-white">
                      {patient.docs?.length || 0} documents
                    </strong>{" "}
                    in {patient.name}&apos;s Cognee Cloud knowledge graph.
                  </p>
                  <Link href="/patients/chat">
                    <button className="btn-primary w-full mt-3 justify-center">
                      <IconMessageCircle size={13}/> Ask AI Doctor
                    </button>
                  </Link>
                </div>
              </div>

              {/* RIGHT — 5 point summary */}
              <div className="card" style={{ opacity: refreshing ? 0.7 : 1, transition:"opacity .3s" }}>
                <div className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal flex items-center justify-center">
                    <span className="text-[10px] font-bold text-bg-base">5</span>
                  </span>
                  5 Point Summary
                  {refreshing && (
                    <span className="ml-auto text-[10px] text-ink-muted">Updating...</span>
                  )}
                </div>

                {(brief.points || []).map((item:any) => {
                  const c = COLORS[item.num] || COLORS[1];
                  return (
                    <div key={item.num}
                      className="flex gap-3 p-3 rounded-xl mb-3 last:mb-0"
                      style={{ background:c.bg, borderLeft:`3px solid ${c.color}` }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background:c.color, color:"#06080f" }}>
                        {item.num}
                      </div>
                      <div className="flex-1">
                        <div className="text-[12px] font-semibold mb-1"
                          style={{ color:c.color }}>
                          {item.title}
                        </div>
                        <div className="text-[12px] text-ink-soft leading-relaxed">
                          {item.text}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line text-[10px] text-ink-muted">
                  <IconDatabase size={11} className="text-teal flex-shrink-0"/>
                  Powered by Cognee Cloud knowledge graph recall
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}