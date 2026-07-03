"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconBrain, IconLayoutDash, IconUpload, IconClock,
  IconStethoscope, IconSparkles, IconShare2,
  IconBell, IconSettings, IconUsers, IconArrowRight,
} from "./Icons";

// Logout icon inline since IconLogOut might not exist
const IconLogOut = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const NAV = [
  { href:"/patients/list",     label:"Patients",    icon:"users"       },
  { href:"/patients",          label:"Memory Hub",  icon:"layout"      },
  { href:"/patients/upload",   label:"Upload Docs", icon:"upload"      },
  { href:"/patients/timeline", label:"Timeline",    icon:"clock"       },
  { href:"/patients/chat",     label:"AI Doctor",   icon:"stethoscope" },
  { href:"/patients/brief",    label:"Pre-Visit",   icon:"sparkles"    },
  { href:"/patients/mindmap",  label:"Mind Map",    icon:"share"       },
];

const BOTTOM = [
  { href:"/alerts",   label:"Alerts",   icon:"bell"     },
  { href:"/settings", label:"Settings", icon:"settings" },
];

function NavIcon({ icon, size = 14 }: { icon: string; size?: number }) {
  const p: Record<string,string> = {
    users:       "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    layout:      "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    upload:      "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
    clock:       "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
    stethoscope: "M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4",
    sparkles:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    share:       "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
    bell:        "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
    settings:    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={p[icon] || ""}/>
    </svg>
  );
}

export default function Sidebar() {
  const path   = usePathname();
  const router = useRouter();
  const [doctor,     setDoctor]     = useState<any>(null);
  const [patient,    setPatient]    = useState<any>(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    try {
      const d = localStorage.getItem("medimem_doctor");
      if (d) setDoctor(JSON.parse(d));
      const p = localStorage.getItem("medimem_active_patient");
      if (p) setPatient(JSON.parse(p));
    } catch {}
  }, [path]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res  = await fetch("http://localhost:8000/alerts/count");
        const data = await res.json();
        setAlertCount(data.unread || 0);
      } catch {}
    };
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, []);

  const logout = () => {
    localStorage.removeItem("medimem_doctor");
    localStorage.removeItem("medimem_active_patient");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/patients/list") return path === href;
    if (href === "/patients")      return path === "/patients";
    return path.startsWith(href);
  };

  return (
    <aside className="sb">
      {/* Logo */}
      <div className="sb-logo">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background:"linear-gradient(135deg,#00d4a0,#007a5e)" }}>
          <IconBrain size={16} className="text-white"/>
        </div>
        <div>
          <div className="text-[14px] font-bold text-white tracking-tight leading-none">MediMem</div>
          <div className="text-[9px] text-ink-muted mt-0.5">AI that remembers</div>
        </div>
      </div>

      {/* Active patient */}
      {patient ? (
        <div className="mx-3 my-2.5 bg-teal-dark border border-teal/20 rounded-xl px-3 py-2">
          <div className="text-[9px] text-ink-muted mb-1 uppercase tracking-widest">Active patient</div>
          <div className="text-[12px] font-semibold text-teal truncate">{patient.name}</div>
          <div className="text-[10px] text-ink-muted mt-0.5">{patient.age} yrs · {patient.gender}</div>
        </div>
      ) : (
        <div onClick={() => router.push("/patients/list")}
          className="mx-3 my-2.5 border border-dashed border-line rounded-xl px-3 py-2.5 cursor-pointer hover:border-teal/30 transition-all">
          <div className="text-[10px] text-ink-muted">No patient selected</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] text-teal">Select a patient</span>
            <IconArrowRight size={10} className="text-teal"/>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-1 overflow-y-auto">
        <div className="text-[9px] text-ink-muted uppercase tracking-widest px-4 mb-1 mt-1">Navigation</div>
        {NAV.map(({ href, icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={`sb-link ${active?"active":""}`}>
              <NavIcon icon={icon} size={14}/>
              <span>{label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal"/>}
            </Link>
          );
        })}

        <div className="text-[9px] text-ink-muted uppercase tracking-widest px-4 mb-1 mt-3">System</div>
        {BOTTOM.map(({ href, icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={`sb-link ${active?"active":""}`}>
              <NavIcon icon={icon} size={14}/>
              <span>{label}</span>
              {label==="Alerts" && alertCount>0 && (
                <span className="ml-auto text-[9px] font-bold bg-rose text-white px-1.5 py-0.5 rounded-full">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Doctor + Logout */}
      <div className="px-3 py-3 border-t border-line">
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-bg-hover transition-all">
          <div className="w-8 h-8 rounded-full bg-bg-card border border-teal/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-teal">
              {doctor?.initials || "DR"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-white truncate">
              {doctor?.name || "Doctor"}
            </div>
            <div className="text-[9px] text-ink-muted truncate">
              {doctor?.specialisation || ""}
            </div>
          </div>
          <button onClick={logout} title="Logout"
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-rose-dark hover:text-rose text-ink-muted transition-all flex-shrink-0">
            <IconLogOut size={13}/>
          </button>
        </div>
      </div>
    </aside>
  );
}