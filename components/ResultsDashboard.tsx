"use client";

import PersonaCard from "./PersonaCard";
import type { Persona } from "@/data/personas";

export interface PersonaReaction {
  personaId: number;
  reactionA: string;
  reactionB: string;
  resonanceA: number;
  resonanceB: number;
  wouldConvertA: boolean;
  wouldConvertB: boolean;
  lingeringA: boolean;
  lingeringB: boolean;
  philosophicalTake: string;
}

interface ResultsDashboardProps {
  personas: Persona[];
  reactions: Map<number, PersonaReaction>;
  isAnalyzing: boolean;
  progress: number;
}

function StatCard({
  label,
  valueA,
  valueB,
  format,
}: {
  label: string;
  valueA: number;
  valueB: number;
  format: "number" | "percent";
}) {
  const fmtA = format === "percent" ? `${valueA.toFixed(0)}%` : valueA.toFixed(1);
  const fmtB = format === "percent" ? `${valueB.toFixed(0)}%` : valueB.toFixed(1);

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: "#16161A", border: "1px solid #1E1E24" }}
    >
      <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "#6B6B7E" }}>
        {label}
      </p>
      <div className="flex items-end gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-wider" style={{ color: "#C8102E" }}>
            A
          </span>
          <span className="text-2xl font-bold text-vendetta-text">{fmtA}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-wider" style={{ color: "#B8963E" }}>
            B
          </span>
          <span className="text-2xl font-bold text-vendetta-text">{fmtB}</span>
        </div>
      </div>
      {/* Comparison bar */}
      <div className="flex items-center gap-1 h-1.5">
        <div
          className="h-full rounded-full"
          style={{
            background: "#C8102E",
            width: `${(valueA / (valueA + valueB + 0.001)) * 100}%`,
            transition: "width 0.8s ease-out",
          }}
        />
        <div
          className="h-full rounded-full"
          style={{
            background: "#B8963E",
            width: `${(valueB / (valueA + valueB + 0.001)) * 100}%`,
            transition: "width 0.8s ease-out",
          }}
        />
      </div>
    </div>
  );
}

export default function ResultsDashboard({
  personas,
  reactions,
  isAnalyzing,
  progress,
}: ResultsDashboardProps) {
  const reactionValues = Array.from(reactions.values());
  const count = reactionValues.length;

  const avgResonanceA =
    count > 0
      ? reactionValues.reduce((s, r) => s + r.resonanceA, 0) / count
      : 0;
  const avgResonanceB =
    count > 0
      ? reactionValues.reduce((s, r) => s + r.resonanceB, 0) / count
      : 0;
  const pctConvertA =
    count > 0
      ? (reactionValues.filter((r) => r.wouldConvertA).length / count) * 100
      : 0;
  const pctConvertB =
    count > 0
      ? (reactionValues.filter((r) => r.wouldConvertB).length / count) * 100
      : 0;
  const pctLingerA =
    count > 0
      ? (reactionValues.filter((r) => r.lingeringA).length / count) * 100
      : 0;
  const pctLingerB =
    count > 0
      ? (reactionValues.filter((r) => r.lingeringB).length / count) * 100
      : 0;

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Progress */}
      {isAnalyzing && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-vendetta-text">
              Simulating 100 minds...
            </p>
            <p className="text-sm font-mono" style={{ color: "#6B6B7E" }}>
              {count} / 100
            </p>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ background: "#1E1E24", height: "6px" }}
          >
            <div
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #C8102E, #B8963E)",
                height: "100%",
                borderRadius: "9999px",
                transition: "width 0.5s ease-out",
              }}
            />
          </div>
          <p className="text-xs text-center" style={{ color: "#6B6B7E" }}>
            Each persona is processing both creatives through their unique psychology
          </p>
        </div>
      )}

      {/* Aggregate Stats */}
      {count > 0 && (
        <div>
          <h2
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: "#6B6B7E" }}
          >
            Aggregate Intelligence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Avg Resonance"
              valueA={avgResonanceA}
              valueB={avgResonanceB}
              format="number"
            />
            <StatCard
              label="Would Convert"
              valueA={pctConvertA}
              valueB={pctConvertB}
              format="percent"
            />
            <StatCard
              label="Lingering Impact"
              valueA={pctLingerA}
              valueB={pctLingerB}
              format="percent"
            />
          </div>
        </div>
      )}

      {/* Persona Grid */}
      {(isAnalyzing || count > 0) && (
        <div>
          <h2
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: "#6B6B7E" }}
          >
            100 Minds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {personas.map((persona) => {
              const reaction = reactions.get(persona.id);
              return (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  reactionA={reaction?.reactionA ?? null}
                  reactionB={reaction?.reactionB ?? null}
                  scores={{
                    resonanceA: reaction?.resonanceA ?? 0,
                    resonanceB: reaction?.resonanceB ?? 0,
                    wouldConvertA: reaction?.wouldConvertA ?? false,
                    wouldConvertB: reaction?.wouldConvertB ?? false,
                    lingeringA: reaction?.lingeringA ?? false,
                    lingeringB: reaction?.lingeringB ?? false,
                  }}
                  isLoading={isAnalyzing && !reaction}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
