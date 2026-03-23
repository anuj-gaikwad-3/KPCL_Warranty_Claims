import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: "Analytics Dashboard",
    desc: "Interactive KPI cards, YoY trends, monthly & quarterly breakdowns — all filterable by Indian fiscal year in real time.",
    tags: ["YoY Trends", "Quarterly View", "Fiscal Year Filter"],
    accent: "#234FA2",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "KBot — AI Chatbot",
    desc: "Ask natural-language questions. KBot generates & executes live pandas code against your warranty data and renders Plotly charts inline.",
    tags: ["Gemini Powered", "Live Charts", "Smart Diagnostics"],
    accent: "#e07c3a",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    label: "ML Forecasting Engine",
    desc: "3-month ensemble forecasts for total complaints, model-wise risk scores, complaint-type breakdowns, and warranty cost outlooks.",
    tags: ["Ensemble Model", "Risk Watch", "Cost Outlook"],
    accent: "#1c3f82",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    label: "ZHC & Usage Analysis",
    desc: "Zero Hour Complaints tracking, MTTF metrics, RPM heatmaps, and infant-mortality failure Pareto charts for every model.",
    tags: ["ZHC Detection", "MTTF", "Pareto Analysis"],
    accent: "#d94f4f",
  },
];

const STATS = [
  { value: "4", label: "Dashboard Modules" },
  { value: "5", label: "Forecast Views" },
  { value: "AI", label: "Chatbot (KBot)" },
  { value: "360°", label: "Warranty Coverage" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const heroRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate("/app", { replace: true });
  }, [isAuthenticated, navigate]);

  // Subtle parallax on hero
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      el.style.backgroundPosition = `calc(50% + ${x}px) calc(50% + ${y}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", background: "#f0f2f5" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2.5rem", height: "64px",
        background: "rgba(28, 63, 130, 0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: 0.5,
          }}>I4</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", lineHeight: 1.1 }}>Indi4 Warranty</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Intelligence</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "rgba(255,255,255,0.12)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8,
              padding: "0.45rem 1.1rem", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          >Sign In</button>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "#fff", color: "#1c3f82",
              border: "none", borderRadius: 8,
              padding: "0.45rem 1.25rem", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >Get Started →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "6rem 2rem 5rem",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        >
          <source src="/Landing pg video_1 (1).mp4" type="video/mp4" />
        </video>

        {/* Dark teal gradient overlay — keeps text readable */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(135deg, rgba(21,47,97,0.82) 0%, rgba(28,63,130,0.78) 40%, rgba(35,79,162,0.72) 70%, rgba(0,117,190,0.75) 100%)",
        }} />

        {/* Subtle pattern on top of overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2, opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Glow orbs */}
        <div style={{ position: "absolute", zIndex: 2, width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.03)", top: "10%", right: "-10%", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", zIndex: 2, width: 400, height: 400, borderRadius: "50%", background: "rgba(224,124,58,0.06)", bottom: "5%", left: "-5%", filter: "blur(60px)" }} />

        {/* All hero content sits above video + overlays */}
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 100, padding: "0.35rem 1rem", marginBottom: "1.75rem",
            fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)",
            letterSpacing: 1.2, textTransform: "uppercase",
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0075BE", display: "inline-block", animation: "pulse 2s infinite" }} />
            Warranty Intelligence Platform
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: 900, color: "#ffffff",
            lineHeight: 1.12, marginBottom: "1.25rem",
            maxWidth: 820, letterSpacing: -1,
          }}>
            Transform Warranty Data
            <br />
            <span style={{ color: "#0075BE" }}>Into Actionable Intelligence</span>
          </h1>

          <p style={{
            fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
            color: "rgba(255,255,255,0.72)", maxWidth: 620,
            lineHeight: 1.7, marginBottom: "2.5rem", fontWeight: 400,
          }}>
            A unified platform combining real-time analytics dashboards, AI-powered chatbot diagnostics,
            and ML-based forecasting — built specifically for Indi4 warranty claims management.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "3.5rem" }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "#fff", color: "#1c3f82", border: "none",
                borderRadius: 12, padding: "0.85rem 2.25rem",
                fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                transition: "all 0.25s",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(0,0,0,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)"; }}
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
            <button
              onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}
              style={{
                background: "rgba(255,255,255,0.1)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 12, padding: "0.85rem 2rem",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                backdropFilter: "blur(8px)", transition: "all 0.25s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            >
              Explore Features
            </button>
          </div>

          {/* Platform preview video card */}
          <div style={{
            maxWidth: 820, width: "100%",
            background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 20, overflow: "hidden",
            backdropFilter: "blur(12px)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}>
            {/* Browser chrome bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0.65rem 1rem",
              background: "rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }} />
              <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 20, marginLeft: 8, display: "flex", alignItems: "center", paddingLeft: 10 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>localhost:5173/app — Indi4 Warranty Intelligence</span>
              </div>
            </div>
            {/* Actual platform demo video */}
            <video
              autoPlay
              muted
              loop
              playsInline
              controls={false}
              style={{ width: "100%", display: "block", maxHeight: 440, objectFit: "cover" }}
            >
              <source src="/Landing pg video_1 (1).mp4" type="video/mp4" />
            </video>
          </div>

        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", zIndex: 3, bottom: "2rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: 0.5 }}>
          <span style={{ fontSize: 10, color: "#fff", letterSpacing: 2, textTransform: "uppercase" }}>Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "bounce 1.5s infinite" }}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e9ee",
        padding: "2.5rem 2rem",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "1rem" }}>
              <div style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#1c3f82", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#5f6b7a", marginTop: 6, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "6rem 2rem", background: "#f0f2f5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div style={{
              display: "inline-block", background: "#e6f1f8", color: "#234FA2",
              borderRadius: 100, padding: "0.3rem 1rem", fontSize: 11,
              fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: "1rem",
            }}>Platform Capabilities</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#1a1a2e", letterSpacing: -0.5, marginBottom: "0.75rem" }}>
              Everything You Need,
              <br />
              <span style={{ color: "#234FA2" }}>In One Place</span>
            </h2>
            <p style={{ fontSize: 16, color: "#5f6b7a", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
              From real-time KPI monitoring to AI-powered diagnostics — Indi4's warranty intelligence covers every angle.
            </p>
          </div>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{
        background: "linear-gradient(135deg, #1c3f82 0%, #234FA2 100%)",
        padding: "5rem 2rem",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)", fontWeight: 900, color: "#fff", marginBottom: "1rem", letterSpacing: -0.5 }}>
            Ready to Explore the Platform?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, marginBottom: "2rem", maxWidth: 460, margin: "0 auto 2rem" }}>
            Sign in with your Indi4 credentials and get full access to the Warranty Intelligence Platform.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "#fff", color: "#1c3f82",
              border: "none", borderRadius: 12,
              padding: "0.9rem 2.5rem", fontSize: 15, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
              transition: "all 0.25s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(0,0,0,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)"; }}
          >
            Sign In to Dashboard →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#152f61", padding: "1.75rem 2rem", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5 }}>
          © 2024 Indi4 — Warranty Intelligence Platform &nbsp;·&nbsp; Built with FastAPI + React + Gemini AI
        </p>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ feature }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "2rem",
        border: `1px solid ${hovered ? feature.accent + "40" : "#dde1e6"}`,
        boxShadow: hovered ? `0 12px 40px ${feature.accent}18` : "0 2px 8px rgba(0,0,0,0.05)",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        cursor: "default",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: feature.accent, borderRadius: "16px 16px 0 0", opacity: hovered ? 1 : 0, transition: "opacity 0.3s" }} />

      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: feature.accent + "14",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: feature.accent, marginBottom: "1.25rem",
        border: `1px solid ${feature.accent}20`,
        transition: "transform 0.3s",
        transform: hovered ? "scale(1.08)" : "scale(1)",
      }}>
        {feature.icon}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e", marginBottom: "0.6rem", letterSpacing: -0.2 }}>
        {feature.label}
      </h3>
      <p style={{ fontSize: 13.5, color: "#5f6b7a", lineHeight: 1.65, marginBottom: "1.25rem" }}>
        {feature.desc}
      </p>

      {/* Tags */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {feature.tags.map((tag, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
            padding: "3px 8px", borderRadius: 6,
            background: feature.accent + "12", color: feature.accent,
            border: `1px solid ${feature.accent}20`,
          }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
