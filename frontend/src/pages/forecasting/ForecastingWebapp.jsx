import React from "react";
import { baseUrl } from "../../config/api";

export default function ForecastingWebapp() {
  const src = `${baseUrl}/forecasting/`;

  return (
    <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="chart-card-header" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>
            Forecasting
          </span>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
            Forecasting Dashboard
          </div>
          <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
            Served directly from backend outputs
          </div>
        </div>
      </div>

      <iframe
        title="Forecasting Dashboard"
        src={src}
        style={{
          width: "100%",
          height: "calc(100vh - 220px)",
          border: "none",
          background: "#eef1f6",
        }}
      />
    </div>
  );
}

