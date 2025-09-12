import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult } from "../types/AnalysisResult";
import { analyzeLatin } from "../utils/directGeminiApi";
import StreamingAnalysisDisplay from "./StreamingAnalysisDisplay";
import SentenceHoverAnalyzer from "./SentenceHoverAnalyzer";

// Define the LatinAnalysisError interface
interface LatinAnalysisError {
  message: string;
  code: string;
  details: Record<string, any>;
}

// Updated interface for streaming options to match geminiApi implementation
interface AnalyzeLatinOptions {
  stream?: boolean;
  onStreamChunk?: (chunk: string, progress?: number) => void;
}

// Updated interface for analyzeLatin response
interface AnalyzeLatinResponse {
  result: AnalysisResult;
  isMockData: boolean;
}

// Hard-coded example texts
const CAESAR_TEXT =
  "Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae, nostra Galli appellantur.";
const CICERO_TEXT =
  "Quousque tandem abutere, Catilina, patientia nostra? Quam diu etiam furor iste tuus nos eludet?";

// Simple mock data generator
function generateMockAnalysis(text: string) {
  console.log("Generating mock analysis for:", text.substring(0, 30) + "...");
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  return {
    words: words.map((word, index) => {
      const partOfSpeech = ["noun", "verb", "adjective", "adverb", "pronoun"][
        index % 5
      ];

      return {
        word: word,
        partOfSpeech: partOfSpeech,
        lemma: word.toLowerCase(),
        morphology:
          partOfSpeech === "verb"
            ? {
                person: "3",
                number: "singular",
                tense: "present",
                mood: "indicative",
                voice: "active",
              }
            : { case: "nominative", number: "singular", gender: "masculine" },
        relationships:
          index > 0
            ? [
                {
                  type: "nearby-word",
                  relatedWordIndex: index - 1,
                  description: `Related to "${words[index - 1]}"`,
                },
              ]
            : [],
      };
    }),
  };
}

