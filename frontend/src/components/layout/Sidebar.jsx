import React, { useContext, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiscalYearContext } from "../../context/FiscalYearContext";
import { useAuth } from "../../context/AuthContext";

const navLinkClass = ({ isActive }) =>
  `sidebar-link px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
    isActive ? "bg-white/18 text-white font-semibold" : "hover:bg-white/10 text-white/80"
  } text-white`;

const subLinkClass = ({ isActive }) =>
  `block px-3 py-1.5 rounded-md text-[12px] transition-colors ${
    isActive ? "bg-white/15 text-white font-semibold" : "hover:bg-white/10 text-white/70"
  }`;

const FORECAST_LINKS = [
  { to: "/app/forecasting/dashboard", label: "Forecasting Dashboard" },
];

export default function Sidebar() {
  const { fys, selectedFy, setSelectedFy } = useContext(FiscalYearContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isForecastActive = location.pathname.startsWith("/app/forecasting");
  const [forecastOpen, setForecastOpen] = useState(isForecastActive);

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div
      className="sidebar-shell fixed top-0 left-0 bottom-0 z-50 flex flex-col"
      style={{ width: "16rem", padding: "1.5rem 0.85rem" }}
    >
      {/* Brand */}
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

      {/* FY selector */}
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
          <option value="" disabled>Loading...</option>
        )}
        {fys.map((fy) => (
          <option key={fy} value={fy} className="text-gray-900">{fy}</option>
        ))}
      </select>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        <NavLink to="/app" end className={navLinkClass}>Overview</NavLink>
        <NavLink to="/app/complaints" className={navLinkClass}>Complaints</NavLink>
        <NavLink to="/app/zhc-analysis" className={navLinkClass}>ZHC Analysis</NavLink>
        <NavLink to="/app/usage-analysis" className={navLinkClass}>Usage Analysis</NavLink>

        {/* Forecasting collapsible */}
        <button
          onClick={() => setForecastOpen((p) => !p)}
          className={`sidebar-link px-3 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center justify-between w-full text-left ${
            isForecastActive ? "bg-white/18 text-white font-semibold" : "hover:bg-white/10 text-white/80"
          }`}
        >
          <span>Forecasting</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${forecastOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
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

      {/* Footer: user info + logout */}
      <div className="mt-auto pt-3 border-t border-white/15">
        {user && (
          <div className="px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                {user.name?.[0] ?? "U"}
              </div>
              <div className="overflow-hidden">
                <div className="text-[12px] font-semibold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-white/55 truncate">{user.role}</div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
