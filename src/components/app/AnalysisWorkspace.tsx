import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../store/appStore";

// POS colors (can be adjusted). These drive the legend dot color and inline word tint.
const posColorMap: { [key: string]: string } = {
  noun: "text-blue-400",
  verb: "text-red-400",
  adjective: "text-amber-400",
  adverb: "text-emerald-400",
  pronoun: "text-violet-400",
  preposition: "text-pink-400",
  conjunction: "text-cyan-400",
  "proper noun": "text-sky-400",
  default: "text-white/80",
};

// Case colors per requested palette:
// Accusative = red, Dative = purple, Genitive = green, Nominative = blue, Ablative = orange, Vocative = darker red
const caseColorMap: { [key: string]: string } = {
  nominative: "border-blue-400",
  genitive: "border-green-400",
  dative: "border-purple-400",
  accusative: "border-red-500",
  ablative: "border-orange-400",
  vocative: "border-rose-600",
};

const AnalysisWorkspace = () => {
  const {
    analysisResult,
    analysisState,
    hoveredWordIndex,
    setHoveredWordIndex,
    setInspectedWordIndex,
  } = useAppStore();
  const isAnalyzing = analysisState === "analyzing";
  const [activeSentence, setActiveSentence] = useState<number>(0);
  const [posFilters, setPosFilters] = useState<Set<string>>(new Set());
  const [caseFilters, setCaseFilters] = useState<Set<string>>(new Set());

  // Words for current context
  const wordsWithIndex = useMemo(() => {
    if (!analysisResult?.words) return [] as Array<{ word: any; index: number }>;
    return analysisResult.words.map((w, i) => ({ word: w, index: i }));
  }, [analysisResult]);

  const activeWords = useMemo(() => {
    const hasSentences = Array.isArray(analysisResult?.sentences) && (analysisResult?.sentences?.length || 0) > 0;
    return hasSentences
      ? wordsWithIndex.filter(({ word }) => (word as any)?.position?.sentenceIndex === activeSentence)
      : wordsWithIndex;
  }, [analysisResult, wordsWithIndex, activeSentence]);

  // Counts for legend (based on active sentence view)
  const posCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const { word } of activeWords) {
      const key = String(word?.partOfSpeech || "unknown").toLowerCase();
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  }, [activeWords]);

  const caseCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const { word } of activeWords) {
      const key = String(word?.morphology?.case || "").toLowerCase();
      if (!key) continue;
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  }, [activeWords]);

  // Debug logging for troubleshooting
  console.log(
    "AnalysisWorkspace render - words found:",
    analysisResult?.words?.length || 0
  );

  // Reset hovered word index when analysis result changes
  useEffect(() => {
    setHoveredWordIndex(null);
  }, [analysisResult, setHoveredWordIndex]);

  const relatedWordIndices = useMemo(() => {
    if (hoveredWordIndex === null || !analysisResult || !analysisResult.words) {
      return [];
    }
    // Check bounds to prevent array access errors
    if (
      hoveredWordIndex < 0 ||
      hoveredWordIndex >= analysisResult.words.length
    ) {
      return [];
    }
    const hoveredWord = analysisResult.words[hoveredWordIndex];
    if (!hoveredWord || !hoveredWord.relationships) {
      return [];
    }
    return hoveredWord.relationships.map((rel) => rel.relatedWordIndex);
  }, [hoveredWordIndex, analysisResult]);

  const renderContent = () => {
    if (
      !analysisResult ||
      !analysisResult.words ||
      analysisResult.words.length === 0
    ) {
      return (
        <div
          className="flex items-center justify-center h-full"
          style={{ color: "var(--muted)" }}
        >
          <span className="ml-3 text-lg">
            {analysisResult
              ? `No words found in analysis (${
                  analysisResult.words?.length || 0
                } words)`
              : "Awaiting analysis..."}
          </span>
        </div>
      );
    }

    const toRender = activeWords;

    return (
      <motion.div
        className="font-serif leading-loose flex flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        onMouseLeave={() => setHoveredWordIndex(null)}
      >
        {toRender.map(({ word, index }) => {
          // Safety check for word properties
          if (!word || typeof word !== "object") {
            console.warn(`Invalid word at index ${index}:`, word);
            return null;
          }

          const isHovered = index === hoveredWordIndex;
          const isRelated = relatedWordIndices.includes(index);
          const posClass =
            word.partOfSpeech && typeof word.partOfSpeech === "string"
              ? posColorMap[word.partOfSpeech.toLowerCase()] ||
                posColorMap.default
              : posColorMap.default;
          const caseClass =
            word.morphology?.case && typeof word.morphology.case === "string"
              ? caseColorMap[word.morphology.case.toLowerCase()]
              : "border-transparent";

          // Filtering logic: if any filter is active, highlight matches and dim others
          const filtersActive = posFilters.size > 0 || caseFilters.size > 0;
          const wordPos = String(word.partOfSpeech || '').toLowerCase();
          const wordCase = String(word.morphology?.case || '').toLowerCase();
          const matchesFilter = !filtersActive
            ? true
            : (posFilters.has(wordPos) || caseFilters.has(wordCase));

          let dynamicClass = "transition-all duration-150 rounded-md border-b-2 px-1.5 py-0.5 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-400/40";
          if (filtersActive) {
            dynamicClass += matchesFilter ? " ring-1 ring-white/20" : " opacity-40";
          } else if (isHovered) {
            dynamicClass += " bg-blue-500/20";
          } else if (isRelated) {
            dynamicClass += " bg-blue-500/20";
          } else if (hoveredWordIndex !== null) {
            dynamicClass += " opacity-50";
          }

          return (
            <span
              key={index}
              className={`mr-2 cursor-pointer p-1 ${dynamicClass} ${caseClass}`}
              onMouseEnter={() => setHoveredWordIndex(index)}
              onClick={() => setInspectedWordIndex(index)}
              title={`${word.word} — ${word.lemma} • ${String(word.partOfSpeech || '')}${word.morphology?.case ? `, ${word.morphology.case}` : ''}`}
            >
              <span className={posClass}>{word.word || "unknown"}</span>
            </span>
          );
        })}
      </motion.div>
    );
  };

  const togglePos = (pos: string) => {
    const key = pos.toLowerCase();
    setPosFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleCase = (kase: string) => {
    const key = kase.toLowerCase();
    setCaseFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setPosFilters(new Set());
    setCaseFilters(new Set());
  };

  const glassStyle = (active: boolean) => ({
    background: active
      ? "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.10) 100%)"
      : "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)",
    borderColor: "rgba(255,255,255,0.18)",
    color: "var(--fg)",
    boxShadow: active ? "0 4px 20px rgba(59,130,246,0.12)" : "none",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  } as React.CSSProperties);

  // Legend chip helpers: turn text/border color tokens into background tokens
  const toBgClass = (token: string, active: boolean) => {
    let cls = token.replace(/^text-/, 'bg-').replace(/^border-/, 'bg-');
    // bump shade for active, soften for inactive if a numeric shade exists
    cls = cls.replace(/-(\d{3})$/, active ? '-600' : '-300');
    return cls;
  };

  return (
    <div
      className={`p-4 rounded-lg border min-h-[300px] relative ${
        isAnalyzing ? "loading-border-aura" : ""
      }`}
      style={{
        backgroundColor: "var(--panel)",
        borderColor: isAnalyzing ? "transparent" : "var(--border)",
      }}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-white font-serif">
            Analysis
          </h2>
          <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
            <span className="uppercase tracking-wide text-[10px] opacity-70 mr-1">POS</span>
            {Object.entries(posColorMap)
              .filter(([key]) => key !== "default")
              .map(([pos, color]) => {
                const active = posFilters.has(pos.toLowerCase());
                const count = posCounts.get(pos.toLowerCase()) || 0;
                return (
                  <button
                    key={pos}
                    onClick={() => togglePos(pos)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-white/90 ${toBgClass(color, active)} ${active ? 'ring-1 ring-white/30' : ''}`}
                    style={{ borderColor: 'transparent' }}
                    title={`Toggle ${pos}`}
                  >
                    <span className="capitalize">{pos}</span>
                    <span className="ml-1 px-1 rounded bg-black/20 text-[10px]">{count}</span>
                  </button>
                );
              })}
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
            <span className="uppercase tracking-wide text-[10px] opacity-70 mr-1">Case</span>
            {Object.entries(caseColorMap).map(([kase, color]) => {
              const active = caseFilters.has(kase.toLowerCase());
              const count = caseCounts.get(kase.toLowerCase()) || 0;
              return (
                <button
                  key={kase}
                  onClick={() => toggleCase(kase)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-white/90 ${toBgClass(color, active)} ${active ? 'ring-1 ring-white/30' : ''}`}
                  style={{ borderColor: 'transparent' }}
                  title={`Toggle ${kase}`}
                >
                  <span className="capitalize">{kase}</span>
                  <span className="ml-1 px-1 rounded bg-black/20 text-[10px]">{count}</span>
                </button>
              );
            })}
            {(posFilters.size > 0 || caseFilters.size > 0) && (
              <button
                onClick={clearFilters}
                className="px-2 py-1 rounded-xl border"
                style={glassStyle(true)}
              >
                Clear filters
              </button>
            )}
          </div>
          {analysisResult?.sentences && analysisResult.sentences.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              {analysisResult.sentences.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSentence(i)}
                  className={`px-2 py-1 rounded-md border ${activeSentence === i ? "" : "opacity-70"}`}
                  style={{ backgroundColor: activeSentence === i ? "var(--button-hover)" : "var(--button)", color: "var(--fg)", borderColor: "var(--border)" }}
                >
                  S{i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AnalysisWorkspace;
