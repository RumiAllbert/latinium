import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Book,
  ChevronRight,
  Clock,
  Info,
  Lightbulb,
  Link as LinkIcon,
  Star,
  Users,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store/appStore";

interface ContextualTooltipProps {
  wordIndex: number | null;
  mousePosition: { x: number; y: number } | null;
  isVisible: boolean;
}

const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  wordIndex,
  mousePosition,
  isVisible,
}) => {
  const { analysisResult } = useAppStore();
  const [activeTab, setActiveTab] = useState<
    "analysis" | "etymology" | "relationships" | "cultural"
  >("analysis");
  const tooltipRef = useRef<HTMLDivElement>(null);

  const word =
    wordIndex !== null && analysisResult?.words
      ? analysisResult.words[wordIndex]
      : null;
  const pedagogicalNotes = (word as any)?.pedagogicalNotes;

  // Auto-position tooltip to avoid edges
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!mousePosition || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = mousePosition.x + 15; // Offset from cursor
    let y = mousePosition.y - rect.height - 10; // Above cursor

    // Adjust horizontal position
    if (x + rect.width > viewportWidth - 20) {
      x = mousePosition.x - rect.width - 15; // Move to left of cursor
    }

    // Adjust vertical position
    if (y < 20) {
      y = mousePosition.y + 15; // Move below cursor
    }

    setPosition({ x, y });
  }, [mousePosition, word]);

  if (!isVisible || !word || wordIndex === null) return null;

  const renderAnalysisTab = () => (
    <div className="space-y-3">
      {/* Basic Info */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white font-serif">
            {word.word}
          </h3>
          <p className="text-sm text-blue-300 italic">
            {word.lemma} • {word.partOfSpeech}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {pedagogicalNotes?.difficulty && (
            <span
              className={`
              px-2 py-1 rounded text-xs font-bold
              ${
                pedagogicalNotes.difficulty === "easy"
                  ? "bg-green-500/30 text-green-200"
                  : pedagogicalNotes.difficulty === "medium"
                  ? "bg-yellow-500/30 text-yellow-200"
                  : "bg-red-500/30 text-red-200"
              }
            `}
            >
              {pedagogicalNotes.difficulty}
            </span>
          )}
          <Star className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      {/* Meaning */}
      <div className="bg-white/5 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-white/80 mb-1 flex items-center gap-2">
          <Book className="w-4 h-4" />
          Meaning
        </h4>
        <p className="text-white">
          {word.meaning?.detailed ||
            word.meaning?.short ||
            "No meaning available"}
        </p>
      </div>

      {/* Morphology */}
      {word.morphology && Object.keys(word.morphology).length > 0 && (
        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white/80 mb-2">Grammar</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(word.morphology).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-white/70 capitalize">{key}:</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory Aid */}
      {pedagogicalNotes?.memoryAid && (
        <div className="bg-violet-500/10 border border-violet-400/20 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-violet-200 mb-1 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Memory Aid
          </h4>
          <p className="text-violet-100 text-sm">
            {pedagogicalNotes.memoryAid}
          </p>
        </div>
      )}

      {/* Common Mistakes */}
      {pedagogicalNotes?.commonMistakes && (
        <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-red-200 mb-1 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Common Mistakes
          </h4>
          <p className="text-red-100 text-sm">
            {pedagogicalNotes.commonMistakes}
          </p>
        </div>
      )}
    </div>
  );

  const renderEtymologyTab = () => (
    <div className="space-y-3">
      {pedagogicalNotes?.etymology ? (
        <div className="bg-amber-500/10 border border-amber-400/20 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-amber-200 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Etymology
          </h4>
          <p className="text-amber-100 text-sm leading-relaxed">
            {pedagogicalNotes.etymology}
          </p>
        </div>
      ) : (
        <div className="text-center text-white/50 py-8">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Etymology information not available</p>
        </div>
      )}

      {/* Related Words */}
      {(word as any).relatedWords && (
        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white/80 mb-2">
            Related Words
          </h4>
          <div className="space-y-2">
            {(word as any).relatedWords.synonyms?.length > 0 && (
              <div>
                <span className="text-xs text-white/60">Synonyms:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(word as any).relatedWords.synonyms
                    .slice(0, 4)
                    .map((syn: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-500/20 text-blue-200 text-xs rounded"
                      >
                        {syn}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {(word as any).relatedWords.derivedForms?.length > 0 && (
              <div>
                <span className="text-xs text-white/60">Derived Forms:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(word as any).relatedWords.derivedForms
                    .slice(0, 3)
                    .map((form: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-emerald-500/20 text-emerald-200 text-xs rounded"
                      >
                        {form}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderRelationshipsTab = () => (
    <div className="space-y-3">
      {word.relationships && word.relationships.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Grammatical Relationships
          </h4>
          {word.relationships.map((rel, i) => {
            const relatedWord = analysisResult?.words[rel.relatedWordIndex];
            return (
              <div
                key={i}
                className="bg-white/5 rounded-lg p-3 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{word.word}</span>
                    <ArrowRight className="w-4 h-4 text-white/60" />
                    <span className="text-blue-300 font-medium">
                      {relatedWord?.word || "?"}
                    </span>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="text-emerald-300 font-semibold">
                    {rel.type}
                  </div>
                  <div className="text-white/70">{rel.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-white/50 py-8">
          <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No relationships identified</p>
        </div>
      )}
    </div>
  );

  const renderCulturalTab = () => (
    <div className="space-y-3">
      {pedagogicalNotes?.culturalContext ? (
        <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Cultural Context
          </h4>
          <p className="text-purple-100 text-sm leading-relaxed">
            {pedagogicalNotes.culturalContext}
          </p>
        </div>
      ) : (
        <div className="text-center text-white/50 py-8">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Cultural context information not available</p>
        </div>
      )}

      {/* Usage Examples */}
      {(word as any).relatedWords?.usageExamples?.length > 0 && (
        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white/80 mb-2">
            Classical Usage Examples
          </h4>
          <div className="space-y-2">
            {(word as any).relatedWords.usageExamples
              .slice(0, 2)
              .map((example: string, i: number) => (
                <div key={i} className="text-sm">
                  <p className="text-white/80 italic font-serif">"{example}"</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: "analysis", label: "Analysis", icon: Book },
    { id: "etymology", label: "Etymology", icon: Clock },
    { id: "relationships", label: "Links", icon: LinkIcon },
    { id: "cultural", label: "Culture", icon: Users },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed z-50 w-80 max-w-[90vw] pointer-events-auto"
        style={{
          left: position.x,
          top: position.y,
          transform: "translateZ(0)", // Force hardware acceleration
        }}
      >
        <div className="bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`
                  flex-1 px-3 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1
                  ${
                    activeTab === id
                      ? "text-blue-300 bg-blue-500/20 border-b-2 border-blue-400"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {activeTab === "analysis" && renderAnalysisTab()}
            {activeTab === "etymology" && renderEtymologyTab()}
            {activeTab === "relationships" && renderRelationshipsTab()}
            {activeTab === "cultural" && renderCulturalTab()}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Volume2 className="w-3 h-3" />
              <span>Click word for detailed view</span>
            </div>
            <button className="text-xs text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-1">
              More details
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Subtle pointer arrow */}
        <div
          className="absolute w-3 h-3 bg-gray-900/95 border-l border-t border-white/20 rotate-45 -z-10"
          style={{
            left: "50%",
            top: "100%",
            marginLeft: "-6px",
            marginTop: "-6px",
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for managing tooltip state
export const useContextualTooltip = () => {
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = (wordIndex: number, event: React.MouseEvent) => {
    setHoveredWordIndex(wordIndex);
    setMousePosition({ x: event.clientX, y: event.clientY });
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
    // Keep state for smooth exit animation
    setTimeout(() => {
      setHoveredWordIndex(null);
      setMousePosition(null);
    }, 200);
  };

  const updatePosition = (event: React.MouseEvent) => {
    if (isVisible) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  return {
    hoveredWordIndex,
    mousePosition,
    isVisible,
    showTooltip,
    hideTooltip,
    updatePosition,
  };
};

export default ContextualTooltip;
