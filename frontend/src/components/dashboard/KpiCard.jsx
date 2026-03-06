import React from "react";

const variantMap = {
  primary: "kpi-primary",
  secondary: "kpi-secondary",
  warning: "kpi-warning",
  info: "kpi-info",
};

export default function KpiCard({ label, value, subtitle, variant = "primary", trend }) {
  const cls = variantMap[variant] || "kpi-primary";

  return (
    <div className={`kpi-card ${cls}`}>
      <div className="flex flex-col items-center justify-center gap-2.5 p-7 min-h-[168px]">
        {trend && (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-base font-bold ${
                trend.direction === "up" ? "text-[var(--danger)]" : "text-[var(--success)]"
              }`}
            >
              {trend.direction === "up" ? "↑" : "↓"}
            </span>
            <span
              className={`text-sm font-bold ${
                trend.direction === "up" ? "text-[var(--danger)]" : "text-[var(--success)]"
              }`}
            >
              {trend.value}
            </span>
          </div>
        )}

        <p className="text-[30px] font-extrabold text-[var(--text-primary)] text-center leading-tight tracking-tight">
          {value}
        </p>

        {subtitle && (
          <p className="text-xs font-semibold text-[var(--primary-teal)]">{subtitle}</p>
        )}

        <p className="text-[11px] font-bold uppercase tracking-[0.9px] text-[var(--text-secondary)] text-center mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}
