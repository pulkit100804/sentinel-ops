import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, ImagePlus, X, FileImage, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/services/api";
import { useAnalysis } from "@/context/AnalysisContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const navigate = useNavigate();
  const { setUpload, reset } = useAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const accept = (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image (JPG, PNG, TIFF).", variant: "destructive" });
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 25 MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) accept(f);
  }, []);

  const runAnalysis = async () => {
    if (!file) return;
    setUploading(true);
    reset();
    try {
      const res = await api.upload(file);
      setUpload(res);
      toast({ title: "Upload complete", description: "Queued for inference." });
      navigate("/processing");
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="STEP 01 · INGEST"
        title="Upload Disaster Imagery"
        description="Submit a single before/after satellite or aerial image. Supported: JPG, PNG, TIFF · max 25 MB."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "relative flex min-h-[360px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-surface-1/60 p-8 text-center transition-all",
            dragging ? "border-primary bg-primary/5 shadow-elegant" : "border-border/60",
            preview && "p-4"
          )}
        >
          {preview ? (
            <div className="relative w-full">
              <img src={preview} alt="Upload preview" className="mx-auto max-h-[420px] w-full rounded-lg object-contain" />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute right-2 top-2 rounded-full border border-border bg-background/80 p-1.5 backdrop-blur hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Remove"
              ><X className="h-4 w-4" /></button>
              <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><FileImage className="h-3.5 w-3.5" />{file?.name}</span>
                <span>{((file?.size ?? 0) / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-full bg-gradient-primary p-4 shadow-elegant">
                <ImagePlus className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold">Drop image here</h3>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse your files</p>
              <label className="mt-5">
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && accept(e.target.files[0])} />
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-surface-2 px-4 py-2 text-sm hover:border-primary hover:text-primary">
                  <UploadIcon className="h-4 w-4" /> Browse files
                </span>
              </label>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5">
            <h3 className="font-display text-base font-semibold">Inference Pipeline</h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">What happens next</p>
            <ol className="mt-4 space-y-3">
              {[
                ["Preprocessing",  "Resize, normalize, tensor conversion"],
                ["Model inference", "PyTorch damage-seg-v1.2.pth · CUDA"],
                ["Postprocessing",  "Mask thresholding & class mapping"],
                ["Severity scoring","Damage %, risk level, regions"],
              ].map(([title, sub], i) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface-2 font-mono text-[10px]">{i+1}</span>
                  <div>
                    <div className="text-sm font-medium">{title}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{sub}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Button disabled={!file || uploading} onClick={runAnalysis} className="h-12 w-full bg-gradient-primary text-sm font-semibold shadow-elegant hover:opacity-95">
            {uploading ? (<><Zap className="mr-2 h-4 w-4 animate-pulse" />Uploading…</>) : (<><Play className="mr-2 h-4 w-4" />Run Analysis</>)}
          </Button>
        </div>
      </div>
    </div>
  );
}
