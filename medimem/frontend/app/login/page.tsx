"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconBrain, IconUser, IconStethoscope, IconArrowRight,
  IconShield, IconNetwork, IconLock, IconDatabase,
  IconActivity, IconZap, IconCheck,
} from "@/components/Icons";

const FEATURES = [
  { Icon:IconDatabase, color:"#00d4a0", bg:"#001f17", title:"Persistent Memory",  desc:"Cognee Cloud builds a knowledge graph for every patient." },
  { Icon:IconActivity, color:"#8b7ff5", bg:"#130f2e", title:"Graph Reasoning",    desc:"Multi-hop traversal answers complex questions across all documents." },
  { Icon:IconZap,      color:"#f0a030", bg:"#1e1200", title:"Pre-Visit Briefs",   desc:"AI-generated summaries before every consultation." },
  { Icon:IconShield,   color:"#4090e0", bg:"#041525", title:"Privacy First",      desc:"Enterprise-grade security with patient data protection." },
];

const HIGHLIGHTS = [
  "Every diagnosis remembered across sessions",
  "Drug conflicts flagged automatically",
  "Pre-visit briefs generated in under 5 seconds",
  "Patient memory deleted with one click",
];

export default function LoginPage() {
  const router = useRouter();
  const [name,    setName]    = useState("");
  const [role,    setRole]    = useState("Cardiologist");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  const go = () => {
    if (!name.trim()) { setErr("Please enter your name."); return; }
    setErr(""); setLoading(true);
    const initials = name.trim().split(" ").map((x:string)=>x[0]).join("").slice(0,2).toUpperCase();
    localStorage.setItem("medimem_doctor", JSON.stringify({ name:name.trim(), specialisation:role, initials }));
    setTimeout(()=>router.push("/patients/list"), 900);
  };

  return (
    <div style={{
      display:"flex", minHeight:"100vh",
      background:"#07090f",
      fontFamily:"Inter,system-ui,sans-serif",
    }}>

      {/* ── LEFT ──────────────────────────────── */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        padding:"28px 44px", position:"relative", overflowY:"auto",
        background:"linear-gradient(135deg,#07090f 0%,#06100a 60%,#09070f 100%)",
      }}>
        <div style={{ position:"absolute", top:-100, left:-100, width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,212,160,.07),transparent 65%)", pointerEvents:"none" }}/>

        {/* Logo + badge */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:"linear-gradient(135deg,#00d4a0,#007a5e)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <IconBrain size={19} className="text-white"/>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:"white", letterSpacing:"-.3px" }}>MediMem AI</div>
              <div style={{ fontSize:10, color:"#4a6080", marginTop:1 }}>Powered by Cognee Cloud</div>
            </div>
          </div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, border:"0.5px solid rgba(0,212,160,.3)", borderRadius:99, padding:"4px 12px" }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:"#00d4a0" }}/>
            <span style={{ fontSize:9, fontWeight:700, color:"#00d4a0", letterSpacing:".12em", textTransform:"uppercase" }}>Persistent AI Memory for Clinicians</span>
          </div>
        </div>

        {/* Quote */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:34, fontWeight:900, color:"white", lineHeight:1.1, letterSpacing:"-1.5px" }}>Great care begins</div>
          <div style={{ fontSize:34, fontWeight:900, color:"white", lineHeight:1.1, letterSpacing:"-1.5px" }}>where memory</div>
          <div style={{ fontSize:34, fontWeight:900, lineHeight:1.1, letterSpacing:"-1.5px", background:"linear-gradient(90deg,#00d4a0,#4090e0)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>never ends.</div>
        </div>

        {/* Subtext — no double dash */}
        <p style={{ fontSize:12, color:"#8a9ab8", lineHeight:1.6, maxWidth:420, marginBottom:18, borderLeft:"2px solid #00d4a030", paddingLeft:10 }}>
          MediMem gives doctors a permanent AI memory for every patient built on Cognee Cloud's knowledge graph. Every diagnosis, every drug, every visit recalled in seconds.
        </p>

        {/* Stats */}
        <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:"0.5px solid #1a2436", background:"#0b1020", marginBottom:16 }}>
          {[{v:"∞",l:"Memory"},{v:"<5s",l:"Brief"},{v:"0",l:"Forgotten"},{v:"100%",l:"Recall"}].map((s,i)=>(
            <div key={s.l} style={{ flex:1, padding:"9px 12px", borderRight:i<3?"0.5px solid #1a2436":"none" }}>
              <div style={{ fontSize:17, fontWeight:700, color:"#00d4a0" }}>{s.v}</div>
              <div style={{ fontSize:8, color:"#4a6080", marginTop:2, textTransform:"uppercase", letterSpacing:".05em" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:16 }}>
          {FEATURES.map(({ Icon, color, bg, title, desc }) => (
            <div key={title} style={{ background:bg, border:`0.5px solid ${color}25`, borderRadius:12, padding:"11px 12px", display:"flex", gap:9, alignItems:"flex-start" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:`${color}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon size={13} color={color}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color, marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:9, color:"#4a6080", lineHeight:1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Highlights as cards below features */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:14 }}>
          {HIGHLIGHTS.map((h,i) => (
            <div key={i} style={{ background:"#0b1020", border:"0.5px solid #1a2436", borderRadius:12, padding:"11px 13px", display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:"#001f17", border:"0.5px solid #00d4a040", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <IconCheck size={10} color="#00d4a0"/>
              </div>
              <span style={{ fontSize:10, color:"#8a9ab8", lineHeight:1.4 }}>{h}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:9, color:"#4a6080", marginTop:"auto" }}>
          <IconLock size={9}/>
          <span>Data encrypted · Never used for training · HIPAA-aware design</span>
        </div>
      </div>

      {/* ── RIGHT ─────────────────────────────── */}
      <div style={{
        width:400, flexShrink:0, display:"flex", flexDirection:"column",
        justifyContent:"center", padding:"28px 28px",
        background:"#08090f", borderLeft:"0.5px solid #1a2436", overflowY:"auto",
      }}>

        {/* Top branding — fills empty space */}
        <div style={{ textAlign:"center", marginBottom:12, padding:"20px 16px", background:"#0c1120", border:"0.5px solid #1a2436", borderRadius:16 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg,#00d4a0,#007a5e)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
            <IconBrain size={32} className="text-white"/>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:"white", letterSpacing:"-.4px", marginBottom:4 }}>MediMem AI</div>
          <div style={{ fontSize:11, color:"#4a6080", marginBottom:14 }}>The memory layer for doctors</div>
          <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
            {["remember()","recall()","forget()","improve()"].map((fn,i) => {
              const colors = ["#00d4a0","#8b7ff5","#f0a030","#4090e0"];
              const bgs    = ["#001f17","#130f2e","#1e1200","#041525"];
              return (
                <span key={fn} style={{ fontSize:9, fontWeight:600, color:colors[i], background:bgs[i], border:`0.5px solid ${colors[i]}30`, borderRadius:99, padding:"3px 9px", fontFamily:"monospace" }}>
                  {fn}
                </span>
              );
            })}
          </div>
        </div>

        {/* Login card */}
        <div style={{ background:"#0c1120", border:"0.5px solid #1a2436", borderRadius:20, padding:"24px 24px", boxShadow:"0 20px 60px rgba(0,0,0,.5)", marginBottom:12 }}>

          {/* Avatar */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", border:"1.5px solid #1a2436", background:"linear-gradient(135deg,#130f2e,#041525)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <IconStethoscope size={25} className="text-violet"/>
            </div>
          </div>

          <div style={{ fontSize:19, fontWeight:700, color:"white", textAlign:"center", marginBottom:4, letterSpacing:"-.4px" }}>Welcome back, Doctor</div>
          <div style={{ fontSize:11, color:"#4a6080", textAlign:"center", marginBottom:14 }}>Access your patient memory dashboard</div>

          {/* Cognee pill */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:"#001f17", border:"0.5px solid rgba(0,212,160,.25)", borderRadius:99, padding:"6px 14px", marginBottom:18 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#00d4a0" }}/>
            <IconNetwork size={11} className="text-teal"/>
            <span style={{ fontSize:11, fontWeight:600, color:"#00d4a0" }}>Cognee Cloud memory is active</span>
          </div>

          {/* Name */}
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:9, fontWeight:700, color:"#4a6080", textTransform:"uppercase", letterSpacing:".1em", display:"block", marginBottom:6 }}>Your name</label>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#06080f", border:"0.5px solid #1a2436", borderRadius:10, padding:"10px 13px" }}>
              <IconUser size={13} className="text-ink-muted"/>
              <input type="text" placeholder="e.g. Dr. Alex Morgan"
                value={name} onChange={e=>{setName(e.target.value);setErr("");}}
                onKeyDown={e=>e.key==="Enter"&&go()}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:12, color:"white", fontFamily:"inherit" }}/>
            </div>
          </div>

          {/* Specialisation */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:9, fontWeight:700, color:"#4a6080", textTransform:"uppercase", letterSpacing:".1em", display:"block", marginBottom:6 }}>Specialisation</label>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#06080f", border:"0.5px solid #1a2436", borderRadius:10, padding:"10px 13px" }}>
              <IconStethoscope size={13} className="text-ink-muted"/>
              <select value={role} onChange={e=>setRole(e.target.value)}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:12, color:"white", fontFamily:"inherit", cursor:"pointer" }}>
                {["Cardiologist","General Physician","Neurologist","Endocrinologist","Pulmonologist","Oncologist"].map(r=>(
                  <option key={r} style={{ background:"#0c1120" }}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {err && (
            <div style={{ fontSize:11, color:"#e05a3a", background:"#280e06", border:"0.5px solid rgba(224,90,58,.3)", borderRadius:8, padding:"8px 12px", marginBottom:12 }}>{err}</div>
          )}

          {/* Sign in */}
          <button onClick={go} disabled={loading} style={{ width:"100%", padding:"13px", borderRadius:10, fontSize:13, fontWeight:700, color:"#06080f", background:loading?"#003d2e":"linear-gradient(90deg,#00d4a0,#0090e0)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading
              ? <><span style={{ width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.2)",borderTopColor:"white",animation:"spin 1s linear infinite" }}/>Connecting...</>
              : <>Sign in <IconArrowRight size={14}/></>
            }
          </button>
        </div>



        {/* Privacy */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontSize:10, color:"#2a3a54" }}>
          <IconShield size={10}/>
          <span>No patient data leaves your Cognee Cloud workspace</span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to{transform:rotate(360deg);} }
        * { box-sizing:border-box; }
        select option { background:#0c1120; }
      `}</style>
    </div>
  );
}