import React, { useState, useRef, useEffect } from "react";
import { Send, RotateCcw, X, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Plot from "react-plotly.js";
import { sendMessage as sendChatMessage } from "../../services/chatApi";
import { useAuth } from "../../context/AuthContext";

const time = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
const clean = (t) => (t ? t.replace(/\\n/g, "\n") : "");

const ADMIN_SUGGESTIONS = [
  "Plot top 10 dealers by complaint count",
  "Show complaints trend by year as a line chart",
  "What is the cost of replacing a shaft seal?",
  "Most frequently replaced spare part?",
  "How many unique compressor models do we have?",
  "Which dealer has the highest complaints?",
];

const VIEWER_SUGGESTIONS = [
  "Plot top 10 dealers by complaint count",
  "Show complaints trend by year as a line chart",
  "How many unique compressor models do we have?",
  "Which dealer has the highest complaints?",
  "How many complaints mention 'leak' or 'vibration'?",
  "Most frequently replaced spare part?",
];

function getInitMessage(isAdmin) {
  const base = "Hello! I'm **KBot**, your Indi4 Warranty Intelligence assistant.\n\nI can analyse warranty data, calculate metrics, generate charts and troubleshoot problems.";
  const extra = isAdmin
    ? " As an **Admin**, you also have access to cost and financial analysis."
    : " 🔒 Cost and price analysis is restricted to Admin users.";
  return base + extra + "\n\nTry one of the suggestions below, or ask your own question.";
}

export default function ChatWindow({ onClose }) {
  const { user, isAdmin } = useAuth();

  const initMsg = {
    role: "bot",
    text: getInitMessage(isAdmin),
    options: isAdmin ? ADMIN_SUGGESTIONS : VIEWER_SUGGESTIONS,
    time: time(),
  };

  const [messages, setMessages] = useState([initMsg]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleClear = () => {
    if (window.confirm("Clear chat history?")) {
      setMessages([{ ...initMsg, time: time() }]);
      setInput("");
    }
  };

  const send = async (text) => {
    const msg = typeof text === "string" ? text : input;
    if (!msg.trim()) return;
    setMessages(p => [...p, { role:"user", text:msg, time:time() }]);
    if (typeof text !== "string") setInput("");
    setLoading(true);
    try {
      const userRole = isAdmin ? "admin" : "viewer";
      const userId   = user?.username || "user";
      const data = await sendChatMessage(msg, userId, userRole);
      setMessages(p => [...p, { role:"bot", text:data.answer, graph_json:data.graph_json, time:time() }]);
    } catch {
      setMessages(p => [...p, { role:"bot", text:"Connection failed. Please check the backend is running.", time:time() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div style={{
      position: "fixed", bottom: "6rem", right: "1.5rem", zIndex: 9999,
      width: 460, height: 640,
      display: "flex", flexDirection: "column",
      background: "#fff", borderRadius: 20,
      border: "1px solid #e2e8f0",
      boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)",
      overflow: "hidden",
      animation: "fadeInUp 0.25s ease both",
    }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #152f61 0%, #1c3f82 50%, #234FA2 100%)",
        padding: "0.9rem 1.1rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={16} color="#0075BE" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", lineHeight: 1.1 }}>KBot</span>
              {/* Role badge */}
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
                padding: "2px 7px", borderRadius: 20,
                background: isAdmin ? "rgba(0,117,190,0.25)" : "rgba(255,255,255,0.12)",
                color: isAdmin ? "#0075BE" : "rgba(255,255,255,0.55)",
                border: `1px solid ${isAdmin ? "rgba(0,117,190,0.4)" : "rgba(255,255,255,0.2)"}`,
              }}>
                {isAdmin ? "Admin" : "🔒 Limited"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0075BE" }} />
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
                {loading ? "Thinking…" : "Online"}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={handleClear} title="Clear chat" style={{
            background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8,
            padding: "5px 7px", cursor: "pointer", color: "rgba(255,255,255,0.7)",
            display: "flex", alignItems: "center",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          ><RotateCcw size={14} /></button>
          <button onClick={onClose} title="Close" style={{
            background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8,
            padding: "5px 7px", cursor: "pointer", color: "rgba(255,255,255,0.7)",
            display: "flex", alignItems: "center",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          ><X size={15} /></button>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "1rem",
        display: "flex", flexDirection: "column", gap: "1rem",
        background: "#f8fafc",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems: msg.role==="user" ? "flex-end" : "flex-start" }}>
            {/* Sender label */}
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8,
              color: "#94a3b8", marginBottom: 4,
              [msg.role === "user" ? "marginRight" : "marginLeft"]: 4,
            }}>
              {msg.role === "user" ? "You" : "KBot"}
            </span>

            {/* Bubble */}
            <div className={msg.role === "user" ? "chat-msg-user" : "chat-msg-bot"}>
              {msg.role === "user" ? (
                <span style={{ whiteSpace: "pre-wrap" }}>{clean(msg.text)}</span>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({children}) => <p style={{ marginBottom:7, whiteSpace:"pre-wrap" }}>{children}</p>,
                    ul: ({children}) => <ul style={{ paddingLeft:18, marginBottom:7 }}>{children}</ul>,
                    ol: ({children}) => <ol style={{ paddingLeft:18, marginBottom:7 }}>{children}</ol>,
                    li: ({children}) => <li style={{ marginBottom:3 }}>{children}</li>,
                    strong: ({children}) => <strong style={{ fontWeight:700, color:"#0f172a" }}>{children}</strong>,
                    code: ({children}) => <code style={{ background:"#e6f1f8", color:"#234FA2", padding:"1px 5px", borderRadius:4, fontSize:12 }}>{children}</code>,
                  }}
                >{clean(msg.text)}</ReactMarkdown>
              )}

              {/* Quick options */}
              {msg.options && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
                  {msg.options.map((opt, j) => (
                    <button key={j} onClick={() => send(opt)} disabled={loading}
                      style={{
                        padding:"4px 10px", fontSize:11, fontWeight:600,
                        border:"1px solid #a8d5ce", background:"#fff", color:"#155f55",
                        borderRadius:20, cursor:"pointer", textAlign:"left",
                        transition:"all 0.15s", opacity: loading ? 0.5 : 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background="#e8f5f3"; }}
                      onMouseLeave={e => { e.currentTarget.style.background="#fff"; }}
                    >{opt}</button>
                  ))}
                </div>
              )}

              {/* Inline chart */}
              {msg.graph_json && (() => {
                try {
                  const p = JSON.parse(msg.graph_json);
                  return (
                    <div style={{ marginTop:10, borderRadius:10, border:"1px solid #e2e8f0", overflow:"hidden", background:"#fff" }}>
                      <Plot
                        data={p.data}
                        layout={{ ...p.layout, autosize:true, margin:{t:36,r:16,l:50,b:80},
                          paper_bgcolor:"transparent", plot_bgcolor:"transparent",
                          font:{family:"Inter,sans-serif",color:"#475569",size:10},
                          legend:{orientation:"h",y:-0.4,x:0} }}
                        useResizeHandler
                        style={{ width:"100%", height:300 }}
                        config={{ responsive:true, displayModeBar:false }}
                      />
                    </div>
                  );
                } catch { return null; }
              })()}

              {/* Timestamp */}
              <span style={{ fontSize:9.5, color:"#94a3b8", display:"block", textAlign:"right", marginTop:6 }}>{msg.time}</span>
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
            <span style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.8, marginBottom:4, marginLeft:4 }}>KBot</span>
            <div style={{ background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:"4px 14px 14px 14px", padding:"10px 14px", display:"flex", gap:5, alignItems:"center" }}>
              {[0,150,300].map(d => (
                <div key={d} style={{ width:7, height:7, borderRadius:"50%", background:"#94a3b8", animation:"bounce 1s infinite", animationDelay:`${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ── INPUT ── */}
      <div style={{ background:"#fff", borderTop:"1px solid #e2e8f0", padding:"0.75rem 1rem", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8,
          background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"0.45rem 0.45rem 0.45rem 0.85rem",
          transition:"border-color 0.2s",
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor="#234FA2"}
          onBlurCapture={e => e.currentTarget.style.borderColor="#e2e8f0"}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
            placeholder={isAdmin ? "Ask about warranty data or costs..." : "Ask about warranty data..."}
            disabled={loading}
            style={{ flex:1, fontSize:13.5, color:"#0f172a", background:"transparent", border:"none", outline:"none" }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{
              width:34, height:34, borderRadius:9, border:"none", cursor:"pointer",
              background: input.trim() && !loading ? "linear-gradient(135deg,#1c3f82,#234FA2)" : "#e2e8f0",
              color: input.trim() && !loading ? "#fff" : "#94a3b8",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s", flexShrink:0,
            }}
          ><Send size={14} /></button>
        </div>
        <p style={{ fontSize:10, color:"#94a3b8", textAlign:"center", marginTop:6 }}>
          Powered by Google Gemini · Indi4 Warranty Data
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
