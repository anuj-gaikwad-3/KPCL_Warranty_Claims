/**
 * KPCL Warranty Intelligence Dashboard
 * All charts rendered client-side via Chart.js from JSON API data.
 */

document.addEventListener('DOMContentLoaded', () => {

    const state = {
        overview: null,
        totalComplaints: null,
        modelWise: null,
        modelValidation: null,
        complaintTypes: null,
        typeValidation: null,
        costData: null,
        insights: null,
        activeTab: 'summary',
        charts: {},
        rendered: {},
    };

    const COLORS = {
        primary: '#1a7a6d',
        primaryDim: 'rgba(26, 122, 109, 0.15)',
        secondary: '#1b8a7a',
        emerald: '#1a7a6d',
        emeraldDim: 'rgba(26, 122, 109, 0.12)',
        amber: '#e07c3a',
        amberDim: 'rgba(224, 124, 58, 0.15)',
        rose: '#d94f4f',
        violet: '#5a5fc7',
        sky: '#3a8fc7',
        textMuted: '#5f6b7a',
        glass: 'rgba(0, 0, 0, 0.03)',
        border: '#dde1e6',
    };

    const PALETTE = [
        '#1a7a6d', '#e07c3a', '#3a8fc7', '#5a5fc7',
        '#d94f4f', '#2ca58d', '#8b6cc1', '#e8a838',
        '#47a3a3', '#7a8b99', '#c7553a', '#3ac78f',
        '#c73a9f', '#3a5fc7', '#c7a33a',
    ];

    async function init() {
        try {
            await fetchAllData();
            setupNavigation();
            renderSummary();
            hideLoader();
        } catch (err) {
            console.error('Init failed:', err);
            hideLoader();
        }
    }

    async function fetchAllData() {
        const endpoints = {
            overview: '/api/overview',
            totalComplaints: '/api/total_complaints',
            modelWise: '/api/model_wise',
            modelValidation: '/api/model_wise/validation',
            complaintTypes: '/api/complaint_types',
            typeValidation: '/api/complaint_types/validation',
            costData: '/api/complaint_types/costs',
            insights: '/api/insights',
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
            })
        );
        results.forEach(([k, v]) => { state[k] = v; });
    }

    function hideLoader() {
        setTimeout(() => {
            document.getElementById('loading-overlay').classList.add('hidden');
        }, 500);
    }

    function setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const tab = link.dataset.tab;
                if (tab === state.activeTab) return;

                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                const panel = document.getElementById(`tab-${tab}`);
                if (panel) {
                    panel.classList.add('active');
                    panel.style.animation = 'none';
                    panel.offsetHeight;
                    panel.style.animation = '';
                }
                state.activeTab = tab;

                setTimeout(() => {
                    switch (tab) {
                        case 'summary': renderSummary(); break;
                        case 'costs': renderCosts(); break;
                        case 'models': renderModels(); break;
                        case 'parts': renderParts(); break;
                        case 'trends': renderTrends(); break;
                    }
                }, 50);
            });
        });
    }

    function baseOpts(overrides = {}) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
                legend: {
                    display: !!overrides.showLegend,
                    position: overrides.legendPos || 'top',
                    labels: {
                        color: '#1a1a2e',
                        font: { family: 'Inter', size: 11, weight: '500' },
                        padding: 12, usePointStyle: true, pointStyleWidth: 8,
                        boxWidth: 8,
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1a2e',
                    titleColor: '#fff', bodyColor: '#cdd5de',
                    borderColor: '#dde1e6', borderWidth: 1,
                    cornerRadius: 6, padding: 10,
                    titleFont: { family: 'Inter', weight: '700', size: 12 },
                    bodyFont: { family: 'Inter', size: 11 },
                    usePointStyle: true,
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#5f6b7a', font: { family: 'Inter', size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 20 }, border: { color: '#dde1e6' } },
                y: { grid: { color: '#eef0f3' }, ticks: { color: '#5f6b7a', font: { family: 'Inter', size: 10 } }, border: { display: false } },
            },
        };
    }

    function hBarOpts(overrides = {}) {
        const o = baseOpts(overrides);
        o.indexAxis = 'y';
        o.scales.x = { grid: { color: '#eef0f3' }, ticks: { color: '#5f6b7a', font: { family: 'Inter', size: 10 } }, border: { display: false } };
        o.scales.y = { grid: { display: false }, ticks: { color: '#1a1a2e', font: { family: 'Inter', size: 10, weight: '500' }, autoSkip: false }, border: { color: '#dde1e6' } };
        return o;
    }

    function destroyChart(key) {
        if (state.charts[key]) { state.charts[key].destroy(); state.charts[key] = null; }
    }

    function formatINR(val) {
        if (val >= 1e7) return '\u20B9' + (val / 1e7).toFixed(2) + ' Cr';
        if (val >= 1e5) return '\u20B9' + (val / 1e5).toFixed(2) + ' L';
        if (val >= 1e3) return '\u20B9' + (val / 1e3).toFixed(1) + 'K';
        return '\u20B9' + Math.round(val).toLocaleString('en-IN');
    }

    function monthLabel(s) {
        try {
            const d = new Date(s);
            if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch (e) { }
        return String(s).substring(0, 10);
    }

    function shortMonth(s) {
        try {
            const d = new Date(s);
            if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        } catch (e) { }
        return String(s).substring(0, 7);
    }

    function animateValue(id, start, end, dur) {
        const el = document.getElementById(id);
        if (!el) return;
        const t0 = performance.now();
        const diff = end - start;
        function upd(now) {
            const p = Math.min((now - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(start + diff * eased);
            if (p < 1) requestAnimationFrame(upd);
        }
        requestAnimationFrame(upd);
    }

    // ===================================================================
    // TAB: EXECUTIVE SUMMARY
    // ===================================================================
    function renderSummary() {
        const o = state.overview;
        const cost = state.costData;
        const ct = state.complaintTypes;
        if (!o) return;

        const totalCost = cost ? cost.total_estimated_cost : 0;
        document.getElementById('kpi-total-cost').textContent = formatINR(totalCost);
        const months = o.forecast_months || [];
        if (months.length >= 2) {
            document.getElementById('kpi-cost-period').textContent =
                monthLabel(months[0]) + ' \u2013 ' + monthLabel(months[months.length - 1]);
        }

        document.getElementById('kpi-models-count').textContent = o.total_models_tracked;
        animateValue('kpi-expected-claims', 0, Math.round(o.three_month_total), 800);

        const trendBadge = document.getElementById('kpi-trend-badge');
        const trendArrow = document.getElementById('kpi-trend-arrow');
        const trendVal = document.getElementById('kpi-trend-value');
        if (o.mom_change > 0) {
            trendBadge.className = 'kpi-trend up';
            trendArrow.textContent = '\u2191'; trendVal.textContent = '+' + o.mom_change;
        } else if (o.mom_change < 0) {
            trendBadge.className = 'kpi-trend down';
            trendArrow.textContent = '\u2193'; trendVal.textContent = o.mom_change;
        } else {
            trendBadge.className = 'kpi-trend neutral';
            trendArrow.textContent = '\u2192'; trendVal.textContent = '0';
        }

        document.getElementById('kpi-risk-model').textContent = o.top_model;
        document.getElementById('kpi-risk-value').textContent = o.top_model_value;
        if (ct && ct.aggregated && ct.aggregated.length) {
            const topType = ct.aggregated[0];
            document.getElementById('kpi-top-issue').textContent = topType.Complaint_Type;
            const totalP50 = ct.aggregated.reduce((s, r) => s + (r.total_p50 || 0), 0);
            const pct = totalP50 > 0 ? Math.round(topType.total_p50 / totalP50 * 100) : 0;
            document.getElementById('kpi-top-issue-pct').textContent = pct;
        }

        renderSummaryTrendChart();
        renderSummaryCostChart();
        renderActionTable();
    }

    function renderSummaryTrendChart() {
        const d = state.totalComplaints;
        if (!d) return;
        destroyChart('summaryTrend');

        const ctx = document.getElementById('summaryTrendChart').getContext('2d');
        const actuals = d.actuals || [];
        const forecasts = d.forecast || [];

        const labels = [...actuals.map(r => r.Month), ...forecasts.map(r => r.Month)];
        const actualVals = actuals.map(r => r.Actual);
        const forecastVals = forecasts.map(r => r['Ensemble (Top-3)']);

        const fullActual = [...actualVals, ...new Array(forecasts.length).fill(null)];
        const fullForecast = [...new Array(actuals.length - 1).fill(null), actualVals[actualVals.length - 1], ...forecastVals];

        state.charts.summaryTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Actual Claims',
                        data: fullActual,
                        borderColor: COLORS.emerald,
                        backgroundColor: COLORS.emeraldDim,
                        borderWidth: 2.5, pointRadius: 4, fill: true, tension: 0.3,
                    },
                    {
                        label: 'Forecast',
                        data: fullForecast,
                        borderColor: COLORS.amber,
                        backgroundColor: COLORS.amberDim,
                        borderWidth: 2.5, pointRadius: 5, borderDash: [6, 4], fill: true, tension: 0.3,
                    },
                ]
            },
            options: baseOpts({ showLegend: true }),
        });
    }

    function renderSummaryCostChart() {
        const cost = state.costData;
        if (!cost || !cost.cost_summary || !cost.cost_summary.length) return;
        destroyChart('summaryCost');

        const ctx = document.getElementById('summaryCostChart').getContext('2d');
        const data = cost.cost_summary.sort((a, b) => b.cost_p50 - a.cost_p50);

        const opts = hBarOpts();
        opts.plugins.tooltip = { ...opts.plugins.tooltip, callbacks: { label: ctx => formatINR(ctx.raw) } };
        opts.scales.x.ticks = { ...opts.scales.x.ticks, callback: v => formatINR(v) };

        state.charts.summaryCost = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(r => r.Complaint_Type),
                datasets: [{
                    label: 'Expected Cost',
                    data: data.map(r => r.cost_p50),
                    backgroundColor: data.map((_, i) => PALETTE[i % PALETTE.length]),
                    borderRadius: 6, borderSkipped: false,
                }]
            },
            options: opts,
        });
    }

    function renderActionTable() {
        const ct = state.complaintTypes;
        if (!ct || !ct.raw) return;

        const rows = ct.raw
            .filter(r => r.Forecast_p50 > 0)
            .sort((a, b) => (b.Est_Cost_p50 || 0) - (a.Est_Cost_p50 || 0))
            .slice(0, 15);

        const tbody = document.querySelector('#action-table tbody');
        tbody.innerHTML = rows.map((r, i) => {
            const priority = i < 3 ? 'high' : i < 8 ? 'medium' : 'low';
            const priorityLabel = i < 3 ? 'High' : i < 8 ? 'Medium' : 'Low';
            return `<tr>
                <td><span class="priority-badge priority-${priority}">${priorityLabel}</span></td>
                <td style="font-weight:600">${r.Model}</td>
                <td>${r.Complaint_Type}</td>
                <td>${r.Predicted_Part || '\u2014'}</td>
                <td>${r.Est_Cost_p50 ? formatINR(r.Est_Cost_p50) : '\u2014'}</td>
                <td class="cell-highlight">${r.Forecast_p50}</td>
            </tr>`;
        }).join('');

        document.getElementById('action-count').textContent = `${rows.length} items`;
    }

    // ===================================================================
    // TAB: WARRANTY COST OUTLOOK
    // ===================================================================

    function renderCosts() {
        const cost = state.costData;
        if (!cost) return;

        if (!state.rendered.costsFilter) {
            const filter = document.getElementById('cost-month-filter');
            const months = cost.available_months || [];
            filter.innerHTML = '<option value="all">All Months</option>' +
                months.map(m => `<option value="${m}">${monthLabel(m)}</option>`).join('');
            filter.addEventListener('change', () => renderCostsForMonth(filter.value));
            state.rendered.costsFilter = true;
        }
        renderCostsForMonth(document.getElementById('cost-month-filter').value);
        renderCostDeepDive();
    }

    function renderCostsForMonth(month) {
        const cost = state.costData;
        if (!cost) return;

        let raw = cost.raw || [];
        if (month !== 'all') raw = raw.filter(r => r.Date === month);

        const totalP50 = raw.reduce((s, r) => s + (r.Est_Cost_p50 || 0), 0);
        const totalP10 = raw.reduce((s, r) => s + (r.Est_Cost_p10 || 0), 0);
        const totalP90 = raw.reduce((s, r) => s + (r.Est_Cost_p90 || 0), 0);

        document.getElementById('cost-total').textContent = formatINR(totalP50);
        document.getElementById('cost-best-case').textContent = formatINR(totalP10);
        document.getElementById('cost-worst-case').textContent = formatINR(totalP90);

        // Cost by type
        const byType = {};
        raw.forEach(r => {
            const t = r.Complaint_Type;
            if (!byType[t]) byType[t] = { p50: 0, p10: 0, p90: 0 };
            byType[t].p50 += r.Est_Cost_p50 || 0;
            byType[t].p10 += r.Est_Cost_p10 || 0;
            byType[t].p90 += r.Est_Cost_p90 || 0;
        });
        const sortedTypes = Object.entries(byType).sort((a, b) => b[1].p50 - a[1].p50);

        destroyChart('costByType');
        const opts1 = baseOpts({ showLegend: true });
        opts1.plugins.tooltip = { ...opts1.plugins.tooltip, callbacks: { label: c => c.dataset.label + ': ' + formatINR(c.raw) } };
        opts1.scales.y = { ...opts1.scales.y, ticks: { ...opts1.scales.y.ticks, callback: v => formatINR(v) } };

        state.charts.costByType = new Chart(
            document.getElementById('costByTypeChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: sortedTypes.map(([k]) => k),
                datasets: [
                    { label: 'Expected Cost', data: sortedTypes.map(([, v]) => v.p50), backgroundColor: COLORS.primary, borderRadius: 6, borderSkipped: false },
                    { label: 'Worst Case', data: sortedTypes.map(([, v]) => v.p90), backgroundColor: COLORS.amberDim, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 4, borderSkipped: false },
                ]
            },
            options: opts1,
        });

        // Cost by model
        const byModel = {};
        raw.forEach(r => { byModel[r.Model] = (byModel[r.Model] || 0) + (r.Est_Cost_p50 || 0); });
        const sortedModels = Object.entries(byModel).sort((a, b) => b[1] - a[1]).slice(0, 10);

        destroyChart('costByModel');
        const opts2 = hBarOpts();
        opts2.scales.x.ticks = { ...opts2.scales.x.ticks, callback: v => formatINR(v) };

        state.charts.costByModel = new Chart(
            document.getElementById('costByModelChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: sortedModels.map(([k]) => k),
                datasets: [{
                    label: 'Expected Cost',
                    data: sortedModels.map(([, v]) => v),
                    backgroundColor: sortedModels.map((_, i) => PALETTE[i % PALETTE.length]),
                    borderRadius: 6, borderSkipped: false,
                }]
            },
            options: opts2,
        });

        // Cost detail table
        const costSummary = cost.cost_summary || [];
        document.querySelector('#cost-detail-table tbody').innerHTML = costSummary.map(r => `
            <tr>
                <td style="font-weight:600">${r.Complaint_Type}</td>
                <td>${r.Predicted_Part || '\u2014'}</td>
                <td>${formatINR(r.avg_cost_per_complaint || 0)}</td>
                <td class="cell-highlight">${r.total_p50 || 0}</td>
                <td style="font-weight:700; color: var(--clr-primary)">${formatINR(r.cost_p50 || 0)}</td>
                <td>${formatINR(r.cost_p10 || 0)}</td>
                <td>${formatINR(r.cost_p90 || 0)}</td>
                <td>${r.models_affected || 0}</td>
            </tr>
        `).join('');
    }

    async function renderCostDeepDive() {
        if (state.rendered.costDeepDive) return;
        state.rendered.costDeepDive = true;

        try {
            const typeData = await fetch('/api/data/complaint_types').then(r => r.json());
            if (typeData && typeData.length) {
                const sorted = typeData.sort((a, b) => b.Forecast_p50 - a.Forecast_p50);
                const opts = hBarOpts({ showLegend: true });
                state.charts.costComplaintType = new Chart(
                    document.getElementById('costComplaintTypeChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: sorted.map(r => r.Complaint_Type),
                        datasets: [
                            { label: 'Forecast (p50)', data: sorted.map(r => r.Forecast_p50), backgroundColor: COLORS.primary, borderRadius: 4, barPercentage: 0.7 },
                            { label: 'Best Case (p10)', data: sorted.map(r => r.Forecast_p10), backgroundColor: 'rgba(26, 122, 109, 0.3)', borderRadius: 4, barPercentage: 0.7 },
                            { label: 'Worst Case (p90)', data: sorted.map(r => r.Forecast_p90), backgroundColor: 'rgba(224, 124, 58, 0.35)', borderRadius: 4, barPercentage: 0.7 },
                        ]
                    },
                    options: opts,
                });
            }
        } catch (e) { console.warn('Complaint type chart failed:', e); }

        try {
            const distData = await fetch('/api/data/type_distribution').then(r => r.json());
            if (distData && distData.length) {
                state.charts.costHistDist = new Chart(
                    document.getElementById('costHistDistChart').getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: distData.map(r => r.Category),
                        datasets: [{
                            data: distData.map(r => r.Count),
                            backgroundColor: distData.map((_, i) => PALETTE[i % PALETTE.length]),
                            borderWidth: 2, borderColor: '#fff', hoverOffset: 6,
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        cutout: '55%',
                        plugins: {
                            legend: {
                                display: true, position: 'bottom',
                                labels: { color: '#1a1a2e', font: { family: 'Inter', size: 10 }, padding: 10, usePointStyle: true, boxWidth: 8 }
                            },
                            tooltip: {
                                backgroundColor: '#1a1a2e', titleColor: '#fff', bodyColor: '#cdd5de',
                                cornerRadius: 6, padding: 10,
                                callbacks: { label: ctx => `${ctx.label}: ${ctx.raw} claims` }
                            }
                        }
                    }
                });
            }
        } catch (e) { console.warn('Distribution chart failed:', e); }
    }

    // ===================================================================
    // TAB: MODEL RISK WATCH
    // ===================================================================

    function renderModels() {
        const mw = state.modelWise;
        const mv = state.modelValidation;
        if (!mw) return;

        if (!state.rendered.modelsFilter) {
            const filter = document.getElementById('model-month-filter');
            const months = mw.available_months || [];
            filter.innerHTML = months.map((m, i) =>
                `<option value="${m}" ${i === 0 ? 'selected' : ''}>${monthLabel(m)}</option>`
            ).join('');
            filter.addEventListener('change', () => renderModelsForMonth(filter.value));
            state.rendered.modelsFilter = true;
        }

        if (state.insights && state.insights.models) {
            const ins = state.insights.models;
            document.getElementById('model-narrative-headline').textContent = ins.headline || '';
            const bodyEl = document.getElementById('model-narrative-body');
            const bullets = Object.entries(ins).filter(([k]) => k !== 'headline').map(([, v]) => v).filter(Boolean);
            bodyEl.innerHTML = bullets.map(b => `<span class="narrative-bullet">${b}</span>`).join('');
        }

        renderModelTop10();
        renderModelsForMonth(document.getElementById('model-month-filter').value);

        if (mv && mv.summary) {
            document.querySelector('#model-validation-table tbody').innerHTML = mv.summary.sort((a, b) => a.mae - b.mae).map(r => {
                const accuracy = Math.max(0, 100 - r.mae * 10);
                const cls = accuracy >= 70 ? 'reliability-high' : accuracy >= 40 ? 'reliability-mid' : 'reliability-low';
                return `<tr>
                    <td style="font-weight:600">${r.Model_masked}</td>
                    <td>${r.total_actual}</td>
                    <td>${Math.round(r.total_predicted)}</td>
                    <td><span class="reliability-badge ${cls}">${accuracy >= 70 ? 'High' : accuracy >= 40 ? 'Medium' : 'Low'}</span></td>
                </tr>`;
            }).join('');
        }

        if (!state.rendered.modelDeepDive) {
            state.rendered.modelDeepDive = true;
            renderModelDeepDive();
        }
    }

    function renderModelTop10() {
        const mw = state.modelWise;
        if (!mw || !mw.forecasts) return;

        const modelAgg = {};
        mw.forecasts.forEach(r => {
            modelAgg[r.Model_masked] = (modelAgg[r.Model_masked] || 0) + r.predicted_complaints;
        });
        const top10 = Object.entries(modelAgg).sort((a, b) => b[1] - a[1]).slice(0, 10);

        destroyChart('modelTop10');
        state.charts.modelTop10 = new Chart(
            document.getElementById('modelTop10Chart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: top10.map(([k]) => k),
                datasets: [{
                    label: 'Total Predicted Claims (3M)',
                    data: top10.map(([, v]) => Math.round(v)),
                    backgroundColor: PALETTE.slice(0, 10),
                    borderRadius: 6
                }]
            },
            options: hBarOpts(),
        });
    }

    function renderModelsForMonth(month) {
        const mw = state.modelWise;
        if (!mw) return;

        const filtered = mw.forecasts.filter(d => d['Complaint Date'] === month)
            .sort((a, b) => b.predicted_complaints - a.predicted_complaints);

        document.getElementById('model-chart-badge').textContent = monthLabel(month);
        document.getElementById('model-chart-title').textContent = 'Expected Claims by Model \u2014 ' + monthLabel(month);
        document.getElementById('model-table-count').textContent = filtered.length + ' models';

        destroyChart('modelBar');
        const opts = hBarOpts({ showLegend: true });
        state.charts.modelBar = new Chart(
            document.getElementById('modelBarChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: filtered.map(d => d.Model_masked),
                datasets: [
                    { label: 'Worst Case', data: filtered.map(d => d.predicted_p90), backgroundColor: COLORS.amberDim, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 4, borderSkipped: false, barPercentage: 0.85 },
                    { label: 'Expected', data: filtered.map(d => d.predicted_complaints), backgroundColor: COLORS.primary, borderRadius: 6, borderSkipped: false, barPercentage: 0.7 },
                    { label: 'Best Case', data: filtered.map(d => d.predicted_p10), backgroundColor: '#2ca58d', borderRadius: 4, borderSkipped: false, barPercentage: 0.55 },
                ]
            },
            options: opts,
        });

        document.querySelector('#model-forecast-table tbody').innerHTML = filtered.map(r => `
            <tr>
                <td style="font-weight:600">${r.Model_masked}</td>
                <td>${r.predicted_p10}</td>
                <td class="cell-highlight">${r.predicted_complaints}</td>
                <td>${r.predicted_p90}</td>
                <td><span class="range-badge">${r.predicted_p10} \u2014 ${r.predicted_p90}</span></td>
            </tr>
        `).join('');
    }

    async function renderModelDeepDive() {
        // Heatmap as bubble chart
        try {
            const heatData = await fetch('/api/data/heatmap').then(r => r.json());
            if (heatData && heatData.length) {
                const dateCols = Object.keys(heatData[0]).filter(k => k !== 'Model_masked');
                const top15 = heatData.sort((a, b) => {
                    const sumA = dateCols.reduce((s, c) => s + (a[c] || 0), 0);
                    const sumB = dateCols.reduce((s, c) => s + (b[c] || 0), 0);
                    return sumB - sumA;
                }).slice(0, 15);

                const bubbleData = [];
                top15.forEach((row, y) => {
                    dateCols.forEach((date, x) => {
                        const val = row[date];
                        if (val > 0) {
                            bubbleData.push({ x, y, r: Math.min(val * 2.5 + 3, 18), v: val, model: row.Model_masked, month: shortMonth(date) });
                        }
                    });
                });

                state.charts.modelHeatmap = new Chart(
                    document.getElementById('modelHeatmapChart').getContext('2d'), {
                    type: 'bubble',
                    data: {
                        datasets: [{
                            label: 'Forecast Intensity',
                            data: bubbleData,
                            backgroundColor: 'rgba(26, 122, 109, 0.55)',
                            borderColor: COLORS.primary, borderWidth: 1,
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'point' },
                        scales: {
                            x: {
                                type: 'linear', min: -0.5, max: dateCols.length - 0.5,
                                ticks: { stepSize: 1, callback: v => shortMonth(dateCols[v]) || '', font: { family: 'Inter', size: 10 } },
                                grid: { display: false }, border: { color: '#dde1e6' }
                            },
                            y: {
                                type: 'linear', min: -0.5, max: top15.length - 0.5,
                                ticks: { stepSize: 1, callback: v => top15[v]?.Model_masked || '', font: { family: 'Inter', size: 10 } },
                                grid: { color: '#eef0f3' }, border: { display: false }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#1a1a2e', titleColor: '#fff', bodyColor: '#cdd5de', cornerRadius: 6, padding: 10,
                                callbacks: { label: ctx => { const p = ctx.raw; return `${p.model} (${p.month}): ${p.v} claims`; } }
                            }
                        }
                    }
                });
            }
        } catch (e) { console.warn('Heatmap failed:', e); }

        // MAE by model
        try {
            const mv = state.modelValidation;
            if (mv && mv.summary) {
                const sorted = mv.summary.sort((a, b) => b.mae - a.mae).slice(0, 15);
                state.charts.modelMAE = new Chart(
                    document.getElementById('modelMAEChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: sorted.map(r => r.Model_masked),
                        datasets: [{
                            label: 'Mean Absolute Error',
                            data: sorted.map(r => +r.mae.toFixed(2)),
                            backgroundColor: sorted.map(r => r.mae > 2 ? COLORS.amber : COLORS.primary),
                            borderRadius: 4
                        }]
                    },
                    options: hBarOpts(),
                });
            }
        } catch (e) { console.warn('MAE chart failed:', e); }

        // Actual vs Predicted (total)
        try {
            const d = state.totalComplaints;
            if (d && d.actuals) {
                state.charts.modelActualVsPred = new Chart(
                    document.getElementById('modelActualVsPredChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: d.actuals.map(r => r.Month),
                        datasets: [
                            { label: 'Actual', data: d.actuals.map(r => r.Actual), backgroundColor: COLORS.emerald, borderRadius: 6, barPercentage: 0.6 },
                            { label: 'Predicted (Ensemble)', data: d.actuals.map(r => Math.round(r['Ensemble (Top-3)'])), backgroundColor: COLORS.amber, borderRadius: 6, barPercentage: 0.6 },
                        ]
                    },
                    options: baseOpts({ showLegend: true }),
                });
            }
        } catch (e) { console.warn('Actual vs Pred failed:', e); }

        // Scatter
        try {
            const scatterData = await fetch('/api/data/scatter').then(r => r.json());
            if (scatterData && scatterData.length) {
                const maxVal = Math.max(...scatterData.map(r => Math.max(r.complaints || 0, r.predicted || 0)), 1);
                state.charts.modelScatter = new Chart(
                    document.getElementById('modelScatterChart').getContext('2d'), {
                    type: 'scatter',
                    data: {
                        datasets: [
                            {
                                label: 'Model-Month',
                                data: scatterData.map(r => ({ x: r.complaints, y: +(r.predicted).toFixed(1) })),
                                backgroundColor: 'rgba(26, 122, 109, 0.5)', pointRadius: 5, pointHoverRadius: 7,
                            },
                            {
                                label: 'Perfect (x=y)',
                                data: [{ x: 0, y: 0 }, { x: maxVal, y: maxVal }],
                                type: 'line',
                                borderColor: COLORS.rose, borderDash: [6, 3], borderWidth: 2,
                                pointRadius: 0, fill: false,
                            }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'point' },
                        plugins: {
                            legend: { display: true, position: 'top', labels: { color: '#1a1a2e', font: { family: 'Inter', size: 10 }, usePointStyle: true, boxWidth: 8 } },
                            tooltip: {
                                backgroundColor: '#1a1a2e', titleColor: '#fff', bodyColor: '#cdd5de', cornerRadius: 6, padding: 10,
                                callbacks: { label: ctx => ctx.datasetIndex === 0 ? `Actual: ${ctx.raw.x}, Predicted: ${ctx.raw.y}` : '' }
                            }
                        },
                        scales: {
                            x: { title: { display: true, text: 'Actual Complaints', color: COLORS.textMuted, font: { size: 11 } }, grid: { color: '#eef0f3' }, ticks: { color: '#5f6b7a' }, border: { color: '#dde1e6' } },
                            y: { title: { display: true, text: 'Predicted Complaints', color: COLORS.textMuted, font: { size: 11 } }, grid: { color: '#eef0f3' }, ticks: { color: '#5f6b7a' }, border: { display: false } }
                        }
                    }
                });
            }
        } catch (e) { console.warn('Scatter failed:', e); }
    }

    // ===================================================================
    // TAB: PARTS & INVENTORY
    // ===================================================================

    function renderParts() {
        const ct = state.complaintTypes;
        if (!ct || !ct.raw) return;

        const raw = ct.raw.filter(r => r.Forecast_p50 > 0);

        const partAgg = {};
        raw.forEach(r => {
            const part = r.Predicted_Part || 'Other Parts';
            if (!partAgg[part]) {
                partAgg[part] = { qty_p50: 0, qty_p90: 0, unit_cost: r.Est_Avg_Cost || 0, types: new Set(), models: new Set() };
            }
            partAgg[part].qty_p50 += r.Forecast_p50;
            partAgg[part].qty_p90 += r.Forecast_p90 || r.Forecast_p50;
            partAgg[part].types.add(r.Complaint_Type);
            partAgg[part].models.add(r.Model);
        });

        const sortedParts = Object.entries(partAgg).sort((a, b) => (b[1].qty_p50 * b[1].unit_cost) - (a[1].qty_p50 * a[1].unit_cost));

        const topPart = sortedParts[0];
        if (topPart) {
            document.getElementById('parts-narrative-headline').textContent =
                `Stock ${topPart[1].qty_p90} units of "${topPart[0]}" to cover worst-case demand`;
            const totalBudget = sortedParts.reduce((s, [, v]) => s + v.qty_p50 * v.unit_cost, 0);
            document.getElementById('parts-narrative-body').innerHTML =
                `<span class="narrative-bullet">Total parts budget needed: ${formatINR(totalBudget)} (expected) across ${sortedParts.length} part types</span>` +
                `<span class="narrative-bullet">${topPart[0]} is needed by ${topPart[1].models.size} models for ${[...topPart[1].types].join(', ')} failures</span>`;
        }

        destroyChart('partsDemand');
        state.charts.partsDemand = new Chart(
            document.getElementById('partsDemandChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: sortedParts.map(([k]) => k),
                datasets: [
                    { label: 'Expected Qty', data: sortedParts.map(([, v]) => v.qty_p50), backgroundColor: COLORS.primary, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 },
                    { label: 'Worst Case Qty', data: sortedParts.map(([, v]) => v.qty_p90), backgroundColor: COLORS.amberDim, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 4, borderSkipped: false, barPercentage: 0.6 },
                ],
            },
            options: baseOpts({ showLegend: true }),
        });

        document.querySelector('#parts-stocking-table tbody').innerHTML = sortedParts.map(([part, v]) => `
            <tr>
                <td style="font-weight:600">${part}</td>
                <td class="cell-highlight">${v.qty_p50}</td>
                <td>${v.qty_p90}</td>
                <td>${formatINR(v.unit_cost)}</td>
                <td style="font-weight:700; color:var(--clr-primary)">${formatINR(v.qty_p50 * v.unit_cost)}</td>
                <td>${[...v.types].join(', ')}</td>
                <td>${[...v.models].join(', ')}</td>
            </tr>
        `).join('');

        const byModel = raw
            .sort((a, b) => (b.Est_Cost_p50 || 0) - (a.Est_Cost_p50 || 0))
            .slice(0, 25);

        document.querySelector('#parts-by-model-table tbody').innerHTML = byModel.map(r => `
            <tr>
                <td style="font-weight:600">${r.Model}</td>
                <td>${r.Complaint_Type}</td>
                <td>${r.Predicted_Part || '\u2014'}</td>
                <td class="cell-highlight">${r.Forecast_p50}</td>
                <td>${r.Forecast_p90 || '\u2014'}</td>
                <td>${r.Est_Cost_p50 ? formatINR(r.Est_Cost_p50) : '\u2014'}</td>
            </tr>
        `).join('');

        if (!state.rendered.typeShare) {
            state.rendered.typeShare = true;
            renderTypeShareChart();
        }
    }

    async function renderTypeShareChart() {
        try {
            const data = await fetch('/api/data/type_shares').then(r => r.json());
            if (!data || !data.length) return;

            const allCats = Object.keys(data[0]).filter(k => k !== 'Model_masked' && k !== 'index');
            const topModels = data.slice(0, 8);
            const topCats = allCats.filter(cat => {
                const total = topModels.reduce((s, r) => s + (r[cat] || 0), 0);
                return total > 0.1;
            }).slice(0, 8);

            state.charts.partsTypeShare = new Chart(
                document.getElementById('partsTypeShareChart').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: topModels.map(r => r.Model_masked),
                    datasets: topCats.map((cat, i) => ({
                        label: cat,
                        data: topModels.map(r => +(r[cat] || 0).toFixed(3)),
                        backgroundColor: PALETTE[i % PALETTE.length],
                    }))
                },
                options: {
                    ...baseOpts({ showLegend: true, legendPos: 'bottom' }),
                    scales: {
                        x: { stacked: true, grid: { display: false }, ticks: { color: '#1a1a2e', font: { family: 'Inter', size: 10 } }, border: { color: '#dde1e6' } },
                        y: { stacked: true, max: 1, grid: { color: '#eef0f3' }, ticks: { color: '#5f6b7a', callback: v => Math.round(v * 100) + '%' }, border: { display: false } },
                    },
                    plugins: {
                        ...baseOpts({ showLegend: true, legendPos: 'bottom' }).plugins,
                        tooltip: {
                            backgroundColor: '#1a1a2e', titleColor: '#fff', bodyColor: '#cdd5de', cornerRadius: 6, padding: 10,
                            callbacks: { label: ctx => `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}%` }
                        }
                    }
                }
            });
        } catch (e) { console.warn('Type share chart failed:', e); }
    }

    // ===================================================================
    // TAB: TRENDS & HISTORY
    // ===================================================================

    function renderTrends() {
        const d = state.totalComplaints;
        if (!d) return;

        if (state.insights && state.insights.total) {
            const ins = state.insights.total;
            document.getElementById('trends-narrative-headline').textContent = ins.headline || '';
            const bodyEl = document.getElementById('trends-narrative-body');
            const bullets = Object.entries(ins).filter(([k]) => k !== 'headline').map(([, v]) => v).filter(Boolean);
            bodyEl.innerHTML = bullets.map(b => `<span class="narrative-bullet">${b}</span>`).join('');
        }

        renderTrendsOverviewChart(d);
        renderTrendsActualChart(d);

        document.querySelector('#trends-forecast-table tbody').innerHTML = d.forecast.map(r => `
            <tr>
                <td class="cell-highlight">${r.Month}</td>
                <td>${Math.round(r['Holt-Winters'])}</td>
                <td>${Math.round(r['SARIMA'])}</td>
                <td>${Math.round(r['Prophet'])}</td>
                <td>${Math.round(r['LightGBM'])}</td>
                <td class="cell-highlight" style="font-weight:700">${Math.round(r['Ensemble (Top-3)'])}</td>
            </tr>
        `).join('');

        document.querySelector('#trends-comparison-table tbody').innerHTML = d.comparison.map((r, i) => {
            const cls = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default';
            return `<tr>
                <td><span class="cell-rank ${cls}">${i + 1}</span></td>
                <td style="font-weight:600">${r.Model}</td>
                <td>${r['Test MAE'].toFixed(2)}</td>
            </tr>`;
        }).join('');

        if (!state.rendered.trendsDeepDive) {
            state.rendered.trendsDeepDive = true;
            renderTrendsDeepDive(d);
        }
    }

    function renderTrendsOverviewChart(d) {
        destroyChart('trendsOverview');
        const actuals = d.actuals || [];
        const forecasts = d.forecast || [];
        const labels = [...actuals.map(r => r.Month), ...forecasts.map(r => r.Month)];
        const actualVals = actuals.map(r => r.Actual);
        const forecastVals = forecasts.map(r => r['Ensemble (Top-3)']);

        const fullActual = [...actualVals, ...new Array(forecasts.length).fill(null)];
        const fullForecast = [...new Array(actuals.length - 1).fill(null), actualVals[actualVals.length - 1], ...forecastVals];

        state.charts.trendsOverview = new Chart(
            document.getElementById('trendsOverviewChart').getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Actual Complaints', data: fullActual, borderColor: COLORS.emerald, backgroundColor: COLORS.emeraldDim, borderWidth: 2, pointRadius: 3, fill: true, tension: 0.3 },
                    { label: 'Ensemble Forecast', data: fullForecast, borderColor: COLORS.amber, backgroundColor: COLORS.amberDim, borderWidth: 3, pointRadius: 5, borderDash: [5, 5], fill: true, tension: 0.3 },
                ]
            },
            options: baseOpts({ showLegend: true }),
        });
    }

    function renderTrendsActualChart(d) {
        destroyChart('trendsActual');
        state.charts.trendsActual = new Chart(
            document.getElementById('trendsActualChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: d.actuals.map(r => r.Month),
                datasets: [
                    { label: 'Actual', data: d.actuals.map(r => r.Actual), backgroundColor: COLORS.emerald, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 },
                    { label: 'Predicted', data: d.actuals.map(r => Math.round(r['Ensemble (Top-3)'])), backgroundColor: COLORS.amber, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 },
                ]
            },
            options: baseOpts({ showLegend: true }),
        });
    }

    async function renderTrendsDeepDive(d) {
        // Algorithm leaderboard
        destroyChart('trendsAlgo');
        state.charts.trendsAlgo = new Chart(
            document.getElementById('trendsAlgoChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: d.comparison.map(r => r.Model),
                datasets: [{
                    label: 'Test MAE (Lower is better)',
                    data: d.comparison.map(r => +r['Test MAE'].toFixed(2)),
                    backgroundColor: d.comparison.map((r, i) => i === 0 ? '#1a7a6d' : i < 3 ? '#2ca58d' : '#7a8b99'),
                    borderRadius: 6, barPercentage: 0.6,
                }]
            },
            options: {
                ...baseOpts(),
                plugins: {
                    ...baseOpts().plugins,
                    tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: ctx => `MAE: ${ctx.raw}` } }
                }
            }
        });

        // Feature importance
        try {
            const fiData = await fetch('/api/data/feature_importance').then(r => r.json());
            if (fiData && fiData.length) {
                state.charts.trendsFeature = new Chart(
                    document.getElementById('trendsFeatureChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: fiData.map(r => r.Feature),
                        datasets: [{
                            label: 'Importance Score',
                            data: fiData.map(r => r.Importance),
                            backgroundColor: fiData.map((_, i) => {
                                const t = i / fiData.length;
                                return `rgba(26, 122, 109, ${1 - t * 0.6})`;
                            }),
                            borderRadius: 4
                        }]
                    },
                    options: hBarOpts(),
                });
            }
        } catch (e) { console.warn('Feature importance failed:', e); }

        // Decomposition chart has been replaced with the static image fetched from forecast_outputs
    }

    init();
});

