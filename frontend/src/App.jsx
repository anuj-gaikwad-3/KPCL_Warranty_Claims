import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FiscalYearProvider } from "./context/FiscalYearContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
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

function DashboardLayout() {
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
          <Route index element={<Overview />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="zhc-analysis" element={<ZhcAnalysis />} />
          <Route path="usage-analysis" element={<UsageAnalysis />} />
          <Route path="forecasting/summary" element={<ExecutiveSummary />} />
          <Route path="forecasting/costs" element={<CostOutlook />} />
          <Route path="forecasting/models" element={<ModelRiskWatch />} />
          <Route path="forecasting/parts" element={<PartsInventory />} />
          <Route path="forecasting/trends" element={<TrendsHistory />} />
        </Routes>
      </div>
      <ChatWidget />
    </FiscalYearProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app/*" element={<DashboardLayout />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
