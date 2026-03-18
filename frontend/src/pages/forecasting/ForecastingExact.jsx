import React from "react";
import { baseUrl } from "../../config/api";

export default function ForecastingExact() {
  const src = `${baseUrl}/forecasting/`;
  return (
    <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
      <iframe
        title="Forecasting Dashboard (Exact)"
        src={src}
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

