// Role & permission types for the Disaster Analysis Platform
export type Role = "admin" | "analyst" | "responder";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  analyst: "Disaster Analyst",
  responder: "Field Responder",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Manage users, system settings, model status and audit logs.",
  analyst: "Upload imagery, run analyses, compare results and export reports.",
  responder: "Review severity, affected regions and relief planning actions.",
};

// Route access matrix — single source of truth for protected routes
export const ROLE_ACCESS: Record<string, Role[]> = {
  "/dashboard":   ["admin", "analyst", "responder"],
  "/upload":      ["admin", "analyst"],
  "/processing":  ["admin", "analyst"],
  "/comparison":  ["admin", "analyst", "responder"],
  "/damage":      ["admin", "analyst", "responder"],
  "/severity":    ["admin", "analyst", "responder"],
  "/relief":      ["admin", "analyst", "responder"],
  "/reports":     ["admin", "analyst"],
  "/admin":       ["admin"],
};

export const canAccess = (path: string, role: Role | undefined): boolean => {
  if (!role) return false;
  const allowed = ROLE_ACCESS[path];
  return !allowed || allowed.includes(role);
};
