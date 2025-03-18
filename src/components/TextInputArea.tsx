import { useEffect, useState } from "react";
import { analyzeLatin } from "../utils/geminiApi";

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
  const [analyzing, setAnalyzing] = useState(false);
  const [charCount, setCharCount] = useState(CAESAR_TEXT.length);

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
  const updateLoadingState = (isAnalyzing: boolean) => {
    setAnalyzing(isAnalyzing);
  };

  const handleAnalysis = async () => {
    console.log("Analysis button clicked, text length:", text.length);
    if (!text.trim()) {
      console.error("No text to analyze");
      return;
    }

    updateLoadingState(true);

    // Make analysis section visible and scroll to it
    const analysisSection = document.getElementById("analysis-section");
    if (analysisSection) {
      analysisSection.classList.remove("analysis-section-hidden");
      analysisSection.classList.add("analysis-section-visible");
    }

    try {
      // Call the API
      console.log(
        "Calling analyzeLatin with text:",
        text.substring(0, 30) + "..."
      );
      const { result, isMockData } = await analyzeLatin(text);

      console.log("Analysis complete", {
        isMockData,
        wordCount: result?.words?.length || 0,
      });

      // Dispatch event with results
      dispatchAnalysisEvent(text, result, isMockData);
    } catch (error) {
      console.error("Error in analysis:", error);
      handleAnalysisError(error);
    } finally {
      updateLoadingState(false);
    }
  };

  // Event dispatching functions
  const dispatchAnalysisEvent = (
    text: string,
    analysis: any,
    isMockData: boolean
  ) => {
    console.log("Dispatching analysis event with data:", {
      textLength: text.length,
      analysisWords: analysis?.words?.length || 0,
      isMockData,
    });

    try {
      const analysisEvent = new CustomEvent("latin-text-analyzed", {
        detail: {
          text,
          analysis,
          isMockData,
        },
      });

      window.dispatchEvent(analysisEvent);
      console.log("Analysis event dispatched successfully");
    } catch (error) {
      console.error("Failed to dispatch analysis event:", error);
      alert("Failed to deliver analysis results: " + error);
    }
  };

  const handleAnalysisError = (error: unknown) => {
    console.error("Handling analysis error:", error);

    let message = "Analysis failed";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }

    try {
      const errorEvent = new CustomEvent("latin-analysis-error", {
        detail: { error: message },
      });
      window.dispatchEvent(errorEvent);
    } catch (e) {
      console.error("Failed to dispatch error event:", e);
      alert("Analysis failed: " + message);
    }
  };

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
    </div>
  );
}
