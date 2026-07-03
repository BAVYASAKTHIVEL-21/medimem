"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { IconSearch, IconSend, IconAlertTriangle,
         IconDatabase, IconFileText, IconActivity,
         IconShield, IconNetwork, IconZap } from "@/components/Icons";
import Link from "next/link";
import { api } from "@/lib/api";
import { cacheGet, cacheSet } from "@/lib/cache";
import { alertHeadline, alertSummary } from "@/lib/formatAlert";

export default function MemoryHubPage() {
  const router  = useRouter();
  const [patient,  setPatient]  = useState<any>(null);
  const [doctor,   setDoctor]   = useState<any>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [mindmap,  setMindmap]  = useState<any>(null);
  const [alerts,   setAlerts]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [input,    setInput]    = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medimem_active_patient");
      const doc   = localStorage.getItem("medimem_doctor");
      if (!saved) { router.push("/patients/list"); return; }
      const p = JSON.parse(saved);
      setPatient(p);
      if (doc) setDoctor(JSON.parse(doc));

      // Load from cache immediately — show instantly
      const cachedSnap = cacheGet<any>(`snapshot_${p.id}`);
      const cachedMm   = cacheGet<any>(`mindmap_${p.id}`);
      const cachedAl   = cacheGet<any[]>(`alerts_hub_${p.id}`);
      if (cachedSnap) setSnapshot(cachedSnap);
      if (cachedMm)   setMindmap(cachedMm);
      if (cachedAl)   setAlerts(cachedAl);

      // If we have cached data — show immediately, refresh in background
      if (cachedSnap) {
        setLoading(false);
        refreshInBackground(p);
      } else {
        // No cache — load normally
        loadFresh(p);
      }
    } catch {}
  }, []);

  const loadFresh = async (p: any) => {
    setLoading(true);
    try {
      const [snap, al] = await Promise.all([
        api.getSnapshot(p.id),
        api.getAlerts(),
      ]);
      setSnapshot(snap);
      cacheSet(`snapshot_${p.id}`, snap, 5); // 5 min cache
      const filtered = (al.alerts||[]).filter((a:any)=>a.patient_id===p.id).slice(0,3);
      setAlerts(filtered);
      cacheSet(`alerts_hub_${p.id}`, filtered, 10);
    } catch {}
    setLoading(false);
    // Load mindmap in background
    loadMindmapBg(p.id);
  };

  const refreshInBackground = async (p: any) => {
    try {
      const [snap, al] = await Promise.all([
        api.getSnapshot(p.id),
        api.getAlerts(),
      ]);
      setSnapshot(snap);
      cacheSet(`snapshot_${p.id}`, snap, 5);
      const filtered = (al.alerts||[]).filter((a:any)=>a.patient_id===p.id).slice(0,3);
      setAlerts(filtered);
      cacheSet(`alerts_hub_${p.id}`, filtered, 10);
    } catch {}
    loadMindmapBg(p.id);
  };

  const loadMindmapBg = async (patientId: string) => {
    try {
      const mm = await api.getMindmap(patientId);
      setMindmap(mm);
      cacheSet(`mindmap_${patientId}`, mm, 60); // 1 hour cache
    } catch {}
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (!patient) return null;

  const docs   = patient.docs || [];
  const chunks = docs.reduce((s:number,d:any)=>s+d.chunks,0);
  const graphNodes = mindmap?.nodes || [];
  const graphEdges = mindmap?.relationships || [];
  const estNodes   = graphNodes.length > 1 ? graphNodes.length : chunks * 4;
  const estEdges   = graphEdges.length > 0 ? graphEdges.length : chunks * 3;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <div className="page-header">
          <div>
            <div className="text-[17px] font-bold text-white">
              {greeting}, {doctor?.name || "Doctor"}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              {patient.name}&apos;s memory hub · {docs.length} documents · {chunks} chunks indexed
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-bg-input border border-line-strong rounded-xl px-3 py-2">
              <IconSearch size={13} className="text-ink-muted flex-shrink-0"/>
              <input placeholder="Search conditions, medications..."
                value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&input.trim()) router.push("/patients/chat"); }}
                className="text-[12px] text-white bg-transparent border-none outline-none w-52"/>
            </div>
          </div>
        </div>

        <div className="page-content">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label:"Documents",     value:docs.length,  color:"#00d4a0", bg:"linear-gradient(135deg,#001f17,#003d2e)" },
              { label:"Chunks",        value:chunks,        color:"#8b7ff5", bg:"linear-gradient(135deg,#130f2e,#1a1650)" },
              { label:"Knowledge Nodes",value:estNodes,    color:"#f0a030", bg:"linear-gradient(135deg,#1e1200,#2a1d00)" },
              { label:"Active Alerts", value:snapshot?.alert_count||0, color:"#e05a3a", bg:"linear-gradient(135deg,#280e06,#350f05)" },
            ].map(s=>(
              <div key={s.label} className="rounded-2xl p-4 text-center border border-transparent flex flex-col items-center justify-center gap-1"
                style={{ background:s.bg }}>
                {loading && !snapshot ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/40 animate-spin-slow"/>
                ) : (
                  <div className="text-[28px] font-bold" style={{ color:s.color }}>{s.value}</div>
                )}
                <div className="text-[10px] text-ink-muted uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1.4fr_1fr] gap-4">
            {/* LEFT */}
            <div className="flex flex-col gap-4">
              {/* Knowledge graph */}
              <div className="card">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] text-ink-muted uppercase tracking-widest">Knowledge graph — Cognee Cloud</div>
                  <a href="https://platform.cognee.ai" target="_blank" rel="noreferrer"
                    className="text-[10px] text-teal hover:underline">View in Cognee ↗</a>
                </div>
                <div className="text-[11px] text-ink-soft mb-3">
                  {estNodes} entities · {estEdges} relationships mapped
                </div>
                {!mindmap ? (
                  docs.length > 0 ? (
                    <PlaceholderGraph patient={patient} docs={docs}/>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-[12px] text-ink-muted">
                      Upload documents to build knowledge graph
                    </div>
                  )
                ) : graphNodes.length <= 1 ? (
                  <PlaceholderGraph patient={patient} docs={docs}/>
                ) : (
                  <MiniGraph nodes={graphNodes} edges={graphEdges}/>
                )}
                <div className="flex gap-3 mt-3 flex-wrap">
                  {[["#00d4a0","Condition"],["#8b7ff5","Patient"],["#f0a030","Allergy"],["#4090e0","Lab Result"],["#e05a3a","Episode"]].map(([c,l])=>(
                    <div key={l} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c}}/>
                      <span className="text-[9px] text-ink-muted">{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ask box */}
              <div className="bg-bg-input border border-line-strong rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <input placeholder={`Ask anything about ${patient.name}...`}
                    value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&input.trim()&&router.push("/patients/chat")}
                    className="flex-1 text-[13px] text-white bg-transparent border-none outline-none"/>
                  <Link href="/patients/chat">
                    <button className="btn-primary px-3 py-2"><IconSend size={14}/></button>
                  </Link>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {["What should I know before today's visit?","Any medication conflicts?","Show recurring issues"].map(q=>(
                    <Link key={q} href="/patients/chat">
                      <button className="text-[11px] text-ink-soft bg-bg-card border border-line rounded-full px-3 py-1.5 cursor-pointer hover:border-teal/40 hover:text-teal transition-all">{q}</button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-4">
              {/* Memory snapshot */}
              <div className="card">
                <div className="text-[10px] text-ink-muted uppercase tracking-widest mb-4">Memory Snapshot</div>
                <div className="flex items-center gap-2 bg-teal-dark border border-teal/20 rounded-xl px-3 py-2.5 mb-4">
                  <span className="w-2 h-2 rounded-full bg-teal animate-pulse flex-shrink-0"/>
                  <IconNetwork size={12} className="text-teal flex-shrink-0"/>
                  <span className="text-[11px] font-semibold text-teal">Cognee Cloud memory active</span>
                </div>
                {[
                  { Icon:IconFileText, label:"Documents uploaded", value:docs.length,   color:"#e2eaf4" },
                  { Icon:IconDatabase, label:"Memory chunks",       value:chunks,         color:"#8b7ff5" },
                  { Icon:IconActivity, label:"Knowledge nodes",     value:estNodes,       color:"#f0a030" },
                  { Icon:IconZap,      label:"Relationships",        value:estEdges,       color:"#4090e0" },
                  { Icon:IconShield,   label:"Active alerts",        value:snapshot?.alert_count||0, color:snapshot?.alert_count>0?"#e05a3a":"#00d4a0" },
                ].map(({Icon,label,value,color})=>(
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon size={13} color={color} className="flex-shrink-0"/>
                      <span className="text-[12px] text-ink-muted">{label}</span>
                    </div>
                    <span className="text-[13px] font-semibold" style={{color}}>{value}</span>
                  </div>
                ))}
                <Link href="/patients/mindmap">
                  <button className="btn-secondary w-full mt-3 justify-center text-[11px]">
                    View full knowledge graph →
                  </button>
                </Link>
              </div>

              {/* Alerts */}
              {alerts.length > 0 ? (
                <div className="bg-rose-dark border border-rose/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <IconAlertTriangle size={14} className="text-rose flex-shrink-0"/>
                    <span className="text-[12px] font-semibold text-rose">Active risk alerts</span>
                  </div>
                  {alerts.map((a:any)=>{
                    const headline = alertHeadline(a.desc || a.description || "", a.title);
                    const summary  = alertSummary(a.desc || a.description || "");
                    const isCritical = a.type === "critical";
                    return (
                    <div key={a.id} className="px-3 py-2.5 rounded-lg mb-2 last:mb-0 border"
                      style={{ background:"#1a0805", borderColor: isCritical ? "#e05a3a30" : "#f0a03030" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                          style={{
                            color: isCritical ? "#e05a3a" : "#f0a030",
                            background: isCritical ? "#e05a3a18" : "#f0a03018",
                          }}>
                          {isCritical ? "Critical" : "Warning"}
                        </span>
                        <span className="text-[11px] font-semibold text-red-200 leading-snug">{headline}</span>
                      </div>
                      {summary && summary !== headline && (
                        <p className="text-[10px] text-red-300/75 leading-relaxed pl-0.5">{summary}</p>
                      )}
                    </div>
                  );})}
                  <Link href="/alerts">
                    <button className="btn-danger w-full mt-2 justify-center text-[11px]">View all alerts →</button>
                  </Link>
                </div>
              ) : (
                <div className="bg-teal-dark border border-teal/20 rounded-2xl p-4 text-center">
                  <IconShield size={20} className="text-teal mx-auto mb-2"/>
                  <div className="text-[12px] font-semibold text-teal">No active alerts</div>
                  <div className="text-[10px] text-ink-muted mt-1">Upload documents to scan for risks</div>
                </div>
              )}

              {/* Docs */}
              {docs.length > 0 && (
                <div className="card">
                  <div className="text-[10px] text-ink-muted uppercase tracking-widest mb-3">Uploaded documents</div>
                  {docs.map((d:any,i:number)=>(
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                      <IconFileText size={13} color="#00d4a0" className="flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-white truncate">{d.name}</div>
                        <div className="text-[9px] text-ink-muted">{d.chunks} chunks · {d.size}</div>
                      </div>
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

function PlaceholderGraph({ patient, docs }: { patient:any; docs:any[] }) {
  const W=500, H=200, cx=W/2, cy=H/2, r=75;
  const nodes = [
    {label:"Conditions", color:"#00d4a0", angle:-90},
    {label:"Medications",color:"#50d4a0", angle:-30},
    {label:"Allergies",  color:"#f0a030", angle: 30},
    {label:"Lab Results",color:"#4090e0", angle: 90},
    {label:"Vitals",     color:"#4090e0", angle:150},
    {label:"History",    color:"#8a9ab8", angle:210},
  ].slice(0, Math.min(6, docs.length*3));
  const initials = patient.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {nodes.map((n,i)=>{
        const rad=(n.angle*Math.PI)/180;
        const x=cx+r*Math.cos(rad), y=cy+r*Math.sin(rad);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={n.color} strokeWidth="0.8" strokeDasharray="4,3" opacity="0.3"/>
            <circle cx={x} cy={y} r="20" fill="#0b1020" stroke={n.color} strokeWidth="1" opacity="0.6"/>
            <text x={x} y={y+3} textAnchor="middle" fill={n.color} fontSize="6.5" fontFamily="Inter,system-ui" opacity="0.7">{n.label}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="32" fill="#16133a" stroke="#8b7ff5" strokeWidth="1.5"/>
      <text x={cx} y={cy-4} textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="Inter,system-ui">{initials}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill="#8b7ff5" fontSize="7" fontFamily="Inter,system-ui">Indexing...</text>
    </svg>
  );
}

function MiniGraph({ nodes, edges }: { nodes:any[]; edges:any[] }) {
  const W=500, H=200, cx=W/2, cy=H/2, r=80;
  const center  = nodes.find(n=>n.primary)||nodes[0];
  const others  = nodes.filter(n=>!n.primary).slice(0,8);
  const placed  = others.map((n,i)=>{
    const angle = (i/others.length)*2*Math.PI - Math.PI/2;
    return {...n, x:cx+r*Math.cos(angle), y:cy+r*Math.sin(angle)};
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {placed.map((n,i)=>(
        <line key={i} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={n.color} strokeWidth="0.8" strokeDasharray="4,3" opacity="0.4"/>
      ))}
      {placed.map((n,i)=>(
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="22" fill="#0b1020" stroke={n.color} strokeWidth="1.2"/>
          <text x={n.x} y={n.y-2} textAnchor="middle" fill="white" fontSize="7" fontFamily="Inter,system-ui">{n.label?.slice(0,12)}</text>
          {n.sub&&<text x={n.x} y={n.y+8} textAnchor="middle" fill={n.color} fontSize="6" fontFamily="Inter,system-ui">{n.sub?.slice(0,12)}</text>}
        </g>
      ))}
      {center&&(
        <g>
          <circle cx={cx} cy={cy} r="36" fill="#16133a" stroke="#8b7ff5" strokeWidth="2"/>
          <circle cx={cx} cy={cy} r="44" fill="none" stroke="#8b7ff5" strokeWidth="0.5" strokeDasharray="3,4" opacity="0.3"/>
          <text x={cx} y={cy-4} textAnchor="middle" fill="white" fontSize="9" fontWeight="600" fontFamily="Inter,system-ui">{center.label?.split(" ")[0]}</text>
          <text x={cx} y={cy+8} textAnchor="middle" fill="#8b7ff5" fontSize="7" fontFamily="Inter,system-ui">{center.label?.split(" ")[1]||""}</text>
        </g>
      )}
    </svg>
  );
}