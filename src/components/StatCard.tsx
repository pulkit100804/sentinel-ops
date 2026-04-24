import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  icon?: LucideIcon;
  tone?: "default" | "critical" | "primary" | "warning";
  className?: string;
}
export function StatCard({ label, value, delta, icon: Icon, tone = "default", className }: StatCardProps) {
  const toneBg = {
    default:  "from-surface-2 to-surface-1",
    primary:  "from-primary/10 to-surface-1",
    critical: "from-destructive/15 to-surface-1",
    warning:  "from-severity-moderate/15 to-surface-1",
  }[tone];
  const iconColor = {
    default:  "text-muted-foreground",
    primary:  "text-primary",
    critical: "text-destructive",
    warning:  "text-severity-moderate",
  }[tone];
  return (
    <div className={cn("group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br p-5 shadow-card transition-all hover:border-border", toneBg, className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={cn("rounded-lg border border-border/60 bg-background/60 p-2", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {typeof delta === "number" && (
        <div className={cn("mt-3 inline-flex items-center gap-1 text-xs", delta >= 0 ? "text-primary" : "text-destructive")}>
          {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span className="font-mono">{delta >= 0 ? "+" : ""}{delta}% vs last 24h</span>
        </div>
      )}
    </div>
  );
}
