"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

interface DropZoneProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  variant: "A" | "B";
}

export default function DropZone({ label, file, onFileChange, variant }: DropZoneProps) {
  const accentColor = variant === "A" ? "#C8102E" : "#B8963E";
  const accentDim = variant === "A" ? "#8B0B20" : "#8B6E2A";

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileChange(acceptedFiles[0]);
      }
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
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded"
          style={{ background: accentDim, color: accentColor, border: `1px solid ${accentColor}` }}
        >
          Creative {variant}
        </span>
        <span className="text-sm text-vendetta-subtle">{label}</span>
      </div>

      <div
        {...getRootProps()}
        className="relative w-full rounded-xl cursor-pointer transition-all duration-200"
        style={{
          background: isDragActive ? "#1A1A20" : "#111114",
          border: `2px dashed ${isDragActive ? accentColor : "#1E1E24"}`,
          minHeight: "280px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <input {...getInputProps()} />

        {previewUrl && file ? (
          <div className="relative w-full h-full" style={{ minHeight: "280px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`Creative ${variant} preview`}
              className="w-full h-full object-contain rounded-xl"
              style={{ maxHeight: "400px" }}
            />
            <div
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center rounded-xl"
              style={{ background: "rgba(10,10,11,0.75)" }}
            >
              <p className="text-vendetta-text text-sm font-medium">Replace image</p>
              <p className="text-vendetta-subtle text-xs mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 text-center select-none">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: accentDim, border: `1px solid ${accentColor}` }}
            >
              <svg
                width="28"
                height="28"
                fill="none"
                stroke={accentColor}
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-vendetta-text font-medium text-base">
                {isDragActive ? "Drop it here" : "Drop your creative"}
              </p>
              <p className="text-vendetta-subtle text-sm mt-1">
                or click to browse · max 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {file && (
        <div className="flex items-center justify-between px-1">
          <p className="text-vendetta-subtle text-xs truncate max-w-[70%]">{file.name}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileChange(null);
            }}
            className="text-vendetta-subtle hover:text-vendetta-text text-xs transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
