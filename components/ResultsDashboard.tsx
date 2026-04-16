"use client";

import PersonaCard from "./PersonaCard";
import { CREATIVE_COLORS } from "./DropZone";
import type { Persona } from "@/data/personas";

export interface CreativeReaction {
  reaction: string;
  resonance: number;
  wouldConvert: boolean;
  lingering: boolean;
}

export interface PersonaReaction {
  personaId: number;
  reactions: CreativeReaction[];
  philosophicalTake: string;
}

interface ResultsDashboardProps {
  personas: Persona[];
  reactions: Map<number, PersonaReaction>;
  isAnalyzing: boolean;
  progress: number;
  numCreatives: number;
}

export default function ResultsDashboard({
  personas,
  reactions,
  isAnalyzing,
  progress,
  numCreatives,
}: ResultsDashboardProps) {
  const values = Array.from(reactions.values());
  const count = values.length;

  const stats = Array.from({ length: numCreatives }, (_, i) => {
    const avgRes = count > 0 ? values.reduce((s, r) => s + (r.reactions[i]?.resonance ?? 0), 0) / count : 0;
    const pctConv = count > 0 ? (values.filter((r) => r.reactions[i]?.wouldConvert).length / count) * 100 : 0;
    const pctLing = count > 0 ? (values.filter((r) => r.reactions[i]?.lingering).length / count) * 100 : 0;
    return { avgRes, pctConv, pctLing };
  });

  const maxRes = Math.max(...stats.map((s) => s.avgRes), 1);
  const maxConv = Math.max(...stats.map((s) => s.pctConv), 1);
  const maxLing = Math.max(...stats.map((s) => s.pctLing), 1);

  return (
    <div className="w-full flex flex-col gap-10">
      {/* Progress */}
      {isAnalyzing && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "#6B6B7E" }}>
              Simulating 100 minds
            </p>
            <p className="text-xs font-mono" style={{ color: "#6B6B7E" }}>
              {count} / 100
            </p>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ background: "#1E1E24", height: "2px" }}>
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
        </div>
      )}

      {/* Aggregate */}
      {count > 0 && (
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "#6B6B7E" }}>
            Aggregate
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Resonance", values: stats.map((s) => s.avgRes), max: maxRes, fmt: (v: number) => v.toFixed(1) },
              { label: "Convert", values: stats.map((s) => s.pctConv), max: maxConv, fmt: (v: number) => `${v.toFixed(0)}%` },
              { label: "Lingers", values: stats.map((s) => s.pctLing), max: maxLing, fmt: (v: number) => `${v.toFixed(0)}%` },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl p-5 flex flex-col gap-3"
                style={{ background: "#16161A", border: "1px solid #1E1E24" }}
              >
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#6B6B7E" }}>
                  {card.label}
                </p>
                <div className="flex flex-col gap-2.5">
                  {card.values.map((v, i) => {
                    const color = CREATIVE_COLORS[i] ?? CREATIVE_COLORS[0];
                    const label = String(i + 1).padStart(2, "0");
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-bold w-5 flex-shrink-0" style={{ color }}>
                          {label}
                        </span>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ background: "#1E1E24", height: "4px" }}>
                          <div
                            style={{
                              width: `${(v / card.max) * 100}%`,
                              background: color,
                              height: "100%",
                              borderRadius: "9999px",
                              transition: "width 0.8s ease-out",
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono w-10 text-right" style={{ color: "#6B6B7E" }}>
                          {card.fmt(v)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persona Grid */}
      {(isAnalyzing || count > 0) && (
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "#6B6B7E" }}>
            100 Minds
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {personas.map((persona) => {
              const r = reactions.get(persona.id);
              const personaReactions = Array.from({ length: numCreatives }, (_, i) =>
                r?.reactions[i] ?? null
              );
              return (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  reactions={personaReactions}
                  isLoading={isAnalyzing && !r}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
