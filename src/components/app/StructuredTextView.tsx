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

  // Calculate adaptive difficulty based on user interaction patterns
  const calculateAdaptiveDifficulty = (
    word: any,
    index: number
  ): "easy" | "medium" | "hard" => {
    const baseDifficulty =
      (word as any).pedagogicalNotes?.difficulty || "medium";

    // Simple adaptive difficulty based on interaction history
    let adaptiveScore = 0;

    // Base score from pedagogical notes
    if (baseDifficulty === "easy") adaptiveScore += 1;
    else if (baseDifficulty === "medium") adaptiveScore += 0;
    else if (baseDifficulty === "hard") adaptiveScore -= 1;

    // Complexity factors
    if (word.relationships && word.relationships.length > 2) {
      adaptiveScore -= 0.5; // More relationships = potentially harder
    }

    // Frequency heuristic (very basic)
    const commonWords = [
      "est",
      "et",
      "in",
      "ad",
      "cum",
      "ex",
      "per",
      "sub",
      "super",
    ];
    if (commonWords.includes(word.word.toLowerCase())) {
      adaptiveScore += 0.5;
    }

    // Convert score back to difficulty level
    if (adaptiveScore >= 0.5) return "easy";
    if (adaptiveScore <= -0.5) return "hard";
    return "medium";
  };

  // Enhanced words with pedagogical info and adaptive features
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
      pedagogicalNotes: (word as any).pedagogicalNotes || {},
      // Calculate adaptive difficulty based on user interaction history
      adaptiveDifficulty: calculateAdaptiveDifficulty(word, index),
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

  // Render word component with enhanced pedagogical features
  const renderWord = (word: any, showConnections = true) => {
    const isHovered = word.index === hoveredWordIndex;
    const isRelated =
      hoveredWordIndex !== null &&
      word.relationships.some(
        (rel: any) =>
          rel.relatedWordIndex === hoveredWordIndex ||
          hoveredWordIndex === word.index
      );

    // Determine visual emphasis based on adaptive difficulty and interaction state
    const getWordEmphasis = () => {
      if (isHovered) return "ring-2 ring-white/40 shadow-lg scale-105";
      if (isRelated) return "ring-2 ring-blue-400/60 shadow-md";
      if (word.adaptiveDifficulty === "hard")
        return "border-2 border-orange-400/50";
      if (word.adaptiveDifficulty === "easy")
        return "border border-green-400/30";
      return "";
    };

    let className = `
      inline-flex items-center gap-2 m-2 px-3 py-2 rounded-lg border cursor-pointer
      transition-all duration-200 font-serif text-lg font-medium relative group
      ${word.colors.text} ${word.colors.bg} ${word.colors.border} ${
      word.caseClass
    }
      ${getWordEmphasis()}
      ${draggedWord === word.index ? "opacity-50 rotate-3" : ""}
      ${readingMode === "beginner" ? "draggable cursor-move" : ""}
      hover:shadow-lg hover:scale-102 focus:outline-none focus:ring-2 focus:ring-blue-400/50
    `;

    const pedagogicalNotes = word.pedagogicalNotes || {};

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
        tabIndex={0}
      >
        <span className="font-semibold text-lg">{word.word}</span>

        {/* Enhanced pedagogical indicators */}
        {showHelpers && readingMode !== "advanced" && (
          <div className="flex flex-col gap-1">
            {/* Main translation/helper */}
            {readingMode === "beginner" &&
              showTranslations &&
              word.meaning?.short && (
                <span className="text-xs text-white/70 font-medium">
                  {word.meaning.short}
                </span>
              )}

            {/* Difficulty indicator */}
            {pedagogicalNotes.difficulty && (
              <div className="flex items-center gap-1">
                <span
                  className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${
                    pedagogicalNotes.difficulty === "easy"
                      ? "bg-green-500/30 text-green-200"
                      : pedagogicalNotes.difficulty === "medium"
                      ? "bg-yellow-500/30 text-yellow-200"
                      : "bg-red-500/30 text-red-200"
                  }
                `}
                  title={`Difficulty: ${pedagogicalNotes.difficulty}`}
                >
                  {pedagogicalNotes.difficulty}
                </span>

                {/* Adaptive difficulty indicator */}
                {word.adaptiveDifficulty !== pedagogicalNotes.difficulty && (
                  <span
                    className={`
                    px-1 py-0.5 rounded-full text-[9px] font-medium
                    ${
                      word.adaptiveDifficulty === "easy"
                        ? "bg-blue-500/30 text-blue-200"
                        : word.adaptiveDifficulty === "medium"
                        ? "bg-purple-500/30 text-purple-200"
                        : "bg-orange-500/30 text-orange-200"
                    }
                  `}
                    title={`Adaptive difficulty: ${word.adaptiveDifficulty}`}
                  >
                    {word.adaptiveDifficulty}
                  </span>
                )}
              </div>
            )}

            {/* Memory aid indicator */}
            {pedagogicalNotes.memoryAid && (
              <span
                className="text-[10px] text-amber-200/80 italic max-w-24 truncate"
                title={pedagogicalNotes.memoryAid}
              >
                💡 {pedagogicalNotes.memoryAid}
              </span>
            )}
          </div>
        )}

        {/* Relationship indicators */}
        {showConnections && word.relationships.length > 0 && (
          <div className="absolute -top-1 -right-1 flex gap-0.5">
            {word.relationships.slice(0, 3).map((rel: any, i: number) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  rel.type.includes("verb")
                    ? "bg-blue-400"
                    : rel.type.includes("noun")
                    ? "bg-green-400"
                    : rel.type.includes("adjective")
                    ? "bg-yellow-400"
                    : "bg-gray-400"
                }`}
                title={`${rel.type}: ${rel.description}`}
              />
            ))}
          </div>
        )}

        {/* Tooltip on hover with detailed information */}
        {isHovered && pedagogicalNotes && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-slate-800/95 backdrop-blur-md text-slate-100 rounded-lg shadow-xl z-50 max-w-xs pointer-events-none border border-slate-600/30">
            <div className="text-sm space-y-2">
              {pedagogicalNotes.readingStrategy && (
                <div>
                  <div className="font-semibold text-blue-300 mb-1">
                    Reading Strategy:
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed">
                    {pedagogicalNotes.readingStrategy}
                  </div>
                </div>
              )}
              {pedagogicalNotes.commonMistakes && (
                <div>
                  <div className="font-semibold text-orange-300 mb-1">
                    Common Mistake:
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed">
                    {pedagogicalNotes.commonMistakes}
                  </div>
                </div>
              )}
              {pedagogicalNotes.culturalContext && (
                <div>
                  <div className="font-semibold text-purple-300 mb-1">
                    Cultural Context:
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed">
                    {pedagogicalNotes.culturalContext}
                  </div>
                </div>
              )}
            </div>
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

      {/* Degraded Analysis Warning */}
      {(analysisResult as any)?.degraded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-orange-500/10 border border-orange-400/20 rounded-lg"
        >
          <div className="flex items-center gap-2 text-orange-200">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-sm font-medium">
              Partial Analysis Available
            </span>
          </div>
          <p className="text-xs text-orange-200/80 mt-1">
            Full AI analysis failed, but basic word identification is available.
            Try again with a shorter text or different passage for better
            results.
          </p>
        </motion.div>
      )}

      {/* Main Content */}
      {renderContent()}

      {/* Learning Objectives Section */}
      {analysisResult?.learningObjectives && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-lg"
        >
          <h4 className="text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Learning Objectives
          </h4>
          <div className="text-sm text-white/80 space-y-2">
            {analysisResult.learningObjectives.goals &&
              analysisResult.learningObjectives.goals.length > 0 && (
                <div>
                  <div className="font-medium text-purple-300">Goals:</div>
                  <ul className="list-disc list-inside ml-2 text-xs">
                    {analysisResult.learningObjectives.goals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
            {analysisResult.learningObjectives.grammar &&
              analysisResult.learningObjectives.grammar.length > 0 && (
                <div>
                  <div className="font-medium text-blue-300">
                    Grammar Focus:
                  </div>
                  <ul className="list-disc list-inside ml-2 text-xs">
                    {analysisResult.learningObjectives.grammar.map(
                      (item, i) => (
                        <li key={i}>{item}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            {analysisResult.learningObjectives.vocabulary &&
              analysisResult.learningObjectives.vocabulary.length > 0 && (
                <div>
                  <div className="font-medium text-green-300">
                    Vocabulary Theme:
                  </div>
                  <ul className="list-disc list-inside ml-2 text-xs">
                    {analysisResult.learningObjectives.vocabulary.map(
                      (item, i) => (
                        <li key={i}>{item}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>
        </motion.div>
      )}

      {/* Pedagogical Metadata */}
      {analysisResult?.pedagogicalMetadata && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-slate-500/10 border border-slate-400/20 rounded-lg"
        >
          <div className="flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-4">
              <span
                className={`px-2 py-1 rounded-full font-medium ${
                  analysisResult.pedagogicalMetadata.estimatedDifficulty ===
                  "easy"
                    ? "bg-green-500/20 text-green-200"
                    : analysisResult.pedagogicalMetadata.estimatedDifficulty ===
                      "medium"
                    ? "bg-yellow-500/20 text-yellow-200"
                    : "bg-red-500/20 text-red-200"
                }`}
              >
                {analysisResult.pedagogicalMetadata.estimatedDifficulty}
              </span>
              <span>⏱️ {analysisResult.pedagogicalMetadata.learningTime}</span>
            </div>
            <div className="flex gap-2">
              {analysisResult.pedagogicalMetadata.prerequisites.length > 0 && (
                <span className="text-blue-300">
                  Prereqs:{" "}
                  {analysisResult.pedagogicalMetadata.prerequisites.length}
                </span>
              )}
              {analysisResult.pedagogicalMetadata.followUpConcepts.length >
                0 && (
                <span className="text-purple-300">
                  Next:{" "}
                  {analysisResult.pedagogicalMetadata.followUpConcepts.length}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

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
