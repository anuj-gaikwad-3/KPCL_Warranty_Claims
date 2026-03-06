const BASE_API =
  import.meta.env.VITE_API_URL || "";

export const baseUrl = BASE_API.replace(/\/$/, "");
