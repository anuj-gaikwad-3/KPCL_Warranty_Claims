const DEFAULT_BASE_API = "https://kpcl-warranty-claims-backend.onrender.com";

// Allow local/dev override without changing code:
// - PowerShell: $env:VITE_API_BASE_URL="http://localhost:8001"
// - then restart `npm run dev`
const BASE_API = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || DEFAULT_BASE_API;

const cleanedBase = String(BASE_API).replace(/\/$/, "");

// If a production build accidentally captured localhost URLs (common on CI),
// fall back to the Render backend when running on a non-local hostname.
const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const baseForRuntime =
  !isLocalHost && cleanedBase.toLowerCase().includes("localhost") ? DEFAULT_BASE_API : cleanedBase;

export const baseUrl = baseForRuntime.replace(/\/$/, "");
