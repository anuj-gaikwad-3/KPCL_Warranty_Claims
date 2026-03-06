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

const PLOT_CFG = { displayModeBar: false, responsive: true };

function priorityBadge(cost) {
  if (cost >= 90000)
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
        High
      </span>
    );
  if (cost >= 50000)
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
        Medium
      </span>
    );
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
      Low
    </span>
  );
}

export default function ExecutiveSummary() {
  const [overview, setOverview] = useState(null);
  const [complaints, setComplaints] = useState(null);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[var(--primary-teal)] border-t-transparent" />
      </div>
    );
  }

  const actuals = complaints?.actuals ?? [];
  const forecasts = complaints?.forecast ?? [];
  const costSummary = (costData?.cost_summary ?? [])
    .slice()
    .sort((a, b) => (b.cost_p50 ?? 0) - (a.cost_p50 ?? 0));
  const rawRows = (costData?.raw ?? [])
    .filter((r) => (r.Forecast_p50 ?? 0) > 0)
    .sort((a, b) => (b.Est_Cost_p50 ?? 0) - (a.Est_Cost_p50 ?? 0))
    .slice(0, 15);
  const topCategory = costSummary[0];
  const topCategoryPct =
    topCategory && costData?.total_estimated_cost
      ? ((topCategory.cost_p50 / costData.total_estimated_cost) * 100).toFixed(1)
      : "0";

  /* ---------- Chart data: Monthly Claims Forecast ---------- */
  const actualLabels = actuals.map((d) => monthLabel(d.Month));
  const forecastLabels = forecasts.map((d) => monthLabel(d.Month));
  const allLabels = [...actualLabels, ...forecastLabels];

  const actualY = [
    ...actuals.map((d) => d.Actual ?? d.count ?? d.value),
    ...forecasts.map(() => null),
  ];
  const forecastY = [
    ...actuals.slice(0, -1).map(() => null),
    actuals.length > 0
      ? actuals[actuals.length - 1].Actual ??
        actuals[actuals.length - 1].count ??
        actuals[actuals.length - 1].value
      : null,
    ...forecasts.map((d) => d["Ensemble (Top-3)"] ?? d["Best (Holt-Winters)"] ?? d.Forecast_p50 ?? d.value),
  ];

  /* ---------- Chart data: Cost by Failure Type ---------- */
  const costTypes = costSummary.map((d) => d.Complaint_Type);
  const costValues = costSummary.map((d) => d.cost_p50 ?? 0);
  const costColors = costSummary.map((_, i) => PALETTE[i % PALETTE.length]);

  return (
    <>
      {/* Hero Banner */}
      <div className="dashboard-header mb-8">
        <div className="relative z-10">
          <div className="subtle-badge mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-teal)]" />
            Forecasting
          </div>
          <h1 className="text-[34px] font-extrabold text-white tracking-tight leading-tight">
            Quarterly Warranty Cost &amp; Risk Overview
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <span className="text-lg font-semibold text-white/90">
              Estimated Quarterly Cost:{" "}
              <span className="text-white font-extrabold">
                {formatINR(costData?.total_estimated_cost ?? 0)}
              </span>
            </span>
            {overview?.forecast_months && (
              <span className="text-sm text-white/70 font-medium">
                | Forecast period: {overview.forecast_months}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="kpi-card kpi-primary">
          <div className="flex flex-col items-center justify-center gap-2 p-7 min-h-[168px]">
            {overview?.mom_change != null && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-base font-bold ${
                    overview.mom_change > 0
                      ? "text-[var(--danger)]"
                      : "text-[var(--success)]"
                  }`}
                >
                  {overview.mom_change > 0 ? "↑" : "↓"}
                </span>
                <span
                  className={`text-sm font-bold ${
                    overview.mom_change > 0
                      ? "text-[var(--danger)]"
                      : "text-[var(--success)]"
                  }`}
                >
                  {Math.abs(overview.mom_change).toFixed(1)}%
                </span>
              </div>
            )}
            <p className="text-[30px] font-extrabold text-[var(--text-primary)] text-center leading-tight tracking-tight">
              {overview?.three_month_total?.toLocaleString("en-IN") ?? "—"}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.9px] text-[var(--text-secondary)] text-center mt-1">
              Expected Claims (3&nbsp;months)
            </p>
          </div>
        </div>

        <div className="kpi-card kpi-secondary">
          <div className="flex flex-col items-center justify-center gap-2 p-7 min-h-[168px]">
            <p className="text-[30px] font-extrabold text-[var(--text-primary)] text-center leading-tight tracking-tight">
              {overview?.top_model ?? "—"}
            </p>
            <p className="text-xs font-semibold text-[var(--primary-teal)]">
              {overview?.top_model_value?.toLocaleString("en-IN") ?? ""} expected claims
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.9px] text-[var(--text-secondary)] text-center mt-1">
              Highest Risk Model
            </p>
          </div>
        </div>

        <div className="kpi-card kpi-warning">
          <div className="flex flex-col items-center justify-center gap-2 p-7 min-h-[168px]">
            <p className="text-[30px] font-extrabold text-[var(--text-primary)] text-center leading-tight tracking-tight">
              {topCategory?.Complaint_Type ?? "—"}
            </p>
            <p className="text-xs font-semibold text-[var(--primary-teal)]">
              {topCategoryPct}% of total cost
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.9px] text-[var(--text-secondary)] text-center mt-1">
              Top Failure Category
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="chart-container">
          <div className="rounded-[10px] overflow-hidden">
            <Plot
              data={[
                {
                  x: allLabels,
                  y: actualY,
                  mode: "lines",
                  name: "Actual Claims",
                  line: { color: COLORS.emerald, width: 2.5, shape: "spline" },
                  fill: "tozeroy",
                  fillcolor: COLORS.emeraldDim,
                  connectgaps: false,
                  hovertemplate: "<b>%{x}</b><br>Actual: %{y}<extra></extra>",
                },
                {
                  x: allLabels,
                  y: forecastY,
                  mode: "lines",
                  name: "Forecast",
                  line: {
                    color: COLORS.primary,
                    width: 2.5,
                    dash: "dash",
                    shape: "spline",
                  },
                  fill: "tozeroy",
                  fillcolor: COLORS.primaryDim,
                  connectgaps: false,
                  hovertemplate: "<b>%{x}</b><br>Forecast: %{y}<extra></extra>",
                },
              ]}
              layout={baseLayout({
                title: {
                  text: "Monthly Claims Forecast",
                  font: { size: 15, color: COLORS.textPrimary },
                },
                xaxis: {
                  gridcolor: "transparent",
                  linecolor: COLORS.border,
                  tickfont: { size: 10, color: COLORS.textMuted },
                  tickangle: -40,
                },
                yaxis: {
                  gridcolor: COLORS.gridLine,
                  linecolor: "transparent",
                  tickfont: { size: 10, color: COLORS.textMuted },
                },
              })}
              config={PLOT_CFG}
              useResizeHandler
              style={{ width: "100%", height: "380px" }}
            />
          </div>
        </div>

        <div className="chart-container">
          <div className="rounded-[10px] overflow-hidden">
            <Plot
              data={[
                {
                  y: costTypes,
                  x: costValues,
                  type: "bar",
                  orientation: "h",
                  marker: {
                    color: costColors,
                    line: { color: costColors, width: 1 },
                  },
                  hovertemplate:
                    "<b>%{y}</b><br>Cost: ₹%{x:,.0f}<extra></extra>",
                },
              ]}
              layout={baseLayout({
                title: {
                  text: "Cost by Failure Type",
                  font: { size: 15, color: COLORS.textPrimary },
                },
                showlegend: false,
                margin: { l: 160, r: 20, t: 40, b: 50 },
                xaxis: {
                  gridcolor: COLORS.gridLine,
                  linecolor: "transparent",
                  tickfont: { size: 10, color: COLORS.textMuted },
                },
                yaxis: {
                  gridcolor: "transparent",
                  linecolor: COLORS.border,
                  tickfont: { size: 10, color: COLORS.textMuted },
                  autorange: "reversed",
                },
              })}
              config={PLOT_CFG}
              useResizeHandler
              style={{ width: "100%", height: "380px" }}
            />
          </div>
        </div>
      </div>

      {/* Key Actions Table */}
      <div className="chart-container mb-8">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Key Actions Required
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Issue
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Likely Part Needed
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Est. Cost
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Expected Claims
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rawRows.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <td className="px-4 py-3">
                    {priorityBadge(row.Est_Cost_p50 ?? 0)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    {row.Model ?? row.model}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {row.Complaint_Type}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {row.Predicted_Part ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">
                    {formatINR(row.Est_Cost_p50 ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-primary)]">
                    {(row.Forecast_p50 ?? 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {rawRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[var(--text-secondary)]"
                  >
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
