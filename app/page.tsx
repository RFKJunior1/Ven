"use client";

import { useState, useCallback } from "react";
import DropZone from "@/components/DropZone";
import ResultsDashboard, { PersonaReaction } from "@/components/ResultsDashboard";
import { personas } from "@/data/personas";

const MAX_CREATIVES = 6;
const TOTAL_BATCHES = 10;

export default function Home() {
  const [files, setFiles] = useState<(File | null)[]>([null, null]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reactions, setReactions] = useState<Map<number, PersonaReaction>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const filledCount = files.filter(Boolean).length;
  const canAnalyze = filledCount >= 1 && !isAnalyzing;

  const setFile = useCallback((index: number, file: File | null) => {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    setError(null);
  }, []);

  const addSlot = () => {
    if (files.length < MAX_CREATIVES) setFiles((f) => [...f, null]);
  };

  const removeSlot = (index: number) => {
    if (files.length <= 1) return;
    setFiles((f) => f.filter((_, i) => i !== index));
  };

  const runAnalysis = async () => {
    const filled = files.filter(Boolean) as File[];
    if (filled.length === 0) return;

    setIsAnalyzing(true);
    setProgress(0);
    setReactions(new Map());
    setError(null);
    setAnalysisComplete(false);

    const formData = new FormData();
    // Only submit filled slots, in order
    let imgIndex = 0;
    for (const file of files) {
      if (file) formData.append(`image${imgIndex++}`, file);
    }

    try {
      const response = await fetch("/api/analyze", { method: "POST", body: formData });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as {
              batch?: number;
              results?: PersonaReaction[];
              error?: string;
            };

            if (parsed.results && Array.isArray(parsed.results)) {
              setReactions((prev) => {
                const next = new Map(prev);
                for (const r of parsed.results!) next.set(r.personaId, r);
                return next;
              });
              if (typeof parsed.batch === "number") {
                setProgress(Math.round(((parsed.batch + 1) / TOTAL_BATCHES) * 100));
              }
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      setAnalysisComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setProgress(100);
    }
  };

  // Grid columns based on count
  const count = files.length;
  const gridCols =
    count === 1 ? "grid-cols-1"
    : count === 2 ? "grid-cols-2"
    : count === 4 ? "grid-cols-2"
    : "grid-cols-3";

  const gridMaxW =
    count === 1 ? "max-w-sm"
    : count === 2 ? "max-w-2xl"
    : count === 4 ? "max-w-3xl"
    : "max-w-5xl";

  const numFilledCreatives = files.filter(Boolean).length;

  return (
    <main className="min-h-screen" style={{ background: "#0A0A0B" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-20">
          <h1
            className="text-7xl sm:text-8xl font-black tracking-tight"
            style={{ color: "#E8E8F0", letterSpacing: "-0.04em" }}
          >
            VENDETTA
          </h1>
          <p className="text-xs font-medium tracking-widest uppercase mt-2" style={{ color: "#6B6B7E" }}>
            100 minds. One truth.
          </p>
          <div className="w-12 h-px mt-5" style={{ background: "#C8102E" }} />
        </div>

        {/* Drop Zones */}
        <div className={`grid ${gridCols} gap-5 ${gridMaxW} mx-auto`}>
          {files.map((file, i) => (
            <DropZone
              key={i}
              index={i}
              file={file}
              onFileChange={(f) => setFile(i, f)}
              onRemove={() => removeSlot(i)}
              canRemove={files.length > 1}
            />
          ))}

          {/* Add slot */}
          {files.length < MAX_CREATIVES && (
            <button
              onClick={addSlot}
              className="rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer"
              style={{
                border: "1px dashed #1E1E24",
                minHeight: "200px",
                background: "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A32")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E1E24")}
            >
              <span className="text-2xl font-thin" style={{ color: "#2A2A32" }}>+</span>
              <span className="text-xs tracking-widest" style={{ color: "#2A2A32" }}>
                add creative
              </span>
            </button>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 mt-12 mb-20">
          {error && (
            <div
              className="px-4 py-3 rounded-lg text-xs max-w-md text-center"
              style={{ background: "#1A0A0A", border: "1px solid #8B0B20", color: "#E8A0A0" }}
            >
              {error}
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={!canAnalyze}
            className="px-12 py-3.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-200"
            style={{
              background: canAnalyze
                ? "linear-gradient(135deg, #C8102E, #8B0B20)"
                : "#111114",
              color: canAnalyze ? "#FFFFFF" : "#2A2A32",
              cursor: canAnalyze ? "pointer" : "not-allowed",
              letterSpacing: "0.15em",
              boxShadow: canAnalyze ? "0 0 40px rgba(200,16,46,0.25)" : "none",
              border: canAnalyze ? "none" : "1px solid #1E1E24",
            }}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
                  <path d="M12 3a9 9 0 019 9" />
                </svg>
                analyzing
              </span>
            ) : analysisComplete ? (
              "run again"
            ) : (
              "run analysis"
            )}
          </button>

          {!canAnalyze && !isAnalyzing && (
            <p className="text-xs" style={{ color: "#2A2A32" }}>
              drop at least one creative to begin
            </p>
          )}
        </div>

        {/* Results */}
        {(isAnalyzing || analysisComplete) && (
          <div className="border-t pt-12" style={{ borderColor: "#1E1E24" }}>
            <ResultsDashboard
              personas={personas}
              reactions={reactions}
              isAnalyzing={isAnalyzing}
              progress={progress}
              numCreatives={numFilledCreatives || 1}
            />
          </div>
        )}
      </div>
    </main>
  );
}
