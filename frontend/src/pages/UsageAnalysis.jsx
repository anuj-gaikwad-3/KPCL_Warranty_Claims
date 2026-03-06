import React, { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FiscalYearContext } from "../context/FiscalYearContext";
import { getUsageData } from "../services/dashboardApi";
import DashboardHeader from "../components/layout/DashboardHeader";
import KpiCard from "../components/dashboard/KpiCard";
import ChartContainer from "../components/dashboard/ChartContainer";

const PRIMARY_TEAL = "#21988a";
const ACCENT_CORAL = "#c37c5c";
const DARK_TEAL = "#044c44";
const PALETTE = ["#21988a", "#c37c5c", "#044c44", "#5abaae", "#e0915c", "#3d8b7a", "#d4a574", "#267a6f"];

const BASE_LAYOUT = {
  font: { family: "Inter, sans-serif", size: 12, color: DARK_TEAL },
  paper_bgcolor: "#ffffff",
  plot_bgcolor: "#ffffff",
  margin: { l: 30, r: 30, t: 70, b: 80 },
  hoverlabel: {
    bgcolor: DARK_TEAL,
    font: { size: 12, family: "Inter, sans-serif", color: "#ffffff" },
  },
};

const PLOT_CONFIG = { displayModeBar: false, responsive: true };

function safe(v) {
  return v == null || Number.isNaN(Number(v)) ? 0 : Number(v);
}
function fmt(v) {
  return safe(v).toLocaleString("en-IN");
}

