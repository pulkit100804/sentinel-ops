import { PageHeader } from "@/components/PageHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Ambulance, Truck, HeartPulse, Home, Radio, Droplets, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ACTIONS = [
  { icon: Ambulance,  title: "Dispatch Medical Teams", desc: "3 emergency medical units to Coastal Sector A", priority: "critical", eta: "12 min" },
  { icon: HeartPulse, title: "Establish Triage Zone",  desc: "Near North Ridge — est. capacity 200 casualties", priority: "high", eta: "25 min" },
  { icon: Home,       title: "Setup Emergency Shelter",desc: "Allocate 450 beds at Downtown Community Center",  priority: "high", eta: "40 min" },
  { icon: Truck,      title: "Deploy Relief Supplies", desc: "Food, blankets, medical kits to affected zones",    priority: "moderate", eta: "1h 10m" },
  { icon: Droplets,   title: "Restore Water Supply",   desc: "Coordinate with utilities — 2 pumping stations down", priority: "moderate", eta: "3h" },
  { icon: Radio,      title: "Activate Comms Relay",   desc: "Mobile tower deployment to Harbor — cell outage", priority: "high", eta: "45 min" },
] as const;

const RESOURCES = [
  { label: "Medical Personnel", used: 42, total: 120 },
  { label: "Rescue Vehicles",   used: 18, total: 45 },
  { label: "Shelter Beds",      used: 320, total: 800 },
  { label: "Food Rations (kg)", used: 1800, total: 5000 },
];

export default function ReliefPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STEP 06 · RESPONSE"
        title="Relief Planning"
        description="Recommended response actions generated from current severity assessment."
        actions={<Button asChild className="bg-gradient-primary shadow-elegant"><Link to="/reports">Generate Dispatch Report <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ACTIONS.map(a => (
          <div key={a.title} className="glass-panel group p-5 transition-all hover:border-primary/50 hover:shadow-elegant">
            <div className="flex items-start justify-between">
              <div className="rounded-lg border border-border/60 bg-surface-2 p-2 text-primary"><a.icon className="h-4 w-4" /></div>
              <SeverityBadge level={a.priority as any} />
            </div>
            <h3 className="mt-3 font-display text-base font-semibold">{a.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">ETA {a.eta}</span>
              <Button size="sm" variant="ghost" className="-mr-2">Dispatch →</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass-panel p-5">
          <h3 className="font-display text-base font-semibold">Resource Allocation</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Currently deployed vs available</p>
          <div className="mt-4 space-y-4">
            {RESOURCES.map(r => {
              const pct = Math.round((r.used / r.total) * 100);
              return (
                <div key={r.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{r.label}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">{r.used.toLocaleString()} / {r.total.toLocaleString()} <span className="text-primary">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="font-display text-base font-semibold">Emergency Response Summary</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Active operation overview</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { icon: Users,       k: "Field personnel", v: "128" },
              { icon: Truck,       k: "Vehicles deployed", v: "42" },
              { icon: HeartPulse,  k: "Casualties treated",v: "87" },
              { icon: Home,        k: "People sheltered",  v: "612" },
            ].map(s => (
              <div key={s.k} className="rounded-lg border border-border/50 bg-surface-2/60 p-3">
                <s.icon className="h-4 w-4 text-primary" />
                <div className="mt-2 font-display text-xl font-semibold">{s.v}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
