import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { SAMPLE_ASSETS } from "@/services/mockApi";
import { GitCompareArrows, SplitSquareVertical } from "lucide-react";
import { Link } from "react-router-dom";

export default function ComparisonPage() {
  const { prediction } = useAnalysis();
  const before = SAMPLE_ASSETS.before;
  const after = prediction?.output_url ?? SAMPLE_ASSETS.after;
  const [pos, setPos] = useState(50);
  const [mode, setMode] = useState<"slider" | "split">("slider");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STEP 03 · COMPARISON"
        title="Before vs After"
        description="Drag the slider to reveal the predicted disaster impact overlaid on the original scene."
        actions={
          <>
            <Button size="sm" variant={mode === "slider" ? "default" : "outline"} onClick={() => setMode("slider")} className={mode === "slider" ? "bg-gradient-primary" : "border-border/60"}>
              <GitCompareArrows className="mr-1 h-3.5 w-3.5" />Slider
            </Button>
            <Button size="sm" variant={mode === "split"  ? "default" : "outline"} onClick={() => setMode("split")}  className={mode === "split"  ? "bg-gradient-primary" : "border-border/60"}>
              <SplitSquareVertical className="mr-1 h-3.5 w-3.5" />Split
            </Button>
            <Button asChild size="sm" variant="outline" className="border-border/60"><Link to="/damage">Damage View →</Link></Button>
          </>
        }
      />

      {mode === "slider" ? (
        <div className="glass-panel overflow-hidden p-0">
          <div className="relative aspect-[16/10] w-full select-none">
            <img src={after} alt="After" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pos}%` }}>
              <img src={before} alt="Before" className="absolute inset-y-0 left-0 h-full w-[100vw] max-w-none object-cover" style={{ width: `${100 / (pos / 100)}%` }} />
            </div>
            <div className="absolute inset-y-0 z-10" style={{ left: `${pos}%` }}>
              <div className="h-full w-0.5 bg-primary shadow-[0_0_20px_hsl(var(--primary))]" />
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background p-1.5 shadow-elegant">
                <GitCompareArrows className="h-4 w-4 text-primary" />
              </div>
            </div>
            <span className="absolute left-3 top-3 rounded-md border border-border/60 bg-background/80 px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur">BEFORE</span>
            <span className="absolute right-3 top-3 rounded-md border border-destructive/40 bg-destructive/20 px-2 py-1 font-mono text-[10px] tracking-widest text-destructive backdrop-blur">AFTER</span>
            <input
              type="range" min={0} max={100} value={pos} onChange={e => setPos(+e.target.value)}
              className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
              aria-label="Comparison slider"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-panel overflow-hidden p-0">
            <div className="relative">
              <img src={before} alt="Before" className="aspect-[4/3] w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-md border border-border/60 bg-background/80 px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur">BEFORE</span>
            </div>
          </div>
          <div className="glass-panel overflow-hidden p-0">
            <div className="relative">
              <img src={after} alt="After" className="aspect-[4/3] w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-md border border-destructive/40 bg-destructive/20 px-2 py-1 font-mono text-[10px] tracking-widest text-destructive backdrop-blur">AFTER</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
