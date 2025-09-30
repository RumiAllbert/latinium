import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../../store/appStore";

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
  const { analysisState, analyzeText } = useAppStore();
  const isAnalyzing = analysisState === "analyzing";

  const handleAnalyze = () => {
    console.log("Analyze button clicked. Sending text to store:", text);
    analyzeText(text);
  };

  return (
    <div className="relative">
      <div className="glass-card p-6 sm:p-8">
        {isAnalyzing && <LightRayLoader />}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold font-serif text-slate-900 dark:text-white">
            Input Text
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-white/60">
            <Wand2 className="h-4 w-4" />
            <span>Paste text or select a sample</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {samples.map((s) => (
            <button
              key={s.label}
              className="px-4 py-2 text-sm rounded-lg backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-white transition-all duration-200 font-medium dark:bg-slate-800/80 dark:border-slate-700/50 dark:text-slate-200"
              onClick={() => setText(s.text)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <textarea
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
          <button
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg ${
              text.length === 0 || text.length > CHAR_LIMIT || isAnalyzing
                ? "glass-button opacity-50"
                : "glass-button-primary hover:scale-105"
            }`}
            onClick={handleAnalyze}
            disabled={
              text.length === 0 || text.length > CHAR_LIMIT || isAnalyzing
            }
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              "Analyze"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputCard;
