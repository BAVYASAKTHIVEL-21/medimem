"use client";
import { useEffect, useState } from "react";
import { IconNetwork } from "./Icons";

// ── Ring chart ────────────────────────────────────────────
export function RingChart({ pct, color, size = 72, label, sublabel }:
  { pct: number; color: string; size?: number; label?: string; sublabel?: string }) {
  const [drawn, setDrawn] = useState(0);
  const r    = size / 2 - 7;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    const t = setTimeout(() => setDrawn(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="text-center">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a2436" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(drawn/100)*circ} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dasharray .9s cubic-bezier(.4,0,.2,1)" }} />
        <text x={size/2} y={size/2 + (sublabel ? 2 : 5)} textAnchor="middle"
          fill="white" fontSize={size > 64 ? 14 : 11} fontWeight="700">{pct}%</text>
        {sublabel && <text x={size/2} y={size/2+14} textAnchor="middle" fill={color} fontSize={8}>{sublabel}</text>}
      </svg>
      {label && <div className="text-[9px] text-ink-muted mt-1 uppercase tracking-widest">{label}</div>}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────
export function ProgressBar({ pct, color = "#00d4a0" }: { pct: number; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="mem-track">
      <div className="mem-fill" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────
export function StatCard({ value, label, color, gradient, icon: Icon, border }:
  { value: string|number; label: string; color: string; gradient?: string; icon?: React.ComponentType<any>; border?: string }) {
  return (
    <div className="stat-card animate-fade-up"
      style={{ background: gradient, borderColor: border || `${color}35` }}>
      {Icon && <Icon size={16} color={color} className="mb-1 opacity-70" />}
      <div className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</div>
      <div className="text-[10px] text-ink-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ── Cognee status pill ────────────────────────────────────
export function CogneePill({ label = "Cognee Cloud connected" }: { label?: string }) {
  return (
    <div className="cpill">
      <span className="w-2 h-2 rounded-full bg-teal animate-glow flex-shrink-0" />
      <IconNetwork size={12} className="text-teal" />
      {label}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────
export function SLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] text-ink-muted uppercase tracking-widest mb-2">{children}</div>;
}

// ── Knowledge graph SVG ───────────────────────────────────
const GN = [
  { cx:185, cy:148, r:42, fill:"#16133a", stroke:"#8b7ff5", label:"John",      sub:"Mathew · 54", primary:true },
  { cx:75,  cy:65,  r:30, fill:"#001f17", stroke:"#00d4a0", label:"Diabetes",  sub:"Type 2"                    },
  { cx:298, cy:65,  r:30, fill:"#130f2e", stroke:"#8b7ff5", label:"Hyper-",    sub:"tension"                   },
  { cx:42,  cy:155, r:24, fill:"#1e1200", stroke:"#f0a030", label:"Allergy",   sub:"Penicillin"                },
  { cx:330, cy:155, r:24, fill:"#041525", stroke:"#4090e0", label:"BP Log",    sub:"12 recs"                   },
  { cx:88,  cy:240, r:23, fill:"#280e06", stroke:"#e05a3a", label:"Chest",     sub:"Pain"                      },
  { cx:284, cy:240, r:23, fill:"#001f17", stroke:"#50d4a0", label:"Metformin", sub:"500mg"                     },
];
const GL:[number,number,number,number,string][] = [
  [185,148,75, 65, "#00d4a0"],
  [185,148,298,65, "#8b7ff5"],
  [185,148,42, 155,"#f0a030"],
  [185,148,330,155,"#4090e0"],
  [185,148,88, 240,"#e05a3a"],
  [185,148,284,240,"#50d4a0"],
];
const LEGEND = [
  ["Condition","#00d4a0","#001f17"],
  ["Event",    "#8b7ff5","#130f2e"],
  ["Alert",    "#f0a030","#1e1200"],
  ["Vital",    "#4090e0","#041525"],
  ["Episode",  "#e05a3a","#280e06"],
  ["Drug",     "#50d4a0","#001f17"],
];

export function KnowledgeGraph({ h = 272 }: { h?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 300); return () => clearTimeout(t); }, []);
  return (
    <div>
      <svg width="100%" height={h} viewBox="0 0 375 275" style={{ opacity: visible ? 1 : 0, transition: "opacity .5s" }}>
        {GL.map(([x1,y1,x2,y2,c],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={c} strokeWidth="1.2" strokeDasharray="5,3" opacity="0.65"
            style={{ animation: `fade-in .4s ${i*0.08}s ease both` }} />
        ))}
        {GN.map((n,i) => (
          <g key={i} style={{ animation: `scale-in .4s ${i*0.06}s ease both` }}>
            {n.primary && (
              <circle cx={n.cx} cy={n.cy} r={n.r+10}
                fill="none" stroke={n.stroke} strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3"
                style={{ animation: "glow-pulse 2.5s ease-in-out infinite" }} />
            )}
            <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.fill} stroke={n.stroke} strokeWidth={n.primary?2.5:1.8} />
            <text x={n.cx} y={n.cy-(n.sub?5:2)} textAnchor="middle"
              fill="white" fontSize={n.primary?12:10} fontWeight="600">{n.label}</text>
            {n.sub && <text x={n.cx} y={n.cy+9} textAnchor="middle" fill={n.stroke} fontSize={8}>{n.sub}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────
type BV = "teal"|"violet"|"amber"|"rose"|"sky";
export function Badge({ label, variant="teal" }: { label:string; variant?:BV }) {
  return <span className={`badge badge-${variant}`}>{label}</span>;
}

// ── Toggle switch ─────────────────────────────────────────
export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="toggle"
      style={{ background: on ? "#00d4a0" : "#1a2436" }}
    >
      <span className="toggle-thumb" style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
    </button>
  );
}

// ── Aliases for backward compat ───────────────────────────
export const SectionLabel = SLabel;
export function GraphLegend() {
  const items = [
    ["Condition","#00d4a0","#001f17"],
    ["Event",    "#8b7ff5","#130f2e"],
    ["Alert",    "#f0a030","#1e1200"],
    ["Vital",    "#4090e0","#041525"],
    ["Episode",  "#e05a3a","#280e06"],
    ["Drug",     "#50d4a0","#001f17"],
  ];
  return (
    <div className="flex gap-2 flex-wrap mt-1">
      {items.map(([l,c,bg]) => (
        <span key={l} className="text-[9px] font-medium px-2 py-0.5 rounded-full border"
          style={{ color:c, background:bg, borderColor:`${c}40` }}>{l}</span>
      ))}
    </div>
  );
}
export function QuickChip({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="bg-bg-input border border-line-strong text-ink-soft text-[11px]
                 px-3 py-1.5 rounded-full cursor-pointer hover:border-teal/40
                 hover:text-teal transition-all duration-150">
      {label}
    </button>
  );
}
