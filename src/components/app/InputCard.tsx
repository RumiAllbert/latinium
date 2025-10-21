import { motion } from "framer-motion";
import { AlertTriangle, Clock, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "../../store/appStore";
import { getRateLimitStatus } from "../../utils/rateLimiter";

const CHAR_LIMIT = 800;

const samples = [
  {
    label: "Caesar",
    text: "Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae, nostra Galli appellantur.",
  },
  {
    label: "Cicero",
    text: "Quousque tandem abutere, Catilina, patientia nostra? Quam diu etiam furor iste tuus nos eludet?",
  },
  {
    label: "Virgil",
    text: "Arma virumque cano, Troiae qui primus ab oris Italiam, fato profugus, Laviniaque venit litora.",
  },
];

// Light ray loading animation component
const LightRayLoader = () => {
  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)",
          filter: "blur(1px)",
        }}
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-lg border-2"
        style={{
          borderImage:
            "linear-gradient(45deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1",
          filter: "blur(0.5px)",
        }}
        animate={{
          borderImage: [
            "linear-gradient(45deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1",
            "linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8)) 1",
            "linear-gradient(225deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1",
            "linear-gradient(315deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8)) 1",
            "linear-gradient(45deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

const InputCard = () => {
  const [text, setText] = useState(samples[0].text);
  const [rateLimitInfo, setRateLimitInfo] = useState(getRateLimitStatus());
  const { analysisState, analyzeText, rateLimitError } = useAppStore();
  const isAnalyzing = analysisState === "analyzing";

  // Update rate limit status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitInfo(getRateLimitStatus());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = () => {
    console.log("Analyze button clicked. Sending text to store:", text);
    analyzeText(text);
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="glass-frosted p-6 sm:p-8 hover-lift glass-glow">
        {isAnalyzing && <LightRayLoader />}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-gradient-animate">Input Text</span>
          </h2>
          <motion.div
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Wand2 className="h-4 w-4" />
            <span>Paste text or select a sample</span>
          </motion.div>
        </div>

        {/* Rate Limit Status */}
        <div className="mb-4 p-3 bg-slate-500/10 rounded-lg border border-slate-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {rateLimitInfo.isLimited ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : (
                <Clock className="h-4 w-4 text-blue-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  rateLimitInfo.isLimited
                    ? "text-red-400"
                    : rateLimitInfo.remaining <= 3
                    ? "text-amber-400"
                    : "text-slate-600 dark:text-white/60"
                }`}
              >
                {rateLimitInfo.isLimited
                  ? "Rate Limited"
                  : `${rateLimitInfo.remaining} requests left`}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-white/50">
              Resets: {rateLimitInfo.timeUntilReset}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 w-full bg-slate-600/20 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                rateLimitInfo.isLimited
                  ? "bg-red-400"
                  : rateLimitInfo.remaining <= 3
                  ? "bg-amber-400"
                  : "bg-green-400"
              }`}
              style={{ width: `${rateLimitInfo.percentage}%` }}
            />
          </div>
        </div>

        {/* Rate Limit Error Message */}
        {rateLimitError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-400/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Rate Limit Exceeded</span>
            </div>
            <p className="text-xs text-red-200/80 mt-1">
              You've reached the limit of 15 analyses per 6 hours. Please wait
              for the reset timer or try again later.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {samples.map((s, idx) => (
            <motion.button
              key={s.label}
              className="px-4 py-2 text-sm rounded-lg backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-white transition-all duration-200 font-medium dark:bg-slate-800/80 dark:border-slate-700/50 btn-interactive hover:scale-105 hover:shadow-lg"
              onClick={() => setText(s.text)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx, duration: 0.3 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {s.label}
            </motion.button>
          ))}
        </div>

        <motion.textarea
          className={`w-full h-64 p-4 sm:p-6 rounded-xl font-serif text-lg leading-relaxed focus:outline-none border transition-all duration-300 glass-input resize-none
          ${
            text.length > CHAR_LIMIT
              ? "ring-2 ring-red-400/50 border-red-400/30"
              : ""
          }
        `}
          disabled={isAnalyzing}
          placeholder="Paste or select sample text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
        <div className="flex justify-between items-center mt-4">
          <span
            className={`text-xs transition-colors ${
              text.length > CHAR_LIMIT
                ? "text-red-400"
                : "text-slate-600 dark:text-white/60"
            }`}
          >
            {text.length}/{CHAR_LIMIT} chars
          </span>
          <motion.button
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg relative overflow-hidden ${
              text.length === 0 ||
              text.length > CHAR_LIMIT ||
              isAnalyzing ||
              rateLimitInfo.isLimited
                ? "glass-button opacity-50"
                : "glass-button-primary hover:scale-105 pulse-glow"
            }`}
            onClick={handleAnalyze}
            disabled={
              text.length === 0 ||
              text.length > CHAR_LIMIT ||
              isAnalyzing ||
              rateLimitInfo.isLimited
            }
            title={
              rateLimitInfo.isLimited
                ? `Rate limited. Resets in ${rateLimitInfo.timeUntilReset}`
                : undefined
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span className="relative z-10">Analyze</span>
                <svg
                  className="w-4 h-4 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default InputCard;
