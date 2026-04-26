/**
 * API client for the Disaster Analysis Platform.
 *
 * ► PRODUCTION: set VITE_API_BASE_URL to your Flask backend (e.g. http://localhost:5000)
 *   and this module will send real HTTP requests.
 *
 * ► DEVELOPMENT (fallback): no base URL → requests are served by a local mock layer.
 */
import type { Role, User } from "@/lib/roles";
import { mockApi } from "@/services/mockApi";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const USE_MOCK = !BASE_URL;

// ─── Token management ──────────────────────────────────────────────────────

let _authToken: string | null = localStorage.getItem("sentinel.token");

function setToken(token: string | null) {
  _authToken = token;
  if (token) localStorage.setItem("sentinel.token", token);
  else localStorage.removeItem("sentinel.token");
}

function getHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (_authToken) h["Authorization"] = `Bearer ${_authToken}`;
  return h;
}

// ─── HTTP helper ────────────────────────────────────────────────────────────

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) throw new Error("Mock route not implemented: " + path);
  const res = await fetch(BASE_URL + path, {
    credentials: "include",
    headers: getHeaders(init?.headers as Record<string, string>),
    ...init,
    // Don't override headers from above
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `API ${res.status}`;
    try { msg = JSON.parse(text).error || msg; } catch { msg = text || msg; }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  upload_id: string;
  pre_url: string;
  post_url: string;
  pre_filename: string;
  post_filename: string;
  size: number;
  // Legacy compat
  url?: string;
  filename?: string;
}

export interface PredictionResult {
  id: string;
  upload_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  input_url: string;       // pre-disaster image
  post_url: string;        // post-disaster image
  output_url: string;      // binary mask
  mask_url: string;        // color damage mask
  heatmap_url: string;     // heatmap overlay on post image
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

// ─── API ────────────────────────────────────────────────────────────────────

export const api = {
  health: () => (USE_MOCK ? mockApi.health() : http<{ status: string; model_loaded: boolean }>("/health")),

  login: async (email: string, password: string, role: Role): Promise<User> => {
    if (USE_MOCK) return mockApi.login(email, password, role);
    const res = await fetch(BASE_URL + "/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    // Grab token from response header
    const token = res.headers.get("X-Auth-Token");
    if (token) setToken(token);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Login failed" }));
      throw new Error(data.error || `Login failed (${res.status})`);
    }
    const user = await res.json() as User;
    localStorage.setItem("sentinel.user", JSON.stringify(user));
    return user;
  },

  logout: async () => {
    if (USE_MOCK) return mockApi.logout();
    setToken(null);
    localStorage.removeItem("sentinel.user");
    return http<{ ok: true }>("/auth/logout", { method: "POST" });
  },

  me: async (): Promise<User> => {
    if (USE_MOCK) return mockApi.me();
    // First try from token
    if (_authToken) {
      try {
        return await http<User>("/me");
      } catch {
        // Token expired, clear it
        setToken(null);
        localStorage.removeItem("sentinel.user");
        throw new Error("Not authenticated");
      }
    }
    // Fallback to localStorage
    const raw = localStorage.getItem("sentinel.user");
    if (raw) {
      try { return JSON.parse(raw) as User; } catch { /* fall through */ }
    }
    throw new Error("Not authenticated");
  },

  upload: async (preFile: File, postFile: File): Promise<UploadResult> => {
    if (USE_MOCK) return mockApi.upload(preFile);
    const fd = new FormData();
    fd.append("pre_image", preFile);
    fd.append("post_image", postFile);
    const res = await fetch(BASE_URL + "/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
      headers: _authToken ? { Authorization: `Bearer ${_authToken}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(data.error || `Upload failed (${res.status})`);
    }
    return res.json() as Promise<UploadResult>;
  },

  predict: async (upload_id: string, onProgress?: (step: string, pct: number) => void): Promise<PredictionResult> => {
    if (USE_MOCK) return mockApi.predict(upload_id, onProgress);  
    // Show progress steps while the real backend is working
    onProgress?.("Uploading to inference server", 10);
    
    // Small delay so the UI has a chance to render the progress bar
    await new Promise(r => setTimeout(r, 300));
    onProgress?.("Preprocessing image", 25);
    await new Promise(r => setTimeout(r, 200));
    onProgress?.("Running inference", 50);
    
    // Actual call to backend /predict (this does the real work)
    const result = await http<PredictionResult>("/predict", {
      method: "POST",
      body: JSON.stringify({ upload_id }),
    });
    
    onProgress?.("Postprocessing mask", 85);
    await new Promise(r => setTimeout(r, 200));
    onProgress?.("Generating output", 100);
    
    return result;
  },

  result: (id: string) => (USE_MOCK ? mockApi.result(id) : http<PredictionResult>(`/results/${id}`)),

  results: () => (USE_MOCK ? Promise.resolve([]) : http<PredictionResult[]>("/results")),

  report: (id: string) => (USE_MOCK ? mockApi.report(id) : http<PredictionResult>(`/reports/${id}`)),

  adminUsers: () => (USE_MOCK ? mockApi.adminUsers() : http<User[]>("/admin/users")),

  adminSettings: () => (USE_MOCK ? mockApi.adminSettings() : http<any>("/admin/settings")),
};
