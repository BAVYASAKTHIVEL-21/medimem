"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";
import { cacheGet, cacheSet } from "@/lib/cache";

const TYPE_COLORS: Record<string, string> = {
  Diagnosis:  "#00d4a0",
  Medication: "#8b7ff5",
  Allergy:    "#f0a030",
  "Lab Result": "#4090e0",
  Vital:      "#4090e0",
  "Follow-up":  "#00d4a0",
  Note:       "#8a9ab8",
};

export default function TimelinePage() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [events,  setEvents]  = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cached,  setCached]  = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medimem_active_patient");
      if (!saved) { router.push("/patients/list"); return; }
      const p = JSON.parse(saved);
      setPatient(p);

      const hit = cacheGet<any[]>(`timeline_${p.id}`);
      if (hit) {
        setEvents(hit);
        setCached(true);
        refreshBg(p.id);
      } else {
        load(p.id);
      }
    } catch {}
  }, []);

  const load = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getTimeline(id);
      const evts = data.events || [];
      setEvents(evts);
      cacheSet(`timeline_${id}`, evts, 30);
      setCached(false);
    } catch {}
    setLoading(false);
  };

  const refreshBg = async (id: string) => {
    try {
      const data = await api.getTimeline(id);
      const evts = data.events || [];
      setEvents(evts);
      cacheSet(`timeline_${id}`, evts, 30);
      setCached(false);
    } catch {}
  };

  if (!patient) return null;

  return (
    <div className="app-shell">
      <Sidebar/>
      <main className="main-area">
        <div className="page-header">
          <div>
            <div className="text-[17px] font-bold text-white">Timeline</div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              {patient.name} · Medical history from Cognee memory
              {cached && <span className="ml-2 text-teal">(cached)</span>}
            </div>
          </div>
          <button onClick={() => load(patient.id)} disabled={loading}
            className="btn-secondary text-[11px]">
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="page-content">
          {loading && events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-teal/20 border-t-teal animate-spin-slow"/>
              <div className="text-[12px] text-ink-muted">Recalling from Cognee Cloud...</div>
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="text-[14px] text-white">No timeline events yet</div>
              <div className="text-[12px] text-ink-muted">Upload patient documents to generate timeline</div>
            </div>
          )}

          {events.length > 0 && (
            <div className="max-w-2xl">
              <div className="border-l-2 border-line pl-6 flex flex-col gap-4">
                {events.map((evt, i) => {
                  const color = TYPE_COLORS[evt.type] || "#8a9ab8";
                  return (
                    <div key={evt.id || i} className="relative">
                      <div className="absolute -left-[31px] top-3 w-3 h-3 rounded-full border-2 flex-shrink-0"
                        style={{ background: color, borderColor: color }}/>
                      <div className="bg-bg-card border border-line rounded-xl px-4 py-3 hover:border-line-strong transition-all">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color, background: `${color}18`, border: `0.5px solid ${color}30` }}>
                            {evt.type}
                          </span>
                          <span className="text-[9px] text-ink-muted">#{i + 1}</span>
                        </div>
                        <p className="text-[12px] text-ink-soft leading-relaxed">{evt.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
