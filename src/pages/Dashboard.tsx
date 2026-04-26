import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Activity, Image as ImageIcon, MapPin, Upload, ArrowUpRight, Radar } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api, PredictionResult } from "@/services/api";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const trend = Array.from({ length: 24 }).map((_, i) => ({
  h: `${i}:00`,
  scans: Math.round(20 + Math.sin(i / 3) * 12 + Math.random() * 8),
  alerts: Math.round(5 + Math.cos(i / 4) * 3 + Math.random() * 2),
}));

export default function Dashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<PredictionResult[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.results().then(setRecent).catch(() => setRecent([]));
    api.adminSettings().then(setSettings).catch(() => {});
  }, []);

  const totalScans = recent.length;
  const highSeverity = recent.filter(r => r.severity_score >= 65).length;
  const criticalAlerts = recent.filter(r => r.risk_level === "critical").length;

  const severityLevel = (score: number) => score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "moderate" : "low";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="COMMAND CENTER"
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "Operator"}`}
        description="Real-time disaster intelligence across monitored regions."
        actions={
          <>
            <Button asChild variant="outline" className="border-border/60"><Link to="/reports"><ArrowUpRight className="mr-1 h-4 w-4" />Latest Report</Link></Button>
            <Button asChild className="bg-gradient-primary shadow-elegant"><Link to="/upload"><Upload className="mr-1 h-4 w-4" />Run New Analysis</Link></Button>
          </>
        }
      />

      {/* Stat grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Scans"         value={totalScans}    icon={ImageIcon}     tone="primary" />
        <StatCard label="Critical Alerts"     value={criticalAlerts} icon={AlertTriangle} tone="critical" />
        <StatCard label="High-Severity Cases" value={highSeverity}  icon={Activity}      tone="warning" />
        <StatCard label="Model Status"        value={settings?.model?.loaded ? "Online" : "Offline"} icon={Upload} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity chart */}
        <div className="glass-panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold">Disaster Overview · 24h</h3>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scans vs active alerts</p>
            </div>
            <div className="flex gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />SCANS</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" />ALERTS</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="h" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="scans"  stroke="hsl(var(--primary))"     fill="url(#gScans)"  strokeWidth={2} />
                <Area type="monotone" dataKey="alerts" stroke="hsl(var(--destructive))" fill="url(#gAlerts)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System status */}
        <div className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">System Status</h3>
            <Radar className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-3">
            {[
              { k: "Inference model",  v: settings?.model?.version ?? "Loading…", ok: settings?.model?.loaded ?? false },
              { k: "Device",          v: settings?.model?.device ?? "—",          ok: settings?.model?.loaded ?? false },
              { k: "API",             v: settings?.api?.healthy ? "Healthy" : "—", ok: settings?.api?.healthy ?? false },
              { k: "Storage",         v: settings ? `${settings.storage?.used_gb ?? 0} / ${settings.storage?.quota_gb ?? 0} GB` : "—", ok: true },
              { k: "Database auth",   v: settings?.features?.database_auth ? "Active" : "—", ok: settings?.features?.database_auth ?? false },
            ].map(r => (
              <div key={r.k} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                <span className="text-xs text-muted-foreground">{r.k}</span>
                <span className="flex items-center gap-2 font-mono text-[11px]">
                  <span className={"h-1.5 w-1.5 rounded-full " + (r.ok ? "bg-primary" : "bg-destructive")} /> {r.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold">Recent Activity</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Latest scans from database</p>
          </div>
          <Button variant="ghost" size="sm" asChild><Link to="/reports">View all <ArrowUpRight className="ml-1 h-3 w-3" /></Link></Button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No analyses yet. Upload an image to start.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 pr-4">ID</th><th className="pr-4">Severity</th><th className="pr-4">Damage</th><th className="pr-4">Risk</th><th className="pr-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 5).map(r => (
                  <tr key={r.id} className="border-b border-border/30 transition-colors hover:bg-surface-2/60">
                    <td className="py-3 pr-4 font-mono text-xs">{r.id}</td>
                    <td className="pr-4 font-mono text-xs">{r.severity_score}</td>
                    <td className="pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3">
                          <div className="h-full bg-gradient-primary" style={{ width: `${r.damage_percentage}%` }} />
                        </div>
                        <span className="font-mono text-xs">{r.damage_percentage}%</span>
                      </div>
                    </td>
                    <td className="pr-4"><SeverityBadge level={severityLevel(r.severity_score) as any} /></td>
                    <td className="pr-4 font-mono text-xs text-muted-foreground">{new Date(r.metadata?.timestamp ?? Date.now()).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
