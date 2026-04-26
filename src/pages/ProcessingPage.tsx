import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Circle, Cpu, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAnalysis } from "@/context/AnalysisContext";
import { toast } from "@/hooks/use-toast";

const STEPS = [
  "Uploading to inference server",
  "Preprocessing image",
  "Running inference",
  "Postprocessing mask",
  "Generating output",
];

export default function ProcessingPage() {
  const navigate = useNavigate();
  const { upload, setPrediction } = useAnalysis();
  const [pct, setPct] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!upload) {
      navigate("/upload");
      return;
    }

    let active = true;
    api.predict(upload.upload_id, (label, p) => {
      if (!active) return;
      setPct(p);
      const idx = STEPS.findIndex(s => label.startsWith(s));
      if (idx >= 0) setStepIdx(idx);
    })
    .then(pred => { if (!active) return; setPrediction(pred); setDone(true); })
    .catch(err => toast({ title: "Inference failed", description: (err as Error).message, variant: "destructive" }));

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STEP 02 · INFERENCE"
        title="Processing model"
        description="Running disaster damage segmentation. Please wait — this typically completes in a few seconds."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="glass-panel relative overflow-hidden p-6">
          <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-primary">
              <Cpu className="h-3.5 w-3.5" /> unet-disaster-v1.0 · {typeof window !== "undefined" ? "Processing" : ""}
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div className="font-display text-6xl font-semibold tabular-nums">{pct}%</div>
              {!done ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <CheckCircle2 className="h-6 w-6 text-primary" />}
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div className="h-full bg-gradient-primary transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">{STEPS[stepIdx]}…</p>

            {done && (
              <Button onClick={() => navigate("/comparison")} className="mt-6 w-full bg-gradient-primary shadow-elegant">
                View Results <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="font-display text-base font-semibold">Pipeline Steps</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Live execution trace</p>
          <ol className="mt-5 space-y-3">
            {STEPS.map((s, i) => {
              const state = i < stepIdx ? "done" : i === stepIdx ? (done ? "done" : "active") : "pending";
              return (
                <li key={s} className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface-2/50 px-3 py-2.5">
                  {state === "done" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  {state === "active" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {state === "pending" && <Circle className="h-4 w-4 text-muted-foreground/50" />}
                  <span className={state === "pending" ? "text-sm text-muted-foreground" : "text-sm font-medium"}>{s}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{state.toUpperCase()}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
