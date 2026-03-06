import React from "react";
import { Routes, Route } from "react-router-dom";
import { FiscalYearProvider } from "./context/FiscalYearContext";
import Sidebar from "./components/layout/Sidebar";
import Overview from "./pages/Overview";
import Complaints from "./pages/Complaints";
import ZhcAnalysis from "./pages/ZhcAnalysis";
import UsageAnalysis from "./pages/UsageAnalysis";
import ExecutiveSummary from "./pages/forecasting/ExecutiveSummary";
import CostOutlook from "./pages/forecasting/CostOutlook";
import ModelRiskWatch from "./pages/forecasting/ModelRiskWatch";
import PartsInventory from "./pages/forecasting/PartsInventory";
import TrendsHistory from "./pages/forecasting/TrendsHistory";
import ChatWidget from "./components/chatbot/ChatWidget";

export default function App() {
  return (
    <FiscalYearProvider>
      <Sidebar />
      <div
        className="min-h-screen"
        style={{
          marginLeft: "17.25rem",
          marginRight: "1.25rem",
          padding: "1.5rem 1rem 2rem",
        }}
      >
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/zhc-analysis" element={<ZhcAnalysis />} />
          <Route path="/usage-analysis" element={<UsageAnalysis />} />
          <Route path="/forecasting/summary" element={<ExecutiveSummary />} />
          <Route path="/forecasting/costs" element={<CostOutlook />} />
          <Route path="/forecasting/models" element={<ModelRiskWatch />} />
          <Route path="/forecasting/parts" element={<PartsInventory />} />
          <Route path="/forecasting/trends" element={<TrendsHistory />} />
        </Routes>
      </div>
      <ChatWidget />
    </FiscalYearProvider>
  );
}
