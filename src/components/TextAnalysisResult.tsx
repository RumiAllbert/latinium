import { useEffect, useState } from "react";

// Fallback mock data in case API integration fails
const mockAnalysisData = {
  words: [
    {
      word: "Gallia",
      partOfSpeech: "noun",
      lemma: "Gallia",
      morphology: {
        case: "nominative",
        number: "singular",
        gender: "feminine",
      },
      relationships: [
        {
          type: "subject-verb",
          relatedWordIndex: 1,
          description: "Subject of 'est'",
        },
      ],
    },
    {
      word: "est",
      partOfSpeech: "verb",
      lemma: "sum",
      morphology: {
        person: "3",
        number: "singular",
        tense: "present",
        mood: "indicative",
        voice: "active",
      },
      relationships: [
        {
          type: "verb-subject",
          relatedWordIndex: 0,
          description: "Main verb with subject 'Gallia'",
        },
      ],
    },
    {
      word: "omnis",
      partOfSpeech: "adjective",
      lemma: "omnis",
      morphology: {
        case: "nominative",
        number: "singular",
        gender: "feminine",
      },
      relationships: [
        {
          type: "adjective-noun",
          relatedWordIndex: 0,
          description: "Modifies 'Gallia'",
        },
      ],
    },
    {
      word: "divisa",
      partOfSpeech: "verb",
      lemma: "divido",
      morphology: {
        person: "3",
        number: "singular",
        tense: "perfect",
        mood: "participle",
        voice: "passive",
      },
      relationships: [
        {
          type: "verb-subject",
          relatedWordIndex: 0,
          description: "Passive participle describing 'Gallia'",
        },
      ],
    },
  ],
};

