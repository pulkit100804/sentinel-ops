import type { Role, User } from "@/lib/roles";
import type { PredictionResult, UploadResult } from "@/services/api";
import beforeImg from "@/assets/sample-before.jpg";
import afterImg from "@/assets/sample-after.jpg";
import maskImg from "@/assets/sample-mask.jpg";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const USERS: User[] = [
  { id: "u1", name: "Dr. Maya Chen",    email: "admin@sentinel.io",     role: "admin",     avatarColor: "hsl(152 76% 46%)" },
  { id: "u2", name: "Jordan Rivera",    email: "analyst@sentinel.io",   role: "analyst",   avatarColor: "hsl(174 72% 48%)" },
  { id: "u3", name: "Captain A. Okafor",email: "responder@sentinel.io", role: "responder", avatarColor: "hsl(20 92% 58%)" },
  { id: "u4", name: "Priya Nair",       email: "priya@sentinel.io",     role: "analyst",   avatarColor: "hsl(42 96% 58%)" },
  { id: "u5", name: "L. Thompson",      email: "thompson@sentinel.io",  role: "responder", avatarColor: "hsl(0 78% 56%)" },
];

function buildPrediction(upload_id: string): PredictionResult {
  return {
    id: "pred_" + Math.random().toString(36).slice(2, 9),
    upload_id,
    status: "completed",
    input_url: afterImg,
    output_url: afterImg,
    mask_url: maskImg,
    severity_score: 78,
    damage_percentage: 62.4,
    risk_level: "high",
    affected_regions: 14,
    buildings_damaged: 327,
    estimated_population: 8420,
    metadata: {
      model_version: "damage-seg-v1.2.pth",
      inference_ms: 1243,
      image_size: [1024, 1024],
      timestamp: new Date().toISOString(),
    },
    class_distribution: [
      { label: "No damage",   value: 37.6, color: "hsl(var(--severity-low))" },
      { label: "Minor",       value: 18.2, color: "hsl(var(--severity-moderate))" },
      { label: "Major",       value: 26.8, color: "hsl(var(--severity-high))" },
      { label: "Destroyed",   value: 17.4, color: "hsl(var(--severity-critical))" },
    ],
    regions: [
      { id: "r1", name: "Coastal Sector A", severity: 92, lat: 13.082, lng: 80.270 },
      { id: "r2", name: "Downtown Grid",    severity: 74, lat: 13.088, lng: 80.276 },
      { id: "r3", name: "Industrial Park",  severity: 58, lat: 13.091, lng: 80.281 },
      { id: "r4", name: "North Ridge",      severity: 41, lat: 13.095, lng: 80.268 },
      { id: "r5", name: "East Harbor",      severity: 88, lat: 13.080, lng: 80.285 },
    ],
  };
}

export const mockApi = {
  async health() { await delay(120); return { status: "ok", model_loaded: true }; },

  async login(email: string, _password: string, role: Role): Promise<User> {
    await delay(500);
    const existing = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    const user: User = existing
      ? { ...existing, role }
      : { id: "u_" + Date.now(), name: email.split("@")[0], email, role, avatarColor: "hsl(152 76% 46%)" };
    localStorage.setItem("sentinel.user", JSON.stringify(user));
    return user;
  },

  async logout() { await delay(150); localStorage.removeItem("sentinel.user"); return { ok: true as const }; },

  async me(): Promise<User> {
    await delay(80);
    const raw = localStorage.getItem("sentinel.user");
    if (!raw) throw new Error("Not authenticated");
    return JSON.parse(raw);
  },

  async upload(file: File): Promise<UploadResult> {
    await delay(700);
    const url = URL.createObjectURL(file);
    return { upload_id: "up_" + Date.now(), url, filename: file.name, size: file.size };
  },

  async predict(upload_id: string, onProgress?: (step: string, pct: number) => void): Promise<PredictionResult> {
    const steps: [string, number][] = [
      ["Preprocessing image",       20],
      ["Loading model weights",     40],
      ["Running inference",         70],
      ["Postprocessing mask",       90],
      ["Generating output",         100],
    ];
    for (const [label, pct] of steps) {
      onProgress?.(label, pct);
      await delay(650);
    }
    return buildPrediction(upload_id);
  },

  async result(_id: string) { await delay(200); return buildPrediction("up_cached"); },

  async report(_id: string) { await delay(500); return new Blob(["PDF stub"], { type: "application/pdf" }); },

  async adminUsers() { await delay(200); return USERS; },

  async adminSettings() {
    await delay(150);
    return {
      model: { path: "/backend/weights/damage-seg-v1.2.pth", loaded: true, version: "1.2.0", device: "cuda:0" },
      api:   { base_url: "https://api.sentinel.local", healthy: true, latency_ms: 42 },
      storage: { driver: "s3", bucket: "sentinel-uploads", used_gb: 18.4, quota_gb: 500 },
      features: { hibp: true, mfa: false, audit_logs: true },
    };
  },
};

export const SAMPLE_ASSETS = { before: beforeImg, after: afterImg, mask: maskImg };
