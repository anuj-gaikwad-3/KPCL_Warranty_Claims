/**
 * Forecasting dashboard (static bundle)
 * Uses backend JSON APIs under /api/v1/forecast/*
 */

document.addEventListener("DOMContentLoaded", () => {
  const state = {
    overview: null,
    totalComplaints: null,
    modelWise: null,
    modelValidation: null,
    complaintTypes: null,
    typeValidation: null,
    costData: null,
    insights: null,
    activeTab: "summary",
    charts: {},
    rendered: {},
  };

  const API = {
    overview: "/api/v1/forecast/overview",
    totalComplaints: "/api/v1/forecast/total_complaints",
    modelWise: "/api/v1/forecast/model_wise",
    modelValidation: "/api/v1/forecast/model_wise/validation",
    complaintTypes: "/api/v1/forecast/complaint_types",
    typeValidation: "/api/v1/forecast/complaint_types/validation",
    costData: "/api/v1/forecast/complaint_types/costs",
    insights: "/api/v1/forecast/insights",
    data: {
      decomposition: "/api/v1/forecast/data/decomposition",
      featureImportance: "/api/v1/forecast/data/feature_importance",
      heatmap: "/api/v1/forecast/data/heatmap",
      complaintTypes: "/api/v1/forecast/data/complaint_types",
      costAnalysis: "/api/v1/forecast/data/cost_analysis",
      typeDistribution: "/api/v1/forecast/data/type_distribution",
      typeShares: "/api/v1/forecast/data/type_shares",
      scatter: "/api/v1/forecast/data/scatter",
      modelWiseHistory: "/api/v1/forecast/data/model_wise_history",
      unifiedHistory: "/api/v1/forecast/data/unified_history",
    },
  };

  const COLORS = {
    primary: "#1a7a6d",
    primaryDim: "rgba(26, 122, 109, 0.15)",
    emerald: "#1a7a6d",
    emeraldDim: "rgba(26, 122, 109, 0.12)",
    amber: "#e07c3a",
    amberDim: "rgba(224, 124, 58, 0.15)",
    rose: "#d94f4f",
    violet: "#5a5fc7",
    sky: "#3a8fc7",
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
    "#c7553a",
    "#3ac78f",
    "#c73a9f",
    "#3a5fc7",
    "#c7a33a",
  ];

  async function init() {
    try {
      await fetchAllData();
      setupNavigation();
      renderSummary();
    } catch (err) {
      console.error("Init failed:", err);
    } finally {
      hideLoader();
    }
  }

  async function fetchAllData() {
    const endpoints = {
      overview: API.overview,
      totalComplaints: API.totalComplaints,
      modelWise: API.modelWise,
      modelValidation: API.modelValidation,
      complaintTypes: API.complaintTypes,
      typeValidation: API.typeValidation,
      costData: API.costData,
      insights: API.insights,
    };

    const results = await Promise.all(
      Object.entries(endpoints).map(async ([key, url]) => {
        try {
          const r = await fetch(url);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return [key, await r.json()];
        } catch (e) {
          console.warn(`Failed: ${key}`, e);
          return [key, null];
        }
      }),
    );
    results.forEach(([k, v]) => {
      state[k] = v;
    });
  }

  function hideLoader() {
    setTimeout(() => {
      const el = document.getElementById("loading-overlay");
      if (el) el.classList.add("hidden");
    }, 350);
  }

  function setupNavigation() {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        const tab = link.dataset.tab;
        if (tab === state.activeTab) return;

        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        document
          .querySelectorAll(".tab-panel")
          .forEach((p) => p.classList.remove("active"));

        const panel = document.getElementById(`tab-${tab}`);
        if (panel) panel.classList.add("active");
        state.activeTab = tab;

        setTimeout(() => {
          switch (tab) {
            case "summary":
              renderSummary();
              break;
            case "costs":
              renderCosts();
              break;
            case "models":
              renderModels();
              break;
            case "parts":
              renderParts();
              break;
            case "trends":
              renderTrends();
              break;
          }
        }, 50);
      });
    });
  }

  function baseOpts(overrides = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 600, easing: "easeOutQuart" },
      plugins: {
        legend: {
          display: !!overrides.showLegend,
          position: overrides.legendPos || "top",
          labels: {
            color: "#1a1a2e",
            font: { family: "Inter", size: 11, weight: "500" },
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 8,
            boxWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: "#1a1a2e",
          titleColor: "#fff",
          bodyColor: "#cdd5de",
          borderColor: COLORS.border,
          borderWidth: 1,
          cornerRadius: 6,
          padding: 10,
          titleFont: { family: "Inter", weight: "700", size: 12 },
          bodyFont: { family: "Inter", size: 11 },
          usePointStyle: true,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: COLORS.textMuted,
            font: { family: "Inter", size: 10 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 20,
          },
          border: { color: COLORS.border },
        },
        y: {
          grid: { color: "#eef0f3" },
          ticks: { color: COLORS.textMuted, font: { family: "Inter", size: 10 } },
          border: { display: false },
        },
      },
    };
  }

  function hBarOpts(overrides = {}) {
    const o = baseOpts(overrides);
    o.indexAxis = "y";
    o.scales.x = {
      grid: { color: "#eef0f3" },
      ticks: { color: COLORS.textMuted, font: { family: "Inter", size: 10 } },
      border: { display: false },
    };
    o.scales.y = {
      grid: { display: false },
      ticks: {
        color: "#1a1a2e",
        font: { family: "Inter", size: 10, weight: "500" },
        autoSkip: false,
      },
      border: { color: COLORS.border },
    };
    return o;
  }

  function destroyChart(key) {
    if (state.charts[key]) {
      state.charts[key].destroy();
      state.charts[key] = null;
    }
  }

  function formatINR(val) {
    const n = Number(val || 0);
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
    if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "K";
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  function monthLabel(s) {
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime()))
        return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch (_) {}
    return String(s).substring(0, 10);
  }

  // =========================================================
  // Summary
  // =========================================================
  function renderSummary() {
    const o = state.overview;
    const cost = state.costData;
    const ct = state.complaintTypes;
    if (!o) return;

    const totalCost = cost ? cost.total_estimated_cost : 0;
    const elCost = document.getElementById("kpi-total-cost");
    if (elCost) elCost.textContent = formatINR(totalCost);

    const months = o.forecast_months || [];
    const elPeriod = document.getElementById("kpi-cost-period");
    if (elPeriod && months.length) {
      elPeriod.textContent = monthLabel(months[0]) + " – " + monthLabel(months[months.length - 1]);
    }

    const elModels = document.getElementById("kpi-models-count");
    if (elModels) elModels.textContent = o.total_models_tracked ?? "--";

    const elClaims = document.getElementById("kpi-expected-claims");
    if (elClaims) elClaims.textContent = Math.round(o.three_month_total ?? 0).toLocaleString("en-IN");

    const trendBadge = document.getElementById("kpi-trend-badge");
    const trendArrow = document.getElementById("kpi-trend-arrow");
    const trendVal = document.getElementById("kpi-trend-value");
    const mc = Number(o.mom_change || 0);
    if (trendBadge && trendArrow && trendVal) {
      if (mc > 0) {
        trendBadge.className = "kpi-trend up";
        trendArrow.textContent = "↑";
        trendVal.textContent = "+" + mc.toFixed(1) + "%";
      } else if (mc < 0) {
        trendBadge.className = "kpi-trend down";
        trendArrow.textContent = "↓";
        trendVal.textContent = mc.toFixed(1) + "%";
      } else {
        trendBadge.className = "kpi-trend neutral";
        trendArrow.textContent = "→";
        trendVal.textContent = "0%";
      }
    }

    const elRiskModel = document.getElementById("kpi-risk-model");
    const elRiskValue = document.getElementById("kpi-risk-value");
    if (elRiskModel) elRiskModel.textContent = o.top_model ?? "--";
    if (elRiskValue) elRiskValue.textContent = (o.top_model_value ?? 0).toLocaleString("en-IN");

    if (ct && ct.aggregated && ct.aggregated.length) {
      const topType = ct.aggregated[0];
      const elTop = document.getElementById("kpi-top-issue");
      if (elTop) elTop.textContent = topType.Complaint_Type ?? "--";
      const totalP50 = ct.aggregated.reduce((s, r) => s + (r.total_p50 || 0), 0);
      const pct = totalP50 > 0 ? Math.round((topType.total_p50 / totalP50) * 100) : 0;
      const elPct = document.getElementById("kpi-top-issue-pct");
      if (elPct) elPct.textContent = String(pct);
    }

    renderSummaryTrendChart();
    renderSummaryCostChart();
    renderActionTable();
  }

  function renderSummaryTrendChart() {
    const d = state.totalComplaints;
    if (!d) return;
    destroyChart("summaryTrend");
    const ctx = document.getElementById("summaryTrendChart")?.getContext("2d");
    if (!ctx) return;

    const actuals = d.actuals || [];
    const forecasts = d.forecast || [];
    const labels = [...actuals.map((r) => r.Month), ...forecasts.map((r) => r.Month)];
    const actualVals = actuals.map((r) => r.Actual);
    const forecastVals = forecasts.map((r) => r["Ensemble (Top-3)"]);

    const fullActual = [...actualVals, ...new Array(forecasts.length).fill(null)];
    const fullForecast = [
      ...new Array(Math.max(actuals.length - 1, 0)).fill(null),
      actuals.length ? actualVals[actualVals.length - 1] : null,
      ...forecastVals,
    ];

    state.charts.summaryTrend = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Actual Claims",
            data: fullActual,
            borderColor: COLORS.emerald,
            backgroundColor: COLORS.emeraldDim,
            borderWidth: 2.5,
            pointRadius: 3,
            fill: true,
            tension: 0.3,
          },
          {
            label: "Forecast",
            data: fullForecast,
            borderColor: COLORS.amber,
            backgroundColor: COLORS.amberDim,
            borderWidth: 2.5,
            pointRadius: 4,
            borderDash: [6, 4],
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: baseOpts({ showLegend: true }),
    });
  }

  function renderSummaryCostChart() {
    const cost = state.costData;
    if (!cost || !cost.cost_summary || !cost.cost_summary.length) return;
    destroyChart("summaryCost");

    const ctx = document.getElementById("summaryCostChart")?.getContext("2d");
    if (!ctx) return;
    const data = cost.cost_summary.slice().sort((a, b) => (b.cost_p50 || 0) - (a.cost_p50 || 0));

    const opts = hBarOpts();
    opts.plugins.tooltip = {
      ...opts.plugins.tooltip,
      callbacks: { label: (c) => formatINR(c.raw) },
    };
    opts.scales.x.ticks = { ...opts.scales.x.ticks, callback: (v) => formatINR(v) };

    state.charts.summaryCost = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((r) => r.Complaint_Type),
        datasets: [
          {
            label: "Expected Cost",
            data: data.map((r) => r.cost_p50),
            backgroundColor: data.map((_, i) => PALETTE[i % PALETTE.length]),
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: opts,
    });
  }

  function renderActionTable() {
    const ct = state.complaintTypes;
    if (!ct || !ct.raw) return;

    const rows = ct.raw
      .filter((r) => (r.Forecast_p50 || 0) > 0)
      .sort((a, b) => (b.Est_Cost_p50 || 0) - (a.Est_Cost_p50 || 0))
      .slice(0, 15);

    const tbody = document.querySelector("#action-table tbody");
    if (!tbody) return;
    tbody.innerHTML = rows
      .map((r, i) => {
        const priority = i < 3 ? "high" : i < 8 ? "medium" : "low";
        const priorityLabel = i < 3 ? "High" : i < 8 ? "Medium" : "Low";
        return `<tr>
          <td><span class="priority-badge priority-${priority}">${priorityLabel}</span></td>
          <td style="font-weight:600">${r.Model || "—"}</td>
          <td>${r.Complaint_Type || "—"}</td>
          <td>${r.Predicted_Part || "—"}</td>
          <td>${r.Est_Cost_p50 ? formatINR(r.Est_Cost_p50) : "—"}</td>
          <td class="cell-highlight">${(r.Forecast_p50 || 0).toLocaleString("en-IN")}</td>
        </tr>`;
      })
      .join("");

    const countEl = document.getElementById("action-count");
    if (countEl) countEl.textContent = `${rows.length} items`;
  }

  // =========================================================
  // Costs
  // =========================================================
  function renderCosts() {
    const cost = state.costData;
    if (!cost) return;

    if (!state.rendered.costsFilter) {
      const filter = document.getElementById("cost-month-filter");
      if (filter) {
        const months = cost.available_months || [];
        filter.innerHTML =
          '<option value="all">All Months</option>' +
          months.map((m) => `<option value="${m}">${monthLabel(m)}</option>`).join("");
        filter.addEventListener("change", () => renderCostsForMonth(filter.value));
        state.rendered.costsFilter = true;
      }
    }
    renderCostsForMonth(document.getElementById("cost-month-filter")?.value || "all");
  }

  function renderCostsForMonth(month) {
    const cost = state.costData;
    if (!cost) return;

    let raw = cost.raw || [];
    if (month !== "all") raw = raw.filter((r) => r.Date === month);

    const totalP50 = raw.reduce((s, r) => s + (r.Est_Cost_p50 || 0), 0);
    const totalP10 = raw.reduce((s, r) => s + (r.Est_Cost_p10 || 0), 0);
    const totalP90 = raw.reduce((s, r) => s + (r.Est_Cost_p90 || 0), 0);

    const el1 = document.getElementById("cost-total");
    const el2 = document.getElementById("cost-best-case");
    const el3 = document.getElementById("cost-worst-case");
    if (el1) el1.textContent = formatINR(totalP50);
    if (el2) el2.textContent = formatINR(totalP10);
    if (el3) el3.textContent = formatINR(totalP90);

    // by type
    const byType = {};
    raw.forEach((r) => {
      const t = r.Complaint_Type || "Unknown";
      if (!byType[t]) byType[t] = { p50: 0, p90: 0 };
      byType[t].p50 += r.Est_Cost_p50 || 0;
      byType[t].p90 += r.Est_Cost_p90 || 0;
    });
    const sortedTypes = Object.entries(byType).sort((a, b) => b[1].p50 - a[1].p50);

    destroyChart("costByType");
    const ctx1 = document.getElementById("costByTypeChart")?.getContext("2d");
    if (ctx1) {
      state.charts.costByType = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: sortedTypes.map(([k]) => k),
          datasets: [
            {
              label: "Expected Cost",
              data: sortedTypes.map(([, v]) => v.p50),
              backgroundColor: COLORS.primary,
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: "Worst Case",
              data: sortedTypes.map(([, v]) => v.p90),
              backgroundColor: COLORS.amberDim,
              borderColor: COLORS.amber,
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false,
            },
          ],
        },
        options: baseOpts({ showLegend: true }),
      });
    }

    // by model
    const byModel = {};
    raw.forEach((r) => {
      const m = r.Model || "Unknown";
      byModel[m] = (byModel[m] || 0) + (r.Est_Cost_p50 || 0);
    });
    const sortedModels = Object.entries(byModel)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    destroyChart("costByModel");
    const ctx2 = document.getElementById("costByModelChart")?.getContext("2d");
    if (ctx2) {
      const opts2 = hBarOpts();
      opts2.scales.x.ticks = { ...opts2.scales.x.ticks, callback: (v) => formatINR(v) };
      state.charts.costByModel = new Chart(ctx2, {
        type: "bar",
        data: {
          labels: sortedModels.map(([k]) => k),
          datasets: [
            {
              label: "Expected Cost",
              data: sortedModels.map(([, v]) => v),
              backgroundColor: sortedModels.map((_, i) => PALETTE[i % PALETTE.length]),
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: opts2,
      });
    }

    // table
    const costSummary = cost.cost_summary || [];
    const tbody = document.querySelector("#cost-detail-table tbody");
    if (tbody) {
      tbody.innerHTML = costSummary
        .map(
          (r) => `<tr>
          <td style="font-weight:600">${r.Complaint_Type || "—"}</td>
          <td>${r.Predicted_Part || "—"}</td>
          <td>${formatINR(r.unit_cost || r.avg_cost_per_complaint || 0)}</td>
          <td class="cell-highlight">${(r.total_p50 || 0).toLocaleString("en-IN")}</td>
          <td style="font-weight:700; color: var(--clr-primary)">${formatINR(r.cost_p50 || 0)}</td>
          <td>${formatINR(r.cost_p10 || 0)}</td>
          <td>${formatINR(r.cost_p90 || 0)}</td>
          <td>${r.Models_Affected || r.models_affected || r.models || 0}</td>
        </tr>`,
        )
        .join("");
    }
  }

  // =========================================================
  // Models / Parts / Trends (minimal: reuse existing state data)
  // =========================================================
  function renderModels() {
    const mw = state.modelWise;
    if (!mw) return;

    if (!state.rendered.modelsFilter) {
      const filter = document.getElementById("model-month-filter");
      const months = mw.available_months || [];
      if (filter) {
        filter.innerHTML = months
          .map((m, i) => `<option value="${m}" ${i === 0 ? "selected" : ""}>${monthLabel(m)}</option>`)
          .join("");
        filter.addEventListener("change", () => renderModelsForMonth(filter.value));
        state.rendered.modelsFilter = true;
      }
    }
    renderModelTop10();
    const selected = document.getElementById("model-month-filter")?.value;
    if (selected) renderModelsForMonth(selected);

    const mv = state.modelValidation;
    if (mv && mv.summary) {
      const tbody = document.querySelector("#model-validation-table tbody");
      if (tbody) {
        tbody.innerHTML = mv.summary
          .slice()
          .sort((a, b) => (a.mae || 0) - (b.mae || 0))
          .map((r) => {
            const accuracy = Math.max(0, 100 - (r.mae || 0) * 10);
            const cls = accuracy >= 70 ? "reliability-high" : accuracy >= 40 ? "reliability-mid" : "reliability-low";
            return `<tr>
              <td style="font-weight:600">${r.Model_masked || "—"}</td>
              <td>${(r.total_actual || 0).toLocaleString("en-IN")}</td>
              <td>${Math.round(r.total_predicted || 0).toLocaleString("en-IN")}</td>
              <td><span class="reliability-badge ${cls}">${accuracy >= 70 ? "High" : accuracy >= 40 ? "Medium" : "Low"}</span></td>
            </tr>`;
          })
          .join("");
      }
    }
  }

  function renderModelTop10() {
    const mw = state.modelWise;
    if (!mw || !mw.forecasts) return;
    const modelAgg = {};
    mw.forecasts.forEach((r) => {
      modelAgg[r.Model_masked] = (modelAgg[r.Model_masked] || 0) + (r.predicted_complaints || 0);
    });
    const top10 = Object.entries(modelAgg).sort((a, b) => b[1] - a[1]).slice(0, 10);
    destroyChart("modelTop10");
    const ctx = document.getElementById("modelTop10Chart")?.getContext("2d");
    if (!ctx) return;
    state.charts.modelTop10 = new Chart(ctx, {
      type: "bar",
      data: {
        labels: top10.map(([k]) => k),
        datasets: [
          {
            label: "Total Predicted Claims (3M)",
            data: top10.map(([, v]) => Math.round(v)),
            backgroundColor: PALETTE.slice(0, 10),
            borderRadius: 6,
          },
        ],
      },
      options: hBarOpts(),
    });
  }

  function renderModelsForMonth(month) {
    const mw = state.modelWise;
    if (!mw || !mw.forecasts) return;

    const filtered = mw.forecasts
      .filter((d) => d["Complaint Date"] === month)
      .sort((a, b) => (b.predicted_complaints || 0) - (a.predicted_complaints || 0));

    const badge = document.getElementById("model-chart-badge");
    const title = document.getElementById("model-chart-title");
    const count = document.getElementById("model-table-count");
    if (badge) badge.textContent = monthLabel(month);
    if (title) title.textContent = "Expected Claims by Model — " + monthLabel(month);
    if (count) count.textContent = filtered.length + " models";

    destroyChart("modelBar");
    const ctx = document.getElementById("modelBarChart")?.getContext("2d");
    if (ctx) {
      state.charts.modelBar = new Chart(ctx, {
        type: "bar",
        data: {
          labels: filtered.map((d) => d.Model_masked),
          datasets: [
            { label: "Worst Case", data: filtered.map((d) => d.p90 ?? d.predicted_p90 ?? 0), backgroundColor: COLORS.amberDim, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 4, borderSkipped: false, barPercentage: 0.85 },
            { label: "Expected", data: filtered.map((d) => d.predicted_complaints ?? 0), backgroundColor: COLORS.primary, borderRadius: 6, borderSkipped: false, barPercentage: 0.7 },
            { label: "Best Case", data: filtered.map((d) => d.p10 ?? d.predicted_p10 ?? 0), backgroundColor: "#2ca58d", borderRadius: 4, borderSkipped: false, barPercentage: 0.55 },
          ],
        },
        options: hBarOpts({ showLegend: true }),
      });
    }

    const tbody = document.querySelector("#model-forecast-table tbody");
    if (tbody) {
      tbody.innerHTML = filtered
        .map((r) => {
          const p10 = r.predicted_p10 ?? r.p10 ?? 0;
          const p90 = r.predicted_p90 ?? r.p90 ?? 0;
          return `<tr>
            <td style="font-weight:600">${r.Model_masked}</td>
            <td>${p10}</td>
            <td class="cell-highlight">${r.predicted_complaints ?? 0}</td>
            <td>${p90}</td>
            <td><span class="range-badge">${p10} — ${p90}</span></td>
          </tr>`;
        })
        .join("");
    }
  }

  function renderParts() {
    const ct = state.complaintTypes;
    if (!ct || !ct.raw) return;
    const raw = ct.raw.filter((r) => (r.Forecast_p50 || 0) > 0);

    const partAgg = {};
    raw.forEach((r) => {
      const part = r.Predicted_Part || "Other Parts";
      if (!partAgg[part]) {
        partAgg[part] = {
          qty_p50: 0,
          qty_p90: 0,
          unit_cost: r.Est_Unit_Cost || r.Est_Avg_Cost || 0,
          types: new Set(),
          models: new Set(),
        };
      }
      partAgg[part].qty_p50 += r.Forecast_p50 || 0;
      partAgg[part].qty_p90 += r.Forecast_p90 || r.Forecast_p50 || 0;
      if (r.Complaint_Type) partAgg[part].types.add(r.Complaint_Type);
      if (r.Model_masked || r.Model) partAgg[part].models.add(r.Model_masked || r.Model);
    });

    const sortedParts = Object.entries(partAgg).sort((a, b) => b[1].qty_p50 * b[1].unit_cost - a[1].qty_p50 * a[1].unit_cost);
    const topPart = sortedParts[0];
    if (topPart) {
      const h = document.getElementById("parts-narrative-headline");
      const b = document.getElementById("parts-narrative-body");
      if (h) h.textContent = `Stock ${Math.round(topPart[1].qty_p90)} units of "${topPart[0]}" to cover worst-case demand`;
      if (b) {
        const totalBudget = sortedParts.reduce((s, [, v]) => s + v.qty_p50 * v.unit_cost, 0);
        b.innerHTML =
          `<span class="narrative-bullet">Total parts budget needed: ${formatINR(totalBudget)} (expected) across ${sortedParts.length} part types</span>` +
          `<span class="narrative-bullet">${topPart[0]} is needed by ${topPart[1].models.size} models for ${[...topPart[1].types].join(", ")} failures</span>`;
      }
    }

    destroyChart("partsDemand");
    const ctx = document.getElementById("partsDemandChart")?.getContext("2d");
    if (ctx) {
      state.charts.partsDemand = new Chart(ctx, {
        type: "bar",
        data: {
          labels: sortedParts.map(([k]) => k),
          datasets: [
            { label: "Expected Qty", data: sortedParts.map(([, v]) => v.qty_p50), backgroundColor: COLORS.primary, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 },
            { label: "Worst Case Qty", data: sortedParts.map(([, v]) => v.qty_p90), backgroundColor: COLORS.amberDim, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 4, borderSkipped: false, barPercentage: 0.6 },
          ],
        },
        options: baseOpts({ showLegend: true }),
      });
    }

    const tbody1 = document.querySelector("#parts-stocking-table tbody");
    if (tbody1) {
      tbody1.innerHTML = sortedParts
        .map(([part, v]) => {
          return `<tr>
            <td style="font-weight:600">${part}</td>
            <td class="cell-highlight">${Math.round(v.qty_p50)}</td>
            <td>${Math.round(v.qty_p90)}</td>
            <td>${formatINR(v.unit_cost)}</td>
            <td style="font-weight:700; color:var(--clr-primary)">${formatINR(v.qty_p50 * v.unit_cost)}</td>
            <td>${[...v.types].join(", ")}</td>
            <td>${[...v.models].join(", ")}</td>
          </tr>`;
        })
        .join("");
    }

    const byModel = raw
      .slice()
      .sort((a, b) => (b.Est_Cost_p50 || 0) - (a.Est_Cost_p50 || 0))
      .slice(0, 25);
    const tbody2 = document.querySelector("#parts-by-model-table tbody");
    if (tbody2) {
      tbody2.innerHTML = byModel
        .map(
          (r) => `<tr>
          <td style="font-weight:600">${r.Model_masked || r.Model || "—"}</td>
          <td>${r.Complaint_Type || "—"}</td>
          <td>${r.Predicted_Part || "—"}</td>
          <td class="cell-highlight">${(r.Forecast_p50 || 0).toLocaleString("en-IN")}</td>
          <td>${(r.Forecast_p90 || 0).toLocaleString("en-IN")}</td>
          <td>${r.Est_Cost_p50 ? formatINR(r.Est_Cost_p50) : "—"}</td>
        </tr>`,
        )
        .join("");
    }
  }

  function renderTrends() {
    const d = state.totalComplaints;
    if (!d) return;

    if (state.insights && state.insights.total) {
      const ins = state.insights.total;
      const h = document.getElementById("trends-narrative-headline");
      const b = document.getElementById("trends-narrative-body");
      if (h) h.textContent = ins.headline || "";
      if (b) {
        const bullets = Object.entries(ins).filter(([k]) => k !== "headline").map(([, v]) => v).filter(Boolean);
        b.innerHTML = bullets.map((t) => `<span class="narrative-bullet">${t}</span>`).join("");
      }
    }

    renderTrendsOverviewChart(d);
    renderTrendsActualChart(d);

    const tbody1 = document.querySelector("#trends-forecast-table tbody");
    if (tbody1) {
      tbody1.innerHTML = (d.forecast || [])
        .map(
          (r) => `<tr>
          <td class="cell-highlight">${r.Month}</td>
          <td>${Math.round(r["Holt-Winters"] || 0)}</td>
          <td>${Math.round(r["SARIMA"] || 0)}</td>
          <td>${Math.round(r["Prophet"] || 0)}</td>
          <td>${Math.round(r["LightGBM"] || 0)}</td>
          <td class="cell-highlight" style="font-weight:700">${Math.round(r["Ensemble (Top-3)"] || 0)}</td>
        </tr>`,
        )
        .join("");
    }

    const tbody2 = document.querySelector("#trends-comparison-table tbody");
    if (tbody2) {
      tbody2.innerHTML = (d.comparison || [])
        .map(
          (r, i) => `<tr>
          <td><span class="cell-rank rank-default">${i + 1}</span></td>
          <td style="font-weight:600">${r.Model}</td>
          <td>${Number(r["Test MAE"] || 0).toFixed(2)}</td>
        </tr>`,
        )
        .join("");
    }
  }

  function renderTrendsOverviewChart(d) {
    destroyChart("trendsOverview");
    const ctx = document.getElementById("trendsOverviewChart")?.getContext("2d");
    if (!ctx) return;
    const actuals = d.actuals || [];
    const forecasts = d.forecast || [];
    const labels = [...actuals.map((r) => r.Month), ...forecasts.map((r) => r.Month)];
    const actualVals = actuals.map((r) => r.Actual);
    const forecastVals = forecasts.map((r) => r["Ensemble (Top-3)"]);

    const fullActual = [...actualVals, ...new Array(forecasts.length).fill(null)];
    const fullForecast = [
      ...new Array(Math.max(actuals.length - 1, 0)).fill(null),
      actuals.length ? actualVals[actualVals.length - 1] : null,
      ...forecastVals,
    ];

    state.charts.trendsOverview = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Actual Complaints", data: fullActual, borderColor: COLORS.emerald, backgroundColor: COLORS.emeraldDim, borderWidth: 2, pointRadius: 3, fill: true, tension: 0.3 },
          { label: "Ensemble Forecast", data: fullForecast, borderColor: COLORS.amber, backgroundColor: COLORS.amberDim, borderWidth: 3, pointRadius: 5, borderDash: [5, 5], fill: true, tension: 0.3 },
        ],
      },
      options: baseOpts({ showLegend: true }),
    });
  }

  function renderTrendsActualChart(d) {
    destroyChart("trendsActual");
    const ctx = document.getElementById("trendsActualChart")?.getContext("2d");
    if (!ctx) return;
    state.charts.trendsActual = new Chart(ctx, {
      type: "bar",
      data: {
        labels: (d.actuals || []).map((r) => r.Month),
        datasets: [
          { label: "Actual", data: (d.actuals || []).map((r) => r.Actual), backgroundColor: COLORS.emerald, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 },
          { label: "Predicted", data: (d.actuals || []).map((r) => Math.round(r["Ensemble (Top-3)"] || 0)), backgroundColor: COLORS.amber, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 },
        ],
      },
      options: baseOpts({ showLegend: true }),
    });
  }

  init();
});

