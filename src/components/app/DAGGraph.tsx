import { Loader2, Network } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import GraphCanvas from "./GraphCanvas";

const DAGGraph = () => {
  const { graphData, graphState, generateGraph, currentText, hoverWordByLabel, inspectWordByLabel } = useAppStore();

  const handleGenerateGraph = () => {
    generateGraph();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold" style={{ color: "var(--fg)" }}>
          Dependency Graph
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (typeof window === 'undefined') return;
              const url = currentText ? `/graph?text=${encodeURIComponent(currentText)}` : '/graph';
              window.open(url, '_blank');
            }}
            className="px-2 py-1 text-xs rounded-md border"
            style={{ backgroundColor: "var(--button)", color: "var(--fg)", borderColor: "var(--border)" }}
          >
            Open Full Graph
          </button>
          <button
          onClick={handleGenerateGraph}
          disabled={graphState === "loading" || !currentText}
          className="px-3 py-1 text-sm rounded-md transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1"
          style={{
            backgroundColor: "var(--button)",
            color: "var(--fg)",
          }}
        >
          {graphState === "loading" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Network className="w-3 h-3" />
          )}
          {graphState === "loading" ? "Generating..." : "Generate Graph"}
          </button>
        </div>
      </div>

      {graphState === "idle" && !graphData && (
        <div
          className="text-center py-5 border border-dashed rounded-md min-h-[200px] flex items-center justify-center"
          style={{ color: "var(--muted)", borderColor: "var(--border)" }}
        >
          Click "Generate Graph" to visualize sentence structure.
        </div>
      )}

      {graphState === "loading" && (
        <div
          className="text-center py-5 border border-dashed rounded-md min-h-[200px] flex items-center justify-center"
          style={{ color: "var(--muted)", borderColor: "var(--border)" }}
        >
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Generating dependency graph...
        </div>
      )}

      {graphState === "error" && (
        <div
          className="text-center py-5 border border-dashed rounded-md min-h-[200px] flex items-center justify-center"
          style={{ color: "var(--error)", borderColor: "var(--error)" }}
        >
          Failed to generate graph. Please try again.
        </div>
      )}

      {graphData && graphState === "loaded" && (
        <div className="space-y-3">
          <GraphCanvas
            nodes={graphData.nodes}
            edges={graphData.edges}
            height={320}
            layout="force"
            onHoverNode={(n) => n ? hoverWordByLabel(n.label) : undefined}
            onSelectNode={(n) => inspectWordByLabel(n.label)}
          />
        </div>
      )}
    </div>
  );
};

export default DAGGraph;
