import React, { useContext } from "react";
import { FiscalYearContext } from "../../context/FiscalYearContext";

export default function DashboardHeader({ title, subtitle, badge }) {
  const { selectedFy } = useContext(FiscalYearContext) || {};

  return (
    <div className="page-header">
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Pill badges row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: 20, padding: "3px 11px",
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.88)",
            letterSpacing: 1.3, textTransform: "uppercase",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0075BE", display: "inline-block" }} />
            {badge || "Dashboard"}
          </span>
          {selectedFy && (
            <span style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 20, padding: "3px 10px",
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 1,
            }}>{selectedFy}</span>
          )}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 900, color: "#ffffff",
          lineHeight: 1.15, letterSpacing: -0.5,
          marginBottom: subtitle ? 6 : 0,
        }}>{title}</h1>

        {/* Subtitle */}
        {subtitle && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", fontWeight: 400, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
