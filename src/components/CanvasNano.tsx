import React, { useEffect, useRef } from "react";
import type { BranchStyle, ScaleSize } from "./CanvasBranchy";

export type NanoViewLayout = "grid16x32" | "arterial";
export type LineConnection = 1 | 2 | 3;

interface CanvasNanoProps {
  bytes: Uint8Array;
  branchStyle?: BranchStyle;
  scale?: ScaleSize;
  viewLayout?: NanoViewLayout;
  lineConnection?: LineConnection;
  hoverIndex?: number | null;
  onHoverNode?: (index: number | null) => void;
}

// Glow2 Palette Color Map by Section
export function getSectionColor(index: number): { hex: string; label: string } {
  if (index < 32) return { hex: "#38bdf8", label: "Header Metadata" }; // Sky blue
  if (index < 64) return { hex: "#f78522", label: "Target Pointer CID" }; // Amber
  if (index < 448) return { hex: "#10b981", label: "DINOv3 Embedding" }; // Emerald
  if (index < 480) return { hex: "#a855f7", label: "Reed-Solomon Parity" }; // Purple
  return { hex: "#f43f5e", label: "Cryptographic HMAC" }; // Rose
}

export function CanvasNano({
  bytes,
  branchStyle = "knotty",
  scale = "normal",
  viewLayout = "grid16x32",
  lineConnection = 1,
  hoverIndex = null,
  onHoverNode,
}: CanvasNanoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Retina DPI backing store scaling
    const cssSize = scale === "xsmall" ? 280 : scale === "small" ? 420 : 580;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    ctx.scale(dpr, dpr);

    const size = cssSize;
    const padding = scale === "xsmall" ? 12 : scale === "small" ? 16 : 20;
    const usableSize = size - padding * 2;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Ensure 512 points
    const count = 512;
    const points: { x: number; y: number; val: number; index: number }[] = [];

    if (viewLayout === "grid16x32") {
      // 16 rows x 32 columns structured lattice
      const cols = 32;
      const rows = 16;
      const stepX = usableSize / (cols - 1);
      const stepY = usableSize / (rows - 1);

      for (let i = 0; i < count; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const b = bytes[i] ?? 0;
        const displacement = ((b - 128) / 128) * (stepX * 0.28);

        const x = padding + c * stepX + (r % 2 === 0 ? displacement : -displacement);
        const y = padding + r * stepY + (c % 2 === 0 ? -displacement : displacement);
        points.push({ x, y, val: b, index: i });
      }
    } else {
      // Zoned Polar Arterial Layout
      const centerX = size / 2;
      const centerY = size / 2;
      const maxR = usableSize / 2;

      for (let i = 0; i < count; i++) {
        const b = bytes[i] ?? 0;
        const signedVal = b > 127 ? b - 256 : b; // Int8 normalized

        let radius: number;
        let theta: number;

        if (i < 64) {
          // Inner Core: Header & Pointer (64 nodes)
          const angleStep = (Math.PI * 2) / 64;
          theta = i * angleStep;
          radius = (maxR * 0.22) + (signedVal / 128) * 8;
        } else if (i < 448) {
          // Mantle: 384 DINOv3 Nodes along Fibonacci spiral
          const idx = i - 64;
          theta = idx * 2.399963 + (b / 256) * 0.15;
          radius = (maxR * 0.28) + Math.sqrt(idx / 384) * (maxR * 0.58) + (signedVal / 128) * 10;
        } else {
          // Perimeter: RS Parity & HMAC Seal (64 nodes)
          const idx = i - 448;
          const angleStep = (Math.PI * 2) / 64;
          theta = idx * angleStep;
          radius = (maxR * 0.94) + (signedVal / 128) * 6;
        }

        const x = centerX + Math.cos(theta) * radius;
        const y = centerY + Math.sin(theta) * radius;
        points.push({ x, y, val: b, index: i });
      }
    }

    const scaleFactor = size / 580;

    // Helper for drawing edge paths
    const strokePath = (
      strokeColor: string,
      width: number,
      lineCap: CanvasLineCap = "round",
      drawFn: () => void
    ) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(0.25, width * scaleFactor);
      ctx.lineCap = lineCap;
      ctx.lineJoin = "round";
      ctx.beginPath();
      drawFn();
      ctx.stroke();
    };

    // Helper to generate line connections (Modes 1, 2, 3)
    const traceEdges = (useCurves = false) => {
      const drawSegment = (
        p1: (typeof points)[0],
        p2: (typeof points)[0],
        curveDelta = 0
      ) => {
        if (!p1 || !p2) return;
        ctx.moveTo(p1.x, p1.y);
        if (useCurves && curveDelta !== 0) {
          const midX = (p1.x + p2.x) / 2 + curveDelta;
          const midY = (p1.y + p2.y) / 2 + (curveDelta > 0 ? -curveDelta : curveDelta);
          ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
        } else {
          ctx.lineTo(p2.x, p2.y);
        }
      };

      if (viewLayout === "grid16x32") {
        if (lineConnection === 1) {
          // Connection 1 (Standard): Horizontal rows + periodic vertical bridges
          for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 31; c++) {
              drawSegment(
                points[r * 32 + c]!,
                points[r * 32 + c + 1]!,
                (c % 2 === 0 ? 2 : -2) * scaleFactor
              );
            }
          }
          for (let c = 0; c < 32; c += 2) {
            for (let r = 0; r < 15; r++) {
              drawSegment(points[r * 32 + c]!, points[(r + 1) * 32 + c]!);
            }
          }
        } else if (lineConnection === 2) {
          // Connection 2 (Diagonal Cross-Mesh / Triangular Lattice)
          for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 31; c++) {
              drawSegment(points[r * 32 + c]!, points[r * 32 + c + 1]!);
            }
          }
          for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 31; c++) {
              drawSegment(
                points[r * 32 + c]!,
                points[(r + 1) * 32 + c + 1]!,
                (c % 2 === 0 ? 1.5 : -1.5) * scaleFactor
              );
              drawSegment(
                points[r * 32 + c + 1]!,
                points[(r + 1) * 32 + c]!,
                (c % 2 === 0 ? -1.5 : 1.5) * scaleFactor
              );
            }
          }
        } else {
          // Connection 3 (Continuous Serpentine Stream & Harmonic Ties)
          for (let r = 0; r < 16; r++) {
            const isEven = r % 2 === 0;
            for (let c = 0; c < 31; c++) {
              const fromCol = isEven ? c : 31 - c;
              const toCol = isEven ? c + 1 : 30 - c;
              drawSegment(
                points[r * 32 + fromCol]!,
                points[r * 32 + toCol]!,
                (c % 2 === 0 ? 2 : -2) * scaleFactor
              );
            }
            if (r < 15) {
              const turnCol = isEven ? 31 : 0;
              drawSegment(
                points[r * 32 + turnCol]!,
                points[(r + 1) * 32 + turnCol]!,
                3 * scaleFactor
              );
            }
          }
          // Harmonic cross-ties between matching bit parity
          for (let i = 0; i < 480; i += 4) {
            if (((bytes[i] ?? 0) & 1) === ((bytes[i + 32] ?? 0) & 1)) {
              drawSegment(points[i]!, points[i + 32]!);
            }
          }
        }
      } else {
        // Arterial Tree Layout
        const hubs: typeof points = [];
        for (let i = 0; i < 16; i++) {
          const hubPt = points[i * 32];
          if (hubPt) hubs.push(hubPt);
        }

        if (lineConnection === 1) {
          // Connection 1 (Standard Arterial): Spine + leaf twigs to parent hub
          for (let i = 0; i < hubs.length - 1; i++) {
            drawSegment(hubs[i]!, hubs[i + 1]!);
          }
          for (let i = 0; i < points.length; i++) {
            if (i % 32 === 0) continue;
            const parentHub = hubs[Math.floor(i / 32)];
            if (parentHub) {
              drawSegment(parentHub, points[i]!, (i % 2 === 0 ? 4 : -4) * scaleFactor);
            }
          }
        } else if (lineConnection === 2) {
          // Connection 2 (Orbital Web / Ring-Interlinked):
          // Spine + hub-to-leaf rays + adjacent leaf-to-leaf ring connections
          for (let i = 0; i < hubs.length; i++) {
            drawSegment(hubs[i]!, hubs[(i + 1) % hubs.length]!);
          }
          for (let i = 0; i < points.length; i++) {
            if (i % 32 === 0) continue;
            const parentHub = hubs[Math.floor(i / 32)];
            if (parentHub) {
              drawSegment(parentHub, points[i]!);
            }
            if ((i + 1) % 32 !== 0 && points[i + 1]) {
              drawSegment(points[i]!, points[i + 1]!, (i % 2 === 0 ? 2 : -2) * scaleFactor);
            }
          }
        } else {
          // Connection 3 (Concentric Celestial Rings & Spiral Flow)
          // Inner core closed ring (0..63)
          for (let i = 0; i < 64; i++) {
            drawSegment(points[i]!, points[(i + 1) % 64]!);
          }
          // Outer perimeter closed ring (448..511)
          for (let i = 448; i < 512; i++) {
            const nextIdx = i === 511 ? 448 : i + 1;
            drawSegment(points[i]!, points[nextIdx]!);
          }
          // Spiral trace through 384 DINO nodes
          for (let i = 64; i < 447; i++) {
            drawSegment(points[i]!, points[i + 1]!, (i % 2 === 0 ? 1.5 : -1.5) * scaleFactor);
          }
          // Radial cross-spokes between core and outer perimeter
          for (let i = 0; i < 16; i++) {
            drawSegment(points[i * 4]!, points[448 + i * 4]!);
          }
        }
      }
    };

    // --- RENDER BASED ON EXACT USER SPECIFIED WIDTHS ---
    if (branchStyle === "knotty") {
      // --- KNOTTY: 1.4 ---
      const baseW = scale === "xsmall" ? 0.7 : scale === "small" ? 1.0 : 1.4;
      strokePath("#1a1a1a", baseW, "round", () => traceEdges(true));

      // Knotty nodes: black with hollow white core
      points.forEach((p, idx) => {
        const isHub = idx % 32 === 0;
        const isHovered = hoverIndex === idx;
        const radius = (isHovered ? 4.5 : isHub ? 2.4 : 1.3) * scaleFactor;

        ctx.fillStyle = isHovered ? "#f43f5e" : "#1a1a1a";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.9, radius), 0, Math.PI * 2);
        ctx.fill();

        if (scale !== "xsmall") {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, radius - 0.7 * scaleFactor), 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else if (branchStyle === "thin") {
      // --- THIN: 0.4 ---
      strokePath("#222222", 0.4, "square", () => traceEdges(false));

      // Thin nodes: crisp black micro-dots
      points.forEach((p, idx) => {
        const isHovered = hoverIndex === idx;
        const radius = (isHovered ? 3.5 : 1.1) * scaleFactor;

        ctx.fillStyle = isHovered ? "#f43f5e" : "#000000";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.7, radius), 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (branchStyle === "steel") {
      // --- STEEL: 1.6 OUTER, 0.6 INNER ---
      strokePath("#333333", 1.6, "butt", () => traceEdges(false));
      strokePath("#999999", 0.6, "butt", () => traceEdges(false));

      // Steel nodes: refined square micro-pads
      points.forEach((p, idx) => {
        const isHovered = hoverIndex === idx;
        const s = Math.max(2.2, (isHovered ? 5.5 : 3.2) * scaleFactor);

        ctx.fillStyle = isHovered ? "#f43f5e" : "#111111";
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(0.4, 0.6 * scaleFactor);
        ctx.strokeRect(p.x - s / 2 + 0.5, p.y - s / 2 + 0.5, s - 1, s - 1);
      });
    }
  }, [bytes, branchStyle, scale, viewLayout, lineConnection, hoverIndex]);

  const cssSize =
    scale === "xsmall"
      ? "w-[280px] h-[280px]"
      : scale === "small"
      ? "w-[420px] h-[420px]"
      : "w-[580px] h-[580px]";

  return (
    <div className="flex items-center justify-center w-full h-full p-2">
      <canvas
        ref={canvasRef}
        className={`${cssSize} border border-border bg-white shadow-xl block rounded-lg`}
      />
    </div>
  );
}
