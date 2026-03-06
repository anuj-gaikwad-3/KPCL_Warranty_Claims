export const COLORS = {
  primary: "#1a7a6d",
  primaryDim: "rgba(26, 122, 109, 0.15)",
  secondary: "#1b8a7a",
  emerald: "#1a7a6d",
  emeraldDim: "rgba(26, 122, 109, 0.12)",
  amber: "#e07c3a",
  amberDim: "rgba(224, 124, 58, 0.25)",
  rose: "#d94f4f",
  violet: "#5a5fc7",
  sky: "#3a8fc7",
  textPrimary: "#1a1a2e",
  textMuted: "#5f6b7a",
  border: "#dde1e6",
  gridLine: "#eef0f3",
};

export const PALETTE = [
  "#1a7a6d", "#e07c3a", "#3a8fc7", "#5a5fc7",
  "#d94f4f", "#2ca58d", "#8b6cc1", "#e8a838",
  "#47a3a3", "#7a8b99",
];

export function baseLayout(overrides = {}) {
  return {
    font: { family: "Inter, sans-serif", color: COLORS.textPrimary },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { l: 50, r: 20, t: 40, b: 50 },
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "left",
      x: 0,
      font: { size: 11, color: COLORS.textMuted },
    },
    xaxis: {
      gridcolor: "transparent",
      linecolor: COLORS.border,
      tickfont: { size: 11, color: COLORS.textMuted },
    },
    yaxis: {
      gridcolor: COLORS.gridLine,
      linecolor: "transparent",
      tickfont: { size: 11, color: COLORS.textMuted },
    },
    ...overrides,
  };
}

export function formatINR(val) {
  if (val >= 1e7) return "\u20B9" + (val / 1e7).toFixed(2) + " Cr";
  if (val >= 1e5) return "\u20B9" + (val / 1e5).toFixed(2) + " L";
  if (val >= 1e3) return "\u20B9" + (val / 1e3).toFixed(1) + "K";
  return "\u20B9" + val.toLocaleString("en-IN");
}

export function monthLabel(s) {
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime()))
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {}
  return s;
}
