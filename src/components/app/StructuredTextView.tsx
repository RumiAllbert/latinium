import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Layers,
  Move,
  Target,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useAppStore } from "../../store/appStore";

type ReadingMode = "beginner" | "intermediate" | "advanced";
type ViewMode = "linear" | "structured" | "grammatical";
type DifficultyFilter = "all" | "easy" | "medium" | "hard";

// Enhanced POS colors with better accessibility
const posColorMap: {
  [key: string]: { text: string; bg: string; border: string };
} = {
  noun: {
    text: "text-blue-100",
    bg: "bg-blue-500/20",
    border: "border-blue-400",
  },
  verb: { text: "text-red-100", bg: "bg-red-500/20", border: "border-red-400" },
  adjective: {
    text: "text-amber-100",
    bg: "bg-amber-500/20",
    border: "border-amber-400",
  },
  adverb: {
    text: "text-emerald-100",
    bg: "bg-emerald-500/20",
    border: "border-emerald-400",
  },
  pronoun: {
    text: "text-violet-100",
    bg: "bg-violet-500/20",
    border: "border-violet-400",
  },
  preposition: {
    text: "text-pink-100",
    bg: "bg-pink-500/20",
    border: "border-pink-400",
  },
  conjunction: {
    text: "text-cyan-100",
    bg: "bg-cyan-500/20",
    border: "border-cyan-400",
  },
  "proper noun": {
    text: "text-sky-100",
    bg: "bg-sky-500/20",
    border: "border-sky-400",
  },
  default: {
    text: "text-white/80",
    bg: "bg-white/10",
    border: "border-white/20",
  },
};

// Case colors with enhanced visibility
const caseColorMap: { [key: string]: string } = {
  nominative: "border-b-blue-400 border-b-2",
  genitive: "border-b-green-400 border-b-2",
  dative: "border-b-purple-400 border-b-2",
  accusative: "border-b-red-500 border-b-2",
  ablative: "border-b-orange-400 border-b-2",
  vocative: "border-b-rose-600 border-b-2",
};

// Relationship connector colors
const relationshipColors: { [key: string]: string } = {
  subject: "#3b82f6",
  object: "#ef4444",
  modifier: "#f59e0b",
  clause: "#8b5cf6",
  default: "#6b7280",
};

interface StructuredTextViewProps {
  className?: string;
}

