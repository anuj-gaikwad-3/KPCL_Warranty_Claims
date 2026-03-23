const DEFAULT_BASE_API = "https://kpcl-warranty-claims-backend.onrender.com";

// Allow local/dev override without changing code:
// - PowerShell: $env:VITE_API_BASE_URL="http://localhost:8001"
// - then restart `npm run dev`
const BASE_API = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || DEFAULT_BASE_API;

export const baseUrl = String(BASE_API).replace(/\/$/, "");
