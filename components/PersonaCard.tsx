"use client";

import type { Persona } from "@/data/personas";

interface PersonaScores {
  resonanceA: number;
  resonanceB: number;
  wouldConvertA: boolean;
  wouldConvertB: boolean;
  lingeringA: boolean;
  lingeringB: boolean;
}

interface PersonaCardProps {
  persona: Persona;
  reactionA: string | null;
  reactionB: string | null;
  scores: PersonaScores;
  isLoading: boolean;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ background: "#1E1E24", height: "4px" }}
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
      <span className="text-xs font-mono" style={{ color: "#6B6B7E", minWidth: "2.5rem" }}>
        {value}
      </span>
    </div>
  );
}

function Indicator({
  active,
  label,
  color,
}: {
  active: boolean;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: active ? color : "#2A2A32" }}
      />
      <span className="text-xs" style={{ color: active ? "#E8E8F0" : "#6B6B7E" }}>
        {label}
      </span>
    </div>
  );
}

export default function PersonaCard({
  persona,
  reactionA,
  reactionB,
  scores,
  isLoading,
}: PersonaCardProps) {
  const hasData = reactionA !== null || reactionB !== null;

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-300"
      style={{
        background: "#16161A",
        border: `1px solid ${hasData ? "#1E1E24" : "#16161A"}`,
        opacity: isLoading && !hasData ? 0.5 : 1,
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
          style={{ background: "#1E1E24", color: "#6B6B7E" }}
        >
          #{persona.id}
        </span>
      </div>

      {/* Loading skeleton */}
      {isLoading && !hasData && (
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-3 rounded" style={{ background: "#1E1E24", width: "90%" }} />
          <div className="h-3 rounded" style={{ background: "#1E1E24", width: "70%" }} />
          <div className="h-3 rounded" style={{ background: "#1E1E24", width: "80%" }} />
        </div>
      )}

      {/* Reactions */}
      {hasData && (
        <div className="flex flex-col gap-3">
          {/* Ad A reaction */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: "#C8102E" }}
              >
                A
              </span>
              <div className="flex-1" style={{ borderTop: "1px solid #1E1E24" }} />
            </div>
            {reactionA ? (
              <p className="text-xs leading-relaxed" style={{ color: "#A8A8B8" }}>
                {reactionA}
              </p>
            ) : (
              <p className="text-xs italic" style={{ color: "#6B6B7E" }}>
                Pending...
              </p>
            )}
            <div className="mt-2">
              <ScoreBar value={scores.resonanceA} color="#C8102E" />
            </div>
            <div className="flex gap-3 mt-1.5">
              <Indicator
                active={scores.wouldConvertA}
                label="Convert"
                color="#C8102E"
              />
              <Indicator
                active={scores.lingeringA}
                label="Lingers"
                color="#C8102E"
              />
            </div>
          </div>

          {/* Ad B reaction */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: "#B8963E" }}
              >
                B
              </span>
              <div className="flex-1" style={{ borderTop: "1px solid #1E1E24" }} />
            </div>
            {reactionB ? (
              <p className="text-xs leading-relaxed" style={{ color: "#A8A8B8" }}>
                {reactionB}
              </p>
            ) : (
              <p className="text-xs italic" style={{ color: "#6B6B7E" }}>
                Pending...
              </p>
            )}
            <div className="mt-2">
              <ScoreBar value={scores.resonanceB} color="#B8963E" />
            </div>
            <div className="flex gap-3 mt-1.5">
              <Indicator
                active={scores.wouldConvertB}
                label="Convert"
                color="#B8963E"
              />
              <Indicator
                active={scores.lingeringB}
                label="Lingers"
                color="#B8963E"
              />
            </div>
          </div>
        </div>
      )}

      {/* Income badge */}
      <div className="flex items-center justify-end">
        <span className="text-xs" style={{ color: "#2A2A32" }}>
          {persona.income}
        </span>
      </div>
    </div>
  );
}
