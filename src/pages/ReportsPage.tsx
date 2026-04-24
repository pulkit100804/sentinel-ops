import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileJson, FileSpreadsheet, Eye } from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useAnalysis } from "@/context/AnalysisContext";
import { SAMPLE_ASSETS } from "@/services/mockApi";
import { toast } from "@/hooks/use-toast";

const HISTORY = [
  { id: "RPT-2041", region: "Coastal Sector A", date: "2025-04-24 14:22", severity: "critical", dmg: 92 },
  { id: "RPT-2040", region: "East Harbor",      date: "2025-04-24 13:48", severity: "high",     dmg: 78 },
  { id: "RPT-2039", region: "Downtown Grid",    date: "2025-04-24 12:01", severity: "high",     dmg: 74 },
  { id: "RPT-2038", region: "Industrial Park",  date: "2025-04-23 18:34", severity: "moderate", dmg: 58 },
  { id: "RPT-2037", region: "North Ridge",      date: "2025-04-23 09:12", severity: "low",      dmg: 24 },
];

export default function ReportsPage() {
  const { prediction } = useAnalysis();
  const downloadJSON = () => {
    const payload = prediction ?? { note: "No active analysis — run one from Upload." };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sentinel-report.json"; a.click();
    toast({ title: "Report downloaded", description: "sentinel-report.json" });
  };
  const downloadPDF = () => toast({ title: "PDF export queued", description: "Hook /reports/:id to your backend to deliver final PDF." });
  const downloadCSV = () => {
    const rows = [["id","region","date","severity","damage_pct"], ...HISTORY.map(h => [h.id,h.region,h.date,h.severity,h.dmg])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "sentinel-history.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STEP 07 · EXPORT"
        title="Reports & Export"
        description="Generate downloadable incident reports and export structured analysis data."
        actions={
          <>
            <Button variant="outline" onClick={downloadCSV} className="border-border/60"><FileSpreadsheet className="mr-1 h-4 w-4" />CSV</Button>
            <Button variant="outline" onClick={downloadJSON} className="border-border/60"><FileJson className="mr-1 h-4 w-4" />JSON</Button>
            <Button onClick={downloadPDF} className="bg-gradient-primary shadow-elegant"><Download className="mr-1 h-4 w-4" />Export PDF</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass-panel overflow-hidden p-0">
          <div className="relative">
            <img src={prediction?.mask_url ?? SAMPLE_ASSETS.mask} alt="Report preview" className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="font-mono text-[10px] tracking-widest text-primary">INCIDENT REPORT · {prediction?.id ?? "RPT-2041"}</div>
              <h3 className="mt-1 font-display text-xl font-semibold">Coastal Sector A — Damage Assessment</h3>
              <p className="mt-1 text-sm text-muted-foreground">Generated {new Date().toLocaleString()} · Model damage-seg-v1.2</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-0 border-t border-border/40">
            {[
              { k: "Severity", v: prediction?.severity_score ?? 78 },
              { k: "Damage %", v: `${prediction?.damage_percentage ?? 62.4}%` },
              { k: "Buildings", v: prediction?.buildings_damaged ?? 327 },
              { k: "Population", v: (prediction?.estimated_population ?? 8420).toLocaleString() },
            ].map(x => (
              <div key={x.k} className="border-r border-border/40 p-4 last:border-r-0">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{x.k}</div>
                <div className="mt-1 font-display text-lg font-semibold">{x.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="font-display text-base font-semibold">Report History</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Last 5 reports</p>
          <div className="mt-4 divide-y divide-border/40">
            {HISTORY.map(h => (
              <div key={h.id} className="flex items-center gap-3 py-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{h.id}</span>
                    <SeverityBadge level={h.severity as any} />
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{h.region} · {h.date}</div>
                </div>
                <Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost"><Download className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
