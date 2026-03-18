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
import ForecastingExact from "./pages/forecasting/ForecastingExact";
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
          <Route path="forecasting/dashboard" element={<ForecastingExact />} />
          <Route path="forecasting/*" element={<Navigate to="/app/forecasting/dashboard" replace />} />
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
