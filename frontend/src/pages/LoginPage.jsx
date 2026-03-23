import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate("/app", { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    // Small artificial delay for UX feel
    await new Promise((r) => setTimeout(r, 600));
    const result = login(username, password);
    setLoading(false);
    if (result.ok) {
      navigate("/app", { replace: true });
    } else {
      setError(result.error);
      setShakeKey((k) => k + 1);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: "0 0 48%",
        background: "linear-gradient(160deg, #152f61 0%, #1c3f82 45%, #234FA2 80%, #0075BE 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "3rem 3.5rem",
        position: "relative", overflow: "hidden",
      }} className="login-left-panel">
        {/* Background pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.07,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Glow orbs */}
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: "-10%", right: "-10%", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "rgba(224,124,58,0.07)", bottom: "5%", left: "-5%", filter: "blur(50px)" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 420 }}>
          {/* Logo */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 22, color: "#fff", margin: "0 auto 1.75rem",
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          }}>I4</div>

          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", letterSpacing: -0.8, marginBottom: "0.75rem", lineHeight: 1.1 }}>
            Indi4 Warranty<br />
            <span style={{ color: "#0075BE" }}>Intelligence</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 14.5, lineHeight: 1.7, marginBottom: "3rem" }}>
            Real-time analytics, AI diagnostics, and ML-based forecasting for warranty claims management.
          </p>

          {/* Mini feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", textAlign: "left" }}>
            {[
              ["📊", "4-module analytics dashboard with fiscal year filtering"],
              ["🤖", "KBot — Gemini-powered chatbot with live chart generation"],
              ["📈", "3-month ensemble forecasting & model risk tracking"],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, paddingTop: 8 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        flex: 1,
        background: "#f0f2f5",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "3rem 2rem",
      }}>
        {/* Back link */}
        <div style={{ position: "absolute", top: "1.5rem", right: "2rem" }}>
          <Link to="/" style={{ fontSize: 13, color: "#5f6b7a", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.color = "#234FA2"}
            onMouseLeave={e => e.currentTarget.style.color = "#5f6b7a"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to home
          </Link>
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Form header */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.9rem", fontWeight: 900, color: "#1a1a2e", letterSpacing: -0.5, marginBottom: "0.4rem" }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: "#5f6b7a" }}>
              Sign in to access the warranty dashboard
            </p>
          </div>

          {/* Demo hint box */}
          <div style={{
            background: "#e6f1f8", border: "1px solid #0075BE",
            borderRadius: 10, padding: "0.75rem 1rem",
            marginBottom: "1.75rem", display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#234FA2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <div style={{ fontSize: 12, color: "#234FA2", lineHeight: 1.7 }}>
              <div><strong>Admin</strong> (full access): <code style={{ background: "#d0e4f2", padding: "1px 5px", borderRadius: 4 }}>admin@c4i4.org</code> &nbsp;/&nbsp; <code style={{ background: "#d0e4f2", padding: "1px 5px", borderRadius: 4 }}>admin123</code></div>
              <div><strong>Viewer</strong> (no cost data): <code style={{ background: "#d0e4f2", padding: "1px 5px", borderRadius: 4 }}>viewer@indi4.com</code> &nbsp;/&nbsp; <code style={{ background: "#d0e4f2", padding: "1px 5px", borderRadius: 4 }}>viewer123</code></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div
              key={shakeKey}
              style={{ animation: shakeKey > 0 ? "shake 0.4s ease" : "none" }}
            >
              {/* Username */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1a1a2e", marginBottom: "0.5rem" }}>
                  Username
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8e99a4" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    placeholder="Enter your username"
                    autoComplete="username"
                    style={{
                      width: "100%", padding: "0.75rem 1rem 0.75rem 2.75rem",
                      borderRadius: 10, border: `1.5px solid ${error ? "#d94f4f" : "#dde1e6"}`,
                      background: "#fff", fontSize: 14, color: "#1a1a2e",
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#234FA2"; e.target.style.boxShadow = "0 0 0 3px rgba(35,79,162,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = error ? "#d94f4f" : "#dde1e6"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1a1a2e", marginBottom: "0.5rem" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8e99a4" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{
                      width: "100%", padding: "0.75rem 3rem 0.75rem 2.75rem",
                      borderRadius: 10, border: `1.5px solid ${error ? "#d94f4f" : "#dde1e6"}`,
                      background: "#fff", fontSize: 14, color: "#1a1a2e",
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#234FA2"; e.target.style.boxShadow = "0 0 0 3px rgba(35,79,162,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = error ? "#d94f4f" : "#dde1e6"; e.target.style.boxShadow = "none"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8e99a4", padding: 0, display: "flex" }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fca5a5",
                borderRadius: 8, padding: "0.65rem 1rem", marginBottom: "1.25rem",
                display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#d94f4f",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "0.85rem",
                background: loading ? "#b0c4de" : "linear-gradient(135deg, #1c3f82 0%, #234FA2 100%)",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 16px rgba(35,79,162,0.35)",
                transition: "all 0.25s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(35,79,162,0.4)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 16px rgba(35,79,162,0.35)"; }}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to Dashboard
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ position: "absolute", bottom: "1.5rem", fontSize: 11, color: "#8e99a4", letterSpacing: 0.3 }}>
          © 2024 Indi4 — Warranty Intelligence Platform
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
