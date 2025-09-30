import { Loader2, Network } from "lucide-react";
import { useEffect } from "react";
import { useAppStore } from "../../store/appStore";
import GraphCanvas from "./GraphCanvas";
import { useMemo, useState } from "react";

const FullGraph = () => {
  const { graphData, graphState, generateGraph, currentText, setCurrentText, hoverWordByLabel, inspectWordByLabel } = useAppStore();

  // Hydrate from ?text= query and auto-generate
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const textParam = params.get('text');
    if (textParam && !currentText) {
      setCurrentText(textParam);
    }
  }, [currentText, setCurrentText]);

  useEffect(() => {
    if (currentText && graphState === "idle" && !graphData) {
      generateGraph();
    }
  }, [currentText, graphState, graphData, generateGraph]);

  const [layout, setLayout] = useState<'circle' | 'grid' | 'force'>('force');
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const allTypes = useMemo(() => {
    if (!graphData) return [] as string[];
    const s = new Set<string>();
    for (const n of graphData.nodes) if (n.type) s.add(n.type.toLowerCase());
    return Array.from(s).sort();
  }, [graphData]);

  const toggleType = (t: string) => {
    setTypeFilters(prev => {
      const next = new Set(prev);
      const key = t.toLowerCase();
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="p-4 flex flex-col gap-3" style={{ color: "var(--fg)" }}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Full Graph</h2>
        <button
          onClick={() => generateGraph()}
          disabled={graphState === "loading" || !currentText}
          className="px-3 py-1 text-sm rounded-md transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1"
          style={{ backgroundColor: "var(--button)", color: "var(--fg)" }}
        >
          {graphState === "loading" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Network className="w-3 h-3" />
          )}
          {graphState === "loading" ? "Generating..." : "Generate/Refresh"}
        </button>
      </div>

      {graphState === "idle" && !graphData && (
        <div
          className="flex-1 flex items-center justify-center border border-dashed rounded-md"
          style={{ color: "var(--muted)", borderColor: "var(--border)" }}
        >
          Click "Generate/Refresh" to visualize sentence structure.
        </div>
      )}

      {graphState === "loading" && (
        <div
          className="flex-1 flex items-center justify-center border border-dashed rounded-md"
          style={{ color: "var(--muted)", borderColor: "var(--border)" }}
        >
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      )}

      {graphState === "error" && (
        <div
          className="flex-1 flex items-center justify-center border border-dashed rounded-md"
          style={{ color: "var(--error)", borderColor: "var(--error)" }}
        >
          Failed to generate graph. Please try again.
        </div>
      )}

      {graphData && graphState === "loaded" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm" style={{ color: "var(--muted)" }}>Layout</label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as any)}
              className="px-2 py-1 text-sm rounded-md border"
              style={{ backgroundColor: "var(--input)", color: "var(--fg)", borderColor: "var(--border)" }}
            >
              <option value="force">Force</option>
              <option value="circle">Circle</option>
              <option value="grid">Grid</option>
            </select>
            <div className="ml-4 flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
              <span>Filter:</span>
              {allTypes.map((t) => {
                const active = typeFilters.has(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`px-2 py-1 rounded-md border ${active ? '' : 'opacity-75'}`}
                    style={{ backgroundColor: active ? "var(--button-hover)" : "var(--button)", borderColor: "var(--border)", color: "var(--fg)" }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <input
              placeholder="Search nodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-auto px-2 py-1 text-sm rounded-md border"
              style={{ backgroundColor: "var(--input)", color: "var(--fg)", borderColor: "var(--border)" }}
            />
          </div>
          <GraphCanvas
            nodes={graphData.nodes}
            edges={graphData.edges}
            height={560}
            layout={layout}
            filters={{ types: typeFilters, search }}
            onHoverNode={(n) => n ? hoverWordByLabel(n.label) : undefined}
            onSelectNode={(n) => inspectWordByLabel(n.label)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-md" style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}>
              <h3 className="font-medium mb-2">Nodes</h3>
              <div className="flex flex-wrap gap-2">
                {graphData.nodes.map((node, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 rounded-full border text-sm"
                    style={{ backgroundColor: "var(--input)", borderColor: "var(--border)" }}
                  >
                    <span className="font-medium">{node.label}</span>
                    <span className="ml-1 text-xs" style={{ color: "var(--muted)" }}>({node.type})</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border rounded-md" style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}>
              <h3 className="font-medium mb-2">Edges</h3>
              <div className="space-y-2">
                {graphData.edges.map((edge, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{edge.source}</span>
                    <span style={{ color: "var(--accent)" }}>→</span>
                    <span className="font-medium">{edge.target}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>({edge.label})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullGraph;
