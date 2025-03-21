import { useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "../types/AnalysisResult";

interface StreamingAnalysisDisplayProps {
  isActive: boolean;
  chunks: string[];
  completionPercentage: number;
  finalResult: AnalysisResult | null;
  onComplete?: () => void;
}

// Animation constants
const LATIN_PHRASES = [
  "Analyzing syntax...",
  "Parsing morphology...",
  "Identifying relationships...",
  "Resolving lemmas...",
  "Cataloging words...",
  "Building syntax tree...",
  "Validating grammar...",
];

// Helper function to extract Latin words from JSON chunks
const extractLatinWordsFromChunks = (chunks: string[]): string[] => {
  try {
    const combinedText = chunks.join("");

    // Extract Latin words from various patterns in the JSON
    const patterns = [
      /"word"\s*:\s*"([^"]+)"/g,
      /"lemma"\s*:\s*"([^"]+)"/g,
      /"case"\s*:\s*"([^"]+)"/g,
      /"tense"\s*:\s*"([^"]+)"/g,
    ];

    const allMatches = patterns.flatMap((pattern) => {
      const matches = combinedText.matchAll(pattern);
      return Array.from(matches).map((match) => match[1]);
    });

    // Filter to likely Latin words (remove common English technical terms)
    return [...new Set(allMatches)]
      .filter(
        (word) =>
          word &&
          word.length > 1 &&
          /^[a-zA-Z\u00C0-\u00FF]+$/.test(word) &&
          ![
            "null",
            "undefined",
            "true",
            "false",
            "string",
            "number",
            "object",
            "array",
          ].includes(word.toLowerCase())
      )
      .slice(0, 12); // Limit to 12 unique words
  } catch (e) {
    console.warn("Error extracting Latin words:", e);
    return [];
  }
};

