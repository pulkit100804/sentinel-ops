import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { GitCompareArrows, SplitSquareVertical, AlertCircle, Layers } from "lucide-react";
import { Link } from "react-router-dom";

export default function ComparisonPage() {
  const { prediction, upload } = useAnalysis();
  const before = upload?.pre_url ?? prediction?.input_url;
  const after = upload?.post_url ?? prediction?.post_url;
  const heatmap = prediction?.heatmap_url;
  const [pos, setPos] = useState(50);
  const [mode, setMode] = useState<"slider" | "split">("slider");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState(70);

  if (!before || !after) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="STEP 03 · COMPARISON" title="Before vs After" description="Run an analysis first to see comparison results." />
        <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display text-lg font-semibold">No Analysis Available</h3>
          <p className="mt-2 text-sm text-muted-foreground">Upload an image and run inference to generate comparison results.</p>
          <Button asChild className="mt-4 bg-gradient-primary"><Link to="/upload">Go to Upload →</Link></Button>
        </div>
      </div>
    );
  }

  // Determine what "after" view to show
  const afterView = showHeatmap && heatmap ? heatmap : after;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STEP 03 · COMPARISON"
        title="Before vs After"
        description="Drag the slider to reveal the predicted disaster impact. Toggle heatmap overlay to see damage distribution."
        actions={
          <>
            <Button size="sm" variant={mode === "slider" ? "default" : "outline"} onClick={() => setMode("slider")} className={mode === "slider" ? "bg-gradient-primary" : "border-border/60"}>
              <GitCompareArrows className="mr-1 h-3.5 w-3.5" />Slider
            </Button>
            <Button size="sm" variant={mode === "split"  ? "default" : "outline"} onClick={() => setMode("split")}  className={mode === "split"  ? "bg-gradient-primary" : "border-border/60"}>
              <SplitSquareVertical className="mr-1 h-3.5 w-3.5" />Split
            </Button>
            {heatmap && (
              <Button size="sm" variant={showHeatmap ? "default" : "outline"} onClick={() => setShowHeatmap(v => !v)} className={showHeatmap ? "bg-gradient-primary" : "border-border/60"}>
                <Layers className="mr-1 h-3.5 w-3.5" />{showHeatmap ? "Heatmap On" : "Heatmap Off"}
              </Button>
            )}
            <Button asChild size="sm" variant="outline" className="border-border/60"><Link to="/damage">Damage View →</Link></Button>
          </>
        }
      />

      {mode === "slider" ? (
        <div className="glass-panel overflow-hidden p-0">
          <div className="relative aspect-[16/10] w-full select-none">
            <img src={afterView} alt="After" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pos}%` }}>
              <img src={before} alt="Before" className="absolute inset-y-0 left-0 h-full w-[100vw] max-w-none object-cover" style={{ width: `${100 / (pos / 100)}%` }} />
            </div>
            <div className="absolute inset-y-0 z-10" style={{ left: `${pos}%` }}>
              <div className="h-full w-0.5 bg-primary shadow-[0_0_20px_hsl(var(--primary))]" />
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background p-1.5 shadow-elegant">
                <GitCompareArrows className="h-4 w-4 text-primary" />
              </div>
            </div>
            <span className="absolute left-3 top-3 rounded-md border border-border/60 bg-background/80 px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur">PRE-DISASTER</span>
            <span className="absolute right-3 top-3 rounded-md border border-destructive/40 bg-destructive/20 px-2 py-1 font-mono text-[10px] tracking-widest text-destructive backdrop-blur">
              {showHeatmap ? "HEATMAP" : "POST-DISASTER"}
            </span>
            <input
              type="range" min={0} max={100} value={pos} onChange={e => setPos(+e.target.value)}
              className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
              aria-label="Comparison slider"
            />
          </div>
          {showHeatmap && (
            <div className="flex items-center gap-3 border-t border-border/40 bg-background/70 p-3 backdrop-blur">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">HEATMAP OPACITY</span>
              <input type="range" min={0} max={100} value={heatmapOpacity} onChange={e => setHeatmapOpacity(+e.target.value)} className="flex-1 accent-primary" />
              <span className="w-10 text-right font-mono text-xs">{heatmapOpacity}%</span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-panel overflow-hidden p-0">
            <div className="relative">
              <img src={before} alt="Before" className="aspect-[4/3] w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-md border border-border/60 bg-background/80 px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur">PRE-DISASTER</span>
            </div>
          </div>
          <div className="glass-panel overflow-hidden p-0">
            <div className="relative">
              <img src={afterView} alt="After" className="aspect-[4/3] w-full object-cover" />
              <span className="absolute right-3 top-3 rounded-md border border-destructive/40 bg-destructive/20 px-2 py-1 font-mono text-[10px] tracking-widest text-destructive backdrop-blur">
                {showHeatmap ? "HEATMAP" : "POST-DISASTER"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
