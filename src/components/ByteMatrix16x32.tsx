import React, { useState } from "react";
import { getSectionColor } from "./CanvasNano";

interface ByteMatrixProps {
  bytes: Uint8Array;
  hoverIndex: number | null;
  onHoverNode: (index: number | null) => void;
}

export function ByteMatrix16x32({ bytes, hoverIndex, onHoverNode }: ByteMatrixProps) {
  const [activeCell, setActiveCell] = useState<number | null>(null);

  const currentIdx = hoverIndex ?? activeCell;
  const currentByte = currentIdx !== null ? bytes[currentIdx] : null;
  const currentSection = currentIdx !== null ? getSectionColor(currentIdx) : null;

  return (
    <div className="w-full rounded-xl border border-border bg-card p-4 font-mono text-xs text-foreground shadow-sm sm:p-5">
      {/* Header telemetry */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span className="font-semibold text-xs tracking-wider uppercase">16×32 Sector Matrix of 512 Bytes </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {currentIdx !== null ? (
            <span>
              Offset <strong className="text-foreground">0x{currentIdx.toString(16).padStart(3, "0")}</strong> (#{currentIdx + 1}) ·{" "}
              Val: <strong className="text-foreground">0x{currentByte?.toString(16).padStart(2, "0").toUpperCase()}</strong> ({currentByte}) ·{" "}
              <span style={{ color: currentSection?.hex }}>{currentSection?.label}</span>
            </span>
          ) : (
            <span>Hover any cell to inspect byte state</span>
          )}
        </div>
      </div>

      {/* 16x32 Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[repeat(32,minmax(0,1fr))] gap-1 min-w-[560px]">
          {Array.from({ length: 512 }).map((_, idx) => {
            const b = bytes[idx] ?? 0;
            const sec = getSectionColor(idx);
            const isHovered = currentIdx === idx;
            const hex = b.toString(16).padStart(2, "0").toUpperCase();

            return (
              <div
                key={idx}
                onMouseEnter={() => {
                  setActiveCell(idx);
                  onHoverNode(idx);
                }}
                onMouseLeave={() => {
                  setActiveCell(null);
                  onHoverNode(null);
                }}
                title={`[0x${idx.toString(16).padStart(3, "0")}] #${idx + 1}: 0x${hex} (${sec.label})`}
                className={`flex h-6 items-center justify-center rounded text-[9px] font-mono transition-transform cursor-pointer select-none ${isHovered
                    ? "scale-125 z-10 ring-2 ring-red-500 font-bold bg-red-100 text-red-950"
                    : "hover:scale-110"
                  }`}
                style={{
                  backgroundColor: isHovered ? undefined : `${sec.hex}22`,
                  borderLeft: `2px solid ${sec.hex}`,
                  color: isHovered ? undefined : "#1e293b",
                }}
              >
                {hex}
              </div>
            );
          })}
        </div>
      </div>

      {/* Glow2 Palette Section Legend */}
      <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#38bdf8]" />
          <span className="text-muted-foreground">Header Meta (0x00..0x1F)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#f78522]" />
          <span className="text-muted-foreground">Target CID (0x20..0x3F)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#10b981]" />
          <span className="text-muted-foreground">DINOv3 Embedding (0x40..0x1BF)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#a855f7]" />
          <span className="text-muted-foreground">RS Parity (0x1C0..0x1DF)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#f43f5e]" />
          <span className="text-muted-foreground">HMAC Seal (0x1E0..0x1FF)</span>
        </div>
      </div>
    </div>
  );
}