export default function TextAnalysisResult() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [view, setView] = useState<"annotated" | "relationships" | "tree">(
    "annotated"
  );
  const [loading, setLoading] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(
    null
  );
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);

  useEffect(() => {
    console.log("TextAnalysisResult component mounted");

    // Listen for the custom event dispatched by the TextInputArea component
    const handleTextAnalyzed = (event: CustomEvent) => {
      console.log("Received latin-text-analyzed event with data:", {
        hasData: !!event.detail,
        hasAnalysis: !!event.detail?.analysis,
        wordCount: event.detail?.analysis?.words?.length || 0,
        isMockData: event.detail?.isMockData,
      });

      setLoading(true);
      setError(null);
      setSelectedWordIndex(null); // Reset selected word when new analysis comes in

      try {
        const { analysis, isMockData } = event.detail;

        if (!analysis || !analysis.words || !Array.isArray(analysis.words)) {
          console.error("Invalid analysis data received:", analysis);
          throw new Error("The analysis data is invalid or incomplete");
        }

        console.log("Processing analysis data:", {
          hasWords: !!analysis?.words,
          wordCount: analysis?.words?.length || 0,
          isMockData,
        });

        setTimeout(() => {
          console.log("Setting analysis data after timeout");
          setAnalysisData(analysis);
          setUsingMockData(!!isMockData);
          setLoading(false);
          console.log("Analysis data set, loading set to false");
        }, 300); // Short delay for smoother UI transition
      } catch (err) {
        console.error("Error processing analysis data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to process analysis data"
        );
        setLoading(false);
      }
    };

    // Listen for analysis errors
    const handleAnalysisError = (event: CustomEvent) => {
      console.log(
        "Received latin-analysis-error event with data:",
        event.detail
      );
      setLoading(false);
      setError(event.detail.error);
      console.log("Error state set:", event.detail.error);
    };

    // Add event listeners as EventListener
    window.addEventListener(
      "latin-text-analyzed",
      handleTextAnalyzed as EventListener
    );
    window.addEventListener(
      "latin-analysis-error",
      handleAnalysisError as EventListener
    );

    console.log("Event listeners added");

    return () => {
      console.log("TextAnalysisResult component unmounting");
      window.removeEventListener(
        "latin-text-analyzed",
        handleTextAnalyzed as EventListener
      );
      window.removeEventListener(
        "latin-analysis-error",
        handleAnalysisError as EventListener
      );
      console.log("Event listeners removed");
    };
  }, []);

  console.log("TextAnalysisResult rendering with state:", {
    loading,
    hasAnalysisData: !!analysisData,
    wordCount: analysisData?.words?.length || 0,
    error,
    usingMockData,
    selectedWordIndex,
  });

  if (loading) {
    console.log("Rendering loading state");
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-300 mb-4"></div>
          <p className="text-white/70">Analyzing text...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("Rendering error state:", error);
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-white/70">
          <div className="text-red-400 mb-3">⚠️ {error}</div>
          <p className="text-sm">Please try again or use a different text</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    console.log("Rendering empty state (no analysis data)");
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-white/50">
          <p className="mb-3">No text analyzed yet</p>
          <p className="text-sm">
            Enter some Latin text and click "Analyze Text" to see results
          </p>
        </div>
      </div>
    );
  }

  console.log(
    "Rendering analysis results with",
    analysisData.words?.length || 0,
    "words"
  );

  const getWordClassName = (word: any, index: number) => {
    const baseClass =
      "word inline-block relative cursor-pointer p-1 rounded hover:bg-white/10";

    // Add highlighting for related words when hovering
    let relatedClass = "";

    // If we're hovering a word, highlight related words
    if (hoveredWordIndex !== null) {
      // This is the hovered word
      if (index === hoveredWordIndex) {
        relatedClass = "bg-white/20 rounded";
      }
      // This word is related to the hovered word
      else if (
        analysisData?.words?.[hoveredWordIndex]?.relationships?.some(
          (rel: any) => rel.relatedWordIndex === index
        )
      ) {
        relatedClass = "bg-primary-500/20 border-b-2 border-primary-400";
      }
      // The hovered word is related to this word
      else if (
        analysisData?.words?.[index]?.relationships?.some(
          (rel: any) => rel.relatedWordIndex === hoveredWordIndex
        )
      ) {
        relatedClass = "bg-secondary-500/20 border-b-2 border-secondary-400";
      }
    }

    // Word type highlighting
    let typeClass = "";
    switch (word.partOfSpeech) {
      case "noun":
        typeClass = `highlight-noun`;
        break;
      case "verb":
        typeClass = `highlight-verb`;
        break;
      case "adjective":
        typeClass = `highlight-adjective`;
        break;
      case "adverb":
        typeClass = `highlight-adverb`;
        break;
      case "preposition":
        typeClass = `highlight-preposition`;
        break;
      case "conjunction":
        typeClass = `highlight-conjunction`;
        break;
      case "pronoun":
        typeClass = `highlight-pronoun`;
        break;
    }

    return `${baseClass} ${typeClass} ${relatedClass}`.trim();
  };

  const renderWordInfo = (word: any) => {
    console.log("Rendering info for word:", word);
    return (
      <div className="glass-panel p-4 mt-4 animate-fade-in">
        <div className="text-lg font-serif mb-2">
          {word.word}{" "}
          <span className="text-white/60 text-sm">({word.lemma})</span>
        </div>

        {/* Word meaning section */}
        {word.meaning && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg">
            {word.meaning.short && (
              <div className="font-medium text-primary-200 mb-1">
                {word.meaning.short}
              </div>
            )}
            {word.meaning.detailed && (
              <div className="text-sm text-white/80">
                {word.meaning.detailed}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-white/60">Part of Speech:</span>
            <span className="ml-2 capitalize">{word.partOfSpeech}</span>
          </div>

          {word.morphology &&
            Object.entries(word.morphology).map(([key, value]) => (
              <div key={key}>
                <span className="text-white/60 capitalize">{key}:</span>
                <span className="ml-2 capitalize">{value as string}</span>
              </div>
            ))}
        </div>

        {word.relationships && word.relationships.length > 0 && (
          <div className="mt-4">
            <div className="text-white/60 text-sm mb-2">Relationships:</div>
            <ul className="text-sm">
              {word.relationships.map((rel: any, idx: number) => (
                <li key={idx} className="flex items-center py-1">
                  <span className="w-3 h-3 rounded-full bg-primary-400 mr-2"></span>
                  {rel.description}
                  {analysisData?.words && rel.relatedWordIndex >= 0 && (
                    <button
                      className="ml-1 text-primary-300 hover:text-primary-200 underline"
                      onClick={() => setSelectedWordIndex(rel.relatedWordIndex)}
                    >
                      ({analysisData.words[rel.relatedWordIndex].word})
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related words section */}
        {word.relatedWords && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="text-white/60 text-sm mb-2">Related Words:</div>

            {word.relatedWords.synonyms &&
              word.relatedWords.synonyms.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-white/50">Synonyms: </span>
                  <span className="text-sm">
                    {word.relatedWords.synonyms.join(", ")}
                  </span>
                </div>
              )}

            {word.relatedWords.derivedForms &&
              word.relatedWords.derivedForms.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-white/50">Derived Forms: </span>
                  <span className="text-sm">
                    {word.relatedWords.derivedForms.join(", ")}
                  </span>
                </div>
              )}

            {word.relatedWords.usageExamples &&
              word.relatedWords.usageExamples.length > 0 && (
                <div>
                  <span className="text-xs text-white/50">Examples: </span>
                  <span className="text-sm font-serif italic">
                    {word.relatedWords.usageExamples.join("; ")}
                  </span>
                </div>
              )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {usingMockData && (
        <div className="bg-amber-900/30 border border-amber-800 rounded-md p-3 mb-4 text-amber-200 text-sm">
          <p className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Using simplified mock analysis. For full AI-powered analysis, ensure
            your server supports API endpoints.
          </p>
        </div>
      )}

      <div className="glass-panel p-6 font-serif text-lg leading-relaxed min-h-64">
        {analysisData.words ? (
          analysisData.words.length > 0 ? (
            analysisData.words
              .map((word: any, index: number) => (
                <span
                  key={index}
                  className={getWordClassName(word, index)}
                  data-meaning={
                    word.meaning?.short ||
                    `${word.lemma} (${word.partOfSpeech})`
                  }
                  onClick={() => {
                    console.log("Word clicked:", word.word, "at index", index);
                    setSelectedWordIndex(
                      selectedWordIndex === index ? null : index
                    );
                  }}
                  onMouseEnter={() => {
                    setHoveredWordIndex(index);
                  }}
                  onMouseLeave={() => {
                    setHoveredWordIndex(null);
                  }}
                >
                  {word.word}
                </span>
              ))
              .reduce((prev: any, curr: any, i: number) => [prev, " ", curr])
          ) : (
            <p className="text-white/60">No words found in analysis</p>
          )
        ) : (
          <p className="text-white/60">Invalid analysis data format</p>
        )}
      </div>

      {selectedWordIndex !== null &&
        analysisData.words &&
        renderWordInfo(analysisData.words[selectedWordIndex])}

      <div className="mt-6 glass-panel p-4">
        <div className="text-sm font-medium mb-2">Word Types Legend</div>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-primary-300 mr-2"></span>
            Nouns
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-secondary-300 mr-2"></span>
            Verbs
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-amber-300 mr-2"></span>
            Adjectives
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-lime-300 mr-2"></span>
            Adverbs
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-rose-300 mr-2"></span>
            Prepositions
          </div>
        </div>
      </div>
    </div>
  );
}
