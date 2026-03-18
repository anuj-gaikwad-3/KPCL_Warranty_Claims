import React from "react";
import { baseUrl } from "../../config/api";

function absUrl(url) {
  if (!url) return url;
  return url.startsWith("/") ? `${baseUrl}${url}` : url;
}

export default function HeroPlot({ category, curatedPlots, openLightbox }) {
  if (!curatedPlots || !curatedPlots[category]) return null;
  const cat = curatedPlots[category];
  const hero = cat.plots.find((p) => p.role === "hero");
  if (!hero) return null;

  const heroUrl = absUrl(hero.url);

  return (
    <div className="chart-card" style={{ marginBottom: "1.5rem" }}>
      {/* Card header */}
      <div className="chart-card-header">
        <div style={{ minWidth: 0 }}>
          <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>
            Hero Analysis
          </span>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.25 }}>{hero.label}</div>
          {hero.description && (
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3 }}>{hero.description}</div>
          )}
        </div>
        <button
          onClick={() => openLightbox(heroUrl, hero.label)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11.5, fontWeight: 600, color: "#1a7a6d",
            background: "#e8f5f3", border: "1px solid #a8d5ce",
            borderRadius: 8, padding: "5px 12px", cursor: "pointer", flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#d4eeea"}
          onMouseLeave={e => e.currentTarget.style.background = "#e8f5f3"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          Expand
        </button>
      </div>

      {/* Image */}
      <div
        style={{ cursor: "pointer", overflow: "hidden" }}
        onClick={() => openLightbox(heroUrl, hero.label)}
      >
        <img
          src={heroUrl}
          alt={hero.label}
          loading="lazy"
          style={{
            width: "100%", height: "auto", display: "block",
            transition: "transform 0.25s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.01)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        />
      </div>
    </div>
  );
}
