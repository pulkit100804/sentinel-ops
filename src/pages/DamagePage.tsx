import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Layers, Eye, EyeOff, MapPin, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function DamagePage() {
  const { prediction, upload } = useAnalysis();
  const [opacity, setOpacity] = useState(75);
  const [show, setShow] = useState(true);
  const [viewMode, setViewMode] = useState<"mask" | "heatmap">("heatmap");

  if (!prediction) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="STEP 04 · DAMAGE VIEW" title="Affected Regions" description="Run an analysis first to see damage results." />
        <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display text-lg font-semibold">No Analysis Available</h3>
          <p className="mt-2 text-sm text-muted-foreground">Upload an image and run inference to see damage regions.</p>
          <Button asChild className="mt-4 bg-gradient-primary"><Link to="/upload">Go to Upload →</Link></Button>
        </div>
      </div>
    );
  }

  // Use the post-disaster image as the base
  const base = upload?.post_url ?? prediction?.post_url ?? prediction?.input_url;
  const mask = prediction.mask_url;
  const heatmap = prediction.heatmap_url;
  const overlayImg = viewMode === "heatmap" && heatmap ? heatmap : mask;
  const regions = prediction.regions ?? [];
  const severityLevel = (s: number) => s >= 85 ? "critical" : s >= 65 ? "high" : s >= 40 ? "moderate" : "low";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STEP 04 · DAMAGE VIEW"
        title="Affected Regions"
        description="Predicted segmentation mask highlights damaged structures across the scene."
        actions={
          <div className="flex gap-2">
            {heatmap && (
              <>
                <Button size="sm" variant={viewMode === "heatmap" ? "default" : "outline"} onClick={() => setViewMode("heatmap")} className={viewMode === "heatmap" ? "bg-gradient-primary" : "border-border/60"}>
                  <Layers className="mr-1 h-3.5 w-3.5" />Heatmap
                </Button>
                <Button size="sm" variant={viewMode === "mask" ? "default" : "outline"} onClick={() => setViewMode("mask")} className={viewMode === "mask" ? "bg-gradient-primary" : "border-border/60"}>
                  <Layers className="mr-1 h-3.5 w-3.5" />Mask
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => setShow(v => !v)} className="border-border/60">
              {show ? <><EyeOff className="mr-1 h-3.5 w-3.5" />Hide Overlay</> : <><Eye className="mr-1 h-3.5 w-3.5" />Show Overlay</>}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass-panel overflow-hidden p-0">
          <div className="relative aspect-[16/10]">
            <img src={base} alt="Post-disaster base" className="absolute inset-0 h-full w-full object-cover" />
            {show && (
              <img
                src={overlayImg}
                alt={viewMode === "heatmap" ? "Heatmap overlay" : "Damage mask"}
                className="absolute inset-0 h-full w-full object-cover mix-blend-screen transition-opacity"
                style={{ opacity: viewMode === "heatmap" ? 1 : opacity / 100 }}
              />
            )}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 border-t border-border/40 bg-background/70 p-3 backdrop-blur">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">OVERLAY OPACITY</span>
              <input type="range" min={0} max={100} value={opacity} onChange={e => setOpacity(+e.target.value)} className="flex-1 accent-primary" />
              <span className="w-10 text-right font-mono text-xs">{opacity}%</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="font-display text-base font-semibold">Region Breakdown</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Geo-tagged damage hotspots</p>
          {regions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No significant damage regions detected.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {regions.sort((a,b) => b.severity - a.severity).map(r => (
                <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface-2/60 p-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{r.name}</span>
                      <SeverityBadge level={severityLevel(r.severity) as any} />
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">{r.lat.toFixed(3)}, {r.lng.toFixed(3)}</div>
                  </div>
                  <div className="font-display text-lg font-semibold tabular-nums">{r.severity}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg border border-border/50 bg-surface-2/60 p-3">
            {[
              { c: "bg-severity-low", l: "No damage" },
              { c: "bg-severity-moderate", l: "Minor" },
              { c: "bg-severity-high", l: "Major" },
              { c: "bg-severity-critical", l: "Destroyed" },
            ].map(x => (
              <div key={x.l} className="flex flex-col items-center gap-1">
                <span className={`h-2.5 w-full rounded ${x.c}`} />
                <span className="font-mono text-[9px] text-muted-foreground">{x.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
