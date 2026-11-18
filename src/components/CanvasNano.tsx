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
    } else if (lineConnection === 1) {
      // Zoned Polar Arterial Layout (Style 1 as is)
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
    } else {
      // 3D Human Face Layout (Arterial Tree Conn Styles 2 & 3)
      // Maps all 512 points to 3D facial coordinates (X, Y, Z) with perspective projection
      const centerX = size / 2;
      const centerY = size / 2;
      const fov = 520;
      const faceScale = usableSize / 540;

      for (let i = 0; i < count; i++) {
        const b = bytes[i] ?? 0;
        const displacement = ((b - 128) / 128) * 2.2;
        let rawX = 0;
        let rawY = 0;
        let rawZ = 0;

        if (i < 64) {
          // 0..63: Outer Jawline, Temples & Cranium Oval (64 nodes)
          const phi = (i / 64) * Math.PI * 2 - Math.PI / 2;
          const jawTaper = 1 - 0.28 * Math.max(0, Math.sin(phi));
          rawX = 140 * Math.cos(phi) * jawTaper;
          rawY = 175 * Math.sin(phi) + 12;
          rawZ = -45 * (1 - Math.cos(phi)) + 10;
        } else if (i < 96) {
          // 64..95: Upper Forehead Tier (32 nodes)
          const t = ((i - 64) / 31) * 2 - 1;
          rawX = t * 110;
          rawY = -125 + t * t * 18;
          rawZ = -15 + (1 - t * t) * 25;
        } else if (i < 128) {
          // 96..127: Lower Forehead / Supraorbital Ridge (32 nodes)
          const t = ((i - 96) / 31) * 2 - 1;
          rawX = t * 100;
          rawY = -85 + t * t * 15;
          rawZ = -10 + (1 - t * t) * 28;
        } else if (i < 144) {
          // 128..143: Left Eyebrow Arch (16 nodes)
          const t = (i - 128) / 15;
          rawX = -20 - t * 62;
          rawY = -62 - Math.sin(t * Math.PI) * 14 + t * 6;
          rawZ = 12 + Math.sin(t * Math.PI) * 10;
        } else if (i < 176) {
          // 144..175: Left Eye Orbit / Eyelid Ring (32 nodes)
          const theta = ((i - 144) / 32) * Math.PI * 2;
          rawX = -50 + 22 * Math.cos(theta);
          rawY = -42 + 10 * Math.sin(theta);
          rawZ = -18 - 8 * Math.cos(theta);
        } else if (i < 192) {
          // 176..191: Right Eyebrow Arch (16 nodes)
          const t = (i - 176) / 15;
          rawX = 20 + t * 62;
          rawY = -62 - Math.sin(t * Math.PI) * 14 + t * 6;
          rawZ = 12 + Math.sin(t * Math.PI) * 10;
        } else if (i < 224) {
          // 192..223: Right Eye Orbit / Eyelid Ring (32 nodes)
          const theta = ((i - 192) / 32) * Math.PI * 2;
          rawX = 50 + 22 * Math.cos(theta);
          rawY = -42 + 10 * Math.sin(theta);
          rawZ = -18 - 8 * Math.cos(theta);
        } else if (i < 248) {
          // 224..247: Nose Bridge & Dorsum Ridge to Tip (24 nodes)
          const t = (i - 224) / 23;
          rawX = 0;
          rawY = -50 + t * 82;
          rawZ = 10 + t * 48; // Protruding tip in +Z
        } else if (i < 258) {
          // 248..257: Left Nasal Flank (10 nodes)
          const t = (i - 248) / 9;
          rawX = -8 - t * 7;
          rawY = -45 + t * 72;
          rawZ = 6 + t * 28;
        } else if (i < 268) {
          // 258..267: Right Nasal Flank (10 nodes)
          const t = (i - 258) / 9;
          rawX = 8 + t * 7;
          rawY = -45 + t * 72;
          rawZ = 6 + t * 28;
        } else if (i < 278) {
          // 268..277: Left Alar Base / Nostril Wing (10 nodes)
          const ang = ((i - 268) / 9) * Math.PI;
          rawX = -18 - Math.sin(ang) * 9;
          rawY = 32 + Math.cos(ang) * 6;
          rawZ = 22 + Math.sin(ang) * 12;
        } else if (i < 288) {
          // 278..287: Right Alar Base / Nostril Wing (10 nodes)
          const ang = ((i - 278) / 9) * Math.PI;
          rawX = 18 + Math.sin(ang) * 9;
          rawY = 32 + Math.cos(ang) * 6;
          rawZ = 22 + Math.sin(ang) * 12;
        } else if (i < 308) {
          // 288..307: Upper Lip Vermilion & Cupid's Bow (20 nodes)
          const t = ((i - 288) / 19) * 2 - 1;
          rawX = t * 40;
          rawY = 70 + t * t * 10 - Math.cos(t * Math.PI) * 3;
          rawZ = 22 - t * t * 15;
        } else if (i < 328) {
          // 308..327: Lower Lip Vermilion (20 nodes)
          const t = ((i - 308) / 19) * 2 - 1;
          rawX = t * 38;
          rawY = 88 - (1 - t * t) * 8;
          rawZ = 20 - t * t * 14;
        } else if (i < 352) {
          // 328..351: Inner Mouth Cleft / Stoma (24 nodes)
          const t = ((i - 328) / 23) * 2 - 1;
          rawX = t * 36;
          rawY = 78;
          rawZ = 14 - t * t * 10;
        } else if (i < 368) {
          // 352..367: Left Cheek Arc 1 - Upper Zygomatic (16 nodes)
          const t = (i - 352) / 15;
          rawX = -85 + t * 50;
          rawY = -22 + t * 28;
          rawZ = 0 + Math.sin(t * Math.PI) * 22;
        } else if (i < 384) {
          // 368..383: Left Cheek Arc 2 - Mid Malar Prominence (16 nodes)
          const t = (i - 368) / 15;
          rawX = -82 + t * 48;
          rawY = 2 + t * 32;
          rawZ = 4 + Math.sin(t * Math.PI) * 24;
        } else if (i < 400) {
          // 384..399: Left Cheek Arc 3 - Nasolabial Fold (16 nodes)
          const t = (i - 384) / 15;
          rawX = -75 + t * 45;
          rawY = 25 + t * 36;
          rawZ = 6 + Math.sin(t * Math.PI) * 20;
        } else if (i < 416) {
          // 400..415: Right Cheek Arc 1 - Upper Zygomatic (16 nodes)
          const t = (i - 400) / 15;
          rawX = 85 - t * 50;
          rawY = -22 + t * 28;
          rawZ = 0 + Math.sin(t * Math.PI) * 22;
        } else if (i < 432) {
          // 416..431: Right Cheek Arc 2 - Mid Malar Prominence (16 nodes)
          const t = (i - 416) / 15;
          rawX = 82 - t * 48;
          rawY = 2 + t * 32;
          rawZ = 4 + Math.sin(t * Math.PI) * 24;
        } else if (i < 448) {
          // 432..447: Right Cheek Arc 3 - Nasolabial Fold (16 nodes)
          const t = (i - 432) / 15;
          rawX = 75 - t * 45;
          rawY = 25 + t * 36;
          rawZ = 6 + Math.sin(t * Math.PI) * 20;
        } else if (i < 480) {
          // 448..479: Chin Prominence & Mental Groove Ring (32 nodes)
          const ang = ((i - 448) / 32) * Math.PI * 2;
          rawX = Math.cos(ang) * 22;
          rawY = 125 + Math.sin(ang) * 18;
          rawZ = 22 + Math.cos(ang) * 8;
        } else {
          // 480..511: Submental Mandible Base Strut (32 nodes)
          const t = ((i - 480) / 31) * 2 - 1;
          rawX = t * 75;
          rawY = 145 + t * t * 18;
          rawZ = 8 - t * t * 20;
        }

        // Apply scale & 3D perspective projection
        const scaledX = (rawX + (i % 2 === 0 ? displacement : -displacement)) * faceScale;
        const scaledY = (rawY + (i % 3 === 0 ? -displacement : displacement)) * faceScale;
        const scaledZ = (rawZ + displacement * 0.8) * faceScale;

        const persp = fov / (fov - scaledZ);
        const x = centerX + scaledX * persp;
        const y = centerY + scaledY * persp;
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

    // Helper to generate line connections (Styles 1, 2, 3)
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

      // Safe row/col node accessor on 16x32 lattice
      const getPt = (r: number, c: number) =>
        points[Math.min(15, Math.max(0, r)) * 32 + Math.min(31, Math.max(0, c))]!;

      const traceChain = (coords: [number, number][], close = false, curve = false) => {
        if (coords.length < 2) return;
        const first = getPt(coords[0]![0], coords[0]![1]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < coords.length; i++) {
          const curr = getPt(coords[i]![0], coords[i]![1]);
          if (curve && i > 0) {
            const prev = getPt(coords[i - 1]![0], coords[i - 1]![1]);
            const midX = (prev.x + curr.x) / 2 + (i % 2 === 0 ? 2 : -2) * scaleFactor;
            const midY = (prev.y + curr.y) / 2 + (i % 3 === 0 ? -2 : 2) * scaleFactor;
            ctx.quadraticCurveTo(midX, midY, curr.x, curr.y);
          } else {
            ctx.lineTo(curr.x, curr.y);
          }
        }
        if (close) {
          ctx.lineTo(first.x, first.y);
        }
      };

      if (viewLayout === "grid16x32") {
        if (lineConnection === 1) {
          // --- STYLE 1 (Standard): Horizontal rows + periodic vertical bridges ---
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
        } else {
          // --- HUMAN FACE TOPOLOGY (Styles 2 & 3) ---

          // 1. Face Oval & Jawline Contour
          traceChain(
            [
              [2, 7], [1, 10], [0, 13], [0, 16], [0, 18], [1, 21], [2, 24],
              [4, 27], [7, 28], [10, 27], [12, 25], [14, 21], [15, 17],
              [15, 14], [14, 10], [12, 6], [10, 4], [7, 3], [4, 4]
            ],
            true,
            useCurves
          );

          // 2. Eyebrows & Brow Ridge
          traceChain([[3, 5], [2, 7], [2, 10], [3, 13]], false, useCurves); // Left brow
          traceChain([[3, 18], [2, 21], [2, 24], [3, 26]], false, useCurves); // Right brow
          traceChain([[3, 13], [3, 15], [3, 16], [3, 18]]); // Brow bridge (Glabella)

          // 3. Eyes (Almond Orbits & Pupils)
          // Left eye
          traceChain([[4, 6], [3, 8], [4, 11], [4, 13]], false, useCurves);
          traceChain([[4, 6], [5, 8], [5, 11], [4, 13]], false, useCurves);
          traceChain([[4, 9], [5, 9]]); // Left pupil
          traceChain([[4, 10], [5, 10]]);

          // Right eye
          traceChain([[4, 18], [4, 20], [3, 23], [4, 25]], false, useCurves);
          traceChain([[4, 18], [5, 20], [5, 23], [4, 25]], false, useCurves);
          traceChain([[4, 21], [5, 21]]); // Right pupil
          traceChain([[4, 22], [5, 22]]);

          // 4. Nose Bridge, Ridge, & Base
          traceChain([[3, 15], [5, 15], [7, 15], [8, 15]]); // Left nasal ridge
          traceChain([[3, 16], [5, 16], [7, 16], [8, 16]]); // Right nasal ridge
          traceChain([[8, 13], [9, 14], [9, 15], [9, 16], [9, 17], [8, 18]], false, useCurves); // Nose ball/tip
          traceChain([[8, 13], [8, 15], [8, 16], [8, 18]]); // Septum base
          traceChain([[8, 13], [9, 12], [8, 12]]); // Left nostril wing
          traceChain([[8, 18], [9, 19], [8, 19]]); // Right nostril wing

          // 5. Philtrum, Lips & Mouth
          traceChain([[9, 15], [10, 15]]); // Philtrum columns
          traceChain([[9, 16], [10, 16]]);
          // Upper lip (Cupid's bow)
          traceChain([[11, 9], [11, 12], [10, 15], [10, 16], [11, 19], [11, 22]], false, useCurves);
          // Mouth parting line
          traceChain([[11, 9], [11, 13], [11, 15], [11, 16], [11, 18], [11, 22]]);
          // Lower lip
          traceChain([[11, 9], [12, 12], [12, 15], [12, 16], [12, 19], [11, 22]], false, useCurves);

          // 6. Chin & Jaw Accents
          traceChain([[13, 13], [13, 15], [13, 16], [13, 18]]); // Chin crease
          traceChain([[13, 15], [14, 15], [14, 16], [13, 16]]); // Chin prominence

          // 7. Cheeks & Nasolabial Creases
          traceChain([[6, 4], [7, 7], [8, 10], [9, 13]]); // Left zygomatic cheekbone
          traceChain([[6, 27], [7, 24], [8, 21], [9, 18]]); // Right zygomatic cheekbone
          traceChain([[9, 13], [10, 11], [11, 9], [12, 8]]); // Left nasolabial fold
          traceChain([[9, 18], [10, 20], [11, 22], [12, 23]]); // Right nasolabial fold

          // Forehead & Temple planes
          traceChain([[1, 10], [1, 15], [1, 16], [1, 21]]);
          traceChain([[2, 7], [3, 5], [5, 4], [7, 3]]);
          traceChain([[2, 24], [3, 26], [5, 27], [7, 28]]);

          // Subtle background lattice ties for context
          for (let r = 0; r < 16; r += 3) {
            for (let c = 0; c < 31; c += 2) {
              drawSegment(points[r * 32 + c]!, points[r * 32 + c + 1]!);
            }
          }

          // --- STYLE 3: FULL 3D FACIAL TRIANGULATION MESH ---
          if (lineConnection === 3) {
            // Forehead & Brow Triangles
            drawSegment(getPt(0, 13), getPt(1, 10));
            drawSegment(getPt(0, 18), getPt(1, 21));
            drawSegment(getPt(1, 10), getPt(2, 7));
            drawSegment(getPt(1, 21), getPt(2, 24));
            drawSegment(getPt(1, 15), getPt(2, 10));
            drawSegment(getPt(1, 16), getPt(2, 21));
            drawSegment(getPt(2, 10), getPt(3, 15));
            drawSegment(getPt(2, 21), getPt(3, 16));

            // Eye Sockets & Orbital Triangulation
            drawSegment(getPt(2, 7), getPt(4, 6));
            drawSegment(getPt(2, 10), getPt(4, 11));
            drawSegment(getPt(3, 13), getPt(4, 13));
            drawSegment(getPt(2, 21), getPt(4, 20));
            drawSegment(getPt(2, 24), getPt(4, 25));
            drawSegment(getPt(3, 18), getPt(4, 18));
            drawSegment(getPt(4, 13), getPt(5, 15));
            drawSegment(getPt(4, 18), getPt(5, 16));

            // Cheekbone to Nose & Jaw Facets
            drawSegment(getPt(5, 8), getPt(7, 7));
            drawSegment(getPt(5, 11), getPt(7, 10));
            drawSegment(getPt(5, 20), getPt(7, 21));
            drawSegment(getPt(5, 23), getPt(7, 24));
            drawSegment(getPt(7, 10), getPt(8, 13));
            drawSegment(getPt(7, 21), getPt(8, 18));
            drawSegment(getPt(7, 7), getPt(10, 4));
            drawSegment(getPt(7, 24), getPt(10, 27));

            // Nose to Upper Lip & Mouth Corners
            drawSegment(getPt(8, 15), getPt(10, 15));
            drawSegment(getPt(8, 16), getPt(10, 16));
            drawSegment(getPt(9, 12), getPt(11, 9));
            drawSegment(getPt(9, 19), getPt(11, 22));
            drawSegment(getPt(10, 15), getPt(11, 13));
            drawSegment(getPt(10, 16), getPt(11, 18));

            // Lower Lip, Chin & Jawline Struts
            drawSegment(getPt(11, 9), getPt(12, 6));
            drawSegment(getPt(11, 22), getPt(12, 25));
            drawSegment(getPt(12, 12), getPt(13, 13));
            drawSegment(getPt(12, 19), getPt(13, 18));
            drawSegment(getPt(12, 15), getPt(13, 15));
            drawSegment(getPt(12, 16), getPt(13, 16));
            drawSegment(getPt(13, 13), getPt(14, 10));
            drawSegment(getPt(13, 18), getPt(14, 21));
            drawSegment(getPt(14, 15), getPt(15, 14));
            drawSegment(getPt(14, 16), getPt(15, 17));
          }
        }
      } else {
        // --- ARTERIAL TREE LAYOUT ---
        const hubs: typeof points = [];
        for (let i = 0; i < 16; i++) {
          const hubPt = points[i * 32];
          if (hubPt) hubs.push(hubPt);
        }

        if (lineConnection === 1) {
          // Style 1 (Standard Arterial): Spine + leaf twigs to parent hub
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
          // --- STYLE 2: 3D HUMAN FACE CONTOURS ---
          const drawRange = (start: number, end: number, close = false, curve = false) => {
            for (let i = start; i < end; i++) {
              drawSegment(points[i]!, points[i + 1]!, curve ? (i % 2 === 0 ? 2 : -2) * scaleFactor : 0);
            }
            if (close) {
              drawSegment(points[end]!, points[start]!);
            }
          };

          // 1. Outer Jawline & Head Oval (0..63)
          drawRange(0, 63, true, true);
          // 2. Forehead Tiers
          drawRange(64, 95, false, true);
          drawRange(96, 127, false, true);
          // 3. Eyebrows & Eyes
          drawRange(128, 143, false, true);
          drawRange(144, 175, true);
          drawRange(176, 191, false, true);
          drawRange(192, 223, true);
          // 4. Nose Dorsum, Flanks & Nostril Wings
          drawRange(224, 247);
          drawRange(248, 257);
          drawRange(258, 267);
          drawRange(268, 277);
          drawRange(278, 287);
          // 5. Mouth & Lips
          drawRange(288, 307, false, true);
          drawRange(308, 327, false, true);
          drawRange(328, 351, false);
          // 6. Cheeks & Zygomatic Arches
          drawRange(352, 367, false, true);
          drawRange(368, 383, false, true);
          drawRange(384, 399, false, true);
          drawRange(400, 415, false, true);
          drawRange(416, 431, false, true);
          drawRange(432, 447, false, true);
          // 7. Chin Prominence & Mandible Base
          drawRange(448, 479, true);
          drawRange(480, 511);

          // Anatomical Facial Landmark Cross-Bridges
          drawSegment(points[128]!, points[224]!); // Left brow to nose bridge
          drawSegment(points[176]!, points[224]!); // Right brow to nose bridge
          drawSegment(points[247]!, points[298]!); // Nose tip to Cupid's bow
          drawSegment(points[318]!, points[448]!); // Lower lip to chin pad
          drawSegment(points[277]!, points[384]!); // Left nostril to nasolabial fold
          drawSegment(points[287]!, points[432]!); // Right nostril to nasolabial fold
          drawSegment(points[143]!, points[144]!); // Left brow outer to eye
          drawSegment(points[191]!, points[192]!); // Right brow outer to eye
          drawSegment(points[288]!, points[328]!); // Left mouth corner commissure
          drawSegment(points[307]!, points[351]!); // Right mouth corner commissure
          drawSegment(points[480]!, points[20]!);  // Jaw base to jawline
          drawSegment(points[511]!, points[44]!);  // Jaw base to jawline
        } else {
          // --- STYLE 3: 3D HUMAN FACE WIREFRAME MESH (TRIANGULATION) ---
          const drawRange = (start: number, end: number, close = false) => {
            for (let i = start; i < end; i++) {
              drawSegment(points[i]!, points[i + 1]!);
            }
            if (close) {
              drawSegment(points[end]!, points[start]!);
            }
          };

          // Primary Contours
          drawRange(0, 63, true);
          drawRange(64, 95);
          drawRange(96, 127);
          drawRange(128, 143);
          drawRange(144, 175, true);
          drawRange(176, 191);
          drawRange(192, 223, true);
          drawRange(224, 247);
          drawRange(248, 257);
          drawRange(258, 267);
          drawRange(268, 277);
          drawRange(278, 287);
          drawRange(288, 307);
          drawRange(308, 327);
          drawRange(328, 351);
          drawRange(352, 367);
          drawRange(368, 383);
          drawRange(384, 399);
          drawRange(400, 415);
          drawRange(416, 431);
          drawRange(432, 447);
          drawRange(448, 479, true);
          drawRange(480, 511);

          // Forehead Lattice Triangulation (64..95 <-> 96..127)
          for (let k = 0; k < 32; k += 2) {
            drawSegment(points[64 + k]!, points[96 + k]!);
            if (k + 1 < 32) {
              drawSegment(points[64 + k]!, points[96 + k + 1]!);
            }
          }
          // Forehead to Eyebrows & Glabella
          for (let k = 0; k < 16; k += 2) {
            drawSegment(points[96 + k]!, points[128 + k]!);
            drawSegment(points[112 + k]!, points[176 + k]!);
          }
          drawSegment(points[111]!, points[224]!);
          drawSegment(points[112]!, points[224]!);

          // Eyebrows to Eye Sockets
          for (let k = 0; k < 16; k += 2) {
            drawSegment(points[128 + k]!, points[144 + k]!);
            drawSegment(points[176 + k]!, points[192 + k]!);
          }

          // Eyes to Cheeks
          for (let k = 0; k < 16; k += 2) {
            drawSegment(points[160 + k]!, points[352 + k]!);
            drawSegment(points[208 + k]!, points[400 + k]!);
          }

          // Cheek Multi-Tier Triangulation
          for (let k = 0; k < 16; k += 2) {
            drawSegment(points[352 + k]!, points[368 + k]!);
            drawSegment(points[368 + k]!, points[384 + k]!);
            drawSegment(points[400 + k]!, points[416 + k]!);
            drawSegment(points[416 + k]!, points[432 + k]!);
          }

          // Nose Bridge to Flanks & Nasolabial Folds
          for (let k = 0; k < 10; k += 2) {
            drawSegment(points[224 + k * 2]!, points[248 + k]!);
            drawSegment(points[224 + k * 2]!, points[258 + k]!);
            drawSegment(points[248 + k]!, points[384 + k]!);
            drawSegment(points[258 + k]!, points[432 + k]!);
          }

          // Lips & Mouth Triangulation
          for (let k = 0; k < 20; k += 2) {
            drawSegment(points[288 + k]!, points[328 + Math.min(23, k)]!);
            drawSegment(points[328 + Math.min(23, k)]!, points[308 + k]!);
          }

          // Lower Lip to Chin Pad
          for (let k = 0; k < 16; k += 2) {
            drawSegment(points[308 + k]!, points[448 + k]!);
          }

          // Chin Pad to Mandible Base & Lower Jawline
          for (let k = 0; k < 16; k += 2) {
            drawSegment(points[448 + k]!, points[480 + k * 2]!);
            drawSegment(points[480 + k * 2]!, points[16 + k]!);
            drawSegment(points[480 + k * 2 + 1]!, points[48 - k]!);
          }

          // Outer Temples / Cheeks to Head Oval
          for (let k = 0; k < 8; k += 2) {
            drawSegment(points[64 + k]!, points[56 + k]!);
            drawSegment(points[88 + k]!, points[k]!);
            drawSegment(points[352 + k]!, points[50 + k]!);
            drawSegment(points[400 + k]!, points[6 + k]!);
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