export default function UsageAnalysis() {
  const { selectedFy } = useContext(FiscalYearContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedFy) return;
    let cancelled = false;
    getUsageData(selectedFy).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => { cancelled = true; };
  }, [selectedFy]);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  return (
    <>
      <DashboardHeader
        title="Usage Analysis"
        subtitle="Machine usage patterns, failure timing, and operational insights"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          label="Mean Time to Failure"
          value={`${fmt(kpis.mttf)} hrs`}
          variant="primary"
          subtitle="Avg. run hours at failure"
        />
        <KpiCard
          label="Avg. Age at Failure"
          value={`${safe(kpis.avg_age_at_failure).toFixed(1)} months`}
          variant="secondary"
          subtitle="Installation to failure"
        />
        <KpiCard
          label="High-Usage Failures"
          value={fmt(kpis.high_usage_failures)}
          variant="warning"
          subtitle="Run hours > 5,000"
        />
        <KpiCard
          label="Dominant Segment"
          value={kpis.dominant_segment || "N/A"}
          variant="info"
          subtitle="Highest avg. run hours"
        />
      </div>

      {/* Row 1: Failure Distribution (full width) */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <ChartContainer>
          {charts.failure_distribution && charts.failure_distribution.length > 0 && (
            <Plot
              data={[
                {
                  x: charts.failure_distribution.map((d) => d.bin),
                  y: charts.failure_distribution.map((d) => d.count),
                  type: "bar",
                  marker: {
                    color: charts.failure_distribution.map((_, i) =>
                      i === 0 ? ACCENT_CORAL : PRIMARY_TEAL
                    ),
                    line: { color: "#1a7a6e", width: 1 },
                  },
                  text: charts.failure_distribution.map((d) => d.count),
                  textposition: "outside",
                  textfont: { size: 11, color: DARK_TEAL },
                  hovertemplate: "<b>%{x} hrs</b><br>Complaints: %{y}<extra></extra>",
                },
              ]}
              layout={{
                ...BASE_LAYOUT,
                title: {
                  text: 'Failure Distribution by Run Hours (The "Bathtub" Curve)',
                  font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" },
                },
                xaxis: { title: "Run Hours", showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL },
                yaxis: { title: "Complaint Count", showgrid: true, gridcolor: "#f0f0f0", zeroline: false, color: DARK_TEAL },
                showlegend: false,
                annotations: [{
                  x: charts.failure_distribution[0]?.bin,
                  y: charts.failure_distribution[0]?.count,
                  text: "ZHC Zone<br>(< 24 hrs)",
                  showarrow: true,
                  arrowhead: 2,
                  arrowcolor: ACCENT_CORAL,
                  font: { size: 10, color: ACCENT_CORAL, family: "Inter, sans-serif" },
                  ax: 40,
                  ay: -30,
                }],
              }}
              config={PLOT_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "400px" }}
            />
          )}
        </ChartContainer>
      </div>

      {/* Row 2: Application vs Usage + Time to Failure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartContainer>
          {charts.app_vs_usage && charts.app_vs_usage.length > 0 && (
            <Plot
              data={charts.app_vs_usage.map((seg, i) => ({
                y: seg.values,
                name: seg.segment,
                type: "box",
                marker: { color: PALETTE[i % PALETTE.length] },
                boxmean: true,
                hovertemplate: `<b>${seg.segment}</b><br>Value: %{y} hrs<extra></extra>`,
              }))}
              layout={{
                ...BASE_LAYOUT,
                title: { text: "Application vs. Usage (Run Hours)", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL },
                yaxis: { title: "Run Hours", showgrid: true, gridcolor: "#f0f0f0", zeroline: false, color: DARK_TEAL },
                showlegend: false,
                margin: { l: 60, r: 20, t: 70, b: 100 },
              }}
              config={PLOT_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "420px" }}
            />
          )}
        </ChartContainer>

        <ChartContainer>
          {charts.time_to_failure && charts.time_to_failure.length > 0 && (
            <Plot
              data={[
                {
                  x: charts.time_to_failure.map((d) => d.date),
                  y: charts.time_to_failure.map((d) => d.months),
                  type: "scatter",
                  mode: "markers",
                  marker: {
                    color: PRIMARY_TEAL,
                    size: 6,
                    opacity: 0.6,
                    line: { color: DARK_TEAL, width: 0.5 },
                  },
                  hovertemplate: "<b>%{x}</b><br>Age: %{y} months<extra></extra>",
                },
              ]}
              layout={{
                ...BASE_LAYOUT,
                title: { text: "Time to Failure Trend", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                xaxis: { title: "Complaint Date", showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL, tickangle: -35 },
                yaxis: { title: "Months (Installation → Failure)", showgrid: true, gridcolor: "#f0f0f0", zeroline: false, color: DARK_TEAL },
                showlegend: false,
                margin: { l: 60, r: 20, t: 70, b: 100 },
              }}
              config={PLOT_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "420px" }}
            />
          )}
        </ChartContainer>
      </div>

      {/* Row 3: RPM vs Nature of Complaint Heatmap (full width) */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <ChartContainer>
          {charts.rpm_heatmap && charts.rpm_heatmap.matrix && charts.rpm_heatmap.matrix.length > 0 && (
            <Plot
              data={[
                {
                  z: charts.rpm_heatmap.matrix,
                  x: charts.rpm_heatmap.rpm_bins,
                  y: charts.rpm_heatmap.complaints,
                  type: "heatmap",
                  colorscale: [
                    [0, "#f0faf8"],
                    [0.25, "#a8e0d8"],
                    [0.5, "#21988a"],
                    [0.75, "#0d6b60"],
                    [1, "#044c44"],
                  ],
                  hoverongaps: false,
                  hovertemplate: "<b>%{y}</b><br>RPM: %{x}<br>Count: %{z}<extra></extra>",
                  showscale: true,
                  colorbar: {
                    title: "Count",
                    titlefont: { color: DARK_TEAL, size: 11 },
                    tickfont: { color: DARK_TEAL, size: 10 },
                  },
                },
              ]}
              layout={{
                ...BASE_LAYOUT,
                title: { text: "RPM vs. Nature of Complaint", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                xaxis: { title: "RPM Range", showgrid: false, color: DARK_TEAL },
                yaxis: { title: "", showgrid: false, color: DARK_TEAL, autorange: "reversed" },
                margin: { l: 200, r: 80, t: 70, b: 60 },
              }}
              config={PLOT_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "450px" }}
            />
          )}
        </ChartContainer>
      </div>
    </>
  );
}