export default function TextInputArea() {
  const [text, setText] = useState(CAESAR_TEXT);
  const [loading, setLoading] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [charCount, setCharCount] = useState(CAESAR_TEXT.length);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingChunks, setStreamingChunks] = useState<string[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<LatinAnalysisError | null>(null);

  const CHAR_LIMIT = 500;

  // Initialize text on mount
  useEffect(() => {
    console.log(
      "TextInputArea mounted with initial text:",
      text.substring(0, 30) + "..."
    );
    setCharCount(text.length);

    // Check for selected example from examples page
    const selectedExample = localStorage.getItem("selected-latin-example");
    if (selectedExample) {
      setText(selectedExample);
      setCharCount(selectedExample.length);
      localStorage.removeItem("selected-latin-example");

      // Analyze the example automatically after a slight delay
      setTimeout(() => {
        handleAnalysis();
      }, 500);
    }
  }, []);

  // Listen for analysis requests from other components
  useEffect(() => {
    const handleAnalysisRequest = (event: CustomEvent) => {
      if (event.detail && event.detail.text) {
        setText(event.detail.text);
        // Wait a tick for the state to update
        setTimeout(() => {
          handleAnalysis();
        }, 0);
      }
    };

    window.addEventListener(
      "latin-request-analysis",
      handleAnalysisRequest as EventListener
    );

    return () => {
      window.removeEventListener(
        "latin-request-analysis",
        handleAnalysisRequest as EventListener
      );
    };
  }, []); // Note: This effect depends on handleAnalysis, but including it would cause unnecessary rerenders

  // Text handling functions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= CHAR_LIMIT) {
      setText(newText);
      setCharCount(newText.length);
    }
  };

  const setExampleText = (exampleText: string) => {
    if (exampleText.length <= CHAR_LIMIT) {
      console.log(
        "Setting example text:",
        exampleText.substring(0, 30) + "..."
      );
      setText(exampleText);
      setCharCount(exampleText.length);

      // Automatically analyze the text when an example is selected
      setTimeout(() => {
        handleAnalysis();
      }, 300);
    } else {
      const truncatedText = exampleText.substring(0, CHAR_LIMIT);
      setText(truncatedText);
      setCharCount(truncatedText.length);
      console.warn("Example text truncated to match character limit");

      // Automatically analyze the truncated text
      setTimeout(() => {
        handleAnalysis();
      }, 300);
    }
  };

  // Analysis handling functions
  const updateLoadingState = useCallback(
    (isLoading: boolean, progress?: number) => {
      setAnalyzing(isLoading);
      setLoading(isLoading);
      setInputDisabled(isLoading);
      if (typeof progress === "number") {
        setLoadingProgress(progress);
        setCompletionPercentage(progress);
      } else if (isLoading) {
        setLoadingProgress(10);
        setCompletionPercentage(10);
      }
    },
    []
  );

  const resetStreamingState = useCallback(() => {
    setIsStreaming(false);
    setStreamingChunks([]);
    setCompletionPercentage(0);
  }, []);

  const handleAnalysis = useCallback(async () => {
    if (!text) return;

    // Reset states at the start of a new analysis
    setAnalysis(null);
    setError(null);
    updateLoadingState(true);
    resetStreamingState();

    try {
      const useStreaming = true; // You can make this a user preference toggle
      if (useStreaming) {
        setIsStreaming(true);
        let chunks: string[] = [];
        let chunkCount = 0;

        // Define streaming options
        const streamOptions = {
          stream: true,
          onStreamChunk: (chunk: string) => {
            // Track chunks and estimate progress
            chunks = [...chunks, chunk];
            chunkCount++;

            // Estimate progress - assume average of 20 chunks for complete analysis
            // This is a simplification - ideally we'd get progress from the server
            const estimatedProgress = Math.min(
              Math.floor((chunkCount / 20) * 100),
              95
            );

            setStreamingChunks(chunks);
            setCompletionPercentage(estimatedProgress);
            updateLoadingState(true, estimatedProgress);
          },
        };

        // Streaming analytics
        try {
          const response = await analyzeLatin(text, streamOptions);

          // When streaming is complete:
          setIsStreaming(false);
          setCompletionPercentage(100); // Set to 100% when complete

          if (
            response &&
            response.result &&
            Array.isArray(response.result.words)
          ) {
            setAnalysis(response.result);
            dispatchAnalysisEvent(text, response.result, response.isMockData);
          } else {
            throw new Error("Invalid analysis result structure");
          }
        } catch (streamError) {
          console.error("Streaming analysis error:", streamError);
          setIsStreaming(false);
          setCompletionPercentage(0);
          throw streamError; // Rethrow to be handled by the outer catch
        }
      } else {
        // Non-streaming analysis (original functionality)
        const response = await analyzeLatin(text);

        if (
          response &&
          response.result &&
          Array.isArray(response.result.words)
        ) {
          setAnalysis(response.result);
          dispatchAnalysisEvent(text, response.result, response.isMockData);
        } else {
          throw new Error("Invalid analysis result structure");
        }
      }

      updateLoadingState(false);
    } catch (e) {
      console.error("Analysis error:", e);
      updateLoadingState(false);
      setIsStreaming(false);
      setCompletionPercentage(0);

      const errorObj: LatinAnalysisError = {
        message:
          typeof e === "string"
            ? e
            : e instanceof Error
            ? e.message
            : "Unknown error occurred during analysis",
        code: "ANALYSIS_ERROR",
        details: { error: String(e) },
      };

      setError(errorObj);

      // Dispatch error event
      try {
        const errorEvent = new CustomEvent("latin-analysis-error", {
          detail: { error: errorObj.message || "Unknown error" },
        });
        window.dispatchEvent(errorEvent);
      } catch (err) {
        console.error("Failed to dispatch error event:", err);
      }
    }
  }, [text, updateLoadingState, resetStreamingState]);

  // Event dispatching functions
  const dispatchAnalysisEvent = (
    text: string,
    result: AnalysisResult,
    isMockData: boolean
  ) => {
    try {
      // Make sure the event structure matches what TextAnalysisResult expects
      const event = new CustomEvent("latin-text-analyzed", {
        detail: {
          text,
          analysis: result, // The key must be "analysis" not "result"
          isMockData,
        },
      });

      console.log("Dispatching analysis event with data:", {
        textLength: text.length,
        wordCount: result.words?.length || 0,
        isMockData,
      });

      window.dispatchEvent(event);
    } catch (error) {
      console.error("Failed to dispatch analysis event:", error);
    }
  };

  const handleStreamingComplete = useCallback(() => {
    // Animation or UI updates after streaming completes
    console.log("Streaming analysis complete");
  }, []);

  // Helper function to get character count class
  const getCharCountClass = () => {
    if (charCount > CHAR_LIMIT * 0.9) return "char-counter-error";
    if (charCount > CHAR_LIMIT * 0.75) return "char-counter-warning";
    return "char-counter-normal";
  };

  // Helper function to get textarea class based on character count
  const getTextareaClass = () => {
    const baseClass =
      "glass-input w-full h-64 font-serif leading-relaxed resize-none mb-1";
    if (charCount > CHAR_LIMIT * 0.9) return `${baseClass} textarea-error`;
    if (charCount > CHAR_LIMIT * 0.75) return `${baseClass} textarea-warning`;
    return baseClass;
  };

  // Render the UI
  return (
    <div className="flex flex-col h-full">
      <div className="relative">
        <textarea
          id="latin-input"
          className={getTextareaClass()}
          placeholder="Enter Latin text here... (e.g. 'Gallia est omnis divisa in partes tres...')"
          value={text}
          onChange={handleTextChange}
          maxLength={CHAR_LIMIT}
          disabled={inputDisabled}
        />
        {/* Character counter */}
        <div className={`char-counter ${getCharCountClass()}`}>
          {charCount}/{CHAR_LIMIT} characters
          {charCount > CHAR_LIMIT * 0.9 && (
            <span className="ml-2">Character limit almost reached</span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-white/60 text-sm">
          Type or use an example below
        </div>

        <div className="flex gap-2">
          <button
            id="analyze-btn"
            className="glass-button bg-primary-600 hover:bg-primary-700 flex items-center gap-2 px-6 py-2 text-base"
            type="button"
            onClick={handleAnalysis}
            disabled={analyzing || charCount === 0}
          >
            {analyzing ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            )}
            <span className="font-medium">
              {analyzing ? "Analyzing..." : "Analyze Text"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1 animate-bounce-subtle"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          className="glass-button bg-white/5 hover:bg-white/15 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white flex items-center gap-1.5 transition-all"
          type="button"
          onClick={() => setExampleText(CAESAR_TEXT)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-primary-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Caesar example
        </button>
        <button
          className="glass-button bg-white/5 hover:bg-white/15 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white flex items-center gap-1.5 transition-all"
          type="button"
          onClick={() => setExampleText(CICERO_TEXT)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-secondary-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Cicero example
        </button>
        <a
          href="/examples"
          className="glass-button bg-white/5 hover:bg-primary-600/20 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-primary-200 flex items-center gap-1.5 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
            />
          </svg>
          More
        </a>
      </div>

      {/* Hover-to-analyze preview */}
      {text && (
        <div className="mt-6">
          <SentenceHoverAnalyzer text={text} />
        </div>
      )}

      {isStreaming && (
        <StreamingAnalysisDisplay
          isActive={isStreaming}
          chunks={streamingChunks}
          completionPercentage={completionPercentage}
          finalResult={analysis}
          onComplete={handleStreamingComplete}
        />
      )}

      {!isStreaming && analysis && (
        <div>
          {/* Placeholder for existing analysis display */}
          <p>Analysis complete. View results below.</p>
        </div>
      )}
    </div>
  );
}
