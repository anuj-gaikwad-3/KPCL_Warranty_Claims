import React, { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FiscalYearContext } from "../context/FiscalYearContext";
import { getTrends, getKpis } from "../services/dashboardApi";
import DashboardHeader from "../components/layout/DashboardHeader";
import KpiCard from "../components/dashboard/KpiCard";
import ChartContainer from "../components/dashboard/ChartContainer";

const PRIMARY_TEAL = "#21988a";
const ACCENT_CORAL = "#c37c5c";
const DARK_TEAL = "#044c44";
const LIGHT_GRAY = "#bac5c8";

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

export default function Overview() {
  const { selectedFy } = useContext(FiscalYearContext);
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    if (!selectedFy) return;
    let cancelled = false;
    Promise.all([getTrends(selectedFy), getKpis(selectedFy)]).then(
      ([tr, kp]) => {
        if (cancelled) return;
        setTrends(tr);
        setKpis(kp);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [selectedFy]);

  const growth = safe(kpis?.growth);
  const isUp = growth > 0;

  const MONTH_ORDER = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  return (
    <>
      <DashboardHeader
        title="Warranty Claims Overview"
        subtitle="10-Year Historical Analysis with Year-over-Year Trends"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          label="Total Complaints"
          value={fmt(kpis?.total_complaints)}
          variant="primary"
          subtitle={kpis?.curr_fy}
        />
        <KpiCard
          label="YoY Growth"
          value={`${Math.abs(growth).toFixed(1)}%`}
          variant="secondary"
          subtitle={isUp ? "YoY Increase" : "YoY Decrease"}
          trend={{ direction: isUp ? "up" : "down", value: `${Math.abs(growth).toFixed(1)}%` }}
        />
        <KpiCard
          label="Open Complaints"
          value={fmt(kpis?.open_complaints)}
          variant="warning"
        />
        <KpiCard
          label="Zero Hour Claims"
          value={fmt(kpis?.zhc_count)}
          variant="info"
          subtitle={`Rate: ${safe(kpis?.zhc_rate).toFixed(1)}%`}
        />
      </div>

      {/* Row 1: YoY Trend (full width) */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <ChartContainer>
          {trends && (
            <Plot
              data={[
                {
                  x: (trends.yoy || []).map((d) => d.fy_year),
                  y: (trends.yoy || []).map((d) => safe(d.count)),
                  mode: "lines+markers+text",
                  name: "Complaints",
                  line: { color: PRIMARY_TEAL, width: 3, shape: "spline" },
                  marker: { size: 10, color: PRIMARY_TEAL, line: { color: "#ffffff", width: 2 } },
                  text: (trends.yoy || []).map((d) => safe(d.count)),
                  textposition: "top center",
                  textfont: { size: 11, color: DARK_TEAL, family: "Inter, sans-serif" },
                  fill: "tozeroy",
                  fillcolor: "rgba(33,152,138,0.1)",
                  hovertemplate: "<b>FY %{x}</b><br>Complaints: %{y}<extra></extra>",
                },
              ]}
              layout={{
                ...BASE_LAYOUT,
                title: { text: "10-Year Complaint Trend", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL },
                yaxis: { title: "", showticklabels: false, showgrid: false, zeroline: false },
                showlegend: false,
              }}
              config={PLOT_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "380px" }}
            />
          )}
        </ChartContainer>
      </div>

      {/* Row 2: Monthly + Quarterly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartContainer>
          {trends && (() => {
            const all = [...(trends.monthly || [])].sort((a, b) => safe(a.fy_month_idx) - safe(b.fy_month_idx));
            const currFy = trends.curr_fy;
            const prevFy = trends.prev_fy;
            const traces = [];

            if (prevFy) {
              const prev = all.filter((d) => d.fy_year === prevFy);
              traces.push({
                x: prev.map((d) => d.fy_month_name),
                y: prev.map((d) => safe(d.count)),
                mode: "lines",
                name: `FY ${prevFy}`,
                line: { color: LIGHT_GRAY, width: 2, shape: "spline" },
                fill: "tozeroy",
                fillcolor: "rgba(186,197,200,0.2)",
                hovertemplate: `<b>%{x} - FY ${prevFy}</b><br>Complaints: %{y}<extra></extra>`,
              });
            }

            if (currFy) {
              const curr = all.filter((d) => d.fy_year === currFy);
              const y = curr.map((d) => safe(d.count));
              traces.push({
                x: curr.map((d) => d.fy_month_name),
                y,
                mode: "lines+markers+text",
                name: `FY ${currFy}`,
                line: { color: PRIMARY_TEAL, width: 3, shape: "spline" },
                marker: { size: 9, color: PRIMARY_TEAL, line: { color: "#ffffff", width: 2 } },
                text: y,
                textposition: "top center",
                textfont: { size: 10, color: DARK_TEAL },
                hovertemplate: `<b>%{x} - FY ${currFy}</b><br>Complaints: %{y}<extra></extra>`,
              });
            }

            return (
              <Plot
                data={traces}
                layout={{
                  ...BASE_LAYOUT,
                  title: { text: "Monthly Comparison: Current vs Previous FY", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                  xaxis: { title: "", categoryorder: "array", categoryarray: MONTH_ORDER, showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL },
                  yaxis: { title: "", showticklabels: false, showgrid: false, zeroline: false },
                  legend: { orientation: "h", yanchor: "top", y: -0.15, xanchor: "center", x: 0.5, bgcolor: "rgba(255,255,255,0)", font: { color: DARK_TEAL, size: 11 } },
                }}
                config={PLOT_CONFIG}
                useResizeHandler
                style={{ width: "100%", height: "380px" }}
              />
            );
          })()}
        </ChartContainer>

        <ChartContainer>
          {trends && (() => {
            const all = trends.quarterly || [];
            const quartersOrder = ["Q1", "Q2", "Q3", "Q4"];
            const currFy = trends.curr_fy;
            const prevFy = trends.prev_fy;
            const traces = [];

            if (prevFy) {
              const prev = all.filter((d) => d.fy_year === prevFy);
              traces.push({
                x: prev.map((d) => d.quarter),
                y: prev.map((d) => safe(d.count)),
                mode: "lines",
                name: `FY ${prevFy}`,
                line: { color: LIGHT_GRAY, width: 2, shape: "spline" },
                fill: "tozeroy",
                fillcolor: "rgba(186,197,200,0.2)",
                hovertemplate: `<b>Q%{x} - FY ${prevFy}</b><br>Complaints: %{y}<extra></extra>`,
              });
            }

            if (currFy) {
              const curr = all.filter((d) => d.fy_year === currFy);
              const y = curr.map((d) => safe(d.count));
              traces.push({
                x: curr.map((d) => d.quarter),
                y,
                mode: "lines+markers+text",
                name: `FY ${currFy}`,
                line: { color: ACCENT_CORAL, width: 3, shape: "spline" },
                marker: { size: 10, color: ACCENT_CORAL, line: { color: "#ffffff", width: 2 } },
                text: y,
                textposition: "top center",
                textfont: { size: 10, color: DARK_TEAL },
                hovertemplate: `<b>Q%{x} - FY ${currFy}</b><br>Complaints: %{y}<extra></extra>`,
              });
            }

            return (
              <Plot
                data={traces}
                layout={{
                  ...BASE_LAYOUT,
                  title: { text: "Quarterly: Current vs Previous FY", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                  xaxis: { title: "", categoryorder: "array", categoryarray: quartersOrder, showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL },
                  yaxis: { title: "", showticklabels: false, showgrid: false, zeroline: false },
                  legend: { orientation: "h", yanchor: "top", y: -0.15, xanchor: "center", x: 0.5, bgcolor: "rgba(255,255,255,0)", font: { color: DARK_TEAL, size: 11 } },
                }}
                config={PLOT_CONFIG}
                useResizeHandler
                style={{ width: "100%", height: "380px" }}
              />
            );
          })()}
        </ChartContainer>
      </div>

      {/* Row 3: Single-Stage + Dual-Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartContainer>
          {trends && (() => {
            const data = trends.single_stage || [];
            return (
              <Plot
                data={[
                  {
                    x: data.map((d) => d.model),
                    y: data.map((d) => safe(d.count)),
                    text: data.map((d) => safe(d.count)),
                    textposition: "outside",
                    textfont: { size: 11, color: DARK_TEAL },
                    type: "bar",
                    marker: { color: PRIMARY_TEAL, line: { color: "#1a7a6e", width: 1.5 } },
                    hovertemplate: "<b>%{x}</b><br>Complaints: %{y}<extra></extra>",
                    name: "Single-Stage Models",
                  },
                ]}
                layout={{
                  ...BASE_LAYOUT,
                  title: { text: "Single-Stage Models", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                  xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL },
                  yaxis: { title: "", showticklabels: false, showgrid: false, zeroline: false },
                  showlegend: false,
                }}
                config={PLOT_CONFIG}
                useResizeHandler
                style={{ width: "100%", height: "380px" }}
              />
            );
          })()}
        </ChartContainer>

        <ChartContainer>
          {trends && (() => {
            const data = trends.dual_stage || [];
            return (
              <Plot
                data={[
                  {
                    x: data.map((d) => d.model),
                    y: data.map((d) => safe(d.count)),
                    text: data.map((d) => safe(d.count)),
                    textposition: "outside",
                    textfont: { size: 11, color: DARK_TEAL },
                    type: "bar",
                    marker: { color: ACCENT_CORAL, line: { color: "#a86849", width: 1.5 } },
                    hovertemplate: "<b>%{x}</b><br>Complaints: %{y}<extra></extra>",
                    name: "Dual-Stage Models",
                  },
                ]}
                layout={{
                  ...BASE_LAYOUT,
                  title: { text: "Dual-Stage Models", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
                  xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: DARK_TEAL },
                  yaxis: { title: "", showticklabels: false, showgrid: false, zeroline: false },
                  showlegend: false,
                }}
                config={PLOT_CONFIG}
                useResizeHandler
                style={{ width: "100%", height: "380px" }}
              />
            );
          })()}
        </ChartContainer>
      </div>
    </>
  );
}
