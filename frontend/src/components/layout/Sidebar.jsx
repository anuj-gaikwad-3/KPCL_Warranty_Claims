import React, { useContext, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FiscalYearContext } from "../../context/FiscalYearContext";

const navLinkClass = ({ isActive }) =>
  `sidebar-link px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
    isActive ? "bg-white/18 text-white font-semibold" : "hover:bg-white/10 text-white/80"
  } text-white`;

const subLinkClass = ({ isActive }) =>
  `block px-3 py-1.5 rounded-md text-[12px] transition-colors ${
    isActive ? "bg-white/15 text-white font-semibold" : "hover:bg-white/10 text-white/70"
  }`;

const FORECAST_LINKS = [
  { to: "/forecasting/summary", label: "Executive Summary" },
  { to: "/forecasting/costs", label: "Cost Outlook" },
  { to: "/forecasting/models", label: "Model Risk Watch" },
  { to: "/forecasting/parts", label: "Parts & Inventory" },
  { to: "/forecasting/trends", label: "Trends & History" },
];

export default function Sidebar() {
  const { fys, selectedFy, setSelectedFy } = useContext(FiscalYearContext);
  const location = useLocation();
  const isForecastActive = location.pathname.startsWith("/forecasting");
  const [forecastOpen, setForecastOpen] = useState(isForecastActive);

  return (
    <div
      className="sidebar-shell fixed top-0 left-0 bottom-0 z-50 flex flex-col"
      style={{ width: "16rem", padding: "1.5rem 0.85rem" }}
    >
      <div className="flex items-center gap-2 px-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">
          KP
        </div>
        <div className="flex flex-col leading-tight">
          <h2 className="text-base font-extrabold tracking-tight text-white mb-0">KPCL Warranty</h2>
          <span className="text-[10px] uppercase tracking-[1.4px] text-white/70 font-semibold">
            Intelligence
          </span>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-[1.5px] text-white/60 px-2 mb-2 font-bold">
        Dashboard
      </div>
      <p className="text-xs uppercase tracking-wider text-white/60 mb-2 px-2">
        Select Fiscal Year
      </p>

      <select
        value={selectedFy || ""}
        onChange={(e) => setSelectedFy(e.target.value)}
        className="w-full rounded-md border border-white/20 bg-white/10 text-white px-3 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        {fys.length === 0 && (
          <option value="" disabled>
            Loading...
          </option>
        )}
        {fys.map((fy) => (
          <option key={fy} value={fy} className="text-gray-900">
            {fy}
          </option>
        ))}
      </select>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        <NavLink to="/" end className={navLinkClass}>
          Overview
        </NavLink>
        <NavLink to="/complaints" className={navLinkClass}>
          Complaints
        </NavLink>
        <NavLink to="/zhc-analysis" className={navLinkClass}>
          ZHC Analysis
        </NavLink>
        <NavLink to="/usage-analysis" className={navLinkClass}>
          Usage Analysis
        </NavLink>

        {/* Forecasting collapsible section */}
        <button
          onClick={() => setForecastOpen((p) => !p)}
          className={`sidebar-link px-3 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center justify-between w-full text-left ${
            isForecastActive ? "bg-white/18 text-white font-semibold" : "hover:bg-white/10 text-white/80"
          }`}
        >
          <span>Forecasting</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${forecastOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {forecastOpen && (
          <div className="ml-3 pl-3 border-l border-white/15 flex flex-col gap-0.5">
            {FORECAST_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={subLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="mt-auto pt-4 px-2 border-t border-white/15 flex items-center gap-2 text-[11px] text-white/60">
        <span className="w-2 h-2 rounded-full bg-emerald-300" />
        <span>Unified Theme Active</span>
      </div>
    </div>
  );
}
