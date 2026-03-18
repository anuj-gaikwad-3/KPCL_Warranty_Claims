import React from "react";
import { baseUrl } from "../../config/api";

function absUrl(url) {
  if (!url) return url;
  return url.startsWith("/") ? `${baseUrl}${url}` : url;
}

export default function SupportingPlots({ category, curatedPlots, openLightbox }) {
  if (!curatedPlots || !curatedPlots[category]) return null;
  const cat = curatedPlots[category];
  const supp = cat.plots.filter((p) => p.role === "supporting");
  if (!supp.length) return null;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
      gap: 16,
      marginTop: 8,
    }}>
      {supp.map((p, i) => (
        (() => {
          const url = absUrl(p.url);
          return (
        <div
          key={i}
          className="chart-card"
          onClick={() => openLightbox(url, p.label)}
          style={{ cursor: "pointer" }}
        >
          {/* Image */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src={url}
              alt={p.label}
              loading="lazy"
              style={{
                width: "100%", height: 180, objectFit: "cover", display: "block",
                transition: "transform 0.25s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            />
            {/* Analysis badge */}
            <div style={{ position: "absolute", top: 8, right: 8 }}>
              <span style={{
                background: "rgba(255,255,255,0.93)",
                color: "#1a7a6d",
                fontSize: 9.5, fontWeight: 700,
                padding: "2px 9px", borderRadius: 20,
                letterSpacing: 0.5, textTransform: "uppercase",
              }}>Analysis</span>
            </div>
          </div>

          {/* Card body */}
          <div style={{ padding: "0.75rem 1rem 0.85rem" }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "#0f172a",
              marginBottom: 4, lineHeight: 1.35,
            }}>
              {p.label}
            </div>
            <div style={{
              fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5,
              marginBottom: 8,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {p.description}
            </div>
            <div style={{
              fontSize: 11, color: "#1a7a6d", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              Click to expand
            </div>
          </div>
        </div>
          );
        })()
      ))}
    </div>
  );
}
