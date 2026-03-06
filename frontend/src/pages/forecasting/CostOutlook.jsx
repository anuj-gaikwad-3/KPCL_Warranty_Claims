import React, { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { getComplaintTypeCosts } from "../../services/forecastApi";
import {
  COLORS,
  PALETTE,
  baseLayout,
  formatINR,
  monthLabel,
} from "../../components/forecasting/plotlyTheme";

const PLOT_CFG = { displayModeBar: false, responsive: true };

export default function CostOutlook() {
  const [costData, setCostData] = useState(null);
  const [month, setMonth] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getComplaintTypeCosts(month === "all" ? undefined : month)
      .then((d) => !cancelled && setCostData(d))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  const months = costData?.available_months ?? [];
  const summary = useMemo(
    () =>
      (costData?.cost_summary ?? [])
        .slice()
        .sort((a, b) => (b.cost_p50 ?? 0) - (a.cost_p50 ?? 0)),
    [costData]
  );
  const raw = costData?.raw ?? [];

  const totals = useMemo(() => {
    const p10 = raw.reduce((s, r) => s + (r.Est_Cost_p10 ?? 0), 0);
    const p50 = raw.reduce((s, r) => s + (r.Est_Cost_p50 ?? 0), 0);
    const p90 = raw.reduce((s, r) => s + (r.Est_Cost_p90 ?? 0), 0);
    return { p10, p50, p90 };
  }, [raw]);

  /* Cost by Model — aggregate raw rows by Model, take top 10 */
  const modelCosts = useMemo(() => {
    const map = {};
    raw.forEach((r) => {
      const m = r.Model ?? r.model ?? "Unknown";
      map[m] = (map[m] ?? 0) + (r.Est_Cost_p50 ?? 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [raw]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[var(--primary-teal)] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Warranty Cost Outlook
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Projected warranty spend by failure type, model, and scenario
          </p>
        </div>
        <div>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
          >
            <option value="all">All Months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="kpi-card kpi-primary">
          <div className="flex flex-col items-center justify-center gap-2 p-7 min-h-[168px]">
            <p className="text-[30px] font-extrabold text-[var(--text-primary)] text-center leading-tight tracking-tight">
              {formatINR(totals.p50)}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.9px] text-[var(--text-secondary)] text-center mt-1">
              Total Estimated Cost
            </p>
          </div>
        </div>
        <div className="kpi-card kpi-secondary">
          <div className="flex flex-col items-center justify-center gap-2 p-7 min-h-[168px]">
            <p className="text-[30px] font-extrabold text-[var(--text-primary)] text-center leading-tight tracking-tight">
              {formatINR(totals.p10)}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.9px] text-[var(--text-secondary)] text-center mt-1">
              Best Case
            </p>
          </div>
        </div>
        <div className="kpi-card kpi-warning">
          <div className="flex flex-col items-center justify-center gap-2 p-7 min-h-[168px]">
            <p className="text-[30px] font-extrabold text-[var(--text-primary)] text-center leading-tight tracking-tight">
              {formatINR(totals.p90)}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.9px] text-[var(--text-secondary)] text-center mt-1">
              Worst Case
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Cost Breakdown by Failure Type — wider */}
        <div className="lg:col-span-3 chart-container">
          <div className="rounded-[10px] overflow-hidden">
            <Plot
              data={[
                {
                  x: summary.map((d) => d.Complaint_Type),
                  y: summary.map((d) => d.cost_p50 ?? 0),
                  type: "bar",
                  name: "Expected Cost",
                  marker: {
                    color: COLORS.primary,
                    line: { color: COLORS.primary, width: 1 },
                  },
                  hovertemplate:
                    "<b>%{x}</b><br>Expected: ₹%{y:,.0f}<extra></extra>",
                },
                {
                  x: summary.map((d) => d.Complaint_Type),
                  y: summary.map((d) => d.cost_p90 ?? 0),
                  type: "bar",
                  name: "Worst Case",
                  marker: {
                    color: COLORS.amberDim,
                    line: { color: COLORS.amber, width: 1 },
                  },
                  hovertemplate:
                    "<b>%{x}</b><br>Worst Case: ₹%{y:,.0f}<extra></extra>",
                },
              ]}
              layout={baseLayout({
                title: {
                  text: "Cost Breakdown by Failure Type",
                  font: { size: 15, color: COLORS.textPrimary },
                },
                barmode: "group",
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
                margin: { l: 60, r: 20, t: 40, b: 120 },
              })}
              config={PLOT_CFG}
              useResizeHandler
              style={{ width: "100%", height: "420px" }}
            />
          </div>
        </div>

        {/* Cost by Model — narrower */}
        <div className="lg:col-span-2 chart-container">
          <div className="rounded-[10px] overflow-hidden">
            <Plot
              data={[
                {
                  y: modelCosts.map(([m]) => m),
                  x: modelCosts.map(([, v]) => v),
                  type: "bar",
                  orientation: "h",
                  marker: {
                    color: modelCosts.map(
                      (_, i) => PALETTE[i % PALETTE.length]
                    ),
                  },
                  hovertemplate:
                    "<b>%{y}</b><br>Cost: ₹%{x:,.0f}<extra></extra>",
                },
              ]}
              layout={baseLayout({
                title: {
                  text: "Cost by Model",
                  font: { size: 15, color: COLORS.textPrimary },
                },
                showlegend: false,
                margin: { l: 140, r: 20, t: 40, b: 50 },
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
              style={{ width: "100%", height: "420px" }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Cost Forecast Table */}
      <div className="chart-container mb-8">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Detailed Cost Forecast
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                {[
                  "Failure Type",
                  "Most Likely Part",
                  "Part Cost",
                  "Expected Claims",
                  "Expected Total Cost",
                  "Best Case",
                  "Worst Case",
                  "Models Affected",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] ${
                      [
                        "Part Cost",
                        "Expected Claims",
                        "Expected Total Cost",
                        "Best Case",
                        "Worst Case",
                      ].includes(h)
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {summary.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    {row.Complaint_Type}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {row.Predicted_Part ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-primary)]">
                    {row.unit_cost != null ? formatINR(row.unit_cost) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-primary)]">
                    {(row.total_p50 ?? 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">
                    {formatINR(row.cost_p50 ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                    {formatINR(row.cost_p10 ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-600 font-medium">
                    {formatINR(row.cost_p90 ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[200px] truncate">
                    {row.Models_Affected ?? row.models ?? "—"}
                  </td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-[var(--text-secondary)]"
                  >
                    No cost data available
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
