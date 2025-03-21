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
              <div className="visualizer-container">
                <div className="pulse-rings"></div>
                <div className="analyzer-core"></div>
                <div className="radial-connections">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="connection-line"
                      style={{
                        transform: `rotate(${i * 45}deg)`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="processing-status">
                <div className="status-indicator"></div>
                <div className="status-text">{currentPhrase}</div>
              </div>

              <div className="extracted-content">
                {extractedWords.length > 0 ? (
                  <div className="word-grid">
                    {extractedWords.map((word, index) => (
                      <div
                        key={index}
                        className="analysis-term"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                        }}
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="processing-placeholder">
                    <div className="processing-line"></div>
                    <div className="processing-line"></div>
                    <div className="processing-line"></div>
                  </div>
                )}
              </div>
            </>
          )}

          {animationState === "complete" && (
            <div className="completion-message">
              <div className="success-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                    fill="#4CAF50"
                  />
                </svg>
              </div>
              <h3 className="title">Analysis Complete</h3>
              <div className="completion-detail">
                Your Latin text has been successfully analyzed
              </div>
            </div>
          )}

          {animationState === "error" && (
            <div className="error-message">
              <div className="error-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                    fill="#DC3545"
                  />
                </svg>
              </div>
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
           height: 4px;
           width: 100%;
           background: rgba(255, 255, 255, 0.08);
           border-radius: 2px;
           overflow: hidden;
           margin-bottom: 0.5rem;
           position: relative;
         }
         
         .progress-fill {
           height: 100%;
           background: linear-gradient(90deg, 
             var(--primary-color, #deb887), 
             var(--accent-color, #d4a76a)
           );
           border-radius: 2px;
           transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
           box-shadow: 0 0 8px rgba(222, 184, 135, 0.5);
         }
         
         .progress-text {
           text-align: right;
           font-size: 0.85rem;
           color: rgba(255, 255, 255, 0.7);
           font-family: monospace;
           letter-spacing: 1px;
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
           animation: subtleGradient 8s infinite alternate;
         }
         
         .animation-container.complete {
           background: rgba(28, 45, 35, 0.6);
         }
         
         .animation-container.error {
           background: rgba(45, 28, 28, 0.6);
         }
         
         /* Modern Visualization */
         .visualizer-container {
           position: relative;
           width: 120px;
           height: 120px;
           margin-bottom: 2rem;
         }
         
         .pulse-rings {
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           bottom: 0;
           border-radius: 50%;
           box-shadow: 0 0 0 0 rgba(222, 184, 135, 0.5);
           animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
         }
         
         .analyzer-core {
           position: absolute;
           width: 40px;
           height: 40px;
           top: 50%;
           left: 50%;
           transform: translate(-50%, -50%);
           background: linear-gradient(135deg, 
             var(--primary-color, #deb887) 0%, 
             var(--accent-color, #d4a76a) 100%
           );
           border-radius: 50%;
           z-index: 2;
           box-shadow: 0 0 15px rgba(222, 184, 135, 0.8);
         }
         
         .radial-connections {
           position: absolute;
           width: 100%;
           height: 100%;
           top: 0;
           left: 0;
           z-index: 1;
         }
         
         .connection-line {
           position: absolute;
           width: 1px;
           height: 60px;
           background: linear-gradient(to top, 
             var(--primary-color, #deb887) 0%, 
             transparent 100%
           );
           top: 50%;
           left: 50%;
           transform-origin: 0 0;
           opacity: 0.6;
           animation: pulse-line 2s infinite alternate;
         }
         
         .processing-status {
           display: flex;
           align-items: center;
           margin-bottom: 2rem;
         }
         
         .status-indicator {
           width: 6px;
           height: 6px;
           background-color: var(--primary-color, #deb887);
           margin-right: 12px;
           position: relative;
           animation: blink 1s infinite;
         }
         
         .status-indicator:after {
           content: '';
           position: absolute;
           top: -4px;
           left: -4px;
           right: -4px;
           bottom: -4px;
           border: 1px solid var(--primary-color, #deb887);
           opacity: 0.5;
           border-radius: 50%;
         }
         
         .status-text {
           font-size: 1.1rem;
           font-style: italic;
           color: var(--primary-color, #deb887);
           font-family: 'Times New Roman', serif;
           animation: fadeInOut 3s infinite;
         }
         
         /* Modern Grid for Extracted Words */
         .extracted-content {
           width: 100%;
           max-width: 500px;
           margin: 0 auto;
         }
         
         .word-grid {
           display: grid;
           grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
           gap: 10px;
           width: 100%;
         }
         
         .analysis-term {
           font-family: 'Times New Roman', serif;
           color: var(--primary-color, #deb887);
           padding: 8px 10px;
           font-size: 0.9rem;
           position: relative;
           overflow: hidden;
           background: rgba(222, 184, 135, 0.1);
           border-left: 2px solid var(--primary-color, #deb887);
           animation: slideIn 0.5s both;
           transition: all 0.3s ease;
         }
         
         .analysis-term:hover {
           background: rgba(222, 184, 135, 0.2);
           transform: translateX(3px);
         }
         
         .processing-placeholder {
           width: 100%;
           padding: 1rem;
         }
         
         .processing-line {
           height: 12px;
           background: rgba(255, 255, 255, 0.05);
           border-radius: 2px;
           margin-bottom: 12px;
           animation: pulse-width 2s infinite alternate;
         }
         
         .processing-line:nth-child(2) {
           animation-delay: 0.5s;
           width: 85%;
         }
         
         .processing-line:nth-child(3) {
           animation-delay: 1s;
           width: 60%;
         }
         
         /* Success/Error States */
         .completion-message, .error-message {
           text-align: center;
           animation: fadeIn 1s;
         }
         
         .success-icon, .error-icon {
           width: 64px;
           height: 64px;
           margin: 0 auto 1.5rem auto;
         }
         
         .completion-detail, .error-detail {
           color: rgba(255, 255, 255, 0.7);
           font-size: 0.9rem;
           margin-top: 1rem;
           max-width: 300px;
           margin-left: auto;
           margin-right: auto;
         }
         
         /* Animations */
         @keyframes pulse-ring {
           0% {
             box-shadow: 0 0 0 0 rgba(222, 184, 135, 0.5);
           }
           70% {
             box-shadow: 0 0 0 40px rgba(222, 184, 135, 0);
           }
           100% {
             box-shadow: 0 0 0 0 rgba(222, 184, 135, 0);
           }
         }
         
         @keyframes pulse-line {
           0% {
             opacity: 0.2;
             height: 40px;
           }
           100% {
             opacity: 0.6;
             height: 60px;
           }
         }
         
         @keyframes blink {
           0%, 100% {
             opacity: 1;
           }
           50% {
             opacity: 0.3;
           }
         }
         
         @keyframes fadeInOut {
           0%, 100% {
             opacity: 0.7;
           }
           50% {
             opacity: 1;
           }
         }
         
         @keyframes subtleGradient {
           0% {
             background: rgba(20, 27, 43, 0.7);
           }
           100% {
             background: rgba(25, 35, 55, 0.7);
           }
         }
         
         @keyframes slideIn {
           from {
             transform: translateY(20px);
             opacity: 0;
           }
           to {
             transform: translateY(0);
             opacity: 1;
           }
         }
         
         @keyframes pulse-width {
           from {
             width: 40%;
             opacity: 0.3;
           }
           to {
             width: 100%;
             opacity: 0.5;
           }
         }
         
         @keyframes fadeIn {
           from {
             opacity: 0;
             transform: translateY(20px);
           }
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }
        `}
      </style>
    </div>
  );
}
