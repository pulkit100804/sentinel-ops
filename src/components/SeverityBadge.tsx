import { cn } from "@/lib/utils";

type Level = "low" | "moderate" | "high" | "critical";
const map: Record<Level, { label: string; cls: string }> = {
  low:      { label: "Low",      cls: "bg-severity-low/15 text-severity-low border-severity-low/30" },
  moderate: { label: "Moderate", cls: "bg-severity-moderate/15 text-severity-moderate border-severity-moderate/30" },
  high:     { label: "High",     cls: "bg-severity-high/15 text-severity-high border-severity-high/30" },
  critical: { label: "Critical", cls: "bg-severity-critical/15 text-severity-critical border-severity-critical/30" },
};

export function SeverityBadge({ level, className }: { level: Level; className?: string }) {
  const { label, cls } = map[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", cls, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {label}
    </span>
  );
}
