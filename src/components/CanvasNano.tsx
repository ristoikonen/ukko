import React, { useEffect, useRef } from "react";
import type { BranchStyle, ScaleSize } from "./CanvasBranchy";

export type NanoViewLayout = "grid16x32" | "arterial";
export type LineConnection = 1 | 2 | 3;
export type GraphColor = "none" | "1" | "2";

// Color Set 1
export const COLOR_SET_1 = [
  "#56B4E9", // Sky Blue
  "#009E73", // Bluish Green
  "#E69F00", // Orange
  "#CC79A7", // Reddish Purple
  "#F0E442", // Yellow
];

// Color Set 2
export const COLOR_SET_2 = [
  "#1E293B", // Deep Navy
  "#334155", // Steel Blue
  "#64748B", // Muted Blue
  "#94A3B8", // Cool Gray
  "#E2E8F0", // Light Mist
];

interface CanvasNanoProps {
  bytes: Uint8Array;
  branchStyle?: BranchStyle;
  scale?: ScaleSize;
  viewLayout?: NanoViewLayout;
  lineConnection?: LineConnection;
  graphColor?: GraphColor;
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
  graphColor = "none",
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
    const points: { x: number; y: number; val: number; index: number; z?: number }[] = [];

    if (viewLayout === "grid16x32") {
      // --- 16×32 STRUCTURED LATTICE (Always used for grid16x32 view) ---
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
      // --- ARTERIAL TREE: STYLE 1 (Zoned Polar Arterial Layout as is) ---
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
      // --- ARTERIAL TREE: STYLES 2 & 3 (3D Toroidal Geodesic Manifold) ---
      // One unified geometric object: 512 points mapped to a 3D Torus (16 rows × 32 columns)
      // Tilted in 3D space with perspective depth projection
      const centerX = size / 2;
      const centerY = size / 2;
      const fov = 520;
      const faceScale = usableSize / 540;

      const majorR = 135 * faceScale;
      const minorR = 64 * faceScale;
      const cols = 32;
      const rows = 16;

      // 3D rotation angles for isometric depth perception
      const rotX = (56 * Math.PI) / 180;
      const rotZ = (26 * Math.PI) / 180;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const b = bytes[i] ?? 0;

        // Subtle nanotoken byte harmonic perturbation on tube thickness
        const byteHarmonic = ((b - 128) / 128) * (minorR * 0.12);
        const localMinorR = minorR + byteHarmonic;

        const u = (row / rows) * Math.PI * 2;
        const v = (col / cols) * Math.PI * 2;

        // Parametric Torus coordinates
        const x0 = (majorR + localMinorR * Math.cos(u)) * Math.cos(v);
        const y0 = (majorR + localMinorR * Math.cos(u)) * Math.sin(v);
        const z0 = localMinorR * Math.sin(u);

        // 3D Euler Rotation (Z then X)
        const x1 = x0 * cosZ - y0 * sinZ;
        const y1 = x0 * sinZ + y0 * cosZ;
        const z1 = z0;

        const x2 = x1;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        // Perspective Projection
        const persp = fov / (fov - z2);
        const x = centerX + x2 * persp;
        const y = centerY + y2 * persp;
        points.push({ x, y, val: b, index: i, z: z2 });
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
    const traceEdges = (mode: "all" | "major" | "rest" = "all", useCurves = false) => {
      const drawSegment = (
        p1: (typeof points)[0],
        p2: (typeof points)[0],
        curveDelta = 0,
        isMajor = false
      ) => {
        if (!p1 || !p2) return;
        if (mode === "major" && !isMajor) return;
        if (mode === "rest" && isMajor) return;

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
        const getPt = (r: number, c: number) =>
          points[Math.min(15, Math.max(0, r)) * 32 + Math.min(31, Math.max(0, c))]!;

        if (lineConnection === 1) {
          // --- 16×32 LATTICE: STYLE 1 (Standard rows + periodic bridges) ---
          for (let r = 0; r < 16; r++) {
            const isRowMajor = r === 0 || r === 5 || r === 10 || r === 15;
            for (let c = 0; c < 31; c++) {
              drawSegment(
                getPt(r, c),
                getPt(r, c + 1),
                (c % 2 === 0 ? 2 : -2) * scaleFactor,
                isRowMajor
              );
            }
          }
          for (let c = 0; c < 32; c += 2) {
            const isColMajor = c % 4 === 0;
            for (let r = 0; r < 15; r++) {
              drawSegment(getPt(r, c), getPt(r + 1, c), 0, isColMajor);
            }
          }
        } else if (lineConnection === 2) {
          // --- 16×32 LATTICE: STYLE 2 (Harmonic Ribbon Waves & Serpentine Diagonals) ---
          // 16 horizontal sinusoidal wave ribbons
          for (let r = 0; r < 16; r++) {
            const isMajorRibbon = r === 0 || r === 4 || r === 8 || r === 12;
            for (let c = 0; c < 31; c++) {
              drawSegment(
                getPt(r, c),
                getPt(r, c + 1),
                (c % 2 === 0 ? 2.5 : -2.5) * scaleFactor,
                isMajorRibbon
              );
            }
          }
          // Vertical structural pillars
          for (let c = 0; c < 32; c += 4) {
            const isColMajor = c % 8 === 0;
            for (let r = 0; r < 15; r++) {
              drawSegment(getPt(r, c), getPt(r + 1, c), 0, isColMajor);
            }
          }
          // Serpentine diagonal weaves
          for (let c = 0; c < 30; c += 2) {
            for (let r = 0; r < 15; r++) {
              const targetC = r % 2 === 0 ? c + 1 : c;
              drawSegment(
                getPt(r, targetC),
                getPt(r + 1, targetC + (r % 2 === 0 ? -1 : 1)),
                (r % 2 === 0 ? 1.5 : -1.5) * scaleFactor,
                false
              );
            }
          }
        } else {
          // --- 16×32 LATTICE: STYLE 3 (Full 2D/Isometric Geodesic Diamond Triangulation) ---
          // Full horizontal lines
          for (let r = 0; r < 16; r++) {
            const isMajorRow = r % 4 === 0;
            for (let c = 0; c < 31; c++) {
              drawSegment(getPt(r, c), getPt(r, c + 1), 0, isMajorRow);
            }
          }
          // Full vertical lines
          for (let c = 0; c < 32; c++) {
            const isMajorCol = c % 4 === 0;
            for (let r = 0; r < 15; r++) {
              drawSegment(getPt(r, c), getPt(r + 1, c), 0, isMajorCol);
            }
          }
          // Dual diagonal geodesic cross-chords
          for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 31; c++) {
              drawSegment(getPt(r, c), getPt(r + 1, c + 1), 0, false);
              drawSegment(getPt(r, c + 1), getPt(r + 1, c), 0, false);
            }
          }
        }
      } else {
        // --- ARTERIAL TREE LAYOUT ---
        if (lineConnection === 1) {
          // --- ARTERIAL TREE: STYLE 1 (16-Hub Spine + Leaf Twigs) ---
          const hubs: typeof points = [];
          for (let i = 0; i < 16; i++) {
            const hubPt = points[i * 32];
            if (hubPt) hubs.push(hubPt);
          }
          for (let i = 0; i < hubs.length - 1; i++) {
            drawSegment(hubs[i]!, hubs[i + 1]!, 0, true);
          }
          for (let i = 0; i < points.length; i++) {
            if (i % 32 === 0) continue;
            const parentHub = hubs[Math.floor(i / 32)];
            if (parentHub) {
              const isTrunk = i % 8 === 0;
              drawSegment(parentHub, points[i]!, (i % 2 === 0 ? 4 : -4) * scaleFactor, isTrunk);
            }
          }
        } else if (lineConnection === 2) {
          // --- ARTERIAL TREE: STYLE 2 (3D Toroidal Streamlines & Villarceau Harmonic Ribs) ---
          const rows = 16;
          const cols = 32;
          const getPt = (r: number, c: number) =>
            points[((r % rows + rows) % rows) * cols + ((c % cols + cols) % cols)]!;

          // 1. All 32 circular meridian rings (around the tube)
          for (let c = 0; c < cols; c++) {
            const isMajorMeridian = c % 8 === 0;
            for (let r = 0; r < rows; r++) {
              drawSegment(
                getPt(r, c),
                getPt(r + 1, c),
                useCurves ? (r % 2 === 0 ? 1.5 : -1.5) * scaleFactor : 0,
                isMajorMeridian
              );
            }
          }

          // 2. Key parallel circular rings (outer equator, inner equator, top crown, bottom keel)
          for (const r of [0, 4, 8, 12]) {
            for (let c = 0; c < cols; c++) {
              drawSegment(
                getPt(r, c),
                getPt(r, c + 1),
                useCurves ? (c % 2 === 0 ? 1.5 : -1.5) * scaleFactor : 0,
                true // Major frame ring!
              );
            }
          }

          // 3. Villarceau / Hopf Fibration spiral streamlines winding through the donut hole
          for (let startC = 0; startC < cols; startC += 2) {
            for (let step = 0; step < rows; step++) {
              drawSegment(
                getPt(step, startC + step * 2),
                getPt(step + 1, startC + (step + 1) * 2),
                useCurves ? 1.5 * scaleFactor : 0,
                false
              );
              drawSegment(
                getPt(step, startC - step * 2),
                getPt(step + 1, startC - (step + 1) * 2),
                useCurves ? -1.5 * scaleFactor : 0,
                false
              );
            }
          }
        } else {
          // --- ARTERIAL TREE: STYLE 3 (Full 3D Geodesic Diamond Wireframe Mesh) ---
          const rows = 16;
          const cols = 32;
          const getPt = (r: number, c: number) =>
            points[((r % rows + rows) % rows) * cols + ((c % cols + cols) % cols)]!;

          // 1. All 16 parallel ring loops
          for (let r = 0; r < rows; r++) {
            const isMajorRing = r % 4 === 0;
            for (let c = 0; c < cols; c++) {
              drawSegment(getPt(r, c), getPt(r, c + 1), 0, isMajorRing);
            }
          }

          // 2. All 32 meridian ring loops
          for (let c = 0; c < cols; c++) {
            const isMajorMeridian = c % 4 === 0;
            for (let r = 0; r < rows; r++) {
              drawSegment(getPt(r, c), getPt(r + 1, c), 0, isMajorMeridian);
            }
          }

          // 3. Dual diagonal cross-chords forming complete 3D geodesic diamond tessellation
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              drawSegment(getPt(r, c), getPt(r + 1, c + 1), 0, false);
              drawSegment(getPt(r, c), getPt(r + 1, c - 1), 0, false);
            }
          }
        }
      }
    };

    // --- FILL WIREFRAME DONUT / SURFACE AREAS IN COLOR PATCHES ---
    if (graphColor !== "none") {
      const palette = graphColor === "1" ? COLOR_SET_1 : COLOR_SET_2;

      interface SurfaceFacet {
        pts: (typeof points)[0][];
        avgZ: number;
        color: string;
      }

      const facets: SurfaceFacet[] = [];

      if (viewLayout === "arterial" && lineConnection !== 1) {
        // --- 3D TORUS ("DONUT"): 16 ROWS × 32 COLS SURFACE PATCHES ---
        const rows = 16;
        const cols = 32;
        const getPt = (r: number, c: number) =>
          points[((r % rows + rows) % rows) * cols + ((c % cols + cols) % cols)]!;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const p1 = getPt(r, c);
            const p2 = getPt(r, c + 1);
            const p3 = getPt(r + 1, c + 1);
            const p4 = getPt(r + 1, c);

            const avgZ = ((p1.z ?? 0) + (p2.z ?? 0) + (p3.z ?? 0) + (p4.z ?? 0)) / 4;

            // Parametric angles on the torus tube
            const u = (r / rows) * Math.PI * 2;
            const v = (c / cols) * Math.PI * 2;
            const avgVal = (p1.val + p2.val + p3.val + p4.val) / 4;

            // Higher-frequency periodic harmonics creating smaller, variegated color patches (~1.9 cells per patch)
            const h1 = Math.sin(u * 2 + v * 1);
            const h2 = Math.cos(v * 3 - u * 1);
            const h3 = Math.sin(u * 3 + v * 2);
            const byteNoise = ((Math.round(avgVal) % 29) / 29) * 1.5;

            // Balanced modulo 5 guarantees an equal ~20% distribution across all 5 palette colors
            const colorIdx =
              Math.floor(
                (h1 * 2.0 + h2 * 2.0 + h3 * 1.0 + byteNoise + (r % 2) * 0.4 + (c % 2) * 0.4) % 5 + 5
              ) % 5;

            facets.push({
              pts: [p1, p2, p3, p4],
              avgZ,
              color: palette[colorIdx]!,
            });
          }
        }

        // Painter's algorithm: sort back-to-front so front surfaces occlude back surfaces
        facets.sort((a, b) => a.avgZ - b.avgZ);
      } else if (viewLayout === "grid16x32") {
        // --- 16×32 LATTICE: SURFACE PATCHES ---
        const rows = 16;
        const cols = 32;
        const getPt = (r: number, c: number) => points[r * cols + c]!;

        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols - 1; c++) {
            const p1 = getPt(r, c);
            const p2 = getPt(r, c + 1);
            const p3 = getPt(r + 1, c + 1);
            const p4 = getPt(r + 1, c);

            const u = (r / (rows - 1)) * Math.PI * 2;
            const v = (c / (cols - 1)) * Math.PI * 2;
            const avgVal = (p1.val + p2.val + p3.val + p4.val) / 4;

            const h1 = Math.sin(u * 2 + v * 1);
            const h2 = Math.cos(v * 3 - u * 1);
            const h3 = Math.sin(u * 3 + v * 2);
            const byteNoise = ((Math.round(avgVal) % 29) / 29) * 1.5;

            const colorIdx =
              Math.floor(
                (h1 * 2.0 + h2 * 2.0 + h3 * 1.0 + byteNoise + (r % 2) * 0.4 + (c % 2) * 0.4) % 5 + 5
              ) % 5;

            facets.push({
              pts: [p1, p2, p3, p4],
              avgZ: 0,
              color: palette[colorIdx]!,
            });
          }
        }
      } else {
        // --- ARTERIAL TREE (POLAR STYLE 1): RADIAL SECTOR TIER PATCHES ---
        for (let s = 0; s < 16; s++) {
          const nextS = (s + 1) % 16;
          const hub1 = points[s * 32];
          const hub2 = points[nextS * 32];
          const mid1 = points[s * 32 + 15];
          const mid2 = points[nextS * 32 + 15];
          const rim1 = points[s * 32 + 31];
          const rim2 = points[nextS * 32 + 31];

          if (hub1 && hub2 && mid1 && mid2) {
            const avg1 = (hub1.val + hub2.val + mid1.val + mid2.val) / 4;
            const colorIdx1 = (s * 2 + Math.floor(avg1 / 30)) % 5;
            facets.push({
              pts: [hub1, mid1, mid2, hub2],
              avgZ: 0,
              color: palette[colorIdx1]!,
            });
          }

          if (mid1 && mid2 && rim1 && rim2) {
            const avg2 = (mid1.val + mid2.val + rim1.val + rim2.val) / 4;
            const colorIdx2 = (s * 2 + 1 + Math.floor(avg2 / 30)) % 5;
            facets.push({
              pts: [mid1, rim1, rim2, mid2],
              avgZ: 0,
              color: palette[colorIdx2]!,
            });
          }
        }
      }

      // Render facet color patches
      facets.forEach((f) => {
        if (!f.pts[0]) return;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for (let k = 1; k < f.pts.length; k++) {
          const pt = f.pts[k];
          if (pt) ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();
      });
    }

    // --- RENDER BASED ON EXACT USER SPECIFIED WIDTHS ---
    if (branchStyle === "knotty") {
      // --- KNOTTY: 1.4 ---
      const baseW = scale === "xsmall" ? 0.7 : scale === "small" ? 1.0 : 1.4;
      strokePath("#1a1a1a", baseW, "round", () => traceEdges("all", true));

      // Knotty nodes: black with hollow white core
      points.forEach((p, idx) => {
        const isHovered = hoverIndex === idx;
        const depthBoost = p.z !== undefined ? Math.max(0.75, 1 + p.z / 350) : 1;
        const isHub = idx % 32 === 0;
        const radius = (isHovered ? 4.5 : isHub ? 2.4 : 1.3) * scaleFactor * depthBoost;

        ctx.fillStyle = isHovered ? "#f43f5e" : "#1a1a1a";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, radius), 0, Math.PI * 2);
        ctx.fill();

        if (scale !== "xsmall") {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.4, radius - 0.7 * scaleFactor), 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else if (branchStyle === "thin") {
      // --- THIN: 0.4 ---
      strokePath("#222222", 0.4, "square", () => traceEdges("all", false));

      // Thin nodes: crisp black micro-dots
      points.forEach((p, idx) => {
        const isHovered = hoverIndex === idx;
        const depthBoost = p.z !== undefined ? Math.max(0.75, 1 + p.z / 350) : 1;
        const radius = (isHovered ? 3.5 : 1.1) * scaleFactor * depthBoost;

        ctx.fillStyle = isHovered ? "#f43f5e" : "#000000";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, radius), 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // --- STEEL / DEFAULT: 1.6 MAJOR LINES (~20% LT GRAY) & 0.6 FOR REST (DARKEST GRAY) ---
      // 1. Pass 1: Few major frame lines about 20% (1.6 width, Light Gray)
      strokePath("#94a3b8", 1.6, "butt", () => traceEdges("major", false));
      // 2. Pass 2: The rest of the lines (0.6 width, Darkest Gray)
      strokePath("#111111", 0.6, "butt", () => traceEdges("rest", false));

      // Steel nodes: refined square micro-pads
      points.forEach((p, idx) => {
        const isHovered = hoverIndex === idx;
        const depthBoost = p.z !== undefined ? Math.max(0.75, 1 + p.z / 350) : 1;
        const s = Math.max(2.0, (isHovered ? 5.5 : 3.2) * scaleFactor * depthBoost);

        ctx.fillStyle = isHovered ? "#f43f5e" : "#111111";
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);

        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = Math.max(0.4, 0.6 * scaleFactor);
        ctx.strokeRect(p.x - s / 2 + 0.5, p.y - s / 2 + 0.5, s - 1, s - 1);
      });
    }
  }, [bytes, branchStyle, scale, viewLayout, lineConnection, graphColor, hoverIndex]);

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
