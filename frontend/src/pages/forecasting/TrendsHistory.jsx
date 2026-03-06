import React, { useState, useEffect, useCallback } from "react";
import Plot from "react-plotly.js";
import { getTotalComplaints, getCuratedPlots, getInsights } from "../../services/forecastApi";
import { COLORS, baseLayout } from "../../components/forecasting/plotlyTheme";
import HeroPlot from "../../components/forecasting/HeroPlot";
import SupportingPlots from "../../components/forecasting/SupportingPlots";
import NarrativeBanner from "../../components/forecasting/NarrativeBanner";
import Lightbox from "../../components/forecasting/Lightbox";

const RANK_STYLES = {
  1: "bg-yellow-50 text-yellow-800 font-bold",
  2: "bg-gray-50 text-gray-600 font-semibold",
  3: "bg-amber-50 text-amber-700 font-semibold",
};

const RANK_BADGE = {
  1: "bg-yellow-400 text-yellow-900",
  2: "bg-gray-300 text-gray-700",
  3: "bg-amber-600 text-white",
};

const FORECAST_METHODS = [
  { key: "Holt-Winters", label: "Holt-Winters" },
  { key: "SARIMA", label: "SARIMA" },
  { key: "Prophet", label: "Prophet" },
  { key: "LightGBM", label: "LightGBM" },
  { key: "Ensemble (Top-3)", label: "Combined Best" },
];

export default function TrendsHistory() {
  const [totalComplaints, setTotalComplaints] = useState(null);
  const [curatedPlots, setCuratedPlots] = useState(null);
  const [insights, setInsights] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [lightboxCaption, setLightboxCaption] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tc, cp, ins] = await Promise.all([
          getTotalComplaints(),
          getCuratedPlots(),
          getInsights(),
        ]);
        if (cancelled) return;
        setTotalComplaints(tc);
        setCuratedPlots(cp);
        setInsights(ins);
      } catch (err) {
        console.error("TrendsHistory fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const openLightbox = useCallback((url, caption) => {
    setLightboxUrl(url);
    setLightboxCaption(caption || "");
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxUrl(null);
    setLightboxCaption("");
  }, []);

  const totalInsight = insights?.total;
  const bulletEntries = totalInsight
    ? Object.entries(totalInsight)
        .filter(([k]) => k !== "headline")
        .map(([, v]) => v)
    : [];

  const actuals = totalComplaints?.actuals || [];
  const comparison = totalComplaints?.comparison || [];
  const forecast = totalComplaints?.forecast || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--primary-teal)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading trend data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Trends &amp; Historical Analysis
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Long-term complaint patterns and forecast methodology performance
        </p>
      </div>

      {/* ── Narrative Banner ── */}
      <NarrativeBanner
        headline={totalInsight?.headline}
        bullets={bulletEntries}
      />

      {/* ── Hero Plot ── */}
      <HeroPlot
        category="total_complaints_forecast"
        curatedPlots={curatedPlots}
        openLightbox={openLightbox}
      />

      {/* ── Two-column: Bar chart + Comparison table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left – Grouped bar chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">
            Recent Actuals vs Predictions
          </h2>
          {actuals.length > 0 ? (
            <Plot
              data={[
                {
                  x: actuals.map((r) => r.Month),
                  y: actuals.map((r) => r.Actual),
                  name: "Actual",
                  type: "bar",
                  marker: { color: COLORS.emerald, cornerradius: 4 },
                },
                {
                  x: actuals.map((r) => r.Month),
                  y: actuals.map((r) => r["Ensemble (Top-3)"] ?? r.Predicted),
                  name: "Predicted (Ensemble)",
                  type: "bar",
                  marker: { color: COLORS.primary, opacity: 0.7, cornerradius: 4 },
                },
              ]}
              layout={baseLayout({
                barmode: "group",
                title: false,
                margin: { l: 45, r: 10, t: 10, b: 60 },
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
                  title: { text: "Complaints", font: { size: 11, color: COLORS.textMuted } },
                },
              })}
              config={{ displayModeBar: false, responsive: true }}
              useResizeHandler
              className="w-full"
              style={{ width: "100%", height: 320 }}
            />
          ) : (
            <p className="text-xs text-gray-400 py-10 text-center">No actuals data available</p>
          )}
        </div>

        {/* Right – Comparison / ranking table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">
            Forecast Method Performance
          </h2>
          {comparison.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-[var(--text-muted)]">
                    <th className="py-2 pr-3 text-left font-semibold text-xs">Rank</th>
                    <th className="py-2 pr-3 text-left font-semibold text-xs">Method</th>
                    <th className="py-2 text-right font-semibold text-xs">Avg Error</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => {
                    const rank = i + 1;
                    const rowCls = RANK_STYLES[rank] || "";
                    const badgeCls = RANK_BADGE[rank] || "bg-gray-100 text-gray-500";
                    return (
                      <tr key={i} className={`border-b border-gray-50 ${rowCls}`}>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${badgeCls}`}>
                            {rank}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">{row.Model}</td>
                        <td className="py-2.5 text-right font-mono text-xs">
                          {Number(row["Test MAE"]).toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-10 text-center">No comparison data available</p>
          )}
        </div>
      </div>

      {/* ── 3-Month Forward Predictions ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">
          3-Month Forward Predictions (All Methods)
        </h2>
        {forecast.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-[var(--text-muted)]">
                  <th className="py-2 pr-4 text-left font-semibold text-xs">Month</th>
                  {FORECAST_METHODS.map((m) => (
                    <th
                      key={m.key}
                      className={`py-2 text-right font-semibold text-xs ${
                        m.key === "Ensemble (Top-3)"
                          ? "text-[var(--primary-teal)]"
                          : ""
                      }`}
                    >
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="py-2.5 pr-4 font-medium">{row.Month}</td>
                    {FORECAST_METHODS.map((m) => {
                      const isCombined = m.key === "Ensemble (Top-3)";
                      return (
                        <td
                          key={m.key}
                          className={`py-2.5 text-right font-mono text-xs ${
                            isCombined
                              ? "font-bold text-[var(--primary-teal)] bg-[var(--primary-teal-light)]"
                              : ""
                          }`}
                        >
                          {row[m.key] != null ? Math.round(row[m.key]).toLocaleString() : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-10 text-center">No forecast data available</p>
        )}
      </div>

      {/* ── Detailed Analysis Charts ── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Detailed Analysis Charts
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <SupportingPlots
        category="total_complaints_forecast"
        curatedPlots={curatedPlots}
        openLightbox={openLightbox}
      />

      {/* ── Lightbox ── */}
      <Lightbox url={lightboxUrl} caption={lightboxCaption} onClose={closeLightbox} />
    </div>
  );
}
