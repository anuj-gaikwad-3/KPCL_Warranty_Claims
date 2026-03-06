import React, { useEffect, useState, useCallback } from "react";
import Plot from "react-plotly.js";
import {
  getModelWise,
  getModelWiseValidation,
  getCuratedPlots,
  getInsights,
} from "../../services/forecastApi";
import { COLORS, baseLayout, monthLabel } from "../../components/forecasting/plotlyTheme";
import HeroPlot from "../../components/forecasting/HeroPlot";
import SupportingPlots from "../../components/forecasting/SupportingPlots";
import NarrativeBanner from "../../components/forecasting/NarrativeBanner";
import Lightbox from "../../components/forecasting/Lightbox";

const PLOT_CFG = { displayModeBar: false, responsive: true };

export default function ModelRiskWatch() {
  const [month, setMonth] = useState("");
  const [months, setMonths] = useState([]);
  const [modelWise, setModelWise] = useState(null);
  const [modelValidation, setModelValidation] = useState(null);
  const [curatedPlots, setCuratedPlots] = useState(null);
  const [insights, setInsights] = useState(null);
  const [lightbox, setLightbox] = useState({ url: null, caption: null });

  const openLightbox = useCallback(
    (url, caption) => setLightbox({ url, caption }),
    []
  );
  const closeLightbox = useCallback(
    () => setLightbox({ url: null, caption: null }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getModelWise(),
      getModelWiseValidation(),
      getCuratedPlots(),
      getInsights(),
    ]).then(([mw, mv, cp, ins]) => {
      if (cancelled) return;
      setModelWise(mw);
      setModelValidation(mv);
      setCuratedPlots(cp);
      setInsights(ins);
      const avail = mw?.available_months || [];
      setMonths(avail);
      if (avail.length) setMonth(avail[0]);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    getModelWise(null, month).then((mw) => {
      if (!cancelled) setModelWise(mw);
    });
    return () => { cancelled = true; };
  }, [month]);

  const rows = (modelWise?.forecasts || [])
    .filter((d) => !month || d["Complaint Date"] === month)
    .sort((a, b) => (b.predicted_complaints ?? 0) - (a.predicted_complaints ?? 0));

  const valRows = modelValidation?.summary || [];

  const insightModels = insights?.models || {};
  const headline = insightModels.headline || "Loading model insights…";
  const bullets = Object.entries(insightModels)
    .filter(([k]) => k !== "headline")
    .map(([, v]) => v);

  return (
    <>
      <Lightbox url={lightbox.url} caption={lightbox.caption} onClose={closeLightbox} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Model Risk Watch
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Per-model forecasts with confidence intervals and validation metrics
          </p>
        </div>
        {months.length > 0 && (
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]/30"
          >
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        )}
      </div>

      {/* Narrative */}
      <NarrativeBanner headline={headline} bullets={bullets} />

      {/* Hero plot */}
      <div className="mb-6">
        <HeroPlot
          category="model_wise"
          curatedPlots={curatedPlots}
          openLightbox={openLightbox}
        />
      </div>

      {/* Expected Claims bar chart */}
      <div className="chart-container bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <Plot
          data={[
            {
              x: rows.map((d) => d.Model_masked),
              y: rows.map((d) => d.p90 ?? 0),
              type: "bar",
              name: "Worst Case",
              marker: { color: COLORS.amberDim },
              hovertemplate: "<b>%{x}</b><br>Worst Case: %{y}<extra></extra>",
            },
            {
              x: rows.map((d) => d.Model_masked),
              y: rows.map((d) => d.predicted_complaints ?? 0),
              type: "bar",
              name: "Expected",
              marker: { color: COLORS.primary },
              hovertemplate: "<b>%{x}</b><br>Expected: %{y}<extra></extra>",
            },
            {
              x: rows.map((d) => d.Model_masked),
              y: rows.map((d) => d.p10 ?? 0),
              type: "bar",
              name: "Best Case",
              marker: { color: "#2ca58d" },
              hovertemplate: "<b>%{x}</b><br>Best Case: %{y}<extra></extra>",
            },
          ]}
          layout={baseLayout({
            title: {
              text: "Expected Claims by Model",
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

      {/* Two side-by-side tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Forecast Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Model Forecast Details
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-left text-[var(--text-muted)]">
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium text-right">Best Case</th>
                  <th className="px-4 py-2 font-medium text-right">Expected</th>
                  <th className="px-4 py-2 font-medium text-right">Worst Case</th>
                  <th className="px-4 py-2 font-medium text-right">Confidence Range</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => {
                  const range = (d.p90 ?? 0) - (d.p10 ?? 0);
                  return (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-medium text-[var(--text-primary)]">
                        {d.Model_masked}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-600">
                        {(d.predicted_p10 ?? d.p10 ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-[var(--primary-teal)]">
                        {(d.predicted_complaints ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-amber-600">
                        {(d.predicted_p90 ?? d.p90 ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-[var(--text-muted)]">
                        ±{Math.round(range / 2).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forecast Reliability */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Forecast Reliability
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-left text-[var(--text-muted)]">
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium text-right">Actual Claims</th>
                  <th className="px-4 py-2 font-medium text-right">Predicted</th>
                  <th className="px-4 py-2 font-medium text-center">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {valRows.map((d, i) => {
                  const accuracy = 100 - (d.mae ?? 0) * 10;
                  const level =
                    accuracy >= 80 ? "High" : accuracy >= 60 ? "Medium" : "Low";
                  const badge =
                    level === "High"
                      ? "bg-emerald-50 text-emerald-700"
                      : level === "Medium"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700";
                  return (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-medium text-[var(--text-primary)]">
                        {d.Model_masked || d.model}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {(d.total_actual ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {(d.total_predicted ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge}`}>
                          {level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!valRows.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      No validation data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section divider + Supporting plots */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Detailed Analysis
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <SupportingPlots
        category="model_wise"
        curatedPlots={curatedPlots}
        openLightbox={openLightbox}
      />
    </>
  );
}
