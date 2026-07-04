"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  IconSearch, IconPlus, IconUser, IconX, IconTrash,
  IconStethoscope, IconActivity, IconDatabase, IconArrowRight,
  IconAlertTriangle,
} from "@/components/Icons";
import { api } from "@/lib/api";

export default function PatientListPage() {
  const router = useRouter();
  const [patients,  setPatients]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [modal,     setModal]     = useState(false);
  const [creating,  setCreating]  = useState(false);
  const [deleting,  setDeleting]  = useState<string|null>(null);
  const [confirmDel,setConfirmDel]= useState<any>(null);
  const [newName,   setNewName]   = useState("");
  const [newAge,    setNewAge]    = useState("");
  const [newGender, setNewGender] = useState("Male");
  const [newBlood,  setNewBlood]  = useState("B+");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.listPatients();
      setPatients(data.patients || []);
    } catch {
      setError("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = (p: any) => {
    localStorage.setItem("medimem_active_patient", JSON.stringify(p));
    router.push("/patients");
  };

  const createPatient = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const data = await api.createPatient({
        name: newName.trim(), age: parseInt(newAge)||30,
        gender: newGender, blood: newBlood,
      });
      setPatients(p => [...p, data.patient]);
      setModal(false);
      setNewName(""); setNewAge("");
    } catch (e: any) { alert(e.message); }
    finally { setCreating(false); }
  };

  const deletePatient = async (p: any) => {
    setConfirmDel(null);
    setDeleting(p.id);
    try {
      await api.deletePatient(p.id);
      setPatients(prev => prev.filter(x => x.id !== p.id));
      // Clear active patient if it was this one
      try {
        const active = JSON.parse(localStorage.getItem("medimem_active_patient") || "{}");
        if (active.id === p.id) localStorage.removeItem("medimem_active_patient");
      } catch {}
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.conditions?.some((c: string) => c.toLowerCase().includes(search.toLowerCase()))
  );

  const STATS = [
    { v: patients.length,                                              l: "Total patients",  c: "#00d4a0", g: "linear-gradient(135deg,#001f17,#003d2e)" },
    { v: patients.reduce((s:number,p:any)=>s+(p.docs?.length||0),0), l: "Docs ingested",   c: "#8b7ff5", g: "linear-gradient(135deg,#130f2e,#1a1650)" },
    { v: patients.filter((p:any)=>p.alerts>0).length,                 l: "Active alerts",   c: "#e05a3a", g: "linear-gradient(135deg,#280e06,#350f05)" },
    { v: patients.filter((p:any)=>(p.docs?.length||0)>0).length,      l: "With memory",     c: "#4090e0", g: "linear-gradient(135deg,#041525,#071e38)" },
  ];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <div className="page-header">
          <div>
            <h1 className="text-[17px] font-bold text-white">Patients</h1>
            <p className="text-[11px] text-ink-muted mt-0.5">
              {patients.length} patients · Click to open Memory Hub
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-bg-input border border-line-strong rounded-xl px-3 py-2">
              <IconSearch size={13} className="text-ink-muted flex-shrink-0" />
              <input placeholder="Search patients..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-[12px] text-white w-44" />
            </div>
            <button onClick={() => setModal(true)} className="btn-primary">
              <IconPlus size={13} /> New patient
            </button>
          </div>
        </div>

        <div className="page-content">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {STATS.map(s => (
              <div key={s.l} className="rounded-2xl p-4 text-center border animate-fade-up"
                style={{ background: s.g, borderColor: `${s.c}35` }}>
                <div className="text-[26px] font-bold" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[10px] text-ink-muted uppercase tracking-widest mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-rose-dark border border-rose/30 rounded-xl px-4 py-3 text-[12px] text-rose mb-4">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-teal/20 border-t-teal animate-spin-slow" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 bg-bg-card border border-line rounded-2xl flex items-center justify-center mx-auto mb-3">
                <IconUser size={22} className="text-ink-muted" />
              </div>
              <div className="text-[14px] font-semibold text-white mb-1">
                {patients.length === 0 ? "No patients yet" : "No results"}
              </div>
              <div className="text-[12px] text-ink-muted">
                {patients.length === 0 ? "Click 'New patient' to get started" : `No results for "${search}"`}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(p => (
                <div key={p.id}
                  className="card cursor-pointer hover:border-teal/40 transition-all duration-200 group relative"
                  style={{ borderLeft: `3px solid ${p.alerts>0?"#e05a3a":"#00d4a0"}`, borderRadius:"0 16px 16px 0" }}
                  onClick={() => selectPatient(p)}>

                  {/* Delete button */}
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDel(p); }}
                    disabled={deleting === p.id}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-dark hover:text-rose text-ink-muted"
                    title="Delete patient and Cognee memory">
                    {deleting===p.id
                      ? <div className="w-4 h-4 rounded-full border-2 border-rose/20 border-t-rose animate-spin-slow" />
                      : <IconTrash size={13} />
                    }
                  </button>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                      style={{ background:"#00d4a020", color:"#00d4a0", border:"1.5px solid #00d4a040" }}>
                      {p.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-semibold text-white group-hover:text-teal transition-colors truncate">
                          {p.name}
                        </div>
                        {p.alerts > 0 && (
                          <span className="flex-shrink-0 text-[9px] font-bold bg-rose-dark text-rose border border-rose/40 px-1.5 py-0.5 rounded-full">
                            {p.alerts}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-muted mt-0.5">
                        {p.age} yrs · {p.gender} · {p.blood || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {p.conditions?.length > 0
                      ? p.conditions.map((c:string) => (
                          <span key={c} className="text-[10px] bg-bg-input text-ink-soft px-2.5 py-0.5 rounded-full border border-line-strong">{c}</span>
                        ))
                      : <span className="text-[10px] text-ink-muted italic">No conditions recorded</span>
                    }
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mb-3 text-[10px] text-ink-muted">
                    <span className="flex items-center gap-1"><IconDatabase size={11} /> {p.docs?.length||0} docs</span>
                    <span className="flex items-center gap-1"><IconActivity size={11} /> {p.meds?.length||0} meds</span>
                  </div>

                  {/* Cognee memory status */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-ink-muted uppercase tracking-wider">
                        Cognee Memory
                      </span>
                      <span className="text-[11px] font-semibold text-teal">
                        {(p.docs?.length || 0)} Document Indexed ✓
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-line">
                    <button onClick={e=>{e.stopPropagation();selectPatient(p);}}
                      className="btn-primary py-1.5 text-[11px] flex-1 justify-center">
                      <IconDatabase size={12} /> Memory Hub
                    </button>
                    <button onClick={e=>{e.stopPropagation();selectPatient(p);router.push("/patients/chat");}}
                      className="btn-secondary py-1.5 text-[11px] flex-1 justify-center">
                      <IconStethoscope size={12} /> AI Doctor
                    </button>
                    <button onClick={e=>{e.stopPropagation();selectPatient(p);router.push("/patients/brief");}}
                      className="btn-secondary py-1.5 text-[11px] px-3">
                      <IconArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Patient Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background:"rgba(0,0,0,.75)", backdropFilter:"blur(4px)" }}
          onClick={() => setModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6 border border-line-strong animate-scale-in"
            style={{ background:"#0c1018" }} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[15px] font-semibold text-white">Add new patient</div>
                <div className="text-[11px] text-ink-muted mt-0.5">Cognee dataset created on first PDF upload</div>
              </div>
              <button onClick={()=>setModal(false)} className="btn-ghost p-1.5 rounded-lg"><IconX size={16} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block mb-1.5">Full name</label>
                <div className="flex items-center gap-2.5 bg-bg-input border border-line-strong rounded-xl px-3 py-2.5 focus-within:border-teal/50 transition-all">
                  <IconUser size={14} className="text-ink-muted flex-shrink-0" />
                  <input value={newName} onChange={e=>setNewName(e.target.value)}
                    placeholder="e.g. Rahul Sharma" className="flex-1 text-[13px] text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block mb-1.5">Age</label>
                  <input value={newAge} onChange={e=>setNewAge(e.target.value)} placeholder="45" type="number"
                    className="w-full bg-bg-input border border-line-strong rounded-xl px-3 py-2.5 text-[13px] text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block mb-1.5">Gender</label>
                  <select value={newGender} onChange={e=>setNewGender(e.target.value)}
                    className="w-full bg-bg-input border border-line-strong rounded-xl px-3 py-2.5 text-[13px] text-white cursor-pointer">
                    {["Male","Female","Other"].map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block mb-1.5">Blood group</label>
                <select value={newBlood} onChange={e=>setNewBlood(e.target.value)}
                  className="w-full bg-bg-input border border-line-strong rounded-xl px-3 py-2.5 text-[13px] text-white cursor-pointer">
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b=><option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={()=>setModal(false)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
                <button onClick={createPatient} disabled={creating}
                  className="btn-primary flex-1 justify-center py-2.5">
                  {creating?"Creating...":"Create patient"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background:"rgba(0,0,0,.8)", backdropFilter:"blur(4px)" }}
          onClick={()=>setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6 border border-rose/30 animate-scale-in"
            style={{ background:"#0c1018" }} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-dark border border-rose/30 flex items-center justify-center flex-shrink-0">
                <IconAlertTriangle size={18} className="text-rose" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-white">Delete patient?</div>
                <div className="text-[11px] text-ink-muted mt-0.5">{confirmDel.name}</div>
              </div>
            </div>
            <p className="text-[12px] text-ink-muted leading-relaxed mb-5">
              This will permanently delete <strong className="text-white">{confirmDel.name}</strong> and
              all their Cognee Cloud memory — knowledge graph, documents, chat history.
              <strong className="text-rose"> This cannot be undone.</strong>
            </p>
            <div className="flex gap-2">
              <button onClick={()=>setConfirmDel(null)} className="btn-secondary flex-1 justify-center py-2.5">
                Cancel
              </button>
              <button onClick={()=>deletePatient(confirmDel)}
                className="btn-danger flex-1 justify-center py-2.5">
                <IconTrash size={13} /> Delete + forget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
