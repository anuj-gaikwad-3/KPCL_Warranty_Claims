import { baseUrl } from "../config/api";

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${url} returned ${res.status}`);
  return res.json();
}

export async function getFys() {
  const json = await get(`${baseUrl}/api/v1/dashboard/fys`);
  return json.fys || [];
}

export async function getTrends(fy) {
  const q = fy ? `?fy=${encodeURIComponent(fy)}` : "";
  const json = await get(`${baseUrl}/api/v1/dashboard/trends${q}`);
  return json.data;
}

export async function getKpis(fy) {
  const q = fy ? `?fy=${encodeURIComponent(fy)}` : "";
  const json = await get(`${baseUrl}/api/v1/dashboard/kpis${q}`);
  return json.data;
}

export async function getComplaintsData(fy) {
  const q = fy ? `?fy=${encodeURIComponent(fy)}` : "";
  const json = await get(`${baseUrl}/api/v1/dashboard/complaints${q}`);
  return json.data;
}

export async function getZhcData(fy) {
  const q = fy ? `?fy=${encodeURIComponent(fy)}` : "";
  const json = await get(`${baseUrl}/api/v1/dashboard/zhc${q}`);
  return json.data;
}

export async function getUsageData(fy) {
  const q = fy ? `?fy=${encodeURIComponent(fy)}` : "";
  const json = await get(`${baseUrl}/api/v1/dashboard/usage${q}`);
  return json.data;
}
