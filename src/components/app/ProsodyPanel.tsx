import { motion } from "framer-motion";
import { BarChart3, Loader2, Music, Pause, Play } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../../store/appStore";

const ProsodyPanel = () => {
  const { prosodyData, prosodyState, generateProsody, currentText } =
    useAppStore();
  const [playingMetronome, setPlayingMetronome] = useState(false);

  const handleGenerateProsody = () => {
    generateProsody();
  };

  const toggleMetronome = () => {
    setPlayingMetronome(!playingMetronome);
    // In a real implementation, you'd start/stop a metronome audio
  };

  const renderScansion = (word: any, wordIndex: number) => {
    return (
      <motion.div
        key={wordIndex}
        className="inline-flex flex-col items-center mx-2 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: wordIndex * 0.1 }}
      >
        {/* Scansion marks */}
        <div className="flex items-center gap-1 mb-1">
          {word.syllables?.map((syllable: any, i: number) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-xs text-white/60 mb-1">
                {syllable.length === "long"
                  ? "—"
                  : syllable.length === "short"
                  ? "⏑"
                  : "◡"}
              </div>
              {syllable.stress && (
                <div
                  className="w-2 h-2 bg-amber-400 rounded-full"
                  title="Primary stress"
                />
              )}
            </div>
          ))}
        </div>

        {/* Word with syllables */}
        <div className="text-lg font-serif text-white">
          {word.syllables?.map((syllable: any, i: number) => (
            <span
              key={i}
              className={`
                ${
                  syllable.length === "long"
                    ? "text-blue-300 font-bold"
                    : syllable.length === "short"
                    ? "text-emerald-300"
                    : "text-white/80"
                }
                ${syllable.stress ? "underline decoration-amber-400" : ""}
              `}
            >
              {syllable.syllable}
            </span>
          )) || word.word}
        </div>
      </motion.div>
    );
  };

  const renderMeterPattern = () => {
    if (!prosodyData?.meter || prosodyData.meter === "prose") return null;

    const patterns: { [key: string]: string } = {
      "dactylic hexameter": "— ⏑ ⏑ | — ⏑ ⏑ | — ⏑ ⏑ | — ⏑ ⏑ | — ⏑ ⏑ | — —",
      "elegiac couplet": "— ⏑ ⏑ | — ⏑ ⏑ | — || — ⏑ ⏑ | — ⏑ ⏑ | —",
      "iambic pentameter": "⏑ — | ⏑ — | ⏑ — | ⏑ — | ⏑ —",
      "sapphic stanza": "— ⏑ | — — | ⏑ ⏑ | — ⏑ | — —",
    };

    const pattern = patterns[prosodyData.meter.toLowerCase()] || "";

    return (
      <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Metrical Pattern: {prosodyData.meter}
        </h4>
        {pattern && (
          <div className="text-center py-2">
            <div className="text-lg font-mono text-purple-100 tracking-wider">
              {pattern}
            </div>
            <div className="text-xs text-purple-300 mt-1">
              — = long, ⏑ = short, | = foot boundary, || = caesura
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="p-6 rounded-xl border backdrop-blur-sm"
      style={{
        backgroundColor: "var(--panel)",
        borderColor: "var(--border)",
      }}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20">
            <Music className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-serif">
              Prosody & Meter
            </h3>
            <p className="text-sm text-white/60">
              Scansion and rhythmic analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {prosodyData && prosodyData.meter !== "prose" && (
            <button
              onClick={toggleMetronome}
              className={`
                p-2 rounded-lg transition-all
                ${
                  playingMetronome
                    ? "bg-amber-500/30 text-amber-200"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }
              `}
              title="Metronome"
            >
              {playingMetronome ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={handleGenerateProsody}
            disabled={prosodyState === "loading" || !currentText}
            className="px-4 py-2 text-sm rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 font-medium"
            style={{
              backgroundColor:
                prosodyState === "loading" ? "var(--button)" : "#d97706",
              color: prosodyState === "loading" ? "var(--fg)" : "white",
            }}
          >
            {prosodyState === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Music className="w-4 h-4" />
            )}
            {prosodyState === "loading" ? "Analyzing..." : "Analyze Meter"}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {prosodyState === "idle" && !prosodyData && (
        <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-xl">
          <Music className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">
            Discover the Rhythm
          </h4>
          <p className="text-white/60 mb-6 max-w-sm mx-auto">
            Analyze the metrical patterns and scansion of your Latin text.
            Perfect for poetry analysis and understanding classical rhythm.
          </p>
          <button
            onClick={handleGenerateProsody}
            disabled={!currentText}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Rhythm
          </button>
        </div>
      )}

      {/* Loading State */}
      {prosodyState === "loading" && (
        <div className="text-center py-12 border-2 border-dashed border-amber-400/30 rounded-xl bg-amber-500/5">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-amber-400 mx-auto mb-4" />
            <div className="absolute inset-0 animate-pulse">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full mx-auto"></div>
            </div>
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">
            Analyzing Prosody
          </h4>
          <p className="text-amber-200">
            Scanning metrical patterns and syllable lengths...
          </p>
        </div>
      )}

      {/* Error State */}
      {prosodyState === "error" && (
        <div className="text-center py-12 border-2 border-dashed border-red-400/30 rounded-xl bg-red-500/5">
          <div className="w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-400 text-xl">✕</span>
          </div>
          <h4 className="text-lg font-semibold text-red-300 mb-2">
            Analysis Failed
          </h4>
          <p className="text-red-200/80 mb-4">
            Unable to analyze prosody patterns. Please try again.
          </p>
          <button
            onClick={handleGenerateProsody}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            Try Again
          </button>
        </div>
      )}

      {prosodyData && prosodyState === "loaded" && (
        <div className="space-y-4">
          {/* Meter Pattern */}
          {renderMeterPattern()}

          {/* Scanned Text */}
          {prosodyData.scansion && prosodyData.scansion.length > 0 ? (
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--panel)",
                borderColor: "var(--border)",
              }}
            >
              <h4 className="text-sm font-semibold text-white/80 mb-3">
                Scansion
              </h4>
              <div className="flex flex-wrap items-end justify-center">
                {prosodyData.scansion.map((word, i) => renderScansion(word, i))}
              </div>
            </div>
          ) : (
            <div
              className="p-4 rounded-lg border text-center"
              style={{
                backgroundColor: "var(--panel)",
                borderColor: "var(--border)",
              }}
            >
              <Music className="w-8 h-8 mx-auto mb-2 text-white/40" />
              <p className="text-white/60">
                {prosodyData.meter === "prose"
                  ? "This appears to be prose text, not poetry."
                  : "No scansion data available."}
              </p>
            </div>
          )}

          {/* Analysis */}
          {prosodyData.analysis && (
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-200 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Metrical Analysis
              </h4>
              <p className="text-blue-100 text-sm leading-relaxed">
                {prosodyData.analysis}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-white/80 mb-2">Legend</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-blue-300 font-bold">—</span>
                <span className="text-white/70">Long syllable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-300">⏑</span>
                <span className="text-white/70">Short syllable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span className="text-white/70">Primary stress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/60">|</span>
                <span className="text-white/70">Foot boundary</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProsodyPanel;
