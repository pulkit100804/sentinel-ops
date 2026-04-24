import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import type { PredictionResult, UploadResult } from "@/services/api";

interface AnalysisState {
  upload: UploadResult | null;
  prediction: PredictionResult | null;
  setUpload: (u: UploadResult | null) => void;
  setPrediction: (p: PredictionResult | null) => void;
  reset: () => void;
}
const Ctx = createContext<AnalysisState | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const value = useMemo(() => ({
    upload, prediction, setUpload, setPrediction,
    reset: () => { setUpload(null); setPrediction(null); },
  }), [upload, prediction]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAnalysis() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAnalysis must be used within AnalysisProvider");
  return c;
}
