"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";
import { cacheGet, cacheSet } from "@/lib/cache";

export default function MindmapPage() {
  const router  = useRouter();
  const svgRef  = useRef<SVGSVGElement>(null);
  const [patient, setPatient] = useState<any>(null);
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cached,  setCached]  = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medimem_active_patient");
      if (!saved) { router.push("/patients/list"); return; }
      const p = JSON.parse(saved);
      setPatient(p);

      // Load from cache first — instant
      const hit = cacheGet<any>(`mindmap_${p.id}`);
      if (hit) {
        setData(hit);
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
      const mm = await api.getMindmap(id);
      setData(mm);
      cacheSet(`mindmap_${id}`, mm, 60); // 1 hour
    } catch {}
    setLoading(false);
  };

  const refreshBg = async (id: string) => {
    try {
      const mm = await api.getMindmap(id);
      if (mm?.nodes?.length > 1) {
        setData(mm);
        cacheSet(`mindmap_${id}`, mm, 60);
        setCached(false);
      }
    } catch {}
  };

  if (!patient) return null;

  const nodes = data?.nodes || [];
  const edges = data?.relationships || [];
  const center = nodes.find((n:any)=>n.primary) || nodes[0];
  const others = nodes.filter((n:any)=>!n.primary);

  // Layout
  const W=800, H=500, cx=W/2, cy=H/2;
  const r = Math.min(W,H) * 0.34;
  const placed = others.map((n:any, i:number) => {
    const angle = (i/others.length)*2*Math.PI - Math.PI/2;
    return {...n, x:cx+r*Math.cos(angle), y:cy+r*Math.sin(angle)};
  });

  return (
    <div className="app-shell">
      <Sidebar/>
      <main className="main-area">
        <div className="page-header">
          <div>
            <div className="text-[17px] font-bold text-white">Cognee Knowledge Graph</div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              {patient.name} · {nodes.length} entities · {edges.length} relationships
              {cached && <span className="ml-2 text-teal">(cached)</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <a href="https://platform.cognee.ai" target="_blank" rel="noreferrer"
              className="btn-secondary text-[11px] no-underline">
              View in Cognee Cloud ↗
            </a>
            <button onClick={()=>load(patient.id)} disabled={loading}
              className="btn-secondary text-[11px]">
              {loading?"Loading...":"Refresh"}
            </button>
          </div>
        </div>

        <div className="page-content">
          {loading && !data && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-teal/20 border-t-teal animate-spin-slow"/>
              <div className="text-[12px] text-ink-muted">Building knowledge graph from Cognee Cloud...</div>
            </div>
          )}

          {data && (
            <>
              <div className="card mb-4" style={{padding:0, overflow:"hidden"}}>
                <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
                  style={{background:"#06080f", display:"block"}}>
                  <defs>
                    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#00d4a0" stopOpacity="0.05"/>
                      <stop offset="100%" stopColor="#00d4a0" stopOpacity="0"/>
                    </radialGradient>
                  </defs>
                  <ellipse cx={cx} cy={cy} rx={r*1.2} ry={r*1.1} fill="url(#bg)"/>

                  {/* Edges */}
                  {placed.map((n:any,i:number)=>(
                    <line key={i} x1={cx} y1={cy} x2={n.x} y2={n.y}
                      stroke={n.color} strokeWidth="1" strokeDasharray="5,4" opacity="0.4"/>
                  ))}

                  {/* Satellite nodes */}
                  {placed.map((n:any,i:number)=>(
                    <g key={i}>
                      <circle cx={n.x} cy={n.y} r="36" fill="#0b1020"
                        stroke={n.color} strokeWidth="1.5"/>
                      {/* Label */}
                      <text x={n.x} y={n.y-5} textAnchor="middle" fill="white"
                        fontSize="8.5" fontWeight="600" fontFamily="Inter,system-ui">
                        {n.label?.replace(/_/g," ").slice(0,14)}
                      </text>
                      {/* Type badge — only once */}
                      <text x={n.x} y={n.y+9} textAnchor="middle" fill={n.color}
                        fontSize="7" fontFamily="Inter,system-ui" opacity="0.85">
                        {n.type}
                      </text>
                    </g>
                  ))}

                  {/* Center node */}
                  {center && (
                    <g>
                      <circle cx={cx} cy={cy} r="56" fill="#16133a"
                        stroke="#8b7ff5" strokeWidth="2.5"/>
                      <circle cx={cx} cy={cy} r="68" fill="none"
                        stroke="#8b7ff5" strokeWidth="0.5" strokeDasharray="4,5" opacity="0.3"/>
                      <text x={cx} y={cy-8} textAnchor="middle" fill="white"
                        fontSize="13" fontWeight="700" fontFamily="Inter,system-ui">
                        {center.label?.replace(/_/g," ").split(" ")[0]}
                      </text>
                      <text x={cx} y={cy+8} textAnchor="middle" fill="white"
                        fontSize="11" fontFamily="Inter,system-ui">
                        {center.label?.replace(/_/g," ").split(" ")[1]||""}
                      </text>
                      <text x={cx} y={cy+24} textAnchor="middle" fill="#8b7ff5"
                        fontSize="8" fontFamily="Inter,system-ui">
                        {center.sub}
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex gap-3 flex-wrap">
                {[["#00d4a0","Condition"],["#8b7ff5","Patient"],["#f0a030","Allergy"],
                  ["#4090e0","Lab Result"],["#50d4a0","Medication"],["#e05a3a","Episode"],["#8a9ab8","Entity"]].map(([c,l])=>(
                  <div key={l} className="flex items-center gap-1.5 bg-bg-card border border-line rounded-lg px-2.5 py-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c}}/>
                    <span className="text-[10px] text-ink-muted">{l}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}