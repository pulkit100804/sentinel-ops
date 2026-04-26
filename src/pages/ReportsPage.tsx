import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileJson, FileSpreadsheet, Eye, AlertCircle } from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useAnalysis } from "@/context/AnalysisContext";
import { api, PredictionResult } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function ReportsPage() {
  const { prediction } = useAnalysis();
  const [history, setHistory] = useState<PredictionResult[]>([]);

  useEffect(() => {
    api.results().then(setHistory).catch(() => setHistory([]));
  }, []);

  const downloadJSON = () => {
    const payload = prediction ?? { note: "No active analysis — run one from Upload." };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sentinel-report.json"; a.click();
    toast({ title: "Report downloaded", description: "sentinel-report.json" });
  };

  const downloadPDF = () => {
    if (prediction?.id) {
      api.report(prediction.id)
        .then(data => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `sentinel-report-${prediction.id}.json`; a.click();
          toast({ title: "Report exported", description: `Report ${prediction.id}` });
        })
        .catch(() => toast({ title: "Export failed", variant: "destructive" }));
    } else {
      toast({ title: "No active analysis", description: "Run an analysis first.", variant: "destructive" });
    }
  };

  const downloadCSV = () => {
    if (history.length === 0) {
      toast({ title: "No data", description: "No analysis history to export.", variant: "destructive" });
      return;
    }
    const rows = [
      ["id", "upload_id", "severity_score", "damage_pct", "risk_level", "buildings_damaged", "timestamp"],
      ...history.map(h => [h.id, h.upload_id, h.severity_score, h.damage_percentage, h.risk_level, h.buildings_damaged, h.metadata?.timestamp ?? ""])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "sentinel-history.csv"; a.click();
    toast({ title: "CSV exported" });
  };

  const severityLevel = (score: number) => score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "moderate" : "low";

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
            <Button onClick={downloadPDF} className="bg-gradient-primary shadow-elegant"><Download className="mr-1 h-4 w-4" />Export Report</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {prediction ? (
          <div className="glass-panel overflow-hidden p-0">
            <div className="relative">
              <img src={prediction.mask_url} alt="Report preview" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="font-mono text-[10px] tracking-widest text-primary">INCIDENT REPORT · {prediction.id}</div>
                <h3 className="mt-1 font-display text-xl font-semibold">Damage Assessment</h3>
                <p className="mt-1 text-sm text-muted-foreground">Generated {new Date(prediction.metadata?.timestamp ?? Date.now()).toLocaleString()} · Model {prediction.metadata?.model_version}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-0 border-t border-border/40">
              {[
                { k: "Severity", v: prediction.severity_score },
                { k: "Damage %", v: `${prediction.damage_percentage}%` },
                { k: "Buildings", v: prediction.buildings_damaged },
                { k: "Population", v: prediction.estimated_population.toLocaleString() },
              ].map(x => (
                <div key={x.k} className="border-r border-border/40 p-4 last:border-r-0">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{x.k}</div>
                  <div className="mt-1 font-display text-lg font-semibold">{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-display text-lg font-semibold">No Active Analysis</h3>
            <p className="mt-2 text-sm text-muted-foreground">Run an analysis to generate a report.</p>
            <Button asChild className="mt-4 bg-gradient-primary"><Link to="/upload">Go to Upload →</Link></Button>
          </div>
        )}

        <div className="glass-panel p-5">
          <h3 className="font-display text-base font-semibold">Report History</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">From database</p>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No past analyses found. Run your first analysis to see history here.</p>
          ) : (
            <div className="mt-4 divide-y divide-border/40">
              {history.slice(0, 10).map(h => (
                <div key={h.id} className="flex items-center gap-3 py-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{h.id}</span>
                      <SeverityBadge level={severityLevel(h.severity_score) as any} />
                    </div>
                    <div className="truncate text-xs text-muted-foreground">Damage: {h.damage_percentage}% · {new Date(h.metadata?.timestamp ?? Date.now()).toLocaleString()}</div>
                  </div>
                  <span className="font-mono text-xs tabular-nums">{h.severity_score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
