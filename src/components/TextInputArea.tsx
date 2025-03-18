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

  // Initialize text on mount
  useEffect(() => {
    console.log(
      "TextInputArea mounted with initial text:",
      text.substring(0, 30) + "..."
    );
  }, []);

  // Text handling functions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const setExampleText = (exampleText: string) => {
    console.log("Setting example text:", exampleText.substring(0, 30) + "...");
    setText(exampleText);
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

  // Render the UI
  return (
    <div className="flex flex-col h-full">
      <textarea
        id="latin-input"
        className="glass-input w-full h-64 font-serif leading-relaxed resize-none mb-4"
        placeholder="Enter Latin text here... (e.g. 'Gallia est omnis divisa in partes tres...')"
        value={text}
        onChange={handleTextChange}
      />

      <div className="flex justify-between items-center">
        <div className="text-white/60 text-sm">
          Type or use an example below
        </div>

        <div className="flex gap-2">
          <button
            id="analyze-btn"
            className="glass-button bg-primary-600 hover:bg-primary-700 flex items-center gap-2 px-4 py-2"
            type="button"
            onClick={handleAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <svg
                className="animate-spin h-4 w-4"
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
                className="h-4 w-4"
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
            <span>{analyzing ? "Analyzing..." : "Analyze Text"}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition"
          type="button"
          onClick={() => setExampleText(CAESAR_TEXT)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Caesar example
        </button>
        <button
          className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition"
          type="button"
          onClick={() => setExampleText(CICERO_TEXT)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Cicero example
        </button>
      </div>
    </div>
  );
}
