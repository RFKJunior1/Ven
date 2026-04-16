"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export const CREATIVE_COLORS = [
  "#C8102E", "#B8963E", "#5B9BD5", "#9B59B6", "#27AE60", "#E67E22",
];
const CREATIVE_DIMS = [
  "#8B0B20", "#8B6E2A", "#1A3F60", "#4A1E6A", "#1A4A2E", "#6A3010",
];

interface DropZoneProps {
  index: number;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
  canRemove?: boolean;
}

export default function DropZone({
  index,
  file,
  onFileChange,
  onRemove,
  canRemove,
}: DropZoneProps) {
  const color = CREATIVE_COLORS[index] ?? CREATIVE_COLORS[0];
  const dim = CREATIVE_DIMS[index] ?? CREATIVE_DIMS[0];
  const label = String(index + 1).padStart(2, "0");

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFileChange(accepted[0]);
    },
    [onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between h-6">
        <span
          className="text-xs font-bold tracking-widest px-2 py-0.5 rounded"
          style={{ background: dim, color, border: `1px solid ${color}` }}
        >
          {label}
        </span>
        {canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="text-xs transition-colors"
            style={{ color: "#2A2A32" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6B6B7E")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#2A2A32")}
          >
            remove
          </button>
        )}
      </div>

      <div
        {...getRootProps()}
        className="relative w-full rounded-xl cursor-pointer transition-all duration-200"
        style={{
          background: isDragActive ? "#1A1A20" : "#111114",
          border: `1px solid ${isDragActive ? color : "#1E1E24"}`,
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <input {...getInputProps()} />

        {previewUrl && file ? (
          <div className="relative w-full" style={{ minHeight: "200px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`Creative ${label}`}
              className="w-full object-contain rounded-xl"
              style={{ maxHeight: "300px" }}
            />
            <div
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center rounded-xl gap-1"
              style={{ background: "rgba(10,10,11,0.8)" }}
            >
              <p className="text-xs font-medium" style={{ color: "#E8E8F0" }}>
                replace
              </p>
              <p className="text-xs" style={{ color: "#6B6B7E" }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center select-none">
            <svg
              width="22"
              height="22"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-xs" style={{ color: "#6B6B7E" }}>
              {isDragActive ? "drop here" : "drop or click"}
            </p>
          </div>
        )}
      </div>

      {file && (
        <p className="text-xs truncate px-1" style={{ color: "#2A2A32" }}>
          {file.name}
        </p>
      )}
    </div>
  );
}
