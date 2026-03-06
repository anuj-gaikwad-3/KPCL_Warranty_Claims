import React, { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FiscalYearContext } from "../context/FiscalYearContext";
import { getComplaintsData } from "../services/dashboardApi";
import DashboardHeader from "../components/layout/DashboardHeader";
import KpiCard from "../components/dashboard/KpiCard";
import ChartContainer from "../components/dashboard/ChartContainer";

const PRIMARY_TEAL = "#21988a";
const ACCENT_CORAL = "#c37c5c";
const DARK_TEAL = "#044c44";

const BASE_LAYOUT = {
  font: { family: "Inter, sans-serif", size: 12, color: PRIMARY_TEAL },
  paper_bgcolor: "#ffffff",
  plot_bgcolor: "#ffffff",
  margin: { l: 30, r: 30, t: 60, b: 80 },
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

const STAGE_COLORS = {
  "Single Stage": PRIMARY_TEAL,
  "Dual Stage": ACCENT_CORAL,
};

export default function Complaints() {
  const { selectedFy } = useContext(FiscalYearContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedFy) return;
    let cancelled = false;
    getComplaintsData(selectedFy).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedFy]);

  const kpis = data?.kpis;
  const charts = data?.charts;

  const topDealer = [...(charts?.dealer || [])]
    .sort((a, b) => safe(b.count) - safe(a.count))
    .slice(0, 7);

  const topCustomer = [...(charts?.customer || [])]
    .sort((a, b) => safe(b.count) - safe(a.count))
    .slice(0, 7);

  const appSorted = [...(charts?.app_stage || [])]
    .sort((a, b) => safe(b.count) - safe(a.count))
    .slice(0, 7);

  const issueSorted = [...(charts?.issue_stage || [])]
    .sort((a, b) => safe(b.count) - safe(a.count))
    .slice(0, 7);

  function stackedTraces(rows, xKey, isHorizontal = false) {
    const stages = Array.from(new Set(rows.map((d) => d.model_stage || "Unknown")));
    return stages.map((stage) => {
      const subset = rows.filter((d) => d.model_stage === stage);
      const base = {
        name: stage,
        type: "bar",
        text: subset.map((d) => safe(d.count)),
        textposition: "inside",
        textfont: { size: 10, color: "#ffffff" },
        marker: { color: STAGE_COLORS[stage] || PRIMARY_TEAL, line: { width: 1 } },
      };

      if (isHorizontal) {
        return {
          ...base,
          y: subset.map((d) => d[xKey]),
          x: subset.map((d) => safe(d.count)),
          orientation: "h",
          hovertemplate: `<b>%{y}</b><br>${stage}: %{x}<extra></extra>`,
        };
      }
      return {
        ...base,
        x: subset.map((d) => d[xKey]),
        y: subset.map((d) => safe(d.count)),
        hovertemplate: `<b>%{x}</b><br>${stage}: %{y}<extra></extra>`,
      };
    });
  }

  return (
    <>
      <DashboardHeader
        title="Complaints Analysis"
        subtitle="Dealer, Customer & Issue Breakdown"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard label="Unique Dealers" value={fmt(kpis?.unique_dealers)} variant="primary" />
        <KpiCard label="Unique Customers" value={fmt(kpis?.unique_customers)} variant="secondary" />
        <KpiCard label="Top Segment" value={kpis?.top_segment || "N/A"} variant="info" />
        <KpiCard
          label="Avg Complaints / Dealer"
          value={safe(kpis?.avg_complaints_per_dealer).toFixed(1)}
          variant="warning"
        />
      </div>

      {/* Row 1: Dealer + Customer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartContainer>
          <Plot
            data={[
              {
                x: topDealer.map((d) => d.dealer_name),
                y: topDealer.map((d) => safe(d.count)),
                text: topDealer.map((d) => safe(d.count)),
                textposition: "outside",
                textfont: { size: 11, color: DARK_TEAL },
                type: "bar",
                marker: { color: PRIMARY_TEAL, line: { color: "#1a7a6e", width: 1.5 } },
                hovertemplate: "<b>%{x}</b><br>Complaints: %{y}<extra></extra>",
                name: "Dealer",
              },
            ]}
            layout={{
              ...BASE_LAYOUT,
              title: { text: "Complaints by Dealer", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
              xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: PRIMARY_TEAL },
              yaxis: { title: "", showticklabels: false, showgrid: false, zeroline: false },
              showlegend: false,
            }}
            config={PLOT_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: "380px" }}
          />
        </ChartContainer>

        <ChartContainer>
          <Plot
            data={[
              {
                x: topCustomer.map((d) => d.customer_name),
                y: topCustomer.map((d) => safe(d.count)),
                text: topCustomer.map((d) => safe(d.count)),
                textposition: "outside",
                textfont: { size: 11, color: DARK_TEAL },
                type: "bar",
                marker: { color: ACCENT_CORAL, line: { color: "#a86849", width: 1.5 } },
                hovertemplate: "<b>%{x}</b><br>Complaints: %{y}<extra></extra>",
                name: "Customer",
              },
            ]}
            layout={{
              ...BASE_LAYOUT,
              title: { text: "Complaints by Customer", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
              xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: PRIMARY_TEAL },
              yaxis: { title: "", showticklabels: false, showgrid: false, zeroline: false },
              showlegend: false,
            }}
            config={PLOT_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: "380px" }}
          />
        </ChartContainer>
      </div>

      {/* Row 2: App vs Stage + Issue Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartContainer>
          <Plot
            data={stackedTraces(appSorted, "application_market_segment")}
            layout={{
              ...BASE_LAYOUT,
              title: { text: "Application vs Model Stage", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
              barmode: "stack",
              xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: PRIMARY_TEAL },
              yaxis: { title: "", showticklabels: false, showgrid: false, zeroline: false },
              legend: {
                orientation: "h",
                yanchor: "top",
                y: -0.15,
                xanchor: "center",
                x: 0.5,
                bgcolor: "rgba(255,255,255,0)",
                font: { color: PRIMARY_TEAL, size: 11 },
              },
            }}
            config={PLOT_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: "380px" }}
          />
        </ChartContainer>

        <ChartContainer>
          <Plot
            data={stackedTraces(issueSorted, "nature_of_complaint", true)}
            layout={{
              ...BASE_LAYOUT,
              margin: { ...BASE_LAYOUT.margin, l: 150 },
              title: { text: "Issue Frequency by Stage", font: { size: 16, color: DARK_TEAL, family: "Inter, sans-serif" } },
              barmode: "stack",
              xaxis: { title: "", showgrid: false, linecolor: "#e0e7e8", color: PRIMARY_TEAL },
              yaxis: { title: "", showgrid: false, zeroline: false, automargin: true, color: PRIMARY_TEAL },
              legend: {
                orientation: "h",
                yanchor: "top",
                y: -0.15,
                xanchor: "center",
                x: 0.5,
                bgcolor: "rgba(255,255,255,0)",
                font: { color: PRIMARY_TEAL, size: 11 },
              },
            }}
            config={PLOT_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: "380px" }}
          />
        </ChartContainer>
      </div>
    </>
  );
}
