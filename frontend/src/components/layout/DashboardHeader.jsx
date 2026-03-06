import React from "react";

export default function DashboardHeader({ title, subtitle }) {
  return (
    <div className="dashboard-header">
      <div className="relative z-10">
        <div className="subtle-badge mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-teal)]" />
          Dashboard
        </div>
        <h1 className="text-[34px] font-extrabold text-white tracking-tight leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-white/85 mt-2 font-medium tracking-wide">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