const StructuredTextView: React.FC<StructuredTextViewProps> = ({
  className = "",
}) => {
  const {
    analysisResult,
    analysisState,
    hoveredWordIndex,
    setHoveredWordIndex,
    setInspectedWordIndex,
  } = useAppStore();

  // View state
  const [readingMode, setReadingMode] = useState<ReadingMode>("intermediate");
  const [viewMode, setViewMode] = useState<ViewMode>("structured");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");
  const [showTranslations, setShowTranslations] = useState(false);
  const [showHelpers, setShowHelpers] = useState(true);
  const [activeSentence, setActiveSentence] = useState<number>(0);
  const [draggedWord, setDraggedWord] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const isAnalyzing = analysisState === "analyzing";

  // Enhanced words with pedagogical info
  const enhancedWords = useMemo(() => {
    if (!analysisResult?.words) return [];

    return analysisResult.words.map((word, index) => ({
      ...word,
      index,
      colors:
        posColorMap[word.partOfSpeech?.toLowerCase()] || posColorMap.default,
      caseClass: word.morphology?.case
        ? caseColorMap[word.morphology.case.toLowerCase()]
        : "",
      difficulty: (word as any).pedagogicalNotes?.difficulty || "medium",
      relationships: word.relationships || [],
    }));
  }, [analysisResult]);

  // Filter words by difficulty and sentence
  const displayWords = useMemo(() => {
    let words = enhancedWords;

    // Filter by sentence if available
    const hasSentences =
      analysisResult?.sentences && analysisResult.sentences.length > 0;
    if (hasSentences) {
      words = words.filter(
        (word) => (word as any).position?.sentenceIndex === activeSentence
      );
    }

    // Filter by difficulty
    if (difficultyFilter !== "all") {
      words = words.filter((word) => word.difficulty === difficultyFilter);
    }

    return words;
  }, [enhancedWords, activeSentence, difficultyFilter, analysisResult]);

  // Group words by grammatical function for structured view
  const structuredGroups = useMemo(() => {
    if (viewMode !== "structured") return null;

    const groups = {
      subjects: [] as any[],
      verbs: [] as any[],
      objects: [] as any[],
      modifiers: [] as any[],
      other: [] as any[],
    };

    displayWords.forEach((word) => {
      const hasSubjectRel = word.relationships.some((rel) =>
        rel.type.toLowerCase().includes("subject")
      );
      const hasObjectRel = word.relationships.some((rel) =>
        rel.type.toLowerCase().includes("object")
      );
      const isVerb = word.partOfSpeech?.toLowerCase() === "verb";
      const isModifier = ["adjective", "adverb"].includes(
        word.partOfSpeech?.toLowerCase()
      );

      if (hasSubjectRel || word.morphology?.case === "nominative") {
        groups.subjects.push(word);
      } else if (isVerb) {
        groups.verbs.push(word);
      } else if (hasObjectRel || word.morphology?.case === "accusative") {
        groups.objects.push(word);
      } else if (isModifier) {
        groups.modifiers.push(word);
      } else {
        groups.other.push(word);
      }
    });

    return groups;
  }, [displayWords, viewMode]);

  // Handle word interactions
  const handleWordHover = (index: number | null) => {
    setHoveredWordIndex(index);
  };

  const handleWordClick = (index: number) => {
    setInspectedWordIndex(index);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, wordIndex: number) => {
    if (readingMode === "beginner") {
      setDraggedWord(wordIndex);
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (readingMode === "beginner") {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (readingMode === "beginner" && draggedWord !== null) {
      e.preventDefault();
      // Here you would implement word reordering logic
      // For now, we'll just clear the drag state
      setDraggedWord(null);
    }
  };

  // Render word component
  const renderWord = (word: any, showConnections = true) => {
    const isHovered = word.index === hoveredWordIndex;
    const isRelated =
      hoveredWordIndex !== null &&
      word.relationships.some(
        (rel: any) =>
          rel.relatedWordIndex === hoveredWordIndex ||
          hoveredWordIndex === word.index
      );

    let className = `
      inline-flex items-center gap-2 m-2 px-4 py-3 rounded-lg border cursor-pointer
      transition-all duration-200 font-serif text-xl font-medium
      ${word.colors.text} ${word.colors.bg} ${word.colors.border} ${
      word.caseClass
    }
      ${isHovered ? "ring-2 ring-white/40 shadow-lg scale-105" : ""}
      ${isRelated ? "ring-2 ring-blue-400/60 shadow-md" : ""}
      ${draggedWord === word.index ? "opacity-50 rotate-3" : ""}
      ${readingMode === "beginner" ? "draggable cursor-move" : ""}
      hover:shadow-lg hover:scale-102
    `;

    const pedagogicalNotes = (word as any).pedagogicalNotes;

    return (
      <motion.span
        key={word.index}
        className={className}
        onMouseEnter={() => handleWordHover(word.index)}
        onClick={() => handleWordClick(word.index)}
        draggable={readingMode === "beginner"}
        onDragStart={(e) => handleDragStart(e as any, word.index)}
        onDragOver={handleDragOver as any}
        onDrop={(e) => handleDrop(e as any, word.index)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        <span className="font-semibold text-xl">{word.word}</span>

        {showHelpers && readingMode !== "advanced" && (
          <div className="flex flex-col text-xs opacity-80">
            {readingMode === "beginner" &&
              showTranslations &&
              word.meaning?.short && (
                <span className="text-white/70">({word.meaning.short})</span>
              )}
            {pedagogicalNotes?.difficulty && (
              <span
                className={`
                px-1 rounded text-[10px] font-bold
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
          </div>
        )}
      </motion.span>
    );
  };

  // Render linear view (enhanced version of current)
  const renderLinearView = () => (
    <motion.div
      className="space-y-4"
      onMouseLeave={() => handleWordHover(null)}
    >
      <div className="flex flex-wrap items-center leading-loose">
        {displayWords.map((word) => renderWord(word))}
      </div>
    </motion.div>
  );

  // Render structured grammatical view
  const renderStructuredView = () => {
    if (!structuredGroups) return renderLinearView();

    return (
      <motion.div
        className="space-y-6"
        onMouseLeave={() => handleWordHover(null)}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Subjects Column */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Subjects
            </h4>
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20 min-h-[80px] flex flex-wrap content-start">
              {structuredGroups.subjects.map((word) => renderWord(word))}
              {structuredGroups.subjects.length === 0 && (
                <span className="text-blue-300/50 text-sm italic">
                  No subjects identified
                </span>
              )}
            </div>
          </div>

          {/* Verbs Column */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-red-300 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Actions
            </h4>
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-400/20 min-h-[80px] flex flex-wrap content-start">
              {structuredGroups.verbs.map((word) => renderWord(word))}
              {structuredGroups.verbs.length === 0 && (
                <span className="text-red-300/50 text-sm italic">
                  No verbs identified
                </span>
              )}
            </div>
          </div>

          {/* Objects Column */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Objects & Others
            </h4>
            <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-400/20 min-h-[80px] flex flex-wrap content-start">
              {[...structuredGroups.objects, ...structuredGroups.other].map(
                (word) => renderWord(word)
              )}
              {structuredGroups.objects.length +
                structuredGroups.other.length ===
                0 && (
                <span className="text-amber-300/50 text-sm italic">
                  No objects identified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modifiers Row */}
        {structuredGroups.modifiers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Move className="w-4 h-4" />
              Modifiers & Descriptions
            </h4>
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-400/20 min-h-[60px] flex flex-wrap content-start">
              {structuredGroups.modifiers.map((word) => renderWord(word))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Main content renderer
  const renderContent = () => {
    if (
      !analysisResult ||
      !analysisResult.words ||
      analysisResult.words.length === 0
    ) {
      return (
        <div className="flex items-center justify-center h-48 text-white/60">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">Ready to analyze Latin text</p>
            <p className="text-sm opacity-70">Enter text above to begin</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {viewMode === "structured"
          ? renderStructuredView()
          : renderLinearView()}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`
        p-6 rounded-xl border backdrop-blur-sm min-h-[400px] relative
        ${isAnalyzing ? "loading-border-aura" : ""}
        ${className}
      `}
      style={{
        backgroundColor: "var(--panel)",
        borderColor: isAnalyzing ? "transparent" : "var(--border)",
      }}
    >
      {/* Enhanced Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white font-serif">
            Enhanced Reading View
          </h2>

          {/* Reading Mode Selector */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            {(["beginner", "intermediate", "advanced"] as ReadingMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setReadingMode(mode)}
                  className={`
                  px-3 py-1 text-xs font-medium rounded-md transition-all capitalize
                  ${
                    readingMode === mode
                      ? "bg-blue-500/30 text-blue-200 shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }
                `}
                >
                  {mode}
                </button>
              )
            )}
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            {(["linear", "structured"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-md transition-all capitalize
                  ${
                    viewMode === mode
                      ? "bg-emerald-500/30 text-emerald-200 shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Helper Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className={`
              p-2 rounded-md transition-all
              ${
                showTranslations
                  ? "bg-violet-500/30 text-violet-200"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }
            `}
            title="Toggle translations"
          >
            {showTranslations ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setShowHelpers(!showHelpers)}
            className={`
              p-2 rounded-md transition-all
              ${
                showHelpers
                  ? "bg-amber-500/30 text-amber-200"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }
            `}
            title="Toggle difficulty indicators"
          >
            <Target className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sentence Navigation */}
      {analysisResult?.sentences && analysisResult.sentences.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-white/60">Sentence:</span>
          {analysisResult.sentences.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSentence(i)}
              className={`
                px-3 py-1 text-sm rounded-md transition-all
                ${
                  activeSentence === i
                    ? "bg-blue-500/30 text-blue-200 border border-blue-400/40"
                    : "text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                }
              `}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      {renderContent()}

      {/* Mode-specific instructions */}
      {readingMode === "beginner" && viewMode === "structured" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg"
        >
          <p className="text-sm text-blue-200">
            <strong>Beginner Mode:</strong> Words are organized by grammatical
            function.
            {readingMode === "beginner" &&
              " Try dragging words between columns to practice sentence structure!"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default StructuredTextView;
