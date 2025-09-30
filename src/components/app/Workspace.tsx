import { AnimatePresence, motion } from "framer-motion";
import { Eye, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "../../store/appStore";
import AnalysisWorkspace from "./AnalysisWorkspace";
import ContextualTooltip, { useContextualTooltip } from "./ContextualTooltip";
import DAGGraph from "./DAGGraph";
import InlineInspector from "./InlineInspector";
import InputCard from "./InputCard";
import ProsodyPanel from "./ProsodyPanel";
import QuizPanel from "./QuizPanel";
import StructuredTextView from "./StructuredTextView";
import TutorPanel from "./TutorPanel";
import VocabDeck from "./VocabDeck";

const Workspace = () => {
  const {
    analysisState,
    error,
    reset,
    loadStoredData,
    currentText,
    analyzeText,
  } = useAppStore();
  const [useEnhancedView, setUseEnhancedView] = useState(true);

  // Load stored data on component mount
  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  // Auto-analyze text if coming from library
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldAutoAnalyze = urlParams.get("autoAnalyze") === "true";

    if (shouldAutoAnalyze && currentText && analysisState === "idle") {
      analyzeText(currentText);
    }
  }, [currentText, analysisState, analyzeText]);

  // Contextual tooltip state
  const {
    hoveredWordIndex,
    mousePosition,
    isVisible: tooltipVisible,
    showTooltip,
    hideTooltip,
    updatePosition,
  } = useContextualTooltip();

  const showAnalysis =
    analysisState === "analyzing" ||
    analysisState === "success" ||
    analysisState === "error";

  return (
    <>
      <div className="flex flex-col gap-8 p-4 sm:p-6 max-w-6xl mx-auto overflow-y-auto">
        {/* Input Section - Full Width */}
        <InputCard />

        {/* View Toggle */}
        {showAnalysis && analysisState !== "error" && (
          <div className="flex items-center justify-center">
            <div className="glass-card p-3 inline-flex rounded-xl">
              <button
                onClick={() => setUseEnhancedView(false)}
                className={`
                  px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                  ${
                    !useEnhancedView
                      ? "bg-white/20 text-white backdrop-blur-sm border border-white/20 dark:bg-slate-800/60 dark:border-slate-600/50"
                      : "text-white/80 hover:text-white hover:bg-white/10 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  }
                `}
              >
                Classic View
              </button>
              <button
                onClick={() => setUseEnhancedView(true)}
                className={`
                  px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                  ${
                    useEnhancedView
                      ? "bg-white/20 text-white backdrop-blur-sm border border-white/20 dark:bg-slate-800/60 dark:border-slate-600/50"
                      : "text-white/80 hover:text-white hover:bg-white/10 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  }
                `}
              >
                <Eye className="w-4 h-4" />
                Enhanced View
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-8"
              onMouseMove={updatePosition}
              onMouseLeave={hideTooltip}
            >
              {analysisState === "error" ? (
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center max-w-2xl mx-auto bg-red-500/10 border-red-400/20 dark:bg-red-500/5 dark:border-red-400/30">
                  <XCircle className="w-16 h-16 text-red-400 mb-6" />
                  <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                    Analysis Failed
                  </h3>
                  <p className="text-base mb-6 max-w-md text-slate-700 dark:text-white/70">
                    {error}
                  </p>
                  <button
                    onClick={reset}
                    className="px-6 py-3 glass-button-primary text-lg font-semibold transition-all duration-200 hover:scale-105"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Main Analysis Section - Full Width */}
                  <div className="w-full">
                    {useEnhancedView ? (
                      <StructuredTextView className="min-h-[400px]" />
                    ) : (
                      <div className="space-y-6">
                        <AnalysisWorkspace />
                        <InlineInspector />
                      </div>
                    )}
                  </div>

                  {/* Learning Tools Section - Stacked Vertically */}
                  {analysisState === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="space-y-8"
                    >
                      {/* Section Header */}
                      <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 font-serif">
                          Learning Tools
                        </h2>
                        <p className="text-white/60 text-base sm:text-lg">
                          Interactive tools to deepen your understanding
                        </p>
                      </div>

                      {/* Learning Tools Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <TutorPanel />
                        <QuizPanel />
                        <VocabDeck />
                        <ProsodyPanel />
                        <div className="md:col-span-2">
                          <DAGGraph />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Contextual Tooltip */}
      <ContextualTooltip
        wordIndex={hoveredWordIndex}
        mousePosition={mousePosition}
        isVisible={tooltipVisible}
      />
    </>
  );
};

export default Workspace;
