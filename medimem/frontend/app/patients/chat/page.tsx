"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { IconSend, IconDatabase, IconFileText } from "@/components/Icons";
import { api } from "@/lib/api";

type Msg = { from: "doc" | "ai"; text: string; sources?: string[] };

const QUICK = [
  "Is it safe to prescribe Ibuprofen?",
  "What are the current medications?",
  "Any drug conflicts?",
  "Summarize patient history",
];

// Convert **bold** markdown to proper text and format nicely
function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")  // remove **bold**
    .replace(/\*(.*?)\*/g, "$1")       // remove *italic*
    .trim();
}

// Render message with numbered list formatting
function MessageText({ text }: { text: string }) {
  const clean = formatMessage(text);
  const lines = clean.split(/\n/).filter(l => l.trim());

  return (
    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
      {lines.map((line, i) => {
        const isNumbered = /^\d+\./.test(line.trim());
        return (
          <div key={i} style={{
            marginBottom: lines.length > 1 ? 4 : 0,
            paddingLeft: isNumbered ? 0 : 0,
          }}>
            {line}
          </div>
        );
      })}
    </div>
  );
}

export default function ChatPage() {
  const router  = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("medimem_active_patient");
      if (saved) {
        const p = JSON.parse(saved);
        setPatient(p);
        // Load chat history from localStorage
        const history = localStorage.getItem(`chat_${p.id}`);
        if (history) setMsgs(JSON.parse(history));
      } else {
        router.push("/patients/list");
      }
    } catch {}
  }, []);

  // Save to localStorage whenever msgs change
  useEffect(() => {
    if (patient && msgs.length > 0) {
      localStorage.setItem(`chat_${patient.id}`, JSON.stringify(msgs));
    }
  }, [msgs, patient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (question?: string) => {
    const q = (question || input).trim();
    if (!q || !patient || loading) return;
    setInput("");
    setError("");
    setMsgs(m => [...m, { from: "doc", text: q }]);
    setLoading(true);

    try {
      const data = await api.chat(patient.id, q);
      setMsgs(m => [...m, {
        from:    "ai",
        text:    data.answer,
        sources: data.sources,
      }]);
    } catch (e: any) {
      setError(e.message || "Chat failed");
      setMsgs(m => [...m, {
        from: "ai",
        text: "Sorry, I couldn't process that. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (!patient) return;
    setMsgs([]);
    localStorage.removeItem(`chat_${patient.id}`);
  };

  if (!patient) return null;

  const initials = patient.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const doctorInitials = (() => {
    try { return JSON.parse(localStorage.getItem("medimem_doctor") || "{}").initials || "DR"; }
    catch { return "DR"; }
  })();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area overflow-hidden">

        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-dark border border-teal/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[12px] font-bold text-teal">{initials}</span>
            </div>
            <div>
              <div className="text-[14px] font-semibold text-white">{patient.name} — AI Doctor</div>
              <div className="text-[10px] text-ink-muted">{patient.age} yrs · {patient.gender}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-teal-dark border border-teal/25 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-medium text-teal">
                Cognee memory active · {patient.docs?.length || 0} docs
              </span>
            </div>
            {msgs.length > 0 && (
              <button onClick={clearHistory}
                className="btn-ghost text-[11px] px-3 py-1.5 text-ink-muted hover:text-rose">
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-3 bg-rose-dark border border-rose/30 rounded-xl px-4 py-2 text-[12px] text-rose">
            {error}
          </div>
        )}

        {patient.docs?.length === 0 && (
          <div className="mx-5 mt-3 bg-amber-dark border border-amber/30 rounded-xl px-4 py-3 text-[12px] text-amber">
            No documents uploaded yet. Please upload patient records first.
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">

          {/* Chat area */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">

              {msgs.length === 0 && (
                <div className="text-center py-16 text-ink-muted">
                  <div className="text-[14px] mb-2 text-white">Ask anything about {patient.name}</div>
                  <div className="text-[12px]">Powered by Cognee Cloud knowledge graph</div>
                </div>
              )}

              {msgs.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 animate-fade-in ${msg.from === "doc" ? "flex-row-reverse" : "flex-row"}`}>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 self-end"
                    style={{
                      background: msg.from === "doc" ? "#1a2436" : "#001f17",
                      border:     msg.from === "doc" ? "1px solid #243044" : "1px solid #00d4a040",
                      color:      msg.from === "doc" ? "#8a9ab8" : "#00d4a0",
                    }}>
                    {msg.from === "doc" ? doctorInitials : "AI"}
                  </div>

                  {/* Bubble */}
                  <div style={{ maxWidth:"75%" }}>
                    {msg.from === "doc" ? (
                      /* Doctor message — RIGHT side, teal-ish */
                      <div style={{
                        background: "#1a2d4a",
                        border: "1px solid #243044",
                        borderRadius: "16px 4px 16px 16px",
                        padding: "10px 14px",
                        color: "#e2eaf4",
                      }}>
                        <MessageText text={msg.text} />
                      </div>
                    ) : (
                      /* AI message — LEFT side, dark green */
                      <>
                        <div style={{
                          background: "#001f17",
                          border: "1px solid rgba(0,212,160,0.2)",
                          borderRadius: "4px 16px 16px 16px",
                          padding: "12px 16px",
                          color: "#9fe1cb",
                        }}>
                          <MessageText text={msg.text} />
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="flex items-center gap-2 mt-1.5 bg-bg-card border border-line rounded-lg px-3 py-1.5">
                            <IconDatabase size={11} className="text-violet flex-shrink-0" />
                            <span className="text-[10px] text-ink-muted">
                              Source: {msg.sources.slice(0, 2).join(" · ")}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2.5 items-end flex-row animate-fade-in">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background:"#001f17", border:"1px solid #00d4a040", color:"#00d4a0" }}>
                    AI
                  </div>
                  <div style={{
                    background: "#001f17",
                    border: "1px solid rgba(0,212,160,0.2)",
                    borderRadius: "4px 16px 16px 16px",
                    padding: "14px 18px",
                  }}>
                    <div className="flex gap-1.5">
                      {[0,1,2].map(d => (
                        <div key={d} className="w-2 h-2 rounded-full bg-teal"
                          style={{ animation:`bounce 1.2s ${d*0.2}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick chips */}
            <div className="px-5 py-2 flex gap-2 flex-wrap border-t border-line">
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-[11px] text-ink-soft bg-bg-input border border-line-strong rounded-full px-3 py-1.5 cursor-pointer hover:border-teal/40 hover:text-teal transition-all">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-line flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder={`Ask about ${patient.name}'s health history...`}
                disabled={loading}
                className="flex-1 bg-bg-input border border-line-strong rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-ink-muted outline-none focus:border-teal/40 transition-all"
              />
              <button onClick={() => send()} disabled={loading} className="btn-primary px-4">
                <IconSend size={15} />
              </button>
            </div>
          </div>

          {/* Right panel — docs */}
          <div className="w-[180px] bg-bg-input border-l border-line flex flex-col flex-shrink-0 overflow-y-auto">
            <div className="px-3 pt-3 pb-2 border-b border-line">
              <div className="text-[9px] font-bold text-ink-muted uppercase tracking-widest">Patient docs</div>
            </div>
            <div className="px-3 py-2 flex flex-col gap-1.5">
              {patient.docs?.length > 0 ? patient.docs.map((doc: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-bg-card border border-line">
                  <IconFileText size={14} color="#00d4a0" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-medium text-white leading-tight" style={{ wordBreak:"break-all" }}>
                      {doc.name?.slice(0, 20)}{doc.name?.length > 20 ? "..." : ""}
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5">{doc.chunks} chunks</div>
                  </div>
                </div>
              )) : (
                <div className="text-[11px] text-ink-muted text-center py-4">No docs yet</div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
        `}</style>
      </main>
    </div>
  );
}
