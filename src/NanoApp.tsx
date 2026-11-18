import React, { useState } from "react";
import { CanvasNano, type NanoViewLayout, type LineConnection } from "./components/CanvasNano";
import { ByteMatrix16x32 } from "./components/ByteMatrix16x32";
import type { BranchStyle } from "./components/CanvasBranchy";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { getSampleNanoBytes, parseNanoToken } from "./lib/sampleNanoBytes";

export default function NanoApp() {
  const [nanoBytes] = useState<Uint8Array>(() => getSampleNanoBytes());
  const [viewLayout, setViewLayout] = useState<NanoViewLayout>("grid16x32");
  const [branchStyle, setBranchStyle] = useState<BranchStyle>("knotty");
  const [lineConnection, setLineConnection] = useState<LineConnection>(1);
  const [showMatrix2Way, setShowMatrix2Way] = useState<boolean>(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const parsed = parseNanoToken(nanoBytes);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="size-2.5 rounded-full bg-[#f43f5e] shadow-[0_0_8px_#f43f5e]" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-wide">UKKO // NANOTOKEN DEMO</h1>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                  512-BYTE CONTAINER
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                High-density 16×32 graphical representation of self-healing vector tokens
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="./index.html"
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              ← 9-Char Graph
            </a>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8 lg:py-8">
        {/* Left Sidebar */}
        <aside className="space-y-5">
          {/* Token Telemetry Card */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-base font-semibold tracking-tight">NanoToken Metadata</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Source: tok_01838_hector2.png.token</p>
              </div>

              <div className="space-y-2 rounded-md border border-border bg-slate-50/60 p-3 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Container Size:</span>
                  <span className="font-semibold text-emerald-700">512 Bytes (Sector)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Magic & Ver:</span>
                  <span>{parsed.magic} (v{parsed.version})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model Binding:</span>
                  <span>DINOv3 ViT-S/16 (384-dim)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Dimensions:</span>
                  <span>{parsed.origWidth} × {parsed.origHeight} px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RS Parity Coverage:</span>
                  <span className="text-purple-700">Dual-Lane GF(2⁸) (32 B)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cryptographic Tag:</span>
                  <span className="text-rose-700">32 B HMAC-SHA256</span>
                </div>
              </div>

              {/* Merkle CID */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Parent Merkle CID
                </label>
                <div className="break-all rounded border border-border bg-muted/40 p-2 font-mono text-[10px] text-muted-foreground">
                  {parsed.targetPointerHex}
                </div>
              </div>

              {/* View Mode Selector */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Graph Layout</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={viewLayout === "grid16x32" && !showMatrix2Way ? "default" : "outline"}
                    onClick={() => {
                      setViewLayout("grid16x32");
                      setShowMatrix2Way(false);
                    }}
                  >
                    16×32 Lattice
                  </Button>
                  <Button
                    size="sm"
                    variant={viewLayout === "arterial" && !showMatrix2Way ? "default" : "outline"}
                    onClick={() => {
                      setViewLayout("arterial");
                      setShowMatrix2Way(false);
                    }}
                  >
                    Arterial Tree
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  variant={showMatrix2Way ? "default" : "outline"}
                  onClick={() => setShowMatrix2Way(!showMatrix2Way)}
                >
                  {showMatrix2Way ? "✓ 2-Way Byte Matrix (Active)" : "Toggle 2-Way Byte Matrix"}
                </Button>
              </div>

              {/* Line Connection Style 1, 2, 3 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Line Connection Style</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {viewLayout === "grid16x32"
                      ? lineConnection === 1
                        ? "1: Standard Lattice"
                        : lineConnection === 2
                          ? "2: Wave Ribbons"
                          : "3: Geodesic Grid"
                      : lineConnection === 1
                        ? "1: Polar Tree"
                        : lineConnection === 2
                          ? "2: Harmonic Ribs"
                          : "3: Torus Mesh"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Line Connection Style">
                  {([1, 2, 3] as const).map((conn) => (
                    <Button
                      key={conn}
                      size="sm"
                      variant={lineConnection === conn ? "default" : "outline"}
                      className="font-mono text-xs font-semibold"
                      onClick={() => setLineConnection(conn)}
                    >
                      {conn}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Branch Style */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch Style</h3>
                <div className="grid grid-cols-1 gap-1.5">
                  {(
                    [
                      { id: "knotty", label: "Knotty branch (1.4)" },
                      { id: "thin", label: "Ultra thin (0.4)" },
                      { id: "steel", label: "Steel frame (1.6 major / 0.6 rest)" },
                    ] as const
                  ).map((style) => (
                    <Button
                      key={style.id}
                      size="sm"
                      variant={branchStyle === style.id ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => setBranchStyle(style.id)}
                    >
                      <span
                        className={`mr-2 size-2 rounded-full ${branchStyle === style.id ? "bg-primary" : "bg-slate-300"
                          }`}
                      />
                      {style.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Right Content Area */}
        <section className="min-w-0 space-y-6">
          {/* Main Visualizer Card */}
          <VisualizerCard
            title="Graph 16×32"
            subtitle={`${viewLayout === "grid16x32" ? "16×32 Sector Lattice" : "Hierarchical Arterial Spine"} · Style ${lineConnection} (${lineConnection === 1 ? "Standard" : lineConnection === 2 ? "Harmonic Ribs" : "Geodesic Mesh"}) · 512 Points`}
          >
            <CanvasNano
              bytes={nanoBytes}
              branchStyle={branchStyle}
              viewLayout={viewLayout}
              lineConnection={lineConnection}
              scale="normal"
              hoverIndex={hoverIndex}
              onHoverNode={setHoverIndex}
            />
          </VisualizerCard>

          {/* 16x32 Byte Matrix View */}
          {showMatrix2Way && (
            <ByteMatrix16x32
              bytes={nanoBytes}
              hoverIndex={hoverIndex}
              onHoverNode={setHoverIndex}
            />
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:px-6 md:flex-row md:justify-between lg:px-8">
          <span>All rights reserved. &copy;Risto Ikonen 2026. Design Curation: Henri Ikonen</span>
          <span>512-point NanoToken is an exact 1 physical sector lossless container.</span>
        </div>
      </footer>
    </main>
  );
}

function VisualizerCard({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#38bdf8]" />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {subtitle}
        </span>
      </div>
      <CardContent className="flex min-h-[620px] items-center justify-center bg-slate-50/70 p-4 sm:p-6">
        {children}
      </CardContent>
    </Card>
  );
}
