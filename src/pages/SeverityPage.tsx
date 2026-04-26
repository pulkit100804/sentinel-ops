import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useAnalysis } from "@/context/AnalysisContext";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Activity, AlertTriangle, Gauge, Building2, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function SeverityPage() {
  const { prediction } = useAnalysis();

  if (!prediction) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="STEP 05 · ANALYTICS" title="Severity Analytics" description="Run an analysis first to see severity data." />
        <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display text-lg font-semibold">No Analysis Available</h3>
          <p className="mt-2 text-sm text-muted-foreground">Upload an image and run inference to generate severity analytics.</p>
          <Button asChild className="mt-4 bg-gradient-primary"><Link to="/upload">Go to Upload →</Link></Button>
        </div>
      </div>
    );
  }

  const score = prediction.severity_score;
  const risk = prediction.risk_level as "low" | "moderate" | "high" | "critical";
  const dist = prediction.class_distribution;
  const regions = prediction.regions;
  const regionData = regions.length
    ? regions.map(r => ({ name: r.name.split(" ")[0], severity: r.severity }))
    : [];

  const criticalCount = regions.filter(r => r.severity >= 85).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STEP 05 · ANALYTICS"
        title="Severity Analytics"
        description="Quantified damage distribution, region-level severity, and overall risk level."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Severity Score"       value={score}                             icon={Gauge}         tone="critical" />
        <StatCard label="Damage Percentage"    value={`${prediction.damage_percentage}%`} icon={Activity}  tone="warning" />
        <StatCard label="Buildings Damaged"    value={prediction.buildings_damaged} icon={Building2}    tone="critical" />
        <StatCard label="Estimated Population" value={prediction.estimated_population.toLocaleString()} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel p-5">
          <h3 className="font-display text-base font-semibold">Risk Level</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Composite score</p>
          <div className="relative mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "severity", value: score, fill: "hsl(var(--severity-critical))" }]} startAngle={220} endAngle={-40}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: "hsl(var(--surface-3))" }} dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-5xl font-semibold tabular-nums">{score}</div>
              <div className="mt-1"><SeverityBadge level={risk} /></div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 lg:col-span-2">
          <h3 className="font-display text-base font-semibold">Damage Class Distribution</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pixel-level classification</p>
          <div className="mt-2 grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dist} dataKey="value" nameKey="label" innerRadius={52} outerRadius={80} strokeWidth={0}>
                    {dist.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 self-center">
              {dist.map(d => (
                <li key={d.label} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded" style={{ background: d.color }} />
                  <span className="flex-1 text-sm">{d.label}</span>
                  <span className="font-mono text-xs tabular-nums">{d.value.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {regionData.length > 0 && (
        <div className="glass-panel p-5">
          <h3 className="font-display text-base font-semibold">Severity by Region</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Top affected zones</p>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "hsl(var(--surface-3))" }} />
                <Bar dataKey="severity" radius={[6, 6, 0, 0]}>
                  {regionData.map((r, i) => (
                    <Cell key={i} fill={r.severity >= 85 ? "hsl(var(--severity-critical))" : r.severity >= 65 ? "hsl(var(--severity-high))" : r.severity >= 40 ? "hsl(var(--severity-moderate))" : "hsl(var(--severity-low))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {criticalCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          <div className="text-sm">
            <div className="font-medium text-destructive">Critical severity detected in {criticalCount} region{criticalCount > 1 ? "s" : ""}</div>
            <div className="mt-0.5 text-muted-foreground">Immediate relief dispatch is recommended. Proceed to Relief Planning for suggested actions.</div>
          </div>
        </div>
      )}
    </div>
  );
}
