"use client";

import { useState, useCallback } from "react";
import DropZone from "@/components/DropZone";
import ResultsDashboard, { PersonaReaction } from "@/components/ResultsDashboard";
import { personas } from "@/data/personas";

export default function Home() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reactions, setReactions] = useState<Map<number, PersonaReaction>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const canAnalyze = fileA !== null && fileB !== null && !isAnalyzing;

  const handleFileAChange = useCallback((file: File | null) => {
    setFileA(file);
    setError(null);
  }, []);

  const handleFileBChange = useCallback((file: File | null) => {
    setFileB(file);
    setError(null);
  }, []);

  const runAnalysis = async () => {
    if (!fileA || !fileB) return;

    setIsAnalyzing(true);
    setProgress(0);
    setReactions(new Map());
    setError(null);
    setAnalysisComplete(false);

    const formData = new FormData();
    formData.append("imageA", fileA);
    formData.append("imageB", fileB);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const TOTAL_BATCHES = 10;

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

            if (parsed.error && !parsed.results?.length) {
              console.warn("Batch error:", parsed.error);
              continue;
            }

            if (parsed.results && Array.isArray(parsed.results)) {
              setReactions((prev) => {
                const next = new Map(prev);
                for (const r of parsed.results!) {
                  next.set(r.personaId, r);
                }
                return next;
              });

              if (typeof parsed.batch === "number") {
                const newProgress = Math.round(((parsed.batch + 1) / TOTAL_BATCHES) * 100);
                setProgress(newProgress);
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

  const showDashboard = isAnalyzing || analysisComplete;

  return (
    <main className="min-h-screen" style={{ background: "#0A0A0B" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-6xl sm:text-7xl font-black tracking-tight mb-3"
            style={{
              color: "#E8E8F0",
              letterSpacing: "-0.03em",
            }}
          >
            VENDETTA
          </h1>
          <p
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: "#6B6B7E" }}
          >
            100 minds. One truth.
          </p>
          <div
            className="w-16 h-px mx-auto mt-6"
            style={{ background: "#C8102E" }}
          />
        </div>

        {/* Upload Section */}
        <div className="mb-10">
          <p
            className="text-xs font-bold tracking-widest uppercase text-center mb-8"
            style={{ color: "#6B6B7E" }}
          >
            Upload Your Creatives
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <DropZone
              label="First creative variant"
              file={fileA}
              onFileChange={handleFileAChange}
              variant="A"
            />
            <DropZone
              label="Second creative variant"
              file={fileB}
              onFileChange={handleFileBChange}
              variant="B"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 mb-16">
          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm max-w-md text-center"
              style={{ background: "#1A0A0A", border: "1px solid #8B0B20", color: "#E8A0A0" }}
            >
              {error}
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={!canAnalyze}
            className="relative px-10 py-4 rounded-xl text-base font-bold tracking-wide uppercase transition-all duration-200"
            style={{
              background: canAnalyze
                ? "linear-gradient(135deg, #C8102E, #8B0B20)"
                : "#1E1E24",
              color: canAnalyze ? "#FFFFFF" : "#6B6B7E",
              cursor: canAnalyze ? "pointer" : "not-allowed",
              letterSpacing: "0.1em",
              boxShadow: canAnalyze ? "0 0 30px rgba(200,16,46,0.3)" : "none",
            }}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-3">
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
                  <path d="M12 3a9 9 0 019 9" />
                </svg>
                Analyzing...
              </span>
            ) : analysisComplete ? (
              "Run Again"
            ) : (
              "Run Analysis"
            )}
          </button>

          {!fileA && !fileB && (
            <p className="text-xs" style={{ color: "#6B6B7E" }}>
              Upload both creatives to begin
            </p>
          )}
          {(fileA || fileB) && !(fileA && fileB) && (
            <p className="text-xs" style={{ color: "#6B6B7E" }}>
              Upload the {!fileA ? "first" : "second"} creative to continue
            </p>
          )}
        </div>

        {/* Results */}
        {showDashboard && (
          <div
            className="border-t pt-12"
            style={{ borderColor: "#1E1E24" }}
          >
            <ResultsDashboard
              personas={personas}
              reactions={reactions}
              isAnalyzing={isAnalyzing}
              progress={progress}
            />
          </div>
        )}
      </div>
    </main>
  );
}
