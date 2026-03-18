import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import {
  getOverview,
  getTotalComplaints,
  getComplaintTypeCosts,
} from "../../services/forecastApi";
import {
  COLORS,
  PALETTE,
  baseLayout,
  formatINR,
  monthLabel,
} from "../../components/forecasting/plotlyTheme";
import KpiCard from "../../components/dashboard/KpiCard";

const PLOT_CFG = { displayModeBar: false, responsive: true };

function priorityBadge(cost) {
  if (cost >= 90000)
    return <span className="badge badge-rose">High</span>;
  if (cost >= 50000)
    return <span className="badge badge-amber">Medium</span>;
  return <span className="badge badge-emerald">Low</span>;
}

export default function ExecutiveSummary() {
  const [overview, setOverview]   = useState(null);
  const [complaints, setComplaints] = useState(null);
  const [costData, setCostData]   = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getOverview(), getTotalComplaints(), getComplaintTypeCosts()])
      .then(([ov, tc, cd]) => {
        if (cancelled) return;
        setOverview(ov);
        setComplaints(tc);
        setCostData(cd);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #1a7a6d", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const actuals    = complaints?.actuals  ?? [];
  const forecasts  = complaints?.forecast ?? [];
  const costSummary = (costData?.cost_summary ?? []).slice().sort((a, b) => (b.cost_p50 ?? 0) - (a.cost_p50 ?? 0));
  const rawRows    = (costData?.raw ?? [])
    .filter(r => (r.Forecast_p50 ?? 0) > 0)
    .sort((a, b) => (b.Est_Cost_p50 ?? 0) - (a.Est_Cost_p50 ?? 0))
    .slice(0, 15);
  const topCategory    = costSummary[0];
  const topCategoryPct = topCategory && costData?.total_estimated_cost
    ? ((topCategory.cost_p50 / costData.total_estimated_cost) * 100).toFixed(1)
    : "0";

  /* Chart data */
  const actualLabels  = actuals.map(d => monthLabel(d.Month));
  const forecastLabels = forecasts.map(d => monthLabel(d.Month));
  const allLabels = [...actualLabels, ...forecastLabels];

  const actualY = [
    ...actuals.map(d => d.Actual ?? d.count ?? d.value),
    ...forecasts.map(() => null),
  ];
  const forecastY = [
    ...actuals.slice(0, -1).map(() => null),
    actuals.length > 0
      ? (actuals[actuals.length - 1].Actual ?? actuals[actuals.length - 1].count ?? actuals[actuals.length - 1].value)
      : null,
    ...forecasts.map(d => d["Ensemble (Top-3)"] ?? d["Best (Holt-Winters)"] ?? d.Forecast_p50 ?? d.value),
  ];

  const costTypes  = costSummary.map(d => d.Complaint_Type);
  const costValues = costSummary.map(d => d.cost_p50 ?? 0);
  const costColors = costSummary.map((_, i) => PALETTE[i % PALETTE.length]);

  const momChange = overview?.mom_change;
  const periodLabel = (() => {
    const months = overview?.forecast_months;
    if (!months) return "";
    if (Array.isArray(months) && months.length) {
      const start = monthLabel(months[0]);
      const end = monthLabel(months[months.length - 1]);
      return start === end ? start : `${start} \u2013 ${end}`;
    }
    // Backward/alternate support if API ever sends a string already
    return String(months);
  })();

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 20, padding: "3px 11px",
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.88)",
              letterSpacing: 1.3, textTransform: "uppercase",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#5eead4", display: "inline-block" }} />
              Forecasting
            </span>
            <span style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 20, padding: "3px 10px",
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 1,
            }}>Executive Summary</span>
          </div>
          <h1 style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 900,
            color: "#fff", lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 6,
          }}>
            Quarterly Warranty Cost &amp; Risk Overview
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
              Estimated Quarterly Cost:{" "}
              <strong style={{ color: "#fff", fontWeight: 800 }}>
                {formatINR(costData?.total_estimated_cost ?? 0)}
              </strong>
            </span>
            {overview?.forecast_months && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
                · Forecast period: {periodLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Expected Claims (3 months)"
          value={overview?.three_month_total?.toLocaleString("en-IN") ?? "—"}
          subtitle="Next quarter forecast"
          variant="primary"
          trend={momChange != null ? {
            direction: momChange > 0 ? "up" : "down",
            value: `${Math.abs(momChange).toFixed(1)}% MoM`,
          } : undefined}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
        <KpiCard
          label="Highest Risk Model"
          value={overview?.top_model ?? "—"}
          subtitle={overview?.top_model_value != null ? `${overview.top_model_value.toLocaleString("en-IN")} expected claims` : ""}
          variant="secondary"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
        />
        <KpiCard
          label="Top Failure Category"
          value={topCategory?.Complaint_Type ?? "—"}
          subtitle={`${topCategoryPct}% of total cost`}
          variant="warning"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly Claims Forecast */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>Forecast</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Monthly Claims Forecast</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Actuals vs. ensemble model predictions</div>
            </div>
          </div>
          <div className="chart-card-body">
            <Plot
              data={[
                {
                  x: allLabels, y: actualY, mode: "lines",
                  name: "Actual Claims",
                  line: { color: COLORS.emerald, width: 2.5, shape: "spline" },
                  fill: "tozeroy", fillcolor: COLORS.emeraldDim, connectgaps: false,
                  hovertemplate: "<b>%{x}</b><br>Actual: %{y}<extra></extra>",
                },
                {
                  x: allLabels, y: forecastY, mode: "lines",
                  name: "Forecast",
                  line: { color: COLORS.primary, width: 2.5, dash: "dash", shape: "spline" },
                  fill: "tozeroy", fillcolor: COLORS.primaryDim, connectgaps: false,
                  hovertemplate: "<b>%{x}</b><br>Forecast: %{y}<extra></extra>",
                },
              ]}
              layout={baseLayout({
                xaxis: { gridcolor: "transparent", linecolor: COLORS.border, tickfont: { size: 10, color: COLORS.textMuted }, tickangle: -40 },
                yaxis: { gridcolor: COLORS.gridLine, linecolor: "transparent", tickfont: { size: 10, color: COLORS.textMuted } },
              })}
              config={PLOT_CFG}
              useResizeHandler
              style={{ width: "100%", height: 340 }}
            />
          </div>
        </div>

        {/* Cost by Failure Type */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 5, display: "inline-flex" }}>Cost</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Cost by Failure Type</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Estimated warranty spend per complaint category</div>
            </div>
          </div>
          <div className="chart-card-body">
            <Plot
              data={[{
                y: costTypes, x: costValues, type: "bar", orientation: "h",
                marker: { color: costColors, line: { color: costColors, width: 1 } },
                hovertemplate: "<b>%{y}</b><br>Cost: ₹%{x:,.0f}<extra></extra>",
              }]}
              layout={baseLayout({
                showlegend: false,
                margin: { l: 160, r: 20, t: 20, b: 50 },
                xaxis: { gridcolor: COLORS.gridLine, linecolor: "transparent", tickfont: { size: 10, color: COLORS.textMuted } },
                yaxis: { gridcolor: "transparent", linecolor: COLORS.border, tickfont: { size: 10, color: COLORS.textMuted }, autorange: "reversed" },
              })}
              config={PLOT_CFG}
              useResizeHandler
              style={{ width: "100%", height: 340 }}
            />
          </div>
        </div>
      </div>

      {/* ── Key Actions Table ── */}
      <div className="section-label">Key Actions Required</div>
      <div className="chart-card" style={{ marginBottom: "1.5rem" }}>
        <div className="chart-card-header">
          <div>
            <span className="badge badge-rose" style={{ marginBottom: 5, display: "inline-flex" }}>Action Items</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Priority Repair &amp; Stocking Plan</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Top 15 model-failure combinations ranked by estimated cost</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Model</th>
                <th>Issue</th>
                <th>Likely Part Needed</th>
                <th style={{ textAlign: "right" }}>Est. Cost</th>
                <th style={{ textAlign: "right" }}>Expected Claims</th>
              </tr>
            </thead>
            <tbody>
              {rawRows.map((row, i) => (
                <tr key={i}>
                  <td>{priorityBadge(row.Est_Cost_p50 ?? 0)}</td>
                  <td style={{ fontWeight: 600 }}>{row.Model ?? row.model}</td>
                  <td style={{ color: "#475569" }}>{row.Complaint_Type}</td>
                  <td style={{ color: "#475569" }}>{row.Predicted_Part ?? "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{formatINR(row.Est_Cost_p50 ?? 0)}</td>
                  <td style={{ textAlign: "right" }}>{(row.Forecast_p50 ?? 0).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {rawRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                    No forecast data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
