import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  getOverview,
  getTotalComplaints,
  getModelWise,
  getModelWiseValidation,
  getComplaintTypes,
  getComplaintTypeCosts,
  getInsights,
  plotUrl,
} from "../../services/forecastApi";
import { formatINR, monthLabel } from "../../components/forecasting/plotlyTheme";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

const COLORS = {
  primary: "#1a7a6d",
  primaryDim: "rgba(26, 122, 109, 0.15)",
  amber: "#e07c3a",
  amberDim: "rgba(224, 124, 58, 0.18)",
  emerald: "#1a7a6d",
  emeraldDim: "rgba(26, 122, 109, 0.12)",
  textMuted: "#5f6b7a",
  border: "#dde1e6",
};

const PALETTE = [
  "#1a7a6d",
  "#e07c3a",
  "#3a8fc7",
  "#5a5fc7",
  "#d94f4f",
  "#2ca58d",
  "#8b6cc1",
  "#e8a838",
  "#47a3a3",
  "#7a8b99",
];

function useChartInstance() {
  const chartRef = useRef(null);
  useEffect(() => () => chartRef.current?.destroy?.(), []);
  return chartRef;
}

export default function ForecastingDashboard() {
  const [tab, setTab] = useState("summary");
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState(null);
  const [totalComplaints, setTotalComplaints] = useState(null);
  const [modelWise, setModelWise] = useState(null);
  const [modelValidation, setModelValidation] = useState(null);
  const [complaintTypes, setComplaintTypes] = useState(null);
  const [costData, setCostData] = useState(null);
  const [insights, setInsights] = useState(null);

  const summaryTrendChart = useRef(null);
  const summaryCostChart = useRef(null);
  const costByTypeChart = useRef(null);
  const costByModelChart = useRef(null);
  const modelTop10Chart = useRef(null);
  const modelBarChart = useRef(null);
  const trendsOverviewChart = useRef(null);
  const trendsActualChart = useRef(null);

  const summaryTrendInst = useChartInstance();
  const summaryCostInst = useChartInstance();
  const costByTypeInst = useChartInstance();
  const costByModelInst = useChartInstance();
  const modelTop10Inst = useChartInstance();
  const modelBarInst = useChartInstance();
  const trendsOverviewInst = useChartInstance();
  const trendsActualInst = useChartInstance();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [ov, tc, mw, mv, ct, cd, ins] = await Promise.all([
          getOverview(),
          getTotalComplaints(),
          getModelWise(),
          getModelWiseValidation(),
          getComplaintTypes(),
          getComplaintTypeCosts(),
          getInsights(),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setTotalComplaints(tc);
        setModelWise(mw);
        setModelValidation(mv);
        setComplaintTypes(ct);
        setCostData(cd);
        setInsights(ins);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const forecastMonthsLabel = useMemo(() => {
    const months = overview?.forecast_months;
    if (!months || !Array.isArray(months) || months.length === 0) return "—";
    const start = monthLabel(months[0]);
    const end = monthLabel(months[months.length - 1]);
    return start === end ? start : `${start} – ${end}`;
  }, [overview]);

  const actionRows = useMemo(() => {
    const raw = costData?.raw ?? [];
    return raw
      .filter((r) => (r.Forecast_p50 ?? 0) > 0)
      .slice()
      .sort((a, b) => (b.Est_Cost_p50 ?? 0) - (a.Est_Cost_p50 ?? 0))
      .slice(0, 15);
  }, [costData]);

  const costSummarySorted = useMemo(() => {
    const rows = costData?.cost_summary ?? [];
    return rows.slice().sort((a, b) => (b.cost_p50 ?? 0) - (a.cost_p50 ?? 0));
  }, [costData]);

  const modelMonth = useMemo(() => {
    const months = modelWise?.available_months ?? [];
    return months[0] ?? "";
  }, [modelWise]);

  // --------------------- chart helpers ---------------------
  function baseOpts({ showLegend = false, indexAxis } = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: showLegend,
          position: "top",
          labels: { color: "#1a1a2e" },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: COLORS.textMuted }, border: { color: COLORS.border } },
        y: { grid: { color: "#eef0f3" }, ticks: { color: COLORS.textMuted }, border: { display: false } },
      },
    };
  }

  function rebuildChart(instRef, canvasRef, config) {
    if (!canvasRef.current) return;
    instRef.current?.destroy?.();
    const ctx = canvasRef.current.getContext("2d");
    instRef.current = new Chart(ctx, config);
  }

  // --------------------- charts: summary ---------------------
  useEffect(() => {
    if (!totalComplaints) return;
    const actuals = totalComplaints.actuals ?? [];
    const forecasts = totalComplaints.forecast ?? [];
    const labels = [...actuals.map((r) => monthLabel(r.Month)), ...forecasts.map((r) => monthLabel(r.Month))];
    const actualVals = actuals.map((r) => r.Actual ?? 0);
    const forecastVals = forecasts.map((r) => r["Ensemble (Top-3)"] ?? 0);
    const fullActual = [...actualVals, ...new Array(forecasts.length).fill(null)];
    const fullForecast = [
      ...new Array(Math.max(actuals.length - 1, 0)).fill(null),
      actuals.length ? actualVals[actualVals.length - 1] : null,
      ...forecastVals,
    ];

    rebuildChart(summaryTrendInst, summaryTrendChart, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Actual Claims",
            data: fullActual,
            borderColor: COLORS.emerald,
            backgroundColor: COLORS.emeraldDim,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2.4,
          },
          {
            label: "Forecast",
            data: fullForecast,
            borderColor: COLORS.amber,
            backgroundColor: COLORS.amberDim,
            borderDash: [6, 4],
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            borderWidth: 2.4,
          },
        ],
      },
      options: baseOpts({ showLegend: true }),
    });
  }, [totalComplaints]);

  useEffect(() => {
    if (!costSummarySorted.length) return;
    const top = costSummarySorted.slice(0, 10);
    rebuildChart(summaryCostInst, summaryCostChart, {
      type: "bar",
      data: {
        labels: top.map((r) => r.Complaint_Type),
        datasets: [
          {
            label: "Expected Cost",
            data: top.map((r) => r.cost_p50 ?? 0),
            backgroundColor: top.map((_, i) => PALETTE[i % PALETTE.length]),
            borderRadius: 6,
          },
        ],
      },
      options: { ...baseOpts({ indexAxis: "y" }), plugins: { legend: { display: false } } },
    });
  }, [costSummarySorted]);

  // --------------------- charts: costs ---------------------
  useEffect(() => {
    if (!costData?.raw?.length) return;
    const raw = costData.raw;

    // by type (top 12)
    const byType = new Map();
    for (const r of raw) {
      const t = r.Complaint_Type ?? "Unknown";
      const cur = byType.get(t) ?? { p50: 0, p90: 0 };
      cur.p50 += r.Est_Cost_p50 ?? 0;
      cur.p90 += r.Est_Cost_p90 ?? 0;
      byType.set(t, cur);
    }
    const typeRows = [...byType.entries()].sort((a, b) => b[1].p50 - a[1].p50).slice(0, 12);
    rebuildChart(costByTypeInst, costByTypeChart, {
      type: "bar",
      data: {
        labels: typeRows.map(([k]) => k),
        datasets: [
          { label: "Expected Cost", data: typeRows.map(([, v]) => v.p50), backgroundColor: COLORS.primary, borderRadius: 6 },
          { label: "Worst Case", data: typeRows.map(([, v]) => v.p90), backgroundColor: COLORS.amberDim, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 4 },
        ],
      },
      options: baseOpts({ showLegend: true }),
    });

    // by model (top 10)
    const byModel = new Map();
    for (const r of raw) {
      const m = r.Model ?? "Unknown";
      byModel.set(m, (byModel.get(m) ?? 0) + (r.Est_Cost_p50 ?? 0));
    }
    const modelRows = [...byModel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    rebuildChart(costByModelInst, costByModelChart, {
      type: "bar",
      data: {
        labels: modelRows.map(([m]) => m),
        datasets: [
          { label: "Expected Cost", data: modelRows.map(([, v]) => v), backgroundColor: modelRows.map((_, i) => PALETTE[i % PALETTE.length]), borderRadius: 6 },
        ],
      },
      options: { ...baseOpts({ indexAxis: "y" }), plugins: { legend: { display: false } } },
    });
  }, [costData]);

  // --------------------- charts: models ---------------------
  useEffect(() => {
    if (!modelWise?.forecasts?.length) return;
    const forecasts = modelWise.forecasts;

    const modelAgg = new Map();
    for (const r of forecasts) {
      const m = r.Model_masked ?? "Unknown";
      modelAgg.set(m, (modelAgg.get(m) ?? 0) + (r.predicted_complaints ?? 0));
    }
    const top10 = [...modelAgg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    rebuildChart(modelTop10Inst, modelTop10Chart, {
      type: "bar",
      data: {
        labels: top10.map(([m]) => m),
        datasets: [{ label: "Total Predicted Claims (3M)", data: top10.map(([, v]) => Math.round(v)), backgroundColor: PALETTE.slice(0, 10), borderRadius: 6 }],
      },
      options: { ...baseOpts({ indexAxis: "y" }), plugins: { legend: { display: false } } },
    });

    if (!modelMonth) return;
    const monthRows = forecasts
      .filter((r) => r["Complaint Date"] === modelMonth)
      .slice()
      .sort((a, b) => (b.predicted_complaints ?? 0) - (a.predicted_complaints ?? 0))
      .slice(0, 30);
    rebuildChart(modelBarInst, modelBarChart, {
      type: "bar",
      data: {
        labels: monthRows.map((r) => r.Model_masked),
        datasets: [
          { label: "Worst Case", data: monthRows.map((r) => r.p90 ?? r.predicted_p90 ?? 0), backgroundColor: COLORS.amberDim, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 4 },
          { label: "Expected", data: monthRows.map((r) => r.predicted_complaints ?? 0), backgroundColor: COLORS.primary, borderRadius: 6 },
          { label: "Best Case", data: monthRows.map((r) => r.p10 ?? r.predicted_p10 ?? 0), backgroundColor: "#2ca58d", borderRadius: 4 },
        ],
      },
      options: baseOpts({ showLegend: true }),
    });
  }, [modelWise, modelMonth]);

  // --------------------- charts: trends ---------------------
  useEffect(() => {
    if (!totalComplaints) return;
    const actuals = totalComplaints.actuals ?? [];
    const forecasts = totalComplaints.forecast ?? [];
    const labels = [...actuals.map((r) => monthLabel(r.Month)), ...forecasts.map((r) => monthLabel(r.Month))];
    const actualVals = actuals.map((r) => r.Actual ?? 0);
    const forecastVals = forecasts.map((r) => r["Ensemble (Top-3)"] ?? 0);
    const fullActual = [...actualVals, ...new Array(forecasts.length).fill(null)];
    const fullForecast = [
      ...new Array(Math.max(actuals.length - 1, 0)).fill(null),
      actuals.length ? actualVals[actualVals.length - 1] : null,
      ...forecastVals,
    ];

    rebuildChart(trendsOverviewInst, trendsOverviewChart, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Actual Complaints", data: fullActual, borderColor: COLORS.emerald, backgroundColor: COLORS.emeraldDim, fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2.2 },
          { label: "Ensemble Forecast", data: fullForecast, borderColor: COLORS.amber, backgroundColor: COLORS.amberDim, borderDash: [5, 5], fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2.6 },
        ],
      },
      options: baseOpts({ showLegend: true }),
    });

    rebuildChart(trendsActualInst, trendsActualChart, {
      type: "bar",
      data: {
        labels: actuals.map((r) => monthLabel(r.Month)),
        datasets: [
          { label: "Actual", data: actuals.map((r) => r.Actual ?? 0), backgroundColor: COLORS.emerald, borderRadius: 6 },
          { label: "Predicted", data: actuals.map((r) => Math.round(r["Ensemble (Top-3)"] ?? 0)), backgroundColor: COLORS.amber, borderRadius: 6 },
        ],
      },
      options: baseOpts({ showLegend: true }),
    });
  }, [totalComplaints]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420, gap: 12 }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%" }} />
        <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Loading forecasting dashboard…</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <span className="badge badge-primary" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.9)" }}>
              Forecasting
            </span>
            <span className="badge badge-emerald" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
              Integrated Dashboard
            </span>
          </div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(1.5rem, 3vw, 2rem)", lineHeight: 1.15 }}>
            Warranty Forecasting Dashboard
          </h1>
          <p style={{ marginTop: 6, color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
            Forecast period: <strong style={{ color: "#fff" }}>{forecastMonthsLabel}</strong>
          </p>
        </div>
      </div>

      {/* Local tabs */}
      <div className="chart-card" style={{ padding: "0.6rem 0.8rem" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["summary", "Executive Summary"],
            ["costs", "Cost Outlook"],
            ["models", "Model Risk"],
            ["parts", "Parts & Inventory"],
            ["trends", "Trends & History"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: "7px 10px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: tab === k ? "#e6f1f8" : "#fff",
                color: tab === k ? "#234FA2" : "#475569",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "summary" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="kpi-card kpi-primary p-4">
              <div className="text-[12px] text-slate-500 font-semibold">Expected Claims (3 months)</div>
              <div className="text-[28px] font-extrabold text-slate-900 mt-1">{Math.round(overview?.three_month_total ?? 0).toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-slate-400 mt-1">MoM change: {(overview?.mom_change ?? 0).toFixed(1)}%</div>
            </div>
            <div className="kpi-card kpi-warning p-4">
              <div className="text-[12px] text-slate-500 font-semibold">Highest Risk Model</div>
              <div className="text-[22px] font-extrabold text-slate-900 mt-1">{overview?.top_model ?? "—"}</div>
              <div className="text-[11px] text-slate-400 mt-1">{(overview?.top_model_value ?? 0).toLocaleString("en-IN")} expected claims</div>
            </div>
            <div className="kpi-card kpi-secondary p-4">
              <div className="text-[12px] text-slate-500 font-semibold">Est. Quarterly Parts Cost</div>
              <div className="text-[28px] font-extrabold text-slate-900 mt-1">{formatINR(costData?.total_estimated_cost ?? 0)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Indicative estimate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>Forecast</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Monthly Claims Forecast</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Actuals vs ensemble prediction</div>
                </div>
              </div>
              <div style={{ padding: "0.9rem 1rem 1.1rem", height: 340 }}>
                <canvas ref={summaryTrendChart} />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <span className="badge badge-accent" style={{ marginBottom: 5, display: "inline-flex" }}>Cost</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Cost by Failure Type</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Top categories (p50)</div>
                </div>
              </div>
              <div style={{ padding: "0.9rem 1rem 1.1rem", height: 340 }}>
                <canvas ref={summaryCostChart} />
              </div>
            </div>
          </div>

          <div className="section-label">Key Actions Required</div>
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <span className="badge badge-rose" style={{ marginBottom: 5, display: "inline-flex" }}>Action Items</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Priority Repair & Stocking Plan</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Top 15 model-failure combinations ranked by estimated cost</div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{actionRows.length} items</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Issue</th>
                    <th>Likely Part</th>
                    <th style={{ textAlign: "right" }}>Est. Cost</th>
                    <th style={{ textAlign: "right" }}>Claims</th>
                  </tr>
                </thead>
                <tbody>
                  {actionRows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{r.Model ?? "—"}</td>
                      <td style={{ color: "#475569" }}>{r.Complaint_Type ?? "—"}</td>
                      <td>{r.Predicted_Part ?? "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 800 }}>{formatINR(r.Est_Cost_p50 ?? 0)}</td>
                      <td style={{ textAlign: "right" }}>{(r.Forecast_p50 ?? 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  {!actionRows.length && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                        No forecast data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "costs" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="kpi-card kpi-secondary p-4">
              <div className="text-[12px] text-slate-500 font-semibold">Total Estimated Cost (p50)</div>
              <div className="text-[26px] font-extrabold text-slate-900 mt-1">{formatINR(costData?.total_estimated_cost ?? 0)}</div>
            </div>
            <div className="kpi-card kpi-info p-4">
              <div className="text-[12px] text-slate-500 font-semibold">Best Case (p10)</div>
              <div className="text-[26px] font-extrabold text-slate-900 mt-1">{formatINR((costData?.raw ?? []).reduce((s, r) => s + (r.Est_Cost_p10 ?? 0), 0))}</div>
            </div>
            <div className="kpi-card kpi-warning p-4">
              <div className="text-[12px] text-slate-500 font-semibold">Worst Case (p90)</div>
              <div className="text-[26px] font-extrabold text-slate-900 mt-1">{formatINR((costData?.raw ?? []).reduce((s, r) => s + (r.Est_Cost_p90 ?? 0), 0))}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="chart-card lg:col-span-3">
              <div className="chart-card-header">
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>By Failure Type</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Cost Breakdown by Failure Type</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Expected vs worst-case</div>
                </div>
              </div>
              <div style={{ padding: "0.9rem 1rem 1.1rem", height: 380 }}>
                <canvas ref={costByTypeChart} />
              </div>
            </div>

            <div className="chart-card lg:col-span-2">
              <div className="chart-card-header">
                <div>
                  <span className="badge badge-accent" style={{ marginBottom: 5, display: "inline-flex" }}>By Model</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Cost by Model (Top 10)</div>
                </div>
              </div>
              <div style={{ padding: "0.9rem 1rem 1.1rem", height: 380 }}>
                <canvas ref={costByModelChart} />
              </div>
            </div>
          </div>

          <div className="section-label">Detailed Cost Forecast</div>
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <span className="badge badge-rose" style={{ marginBottom: 5, display: "inline-flex" }}>Full Detail</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Warranty Cost Forecast by Failure Type</div>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Failure Type</th>
                    <th>Likely Part</th>
                    <th style={{ textAlign: "right" }}>Unit Cost</th>
                    <th style={{ textAlign: "right" }}>Claims</th>
                    <th style={{ textAlign: "right" }}>Expected Total</th>
                    <th style={{ textAlign: "right" }}>Best</th>
                    <th style={{ textAlign: "right" }}>Worst</th>
                    <th>Models Affected</th>
                  </tr>
                </thead>
                <tbody>
                  {costSummarySorted.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800 }}>{r.Complaint_Type}</td>
                      <td style={{ color: "#475569" }}>{r.Predicted_Part ?? "—"}</td>
                      <td style={{ textAlign: "right" }}>{formatINR(r.unit_cost ?? r.avg_cost_per_complaint ?? 0)}</td>
                      <td style={{ textAlign: "right" }}>{(r.total_p50 ?? 0).toLocaleString("en-IN")}</td>
                      <td style={{ textAlign: "right", fontWeight: 900 }}>{formatINR(r.cost_p50 ?? 0)}</td>
                      <td style={{ textAlign: "right" }}>{formatINR(r.cost_p10 ?? 0)}</td>
                      <td style={{ textAlign: "right" }}>{formatINR(r.cost_p90 ?? 0)}</td>
                      <td style={{ color: "#475569" }}>{r.Models_Affected ?? r.models_affected ?? "—"}</td>
                    </tr>
                  ))}
                  {!costSummarySorted.length && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                        No cost data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "models" && (
        <>
          <div className="info-banner">
            <div style={{ fontWeight: 900, color: "#234FA2" }}>{insights?.models?.headline ?? "Model insights loaded"}</div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>Aggregate</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Top 10 Models — Forecasted Claims (3 months)</div>
              </div>
            </div>
            <div style={{ padding: "0.9rem 1rem 1.1rem", height: 380 }}>
              <canvas ref={modelTop10Chart} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <span className="badge badge-rose" style={{ marginBottom: 5, display: "inline-flex" }}>Risk</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Expected Claims by Model</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
                  Month: <strong>{modelMonth ? monthLabel(modelMonth) : "—"}</strong>
                </div>
              </div>
            </div>
            <div style={{ padding: "0.9rem 1rem 1.1rem", height: 520 }}>
              <canvas ref={modelBarChart} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <span className="badge badge-emerald" style={{ marginBottom: 5, display: "inline-flex" }}>Reliability</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Forecast Reliability</div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th style={{ textAlign: "right" }}>Actual</th>
                      <th style={{ textAlign: "right" }}>Predicted</th>
                      <th style={{ textAlign: "right" }}>MAE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(modelValidation?.summary ?? []).slice(0, 25).map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 800 }}>{r.Model_masked}</td>
                        <td style={{ textAlign: "right" }}>{(r.total_actual ?? 0).toLocaleString("en-IN")}</td>
                        <td style={{ textAlign: "right" }}>{Math.round(r.total_predicted ?? 0).toLocaleString("en-IN")}</td>
                        <td style={{ textAlign: "right" }}>{Number(r.mae ?? 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {!(modelValidation?.summary ?? []).length && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                          No validation data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>Forecast</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Model Forecast Details</div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th style={{ textAlign: "right" }}>Best</th>
                      <th style={{ textAlign: "right" }}>Expected</th>
                      <th style={{ textAlign: "right" }}>Worst</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(modelWise?.forecasts ?? [])
                      .filter((r) => !modelMonth || r["Complaint Date"] === modelMonth)
                      .slice()
                      .sort((a, b) => (b.predicted_complaints ?? 0) - (a.predicted_complaints ?? 0))
                      .slice(0, 25)
                      .map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 800 }}>{r.Model_masked}</td>
                          <td style={{ textAlign: "right" }}>{(r.p10 ?? r.predicted_p10 ?? 0).toLocaleString("en-IN")}</td>
                          <td style={{ textAlign: "right", fontWeight: 900, color: "#234FA2" }}>{(r.predicted_complaints ?? 0).toLocaleString("en-IN")}</td>
                          <td style={{ textAlign: "right" }}>{(r.p90 ?? r.predicted_p90 ?? 0).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    {!((modelWise?.forecasts ?? []).length) && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                          No forecast rows available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "parts" && (
        <>
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>Parts</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Parts & Inventory Planning</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Use the existing “Parts & Inventory” page for full interactive analysis</div>
              </div>
            </div>
            <div style={{ padding: "1rem 1.25rem", color: "#475569", fontSize: 13 }}>
              This integrated dashboard focuses on the same Indi4-style overview. Your detailed parts planning is already implemented in the Forecasting → Parts & Inventory route.
            </div>
          </div>
        </>
      )}

      {tab === "trends" && (
        <>
          <div className="info-banner">
            <div style={{ fontWeight: 900, color: "#234FA2" }}>{insights?.total?.headline ?? "Trend insights loaded"}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>History</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Full History + Forecast Overview</div>
                </div>
              </div>
              <div style={{ padding: "0.9rem 1rem 1.1rem", height: 340 }}>
                <canvas ref={trendsOverviewChart} />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <span className="badge badge-accent" style={{ marginBottom: 5, display: "inline-flex" }}>Validation</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Recent Actuals vs Predictions</div>
                </div>
              </div>
              <div style={{ padding: "0.9rem 1rem 1.1rem", height: 340 }}>
                <canvas ref={trendsActualChart} />
              </div>
            </div>
          </div>

          <div className="section-label">Trend Seasonality & Decomposition</div>
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <span className="badge badge-violet" style={{ marginBottom: 5, display: "inline-flex" }}>Decomposition</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Trend Seasonality and Decomposition Plot</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>The underlying trend, seasonal cycle and residual noise separated from raw data</div>
              </div>
            </div>
            <div style={{ padding: "1rem", textAlign: "center" }}>
              <img src={plotUrl("total_complaints_forecast", "plot5_decomposition.png")} alt="Decomposition Plot" style={{ width: "100%", maxWidth: 900, height: "auto", borderRadius: 6, margin: "0 auto" }} />
            </div>
          </div>

          <div className="section-label">Method Performance</div>
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <span className="badge badge-violet" style={{ marginBottom: 5, display: "inline-flex" }}>Performance</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Forecast Method Performance</div>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Method</th>
                    <th style={{ textAlign: "right" }}>Test MAE</th>
                  </tr>
                </thead>
                <tbody>
                  {(totalComplaints?.comparison ?? []).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 900 }}>{i + 1}</td>
                      <td style={{ fontWeight: 800 }}>{r.Model}</td>
                      <td style={{ textAlign: "right" }}>{Number(r["Test MAE"] ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!((totalComplaints?.comparison ?? []).length) && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                        No comparison data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

