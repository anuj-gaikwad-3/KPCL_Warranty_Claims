import React, { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { getComplaintTypes } from "../../services/forecastApi";
import {
  COLORS,
  PALETTE,
  baseLayout,
  formatINR,
} from "../../components/forecasting/plotlyTheme";
import NarrativeBanner from "../../components/forecasting/NarrativeBanner";

const PLOT_CFG = { displayModeBar: false, responsive: true };

export default function PartsInventory() {
  const [raw, setRaw] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getComplaintTypes().then((res) => {
      if (!cancelled) setRaw(res?.raw || []);
    });
    return () => { cancelled = true; };
  }, []);

  const parts = useMemo(() => {
    const filtered = raw.filter((r) => (r.Forecast_p50 ?? 0) > 0);
    const map = new Map();
    for (const r of filtered) {
      const part = r.Predicted_Part || "Unknown";
      if (!map.has(part)) {
        map.set(part, {
          part,
          qty_p50: 0,
          qty_p90: 0,
          unit_cost: r.Est_Unit_Cost ?? 0,
          types: new Set(),
          models: new Set(),
        });
      }
      const agg = map.get(part);
      agg.qty_p50 += r.Forecast_p50 ?? 0;
      agg.qty_p90 += r.Forecast_p90 ?? 0;
      if (r.Est_Unit_Cost) agg.unit_cost = r.Est_Unit_Cost;
      if (r.Complaint_Type) agg.types.add(r.Complaint_Type);
      if (r.Model_masked || r.Model) agg.models.add(r.Model_masked || r.Model);
    }
    return [...map.values()].sort(
      (a, b) => b.qty_p50 * b.unit_cost - a.qty_p50 * a.unit_cost
    );
  }, [raw]);

  const topPart = parts[0]?.part || "N/A";
  const totalBudget = parts.reduce((s, p) => s + p.qty_p50 * p.unit_cost, 0);
  const worstBudget = parts.reduce((s, p) => s + p.qty_p90 * p.unit_cost, 0);
  const topPartModels = parts[0] ? [...parts[0].models].join(", ") : "";

  const detailRows = useMemo(() => {
    return [...raw]
      .filter((r) => (r.Est_Cost_p50 ?? 0) > 0)
      .sort((a, b) => (b.Est_Cost_p50 ?? 0) - (a.Est_Cost_p50 ?? 0))
      .slice(0, 25);
  }, [raw]);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Parts &amp; Inventory Planning
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Predicted spare-part requirements with budget estimates
        </p>
      </div>

      {/* Narrative */}
      <NarrativeBanner
        headline={`Stock ${parts[0]?.qty_p90?.toLocaleString() ?? "—"} units of '${topPart}' to cover worst-case demand`}
        bullets={[
          `Total expected budget: ${formatINR(totalBudget)} · Worst-case budget: ${formatINR(worstBudget)}`,
          topPartModels
            ? `Top part '${topPart}' used in models: ${topPartModels}`
            : null,
          `${parts.length} distinct parts required across all models`,
        ].filter(Boolean)}
      />

      {/* Bar chart */}
      <div className="chart-container bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <Plot
          data={[
            {
              x: parts.map((p) => p.part),
              y: parts.map((p) => p.qty_p50),
              type: "bar",
              name: "Expected Qty",
              marker: { color: COLORS.primary },
              hovertemplate: "<b>%{x}</b><br>Expected: %{y}<extra></extra>",
            },
            {
              x: parts.map((p) => p.part),
              y: parts.map((p) => p.qty_p90),
              type: "bar",
              name: "Worst Case Qty",
              marker: { color: COLORS.amberDim },
              hovertemplate: "<b>%{x}</b><br>Worst Case: %{y}<extra></extra>",
            },
          ]}
          layout={baseLayout({
            title: {
              text: "Parts Demand Forecast",
              font: { size: 16, color: COLORS.textPrimary },
            },
            barmode: "group",
            xaxis: {
              gridcolor: "transparent",
              linecolor: COLORS.border,
              tickfont: { size: 10, color: COLORS.textMuted },
              tickangle: -35,
            },
            yaxis: {
              gridcolor: COLORS.gridLine,
              linecolor: "transparent",
              tickfont: { size: 11, color: COLORS.textMuted },
              title: "",
            },
          })}
          config={PLOT_CFG}
          useResizeHandler
          style={{ width: "100%", height: "420px" }}
        />
      </div>

      {/* Recommended stocking table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Recommended Parts Stocking
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-left text-[var(--text-muted)]">
                <th className="px-4 py-2 font-medium">Part / Component</th>
                <th className="px-4 py-2 font-medium text-right">Units Needed (Expected)</th>
                <th className="px-4 py-2 font-medium text-right">Units Needed (Worst Case)</th>
                <th className="px-4 py-2 font-medium text-right">Unit Cost</th>
                <th className="px-4 py-2 font-medium text-right">Total Budget (Expected)</th>
                <th className="px-4 py-2 font-medium">Primary Failure Types</th>
                <th className="px-4 py-2 font-medium">Models Using This Part</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2 font-medium text-[var(--text-primary)]">
                    {p.part}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {Math.round(p.qty_p50).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-amber-600">
                    {Math.round(p.qty_p90).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatINR(p.unit_cost)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--primary-teal)]">
                    {formatINR(Math.round(p.qty_p50 * p.unit_cost))}
                  </td>
                  <td className="px-4 py-2 text-[var(--text-muted)] max-w-[180px] truncate">
                    {[...p.types].join(", ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-[var(--text-muted)] max-w-[160px] truncate">
                    {[...p.models].join(", ") || "—"}
                  </td>
                </tr>
              ))}
              {!parts.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No parts data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part requirements by model detail table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Part Requirements by Model
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-left text-[var(--text-muted)]">
                <th className="px-4 py-2 font-medium">Model</th>
                <th className="px-4 py-2 font-medium">Failure Type</th>
                <th className="px-4 py-2 font-medium">Likely Part</th>
                <th className="px-4 py-2 font-medium text-right">Qty Expected</th>
                <th className="px-4 py-2 font-medium text-right">Qty Worst Case</th>
                <th className="px-4 py-2 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((d, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2 font-medium text-[var(--text-primary)]">
                    {d.Model_masked || d.Model}
                  </td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">
                    {d.Complaint_Type}
                  </td>
                  <td className="px-4 py-2">{d.Predicted_Part || "—"}</td>
                  <td className="px-4 py-2 text-right">
                    {(d.Forecast_p50 ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-amber-600">
                    {(d.Forecast_p90 ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--primary-teal)]">
                    {formatINR(d.Est_Cost_p50 ?? 0)}
                  </td>
                </tr>
              ))}
              {!detailRows.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    No detail data available
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
