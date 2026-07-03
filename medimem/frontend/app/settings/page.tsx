"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  IconKey, IconShield, IconCheck, IconNetwork,
  IconActivity, IconTrash, IconEye, IconUser,
  IconRefresh, IconZap, IconBell,
} from "@/components/Icons";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [status,   setStatus]   = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [savingN,  setSavingN]  = useState(false);
  const [savedN,   setSavedN]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [testOk,   setTestOk]   = useState<boolean|null>(null);
  const [showCogneeKey, setShowCogneeKey] = useState(false);
  const [showLlmKey,    setShowLlmKey]    = useState(false);

  // Cognee fields
  const [cogneeKey, setCogneeKey] = useState("");
  const [cogneeUrl, setCogneeUrl] = useState("");

  // LLM fields — simple 3 inputs
  const [provider, setProvider] = useState("groq");
  const [model,    setModel]    = useState("");
  const [llmKey,   setLlmKey]   = useState("");
  const [baseUrl,  setBaseUrl]  = useState("");

  // Notification prefs
  const [prefs, setPrefs] = useState({
    drug_alerts: true,
    bp_alerts:   true,
    lab_alerts:  true,
    followup:    true,
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statusData, notifData] = await Promise.all([
        api.getStatus(),
        api.getNotifications().catch(() => ({})),
      ]);
      setStatus(statusData);
      if (statusData.cognee_cloud?.url) setCogneeUrl(statusData.cognee_cloud.url);
      if (statusData.llm?.provider)     setProvider(statusData.llm.provider);
      if (statusData.llm?.model)        setModel(statusData.llm.model);
      setPrefs({
        drug_alerts: notifData.drug_alerts ?? true,
        bp_alerts:   notifData.bp_alerts   ?? true,
        lab_alerts:  notifData.lab_alerts  ?? true,
        followup:    notifData.followup    ?? true,
      });
    } catch {}
    setLoading(false);
  };

  const saveKeys = async () => {
    setSaving(true); setTestOk(null);
    try {
      const result = await api.saveKeys({
        cognee_api_key:  cogneeKey || undefined,
        cognee_base_url: cogneeUrl || undefined,
        llm_api_key:     llmKey    || undefined,
        llm_provider:    provider,
        llm_model:       model,
        ...(baseUrl ? { llm_base_url: baseUrl } : {}),
      });
      setSaved(true);
      setTestOk(result.cognee_connected);
      await loadAll();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const saveNotifications = async () => {
    setSavingN(true);
    try {
      await api.saveNotifications(prefs);
      setSavedN(true);
      setTimeout(() => setSavedN(false), 3000);
    } catch (e: any) { alert(e.message); }
    finally { setSavingN(false); }
  };

  const testConnection = async () => {
    setTesting(true); setTestOk(null);
    try {
      const data = await api.getStatus();
      setTestOk(data.cognee_cloud?.connected || false);
    } catch { setTestOk(false); }
    finally { setTesting(false); }
  };

  if (loading) return (
    <div className="app-shell"><Sidebar/>
      <main className="main-area flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal/20 border-t-teal animate-spin-slow"/>
      </main>
    </div>
  );

  const cogneeOk = status?.cognee_cloud?.connected;
  const llmOk    = status?.llm?.configured;

  return (
    <div className="app-shell">
      <Sidebar/>
      <main className="main-area">
        <div className="page-header">
          <div>
            <div className="text-[17px] font-bold text-white">Settings</div>
            <div className="text-[11px] text-ink-muted mt-0.5">Configure your Cognee Cloud and AI model</div>
          </div>
          <button onClick={saveKeys} disabled={saving} className="btn-primary">
            {saved ? <><IconCheck size={13}/> Saved!</> : saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        <div className="page-content">
          <div className="max-w-2xl flex flex-col gap-4">

            {/* ── Status bar ───────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3.5 border flex items-center gap-3"
                style={{ background:cogneeOk?"#001f17":"#1a0805", borderColor:cogneeOk?"#00d4a030":"#e05a3a30" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background:cogneeOk?"#00d4a020":"#e05a3a20" }}>
                  <IconNetwork size={15} color={cogneeOk?"#00d4a0":"#e05a3a"}/>
                </div>
                <div>
                  <div className="text-[11px] font-semibold" style={{ color:cogneeOk?"#00d4a0":"#e05a3a" }}>
                    Cognee Cloud — {cogneeOk?"Connected":"Not connected"}
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5">
                    {cogneeOk?"Knowledge graph active":"Enter API key below"}
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-3.5 border flex items-center gap-3"
                style={{ background:llmOk?"#130f2e":"#1a0805", borderColor:llmOk?"#8b7ff530":"#e05a3a30" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background:llmOk?"#8b7ff520":"#e05a3a20" }}>
                  <IconActivity size={15} color={llmOk?"#8b7ff5":"#e05a3a"}/>
                </div>
                <div>
                  <div className="text-[11px] font-semibold" style={{ color:llmOk?"#8b7ff5":"#e05a3a" }}>
                    {status?.llm?.provider
                      ? status.llm.provider.charAt(0).toUpperCase()+status.llm.provider.slice(1)
                      : "LLM"} — {llmOk?"Configured":"Not configured"}
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5">
                    {status?.llm?.model || "No model selected"}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Cognee Cloud ─────────────────── */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-line">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:"#00d4a018", border:"0.5px solid #00d4a030" }}>
                  <IconNetwork size={16} color="#00d4a0"/>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-white">Cognee Cloud</div>
                  <div className="text-[10px] text-ink-muted">Memory and knowledge graph provider</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={testConnection} disabled={testing}
                    className="btn-secondary text-[11px] flex items-center gap-1.5">
                    <IconRefresh size={12} className={testing?"animate-spin-slow":""}/>
                    {testing?"Testing...":testOk===true?"✓ Connected!":testOk===false?"✗ Failed":"Test"}
                  </button>
                  <a href="https://platform.cognee.ai/sessions" target="_blank" rel="noreferrer"
                    className="btn-secondary text-[11px] no-underline">Sessions ↗</a>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Cognee API Key */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Cognee API Key</label>
                    <a href="https://platform.cognee.ai/apiKeys" target="_blank" rel="noreferrer"
                      className="text-[10px] text-teal hover:underline">Get from platform.cognee.ai ↗</a>
                  </div>
                  <div className="flex items-center gap-2 bg-bg-input border border-line-strong rounded-xl px-4 py-3 focus-within:border-teal/50 transition-all">
                    <IconKey size={14} className="text-ink-muted flex-shrink-0"/>
                    <input type={showCogneeKey?"text":"password"} value={cogneeKey}
                      onChange={e=>setCogneeKey(e.target.value)}
                      placeholder={status?.cognee_cloud?.has_key?"••••••••••••••• (saved)":"ck_your_key_here"}
                      className="flex-1 text-[13px] text-white font-mono"/>
                    <button onClick={()=>setShowCogneeKey(s=>!s)}
                      className="text-ink-muted hover:text-white transition-all">
                      <IconEye size={14}/>
                    </button>
                  </div>
                </div>

                {/* Cognee Base URL */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Cognee Base URL</label>
                    <span className="text-[10px] text-ink-muted">Copy from browser when logged into Cognee Cloud</span>
                  </div>
                  <div className="flex items-center gap-2 bg-bg-input border border-line-strong rounded-xl px-4 py-3 focus-within:border-teal/50 transition-all">
                    <IconNetwork size={14} className="text-ink-muted flex-shrink-0"/>
                    <input type="text" value={cogneeUrl}
                      onChange={e=>setCogneeUrl(e.target.value)}
                      placeholder="https://tenant-xxx.aws.cognee.ai"
                      className="flex-1 text-[13px] text-white font-mono"/>
                  </div>
                </div>
              </div>
            </div>

            {/* ── AI Model ─────────────────────── */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-line">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:"#8b7ff518", border:"0.5px solid #8b7ff530" }}>
                  <IconZap size={16} color="#8b7ff5"/>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-white">AI Model</div>
                  <div className="text-[10px] text-ink-muted">Generates answers from Cognee recalled memory</div>
                </div>
                {llmOk && (
                  <span className="text-[10px] font-semibold text-violet bg-violet-dark border border-violet/25 px-2.5 py-1 rounded-full">
                    {status.llm.provider} · {status.llm.model}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {/* Provider */}
                <div>
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block mb-1.5">
                    LLM Provider
                  </label>
                  <div className="flex items-center gap-2 bg-bg-input border border-line-strong rounded-xl px-4 py-3 focus-within:border-teal/50 transition-all">
                    <IconActivity size={14} className="text-ink-muted flex-shrink-0"/>
                    <input type="text" value={provider}
                      onChange={e=>setProvider(e.target.value.toLowerCase().trim())}
                      placeholder="groq, openai, anthropic, mistral, together, custom"
                      className="flex-1 text-[13px] text-white"/>
                  </div>
                  <div className="text-[10px] text-ink-muted mt-1.5">
                    Supported: <span className="text-teal font-mono">groq</span> · <span className="text-teal font-mono">openai</span> · <span className="text-teal font-mono">anthropic</span> · <span className="text-teal font-mono">mistral</span> · <span className="text-teal font-mono">together</span> · <span className="text-teal font-mono">custom</span>
                  </div>
                </div>

                {/* Model */}
                <div>
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block mb-1.5">
                    Model name
                  </label>
                  <div className="flex items-center gap-2 bg-bg-input border border-line-strong rounded-xl px-4 py-3 focus-within:border-teal/50 transition-all">
                    <IconZap size={14} className="text-ink-muted flex-shrink-0"/>
                    <input type="text" value={model}
                      onChange={e=>setModel(e.target.value.trim())}
                      placeholder="e.g. llama-3.1-8b-instant, gpt-4o-mini, claude-haiku-4-5"
                      className="flex-1 text-[13px] text-white font-mono"/>
                  </div>
                  <div className="text-[10px] text-ink-muted mt-1.5">
                    Enter any model name supported by your provider
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">API Key</label>
                    <span className="text-[10px] text-ink-muted">From your LLM provider dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 bg-bg-input border border-line-strong rounded-xl px-4 py-3 focus-within:border-teal/50 transition-all">
                    <IconKey size={14} className="text-ink-muted flex-shrink-0"/>
                    <input type={showLlmKey?"text":"password"} value={llmKey}
                      onChange={e=>setLlmKey(e.target.value)}
                      placeholder={llmOk
                        ? `••••••••••••••• (${status.llm.provider} key saved)`
                        : "Your LLM API key"
                      }
                      className="flex-1 text-[13px] text-white font-mono"/>
                    <button onClick={()=>setShowLlmKey(s=>!s)}
                      className="text-ink-muted hover:text-white transition-all">
                      <IconEye size={14}/>
                    </button>
                  </div>
                </div>

                {/* Custom base URL — only when provider = custom */}
                {provider==="custom" && (
                  <div>
                    <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block mb-1.5">
                      Base URL (OpenAI-compatible)
                    </label>
                    <div className="flex items-center gap-2 bg-bg-input border border-line-strong rounded-xl px-4 py-3 focus-within:border-teal/50 transition-all">
                      <IconNetwork size={14} className="text-ink-muted flex-shrink-0"/>
                      <input type="text" value={baseUrl}
                        onChange={e=>setBaseUrl(e.target.value)}
                        placeholder="https://your-api-endpoint.com/v1"
                        className="flex-1 text-[13px] text-white font-mono"/>
                    </div>
                    <div className="text-[10px] text-ink-muted mt-1.5">
                      Works with Ollama, LM Studio, vLLM, or any OpenAI-compatible API
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Alert Preferences ────────────── */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-line">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:"#f0a03018", border:"0.5px solid #f0a03030" }}>
                  <IconBell size={16} color="#f0a030"/>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-white">Alert Preferences</div>
                  <div className="text-[10px] text-ink-muted">Controls what Cognee scans for during PDF upload</div>
                </div>
                <button onClick={saveNotifications} disabled={savingN}
                  className="btn-secondary text-[11px]">
                  {savedN?<><IconCheck size={12}/> Saved!</>:savingN?"Saving...":"Save prefs"}
                </button>
              </div>
              {[
                { key:"drug_alerts", label:"Drug interaction warnings",  sub:"Scan for drug conflicts and allergy risks"    },
                { key:"bp_alerts",   label:"BP and vitals alerts",       sub:"Scan for blood pressure and vitals warnings" },
                { key:"lab_alerts",  label:"Lab result notifications",   sub:"Scan for abnormal lab values and HbA1c"      },
                { key:"followup",    label:"Follow-up reminders",        sub:"Flag patients requiring follow-up visits"    },
              ].map((s,i,arr) => (
                <div key={s.key}
                  className={`flex items-center justify-between py-3 gap-4 ${i<arr.length-1?"border-b border-line":""}`}>
                  <div className="flex-1">
                    <div className="text-[12px] font-medium text-white">{s.label}</div>
                    <div className="text-[10px] text-ink-muted mt-0.5">{s.sub}</div>
                  </div>
                  <button
                    onClick={()=>setPrefs(p=>({...p,[s.key]:!p[s.key as keyof typeof p]}))}
                    style={{
                      width:40, height:22, borderRadius:99, border:"none", cursor:"pointer",
                      background:prefs[s.key as keyof typeof prefs]?"#00d4a0":"#1a2436",
                      position:"relative", flexShrink:0, transition:"background .2s",
                    }}>
                    <span style={{
                      position:"absolute", top:3,
                      left:prefs[s.key as keyof typeof prefs]?21:3,
                      width:16, height:16, borderRadius:"50%",
                      background:"white", transition:"left .2s", display:"block",
                    }}/>
                  </button>
                </div>
              ))}
            </div>

            {/* ── Account ──────────────────────── */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-line">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:"#ffffff10", border:"0.5px solid #ffffff20" }}>
                  <IconUser size={16} color="#e2eaf4"/>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">Account</div>
                  <div className="text-[10px] text-ink-muted">Manage your session and data</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-line">
                <div>
                  <div className="text-[12px] font-medium text-white">Delete all patient memory</div>
                  <div className="text-[10px] text-ink-muted mt-0.5">Permanently removes all data from Cognee Cloud</div>
                </div>
                <button
                  onClick={()=>{ if(confirm("Delete ALL patient memory? Cannot be undone.")) alert("Delete individual patients from the Patients page."); }}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg border cursor-pointer flex items-center gap-1.5 bg-rose-dark border-rose/30 text-rose hover:bg-rose/10 transition-all">
                  <IconTrash size={12}/> Delete all
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[12px] font-medium text-white">Sign out</div>
                  <div className="text-[10px] text-ink-muted mt-0.5">Clears session and returns to login</div>
                </div>
                <button
                  onClick={()=>{ localStorage.removeItem("medimem_doctor"); localStorage.removeItem("medimem_active_patient"); window.location.href="/login"; }}
                  className="btn-secondary text-[11px]">Sign out</button>
              </div>
            </div>

            <div className="text-center py-2 text-[10px] text-ink-muted">
              MediMem AI · v1.0.0 · WeMakeDevs × Cognee Hackathon
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}