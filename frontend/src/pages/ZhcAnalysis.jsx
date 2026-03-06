import React, { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FiscalYearContext } from "../context/FiscalYearContext";
import { getZhcData } from "../services/dashboardApi";
import DashboardHeader from "../components/layout/DashboardHeader";
import KpiCard from "../components/dashboard/KpiCard";
import ChartContainer from "../components/dashboard/ChartContainer";

const PRIMARY_TEAL = "#21988a";
const ACCENT_CORAL = "#c37c5c";
const DARK_TEAL = "#044c44";

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

export default function ZhcAnalysis() {
  const { selectedFy } = useContext(FiscalYearContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedFy) return;
    let cancelled = false;
    getZhcData(selectedFy).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => { cancelled = true; };
  }, [selectedFy]);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const growth = safe(kpis.zhc_growth);
  const isUp = growth > 0;

  return (
    <>
      <DashboardHeader
        title="ZHC Analysis"
        subtitle="Zero Hour Complaints — Units failing within first 24 hours of operation"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          label="Total ZHC Cases"
          value={fmt(kpis.total_zhc)}
          variant="primary"
          subtitle={selectedFy}
        />
        <KpiCard
          label="ZHC Rate"
          value={`${safe(kpis.zhc_rate).toFixed(1)}%`}
          variant="secondary"
          subtitle="Of total complaints"
        />
        <KpiCard
          label="Primary Failure Part"
          value={kpis.primary_failure_part || "N/A"}
          variant="warning"
        />
        <KpiCard
          label="ZHC Growth"
          value={`${Math.abs(growth).toFixed(1)}%`}
          variant="info"
          subtitle={isUp ? "YoY Increase" : "YoY Decrease"}
          trend={{ direction: isUp ? "up" : "down", value: `${Math.abs(growth).toFixed(1)}%` }}
        />
      </div>

      {/* Pareto Chart (full width) */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <ChartContainer>
          {charts.pareto && charts.pareto.length > 0 && (
            <Plot
              data={[
                {
                  x: charts.pareto.map((d) => d.nature_of_complaint),
                  y: charts.pareto.map((d) => d.count),
                  type: "bar",
                  name: "Count",
                  marker: { color: PRIMARY_TEAL, line: { color: "#1a7a6e", width: 1.5 } },
                  text: charts.pareto.map((d) => d.count),
                  textposition: "outside",
                  textfont: { size: 10, color: DARK_TEAL },
                  hovertemplate: "<b>%{x}</b><br>Count: %{y}<extra></extra>",
                },
                {
                  x: charts.pareto.map((d) => d.nature_of_complaint),
                  y: charts.pareto.map((d) => d.cumulative_pct),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Cumulative %",
                  yaxis: "y2",
                  line: { color: ACCENT_CORAL, width: 2.5, shape: "spline" },
                  marker: { size: 7, color: ACCENT_CORAL },
                  hovertemplate: "<b>%{x}</b><br>Cumulative: %{y}%<extra></extra>",
                },
              ]}
              layout={{
                ...BASE_LAYOUT,
                title: { text: "Pareto Analysis — Nature of Complaint (ZHC)", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL, tickangle: -35 },
                yaxis: { title: "Count", showgrid: true, gridcolor: "#f0f0f0", zeroline: false, color: DARK_TEAL },
                yaxis2: {
                  title: "Cumulative %",
                  overlaying: "y",
                  side: "right",
                  range: [0, 105],
                  showgrid: false,
                  color: ACCENT_CORAL,
                },
                legend: { orientation: "h", yanchor: "top", y: -0.22, xanchor: "center", x: 0.5, font: { color: DARK_TEAL, size: 11 } },
                margin: { l: 50, r: 50, t: 70, b: 120 },
              }}
              config={PLOT_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "420px" }}
            />
          )}
        </ChartContainer>
      </div>

      {/* Row 2: ZHC by Model + Top Parts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartContainer>
          {charts.zhc_by_model && charts.zhc_by_model.length > 0 && (
            <Plot
              data={[
                {
                  x: charts.zhc_by_model.map((d) => d.model),
                  y: charts.zhc_by_model.map((d) => d.count),
                  type: "bar",
                  marker: { color: PRIMARY_TEAL, line: { color: "#1a7a6e", width: 1.5 } },
                  text: charts.zhc_by_model.map((d) => d.count),
                  textposition: "outside",
                  textfont: { size: 10, color: DARK_TEAL },
                  hovertemplate: "<b>%{x}</b><br>ZHC Count: %{y}<extra></extra>",
                },
              ]}
              layout={{
                ...BASE_LAYOUT,
                title: { text: "ZHC by Model", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL, tickangle: -35 },
                yaxis: { title: "", showticklabels: false, showgrid: false, zeroline: false },
                showlegend: false,
              }}
              config={PLOT_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "380px" }}
            />
          )}
        </ChartContainer>

        <ChartContainer>
          {charts.top_parts && charts.top_parts.length > 0 && (
            <Plot
              data={[
                {
                  y: charts.top_parts.map((d) => d.part),
                  x: charts.top_parts.map((d) => d.count),
                  type: "bar",
                  orientation: "h",
                  marker: { color: ACCENT_CORAL, line: { color: "#a86849", width: 1.5 } },
                  text: charts.top_parts.map((d) => d.count),
                  textposition: "outside",
                  textfont: { size: 10, color: DARK_TEAL },
                  hovertemplate: "<b>%{y}</b><br>Frequency: %{x}<extra></extra>",
                },
              ]}
              layout={{
                ...BASE_LAYOUT,
                title: { text: "Top 10 Parts Replaced (ZHC)", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                xaxis: { title: "", showgrid: true, gridcolor: "#f0f0f0", zeroline: false, color: DARK_TEAL },
                yaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL, autorange: "reversed" },
                showlegend: false,
                margin: { l: 180, r: 30, t: 70, b: 50 },
              }}
              config={PLOT_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "380px" }}
            />
          )}
        </ChartContainer>
      </div>
    </>
  );
}