export default function StreamingAnalysisDisplay({
  isActive,
  chunks,
  completionPercentage,
  finalResult,
  onComplete,
}: StreamingAnalysisDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [extractedWords, setExtractedWords] = useState<string[]>([]);
  const [currentPhrase, setCurrentPhrase] = useState<string>(LATIN_PHRASES[0]);
  const [animationState, setAnimationState] = useState<
    "loading" | "complete" | "error"
  >("loading");

  // Effect for phrase rotation
  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      setCurrentPhrase((prev) => {
        const currentIndex = LATIN_PHRASES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % LATIN_PHRASES.length;
        return LATIN_PHRASES[nextIndex];
      });
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isActive]);

  // Process chunks to extract meaningful Latin words
  useEffect(() => {
    if (chunks.length === 0) return;

    const latinWords = extractLatinWordsFromChunks(chunks);
    if (latinWords.length > 0) {
      setExtractedWords(latinWords);
    }
  }, [chunks]);

  // Effect to update animation state
  useEffect(() => {
    if (isActive) {
      setAnimationState("loading");
    } else if (finalResult) {
      setAnimationState("complete");
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    } else {
      setAnimationState("error");
    }
  }, [isActive, finalResult, onComplete]);

  // If not active and no processing has happened, don't render
  if (
    !isActive &&
    chunks.length === 0 &&
    animationState !== "complete" &&
    animationState !== "error"
  ) {
    return null;
  }

  return (
    <div className="streaming-analysis-container" ref={containerRef}>
      <div className="glass-morphic-panel">
        <div className="header-section">
          <h3 className="title">Latin Analysis in Progress</h3>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="progress-text">{completionPercentage}% complete</div>
        </div>

        <div className={`animation-container ${animationState}`}>
          {animationState === "loading" && (
            <>
              <div className="floating-icons">
                <div className="floating-icon grammar"></div>
                <div className="floating-icon syntax"></div>
                <div className="floating-icon lexicon"></div>
              </div>

              <div className="processing-status">
                <div className="pulse-dot"></div>
                <div className="status-text">{currentPhrase}</div>
              </div>

              <div className="word-cloud">
                {extractedWords.length > 0
                  ? extractedWords.map((word, index) => (
                      <div
                        key={index}
                        className="latin-word-bubble"
                        style={{
                          animationDelay: `${index * 0.2}s`,
                          opacity: 1 - index * 0.05,
                        }}
                      >
                        {word}
                      </div>
                    ))
                  : // Placeholder bubbles when no words extracted yet
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="latin-word-bubble placeholder"
                        style={{ animationDelay: `${index * 0.2}s` }}
                      >
                        Latin
                      </div>
                    ))}
              </div>
            </>
          )}

          {animationState === "complete" && (
            <div className="completion-message">
              <div className="success-checkmark">
                <div className="check-icon">
                  <span className="icon-line line-tip"></span>
                  <span className="icon-line line-long"></span>
                </div>
              </div>
              <h3 className="title">Analysis Complete</h3>
              <div className="completion-detail">
                Your Latin text has been successfully analyzed
              </div>
            </div>
          )}

          {animationState === "error" && (
            <div className="error-message">
              <div className="error-icon">!</div>
              <h3 className="title">Analysis Error</h3>
              <div className="error-detail">
                There was a problem analyzing your text. Please try again.
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
         .streaming-analysis-container {
           width: 100%;
           margin: 2rem 0;
           animation: fadeIn 0.5s ease;
         }
         
         .glass-morphic-panel {
           background: rgba(30, 38, 55, 0.7);
           backdrop-filter: blur(10px);
           border-radius: 16px;
           border: 1px solid rgba(255, 255, 255, 0.1);
           box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
           padding: 2rem;
           overflow: hidden;
         }
         
         .header-section {
           margin-bottom: 1.5rem;
           text-align: center;
         }
         
         .title {
           margin: 0;
           color: var(--primary-color, #deb887);
           font-size: 1.5rem;
           font-weight: 500;
           letter-spacing: 0.5px;
           font-family: 'Times New Roman', serif;
         }
         
         .progress-container {
           margin-bottom: 2rem;
         }
         
         .progress-bar {
           height: 6px;
           width: 100%;
           background: rgba(255, 255, 255, 0.1);
           border-radius: 8px;
           overflow: hidden;
           margin-bottom: 0.5rem;
         }
         
         .progress-fill {
           height: 100%;
           background: linear-gradient(90deg, 
             var(--primary-color, #deb887), 
             var(--accent-color, #d4a76a)
           );
           border-radius: 8px;
           transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
         }
         
         .progress-text {
           text-align: right;
           font-size: 0.85rem;
           color: rgba(255, 255, 255, 0.7);
         }
         
         .animation-container {
           background: rgba(20, 27, 43, 0.7);
           border-radius: 12px;
           padding: 2rem;
           height: 280px;
           display: flex;
           flex-direction: column;
           justify-content: center;
           align-items: center;
           position: relative;
           overflow: hidden;
         }
         
         .animation-container.loading {
           animation: pulseBackground 4s infinite;
         }
         
         .animation-container.complete {
           background: rgba(28, 45, 35, 0.6);
         }
         
         .animation-container.error {
           background: rgba(45, 28, 28, 0.6);
         }
         
         .processing-status {
           display: flex;
           align-items: center;
           margin-bottom: 2rem;
         }
         
         .pulse-dot {
           width: 12px;
           height: 12px;
           background-color: var(--primary-color, #deb887);
           border-radius: 50%;
           margin-right: 12px;
           animation: pulse 1.5s infinite;
         }
         
         .status-text {
           font-size: 1.1rem;
           font-style: italic;
           color: var(--primary-color, #deb887);
           animation: fadeInOut 3s infinite;
         }
         
         .word-cloud {
           display: flex;
           flex-wrap: wrap;
           justify-content: center;
           gap: 1rem;
           margin: 0 auto;
           max-width: 80%;
         }
         
         .latin-word-bubble {
           background: rgba(222, 184, 135, 0.15);
           border: 1px solid rgba(222, 184, 135, 0.3);
           border-radius: 20px;
           padding: 0.4rem 1rem;
           font-family: 'Times New Roman', serif;
           color: var(--primary-color, #deb887);
           font-size: 1rem;
           animation: float 3s infinite;
           transition: all 0.3s ease;
         }
         
         .latin-word-bubble:hover {
           background: rgba(222, 184, 135, 0.25);
           transform: translateY(-5px);
         }
         
         .latin-word-bubble.placeholder {
           opacity: 0.5;
           font-style: italic;
         }
         
         .floating-icons {
           position: absolute;
           width: 100%;
           height: 100%;
           top: 0;
           left: 0;
           pointer-events: none;
         }
         
         .floating-icon {
           position: absolute;
           width: 32px;
           height: 32px;
           border-radius: 50%;
           opacity: 0.6;
           animation: floatAround 8s infinite linear;
         }
         
         .floating-icon.grammar {
           background: rgba(173, 216, 230, 0.3);
           top: 15%;
           left: 20%;
           animation-delay: 0s;
         }
         
         .floating-icon.syntax {
           background: rgba(144, 238, 144, 0.3);
           bottom: 25%;
           right: 15%;
           animation-delay: 2s;
         }
         
         .floating-icon.lexicon {
           background: rgba(255, 182, 193, 0.3);
           bottom: 15%;
           left: 30%;
           animation-delay: 4s;
         }
         
         .completion-message {
           text-align: center;
           animation: fadeIn 1s;
         }
         
         .success-checkmark {
           width: 80px;
           height: 80px;
           margin: 0 auto 1.5rem auto;
         }
         
         .check-icon {
           width: 80px;
           height: 80px;
           position: relative;
           border-radius: 50%;
           box-sizing: content-box;
           border: 4px solid #4CAF50;
         }
         
         .check-icon::before {
           top: 3px;
           left: -2px;
           width: 30px;
           transform-origin: 100% 50%;
           border-radius: 100px 0 0 100px;
         }
         
         .check-icon::after {
           top: 0;
           left: 30px;
           width: 60px;
           transform-origin: 0 50%;
           border-radius: 0 100px 100px 0;
           animation: rotate-circle 4.25s ease-in;
         }
         
         .check-icon::before, .check-icon::after {
           content: '';
           height: 100px;
           position: absolute;
           background: transparent;
           transform: rotate(-45deg);
         }
         
         .check-icon .icon-line {
           height: 5px;
           background-color: #4CAF50;
           display: block;
           border-radius: 2px;
           position: absolute;
           z-index: 10;
         }
         
         .check-icon .icon-line.line-tip {
           top: 46px;
           left: 14px;
           width: 25px;
           transform: rotate(45deg);
           animation: icon-line-tip 0.75s;
         }
         
         .check-icon .icon-line.line-long {
           top: 38px;
           right: 8px;
           width: 47px;
           transform: rotate(-45deg);
           animation: icon-line-long 0.75s;
         }
         
         .completion-detail {
           color: rgba(255, 255, 255, 0.7);
           font-size: 0.9rem;
           margin-top: 1rem;
         }
         
         .error-message {
           text-align: center;
           animation: fadeIn 1s;
         }
         
         .error-icon {
           width: 60px;
           height: 60px;
           line-height: 60px;
           border-radius: 50%;
           font-size: 30px;
           font-weight: bold;
           margin: 0 auto 1.5rem auto;
           background: rgba(220, 53, 69, 0.8);
           color: white;
         }
         
         .error-detail {
           color: rgba(255, 255, 255, 0.7);
           font-size: 0.9rem;
           margin-top: 1rem;
         }
         
         @keyframes pulse {
           0% { transform: scale(0.95); opacity: 0.7; }
           50% { transform: scale(1.05); opacity: 1; }
           100% { transform: scale(0.95); opacity: 0.7; }
         }
         
         @keyframes fadeInOut {
           0%, 100% { opacity: 0.7; }
           50% { opacity: 1; }
         }
         
         @keyframes float {
           0%, 100% { transform: translateY(0); }
           50% { transform: translateY(-8px); }
         }
         
         @keyframes floatAround {
           0% { transform: translate(0, 0) rotate(0deg); }
           25% { transform: translate(20px, 15px) rotate(90deg); }
           50% { transform: translate(0, 30px) rotate(180deg); }
           75% { transform: translate(-20px, 15px) rotate(270deg); }
           100% { transform: translate(0, 0) rotate(360deg); }
         }
         
         @keyframes fadeIn {
           from { opacity: 0; transform: translateY(20px); }
           to { opacity: 1; transform: translateY(0); }
         }
         
         @keyframes pulseBackground {
           0%, 100% { background: rgba(20, 27, 43, 0.7); }
           50% { background: rgba(25, 33, 52, 0.7); }
         }
         
         @keyframes icon-line-tip {
           0% { width: 0; left: 1px; top: 19px; }
           54% { width: 0; left: 1px; top: 19px; }
           70% { width: 50px; left: -8px; top: 37px; }
           84% { width: 17px; left: 21px; top: 48px; }
           100% { width: 25px; left: 14px; top: 46px; }
         }
         
         @keyframes icon-line-long {
           0% { width: 0; right: 46px; top: 54px; }
           65% { width: 0; right: 46px; top: 54px; }
           84% { width: 55px; right: 0px; top: 35px; }
           100% { width: 47px; right: 8px; top: 38px; }
         }
        `}
      </style>
    </div>
  );
}
