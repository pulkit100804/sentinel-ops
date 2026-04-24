/**
 * API client for the Disaster Analysis Platform.
 *
 * ► PRODUCTION: set VITE_API_BASE_URL to your FastAPI backend (e.g. https://api.example.com)
 *   and this module will send real HTTP requests to the endpoints listed below.
 *
 * ► DEVELOPMENT (default): no base URL → requests are served by a local mock layer so
 *   the UI works out of the box. Drop in your backend by setting the env var.
 *
 * Backend endpoints (match the FastAPI skeleton shipped in /backend):
 *   GET    /health
 *   POST   /auth/login          { email, password }
 *   POST   /auth/logout
 *   GET    /me
 *   POST   /upload              (multipart: file)
 *   POST   /predict             { upload_id }
 *   GET    /results/:id
 *   GET    /reports/:id
 *   GET    /admin/users
 *   POST   /admin/users
 *   GET    /admin/settings
 */
import type { Role, User } from "@/lib/roles";
import { mockApi } from "@/services/mockApi";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const USE_MOCK = !BASE_URL;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) throw new Error("Mock route not implemented: " + path);
  const res = await fetch(BASE_URL + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface UploadResult { upload_id: string; url: string; filename: string; size: number; }

export interface PredictionResult {
  id: string;
  upload_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  input_url: string;
  output_url: string;
  mask_url: string;
  severity_score: number;        // 0-100
  damage_percentage: number;     // 0-100
  risk_level: "low" | "moderate" | "high" | "critical";
  affected_regions: number;
  buildings_damaged: number;
  estimated_population: number;
  metadata: {
    model_version: string;
    inference_ms: number;
    image_size: [number, number];
    timestamp: string;
  };
  class_distribution: { label: string; value: number; color: string }[];
  regions: { id: string; name: string; severity: number; lat: number; lng: number }[];
}

export const api = {
  health: () => (USE_MOCK ? mockApi.health() : http<{ status: string; model_loaded: boolean }>("/health")),

  login: (email: string, password: string, role: Role) =>
    USE_MOCK ? mockApi.login(email, password, role) : http<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password, role }) }),

  logout: () => (USE_MOCK ? mockApi.logout() : http<{ ok: true }>("/auth/logout", { method: "POST" })),

  me: () => (USE_MOCK ? mockApi.me() : http<User>("/me")),

  upload: (file: File) => {
    if (USE_MOCK) return mockApi.upload(file);
    const fd = new FormData();
    fd.append("file", file);
    return fetch(BASE_URL + "/upload", { method: "POST", body: fd, credentials: "include" }).then(r => r.json() as Promise<UploadResult>);
  },

  predict: (upload_id: string, onProgress?: (step: string, pct: number) => void) =>
    USE_MOCK ? mockApi.predict(upload_id, onProgress) : http<PredictionResult>("/predict", { method: "POST", body: JSON.stringify({ upload_id }) }),

  result: (id: string) => (USE_MOCK ? mockApi.result(id) : http<PredictionResult>(`/results/${id}`)),

  report: (id: string) => (USE_MOCK ? mockApi.report(id) : http<Blob>(`/reports/${id}`)),

  adminUsers: () => (USE_MOCK ? mockApi.adminUsers() : http<User[]>("/admin/users")),

  adminSettings: () => (USE_MOCK ? mockApi.adminSettings() : http<any>("/admin/settings")),
};
