import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Node = { id: string; label: string; type?: string };
type Edge = { id: string; source: string; target: string; label?: string };

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  height?: number;
  layout?: 'circle' | 'grid' | 'force';
  filters?: { types?: Set<string>; search?: string };
  onSelectNode?: (node: Node) => void;
  onHoverNode?: (node: Node | null) => void;
}

// Simple categorical colors by node.type; fallback by index
const typeColor = (t?: string, i?: number) => {
  const map: Record<string, string> = {
    noun: "#60a5fa",
    verb: "#f87171",
    adjective: "#f59e0b",
    adverb: "#10b981",
    pronoun: "#a78bfa",
    preposition: "#f472b6",
    conjunction: "#22d3ee",
    entity: "#38bdf8",
  };
  if (t && map[t.toLowerCase()]) return map[t.toLowerCase()];
  const palette = ["#60a5fa", "#f87171", "#f59e0b", "#10b981", "#a78bfa", "#f472b6", "#22d3ee", "#38bdf8"];
  return palette[(i || 0) % palette.length];
};

const GraphCanvas: React.FC<GraphCanvasProps> = ({ nodes, edges, height = 520, layout = 'circle', filters, onSelectNode, onHoverNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Layouts: circle, grid, force
  const applyLayout = useCallback(() => {
    if (nodes.length === 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width ?? 800;
    const h = rect?.height ?? height;
    const next: Record<string, { x: number; y: number }> = {};

    if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const spacingX = Math.max(120, w / Math.max(1, cols));
      const spacingY = Math.max(90, h / Math.max(1, Math.ceil(nodes.length / cols)));
      nodes.forEach((n, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        next[n.id] = { x: 60 + col * spacingX, y: 60 + row * spacingY };
      });
    } else if (layout === 'force') {
      const R = Math.min(w, h) * 0.33;
      const cx = w / 2;
      const cy = h / 2;
      nodes.forEach((n, i) => {
        const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
        next[n.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
      });
      const idIndex = new Map(nodes.map((n, i) => [n.id, i] as const));
      const pos = nodes.map((n) => ({ ...next[n.id] }));
      const repulsion = 5000;
      const spring = 0.02;
      const rest = 140;
      for (let iter = 0; iter < 200; iter++) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = pos[j].x - pos[i].x;
            const dy = pos[j].y - pos[i].y;
            const d2 = Math.max(25, dx * dx + dy * dy);
            const f = repulsion / d2;
            const invd = 1 / Math.sqrt(d2);
            const fx = f * dx * invd;
            const fy = f * dy * invd;
            pos[i].x -= fx; pos[i].y -= fy;
            pos[j].x += fx; pos[j].y += fy;
          }
        }
        for (const e of edges) {
          const si = idIndex.get(e.source); const ti = idIndex.get(e.target);
          if (si == null || ti == null) continue;
          const dx = pos[ti].x - pos[si].x;
          const dy = pos[ti].y - pos[si].y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const f = spring * (dist - rest);
          const nx = dx / dist, ny = dy / dist;
          pos[si].x += f * nx; pos[si].y += f * ny;
          pos[ti].x -= f * nx; pos[ti].y -= f * ny;
        }
      }
      nodes.forEach((n, i) => { next[n.id] = pos[i]; });
    } else {
      const R = Math.min(w, h) * 0.33;
      const cx = w / 2;
      const cy = h / 2;
      nodes.forEach((n, i) => {
        const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
        next[n.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
      });
    }
    setPositions(next);
    setPan({ x: 0, y: 0 });
    setScale(1);
  }, [nodes, height, layout, edges]);

  useEffect(() => { applyLayout(); }, [applyLayout]);

  const onPointerDownBg = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).dataset.node) return; // node handles its own
    setIsPanning(true);
    panStart.current = { ...pan };
    pointerStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMoveBg = (e: React.PointerEvent) => {
    if (!isPanning || !panStart.current || !pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };

  const onPointerUpBg = (e: React.PointerEvent) => {
    setIsPanning(false);
    panStart.current = null;
    pointerStart.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    const mx = (e.clientX - (rect?.left || 0) - pan.x) / scale;
    const my = (e.clientY - (rect?.top || 0) - pan.y) / scale;
    const delta = -e.deltaY * 0.0015;
    const nextScale = Math.min(2.5, Math.max(0.4, scale * (1 + delta)));
    // zoom around mouse position
    const nx = e.clientX - (rect?.left || 0) - mx * nextScale;
    const ny = e.clientY - (rect?.top || 0) - my * nextScale;
    setScale(nextScale);
    setPan({ x: nx, y: ny });
  };

  const startDrag = (id: string) => (e: React.PointerEvent) => {
    setDragging(id);
    pointerStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = positions[id];
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDrag = (e: React.PointerEvent) => {
    if (!dragging || !panStart.current || !pointerStart.current) return;
    const dx = (e.clientX - pointerStart.current.x) / scale;
    const dy = (e.clientY - pointerStart.current.y) / scale;
    setPositions((prev) => ({ ...prev, [dragging]: { x: panStart.current!.x + dx, y: panStart.current!.y + dy } }));
  };
  const endDrag = (e: React.PointerEvent) => {
    setDragging(null);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const fitToView = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const xs = Object.values(positions).map((p) => p.x);
    const ys = Object.values(positions).map((p) => p.y);
    if (xs.length === 0 || ys.length === 0) return;
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const gw = Math.max(1, maxX - minX);
    const gh = Math.max(1, maxY - minY);
    const pad = 40;
    const sx = (w - pad) / gw;
    const sy = (h - pad) / gh;
    const s = Math.min(2, Math.max(0.4, Math.min(sx, sy)));
    setScale(s);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setPan({ x: w / 2 - cx * s, y: h / 2 - cy * s });
  }, [nodes.length, positions]);

  // Re-fit when positions first created
  useEffect(() => { if (Object.keys(positions).length) fitToView(); }, [positions, fitToView]);

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;

  // Filtering logic
  const searchNorm = (filters?.search || '').toLowerCase().trim();
  const visibleIds = new Set(
    nodes
      .filter((n) => {
        const matchesType = !filters?.types || filters.types.size === 0 || filters.types.has((n.type || '').toLowerCase());
        const matchesSearch = !searchNorm || n.label.toLowerCase().includes(searchNorm);
        return matchesType && matchesSearch;
      })
      .map((n) => n.id)
  );

  const idToPos = positions;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-md border overflow-hidden"
      style={{ borderColor: "var(--border)", height }}
      onPointerDown={onPointerDownBg}
      onPointerMove={(e) => { onPointerMoveBg(e); onDrag(e); }}
      onPointerUp={(e) => { onPointerUpBg(e); endDrag(e); }}
      onWheel={onWheel}
    >
      <svg className="absolute inset-0" style={{ pointerEvents: "none" }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148,163,184,0.9)" />
          </marker>
        </defs>
      </svg>
      <div className="absolute inset-0" style={{ transform, transformOrigin: "0 0" }}>
        {/* Edges */}
        <svg className="absolute inset-0" style={{ overflow: "visible" }}>
          {edges.map((e, i) => {
            const s = idToPos[e.source];
            const t = idToPos[e.target];
            if (!s || !t) return null;
            const visible = visibleIds.has(e.source) && visibleIds.has(e.target);
            const isHot = (selected && (e.source === selected || e.target === selected)) || false;
            return (
              <g key={e.id || i}>
                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={isHot ? "#60a5fa" : "rgba(148,163,184,0.7)"}
                  strokeWidth={isHot ? 2.4 : 1.4}
                  opacity={visible ? 1 : 0.25}
                  markerEnd="url(#arrow)" />
                {e.label && visible && (
                  <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 6} fontSize={11} fill="rgba(148,163,184,0.9)" textAnchor="middle">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((n, i) => {
          const p = idToPos[n.id];
          if (!p) return null;
          const color = typeColor(n.type, i);
          const isSel = selected === n.id;
          const isVisible = visibleIds.has(n.id);
          return (
            <div
              key={n.id}
              data-node
              onPointerDown={startDrag(n.id)}
              onClick={(e) => { e.stopPropagation(); const nextId = n.id === selected ? null : n.id; setSelected(nextId); onSelectNode?.(n); }}
              onMouseEnter={() => onHoverNode?.(n)}
              onMouseLeave={() => onHoverNode?.(null)}
              className={`absolute select-none cursor-grab active:cursor-grabbing rounded-xl px-3 py-1 text-sm shadow-md`}
              style={{
                left: p.x,
                top: p.y,
                transform: "translate(-50%, -50%)",
                background: "rgba(17, 24, 39, 0.6)",
                border: `2px solid ${color}`,
                color: "var(--fg)",
                boxShadow: isSel ? `0 0 0 6px ${color}22` : "0 4px 14px rgba(0,0,0,0.25)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                opacity: isVisible ? 1 : 0.35,
              }}
              title={`${n.label}${n.type ? ` (${n.type})` : ""}`}
            >
              <span style={{ color }}>{n.label}</span>
              {n.type && <span className="ml-1 opacity-70 text-xs">({n.type})</span>}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <button
          className="px-2 py-1 text-xs rounded-md border"
          style={{ backgroundColor: "var(--button)", color: "var(--fg)", borderColor: "var(--border)" }}
          onClick={() => setScale((s) => Math.max(0.4, s * 0.88))}
        >
          −
        </button>
        <button
          className="px-2 py-1 text-xs rounded-md border"
          style={{ backgroundColor: "var(--button)", color: "var(--fg)", borderColor: "var(--border)" }}
          onClick={() => setScale((s) => Math.min(2.5, s * 1.12))}
        >
          +
        </button>
        <button
          className="px-2 py-1 text-xs rounded-md border"
          style={{ backgroundColor: "var(--button)", color: "var(--fg)", borderColor: "var(--border)" }}
          onClick={fitToView}
        >
          Fit
        </button>
      </div>
    </div>
  );
};

export default GraphCanvas;
