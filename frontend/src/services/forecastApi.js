import { baseUrl } from "../config/api";

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${url} returned ${res.status}`);
  return res.json();
}

export async function getOverview() {
  return get(`${baseUrl}/api/v1/forecast/overview`);
}

export async function getTotalComplaints() {
  return get(`${baseUrl}/api/v1/forecast/total_complaints`);
}

export async function getModelWise(modelName, month) {
  const params = new URLSearchParams();
  if (modelName) params.set("model_name", modelName);
  if (month) params.set("month", month);
  const qs = params.toString();
  return get(`${baseUrl}/api/v1/forecast/model_wise${qs ? "?" + qs : ""}`);
}

export async function getModelWiseValidation() {
  return get(`${baseUrl}/api/v1/forecast/model_wise/validation`);
}

export async function getComplaintTypes(month, model) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (model) params.set("model", model);
  const qs = params.toString();
  return get(`${baseUrl}/api/v1/forecast/complaint_types${qs ? "?" + qs : ""}`);
}

export async function getComplaintTypeValidation() {
  return get(`${baseUrl}/api/v1/forecast/complaint_types/validation`);
}

export async function getComplaintTypeCosts(month, model) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (model) params.set("model", model);
  const qs = params.toString();
  return get(`${baseUrl}/api/v1/forecast/complaint_types/costs${qs ? "?" + qs : ""}`);
}

export async function getCuratedPlots() {
  return get(`${baseUrl}/api/v1/forecast/curated_plots`);
}

export async function getInsights() {
  return get(`${baseUrl}/api/v1/forecast/insights`);
}

export async function getMetadata() {
  return get(`${baseUrl}/api/v1/forecast/metadata`);
}

export function plotUrl(category, filename) {
  return `${baseUrl}/api/v1/forecast/plots/${category}/${filename}`;
}
