import React from "react";

export default function ForecastingExact() {
  return (
    <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
      <iframe
        title="Forecasting Dashboard (Exact)"
        src="/static/index.html"
        style={{
          width: "100%",
          height: "calc(100vh - 165px)",
          border: "none",
          display: "block",
          background: "#eef1f6",
        }}
      />
    </div>
  );
}

