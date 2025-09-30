import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useAppStore } from "../../store/appStore";

const InlineInspector = () => {
  const { analysisResult, inspectedWordIndex, setInspectedWordIndex } =
    useAppStore();

  const inspectedWord =
    inspectedWordIndex !== null && analysisResult
      ? analysisResult.words[inspectedWordIndex]
      : null;

  const renderMorphology = () => {
    if (!inspectedWord || !inspectedWord.morphology) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(inspectedWord.morphology).map(([key, value]) => (
          <div
            key={key}
            className="px-2 py-1 rounded-md text-xs"
            style={{
              backgroundColor: "var(--button)",
              color: "var(--fg)",
            }}
          >
            <span className="font-semibold capitalize">{key}: </span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderRelationships = () => {
    if (!inspectedWord || !inspectedWord.relationships || !analysisResult)
      return null;
    return (
      <ul className="space-y-1 text-sm">
        {inspectedWord.relationships.map((rel, i) => (
          <li key={i} className="text-white/80">
            <span className="font-semibold">{rel.type}</span>: {" "}
            {analysisResult.words[rel.relatedWordIndex]?.word ?? "?"} ({rel.description})
          </li>
        ))}
      </ul>
    );
  };

  return (
    <AnimatePresence>
      {inspectedWord && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="p-4 backdrop-blur-md rounded-lg border overflow-hidden"
          style={{
            backgroundColor: "var(--bg-accent)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3
                className="text-lg font-semibold font-serif"
                style={{ color: "var(--fg)" }}
              >
                {inspectedWord.word}
              </h3>
              <p className="text-md italic" style={{ color: "var(--muted)" }}>
                {inspectedWord.lemma} - "{typeof (inspectedWord as any).meaning === 'string' ? (inspectedWord as any).meaning : (inspectedWord as any).meaning?.short}"
              </p>
            </div>
            <button
              onClick={() => setInspectedWordIndex(null)}
              className="p-1 rounded-full hover:bg-[var(--button)]"
            >
              <X size={20} style={{ color: "var(--fg)" }} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4
                className="font-semibold text-sm mb-2"
                style={{ color: "var(--muted)" }}
              >
                Morphology
              </h4>
              {renderMorphology()}
            </div>
            <div>
              <h4
                className="font-semibold text-sm mb-2"
                style={{ color: "var(--muted)" }}
              >
                Relationships
              </h4>
              {renderRelationships()}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InlineInspector;
