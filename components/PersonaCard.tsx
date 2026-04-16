"use client";

import type { Persona } from "@/data/personas";
import { CREATIVE_COLORS } from "./DropZone";
import type { CreativeReaction } from "./ResultsDashboard";

interface PersonaCardProps {
  persona: Persona;
  reactions: (CreativeReaction | null)[];
  isLoading: boolean;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ background: "#1E1E24", height: "3px" }}
      >
        <div
          style={{
            width: `${value}%`,
            background: color,
            height: "100%",
            borderRadius: "9999px",
            transition: "width 0.8s ease-out",
          }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color: "#6B6B7E", minWidth: "2rem" }}>
        {value}
      </span>
    </div>
  );
}

export default function PersonaCard({ persona, reactions, isLoading }: PersonaCardProps) {
  const hasData = reactions.some((r) => r !== null);

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-300"
      style={{
        background: "#16161A",
        border: `1px solid ${hasData ? "#1E1E24" : "#16161A"}`,
        opacity: isLoading && !hasData ? 0.4 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-vendetta-text leading-tight">
            {persona.name}
          </p>
          <p className="text-xs text-vendetta-subtle mt-0.5">
            {persona.age} · {persona.occupation}
          </p>
          <p className="text-xs text-vendetta-subtle mt-0.5">{persona.location}</p>
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: "#111114", color: "#2A2A32" }}
        >
          #{persona.id}
        </span>
      </div>

      {isLoading && !hasData && (
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-2.5 rounded" style={{ background: "#1E1E24", width: "85%" }} />
          <div className="h-2.5 rounded" style={{ background: "#1E1E24", width: "65%" }} />
        </div>
      )}

      {hasData && (
        <div className="flex flex-col gap-3">
          {reactions.map((r, i) => {
            const color = CREATIVE_COLORS[i] ?? CREATIVE_COLORS[0];
            const label = String(i + 1).padStart(2, "0");
            return (
              <div key={i}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs font-bold tracking-wider" style={{ color }}>
                    {label}
                  </span>
                  <div className="flex-1" style={{ borderTop: "1px solid #1E1E24" }} />
                  {r && (
                    <div className="flex gap-2">
                      {r.wouldConvert && (
                        <span className="text-xs" style={{ color }}>convert</span>
                      )}
                      {r.lingering && (
                        <span className="text-xs" style={{ color }}>lingers</span>
                      )}
                    </div>
                  )}
                </div>
                {r ? (
                  <>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "#A8A8B8", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
                    >
                      {r.reaction}
                    </p>
                    <div className="mt-1.5">
                      <ScoreBar value={r.resonance} color={color} />
                    </div>
                  </>
                ) : (
                  <p className="text-xs italic" style={{ color: "#2A2A32" }}>
                    pending...
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
