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
  const [visibleRelationTypes, setVisibleRelationTypes] = useState<string[]>([
    "subject",
    "object",
    "adjective",
    "adverb",
    "other",
  ]);

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

  // Function to handle exporting analysis data
  const handleExport = () => {
    if (!analysisData) return;

    // Create a JSON blob from the analysis data
    const dataStr = JSON.stringify(analysisData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    // Create a download link and trigger it
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "latin-analysis.json";
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Function to trigger a refresh of the analysis
  const handleRefresh = () => {
    // Get the current text from any previous analysis
    if (!analysisData?.words || analysisData.words.length === 0) {
      return; // Nothing to refresh
    }

    // Reconstruct the original text (approximate)
    const text = analysisData.words.map((w) => w.word).join(" ");

    // Dispatch a custom event to request a new analysis
    const event = new CustomEvent("latin-request-analysis", {
      detail: { text },
    });
    window.dispatchEvent(event);

    // Reset view state
    setSelectedWordIndex(null);
    setHoveredWordIndex(null);
  };

  // Add the event listener for handling refresh requests
  useEffect(() => {
    const handleRefreshRequest = () => {
      setLoading(true);
    };

    window.addEventListener("latin-request-analysis", handleRefreshRequest);

    return () => {
      window.removeEventListener(
        "latin-request-analysis",
        handleRefreshRequest
      );
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
      <div className="h-64 flex items-center justify-center animate-slide-in">
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

  // Function to render the Relationships view
  const renderRelationshipsView = () => {
    if (!analysisData?.words?.length)
      return <p>No words to display relationships</p>;

    // List all unique relationship types in the data
    const allRelationshipTypes = Array.from(
      new Set(
        analysisData.words.flatMap((word: any) =>
          word.relationships.map((rel: any) => rel.type)
        )
      )
    );

    // Toggle a relationship type's visibility
    const toggleRelationshipType = (type: string) => {
      if (visibleRelationTypes.includes(type)) {
        setVisibleRelationTypes(visibleRelationTypes.filter((t) => t !== type));
      } else {
        setVisibleRelationTypes([...visibleRelationTypes, type]);
      }
    };

    // Check if a relationship should be visible
    const isRelationshipVisible = (type: string): boolean => {
      // If we're only showing specific types
      if (type.includes("subject"))
        return visibleRelationTypes.includes("subject");
      if (type.includes("object"))
        return visibleRelationTypes.includes("object");
      if (type.includes("adjective"))
        return visibleRelationTypes.includes("adjective");
      if (type.includes("adverb"))
        return visibleRelationTypes.includes("adverb");
      return visibleRelationTypes.includes("other"); // For any other types
    };

    // Function to get relationship type class
    const getRelationTypeClass = (relType: string): string => {
      if (relType.includes("subject")) return "verb-subject";
      if (relType.includes("object")) return "verb-object";
      if (relType.includes("adjective")) return "adjective-noun";
      if (relType.includes("adverb")) return "adverb-verb";
      return "relation-label";
    };

    // Layout the words in a better grid pattern
    const positionWords = () => {
      const positions: { x: number; y: number }[] = [];
      const wordCount = analysisData.words.length;

      // Use a radial layout for fewer words, grid for more
      if (wordCount <= 6) {
        // Radial layout for better relationship visualization with few words
        const radius = Math.min(150, 60 * wordCount);
        const angleStep = (2 * Math.PI) / wordCount;

        for (let i = 0; i < wordCount; i++) {
          const angle = i * angleStep;
          positions.push({
            x: 250 + radius * Math.cos(angle),
            y: 150 + radius * Math.sin(angle),
          });
        }
      } else {
        // Grid layout for more words
        const cols = Math.ceil(Math.sqrt(wordCount));
        const rows = Math.ceil(wordCount / cols);
        const cellWidth = 150;
        const cellHeight = 100;

        for (let i = 0; i < wordCount; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          positions.push({
            x: 100 + col * cellWidth,
            y: 60 + row * cellHeight,
          });
        }
      }

      return positions;
    };

    const wordPositions = positionWords();

    return (
      <div className="p-4">
        {/* Filter controls for relationship types */}
        <div className="mb-4 glass-panel p-3">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-white/70 text-sm mr-2">
              Show relationships:
            </span>
            <button
              className={`px-2 py-1 text-xs rounded ${
                visibleRelationTypes.includes("subject")
                  ? "bg-secondary-500/30 text-secondary-200"
                  : "bg-white/10 text-white/50"
              }`}
              onClick={() => toggleRelationshipType("subject")}
            >
              Subject-Verb
            </button>
            <button
              className={`px-2 py-1 text-xs rounded ${
                visibleRelationTypes.includes("object")
                  ? "bg-primary-500/30 text-primary-200"
                  : "bg-white/10 text-white/50"
              }`}
              onClick={() => toggleRelationshipType("object")}
            >
              Verb-Object
            </button>
            <button
              className={`px-2 py-1 text-xs rounded ${
                visibleRelationTypes.includes("adjective")
                  ? "bg-amber-500/30 text-amber-200"
                  : "bg-white/10 text-white/50"
              }`}
              onClick={() => toggleRelationshipType("adjective")}
            >
              Adjective-Noun
            </button>
            <button
              className={`px-2 py-1 text-xs rounded ${
                visibleRelationTypes.includes("adverb")
                  ? "bg-lime-500/30 text-lime-200"
                  : "bg-white/10 text-white/50"
              }`}
              onClick={() => toggleRelationshipType("adverb")}
            >
              Adverb-Verb
            </button>
            <button
              className={`px-2 py-1 text-xs rounded ${
                visibleRelationTypes.includes("other")
                  ? "bg-gray-500/30 text-gray-200"
                  : "bg-white/10 text-white/50"
              }`}
              onClick={() => toggleRelationshipType("other")}
            >
              Other
            </button>
          </div>
        </div>

        <div className="glass-panel p-4 overflow-x-auto">
          <div
            className="min-w-full min-h-[500px] relative"
            style={{ padding: "20px 0" }}
          >
            {/* Draw lines between related words */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <defs>
                {/* Define arrowhead markers for relationship directions */}
                <marker
                  id="arrowhead-verb"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#c4b5fd" />
                </marker>
                <marker
                  id="arrowhead-noun"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#93c5fd" />
                </marker>
                <marker
                  id="arrowhead-adjective"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#fcd34d" />
                </marker>
              </defs>

              {analysisData.words.flatMap((word: any, wordIndex: number) =>
                word.relationships
                  .filter((rel) => isRelationshipVisible(rel.type))
                  .map((rel: any, relIndex: number) => {
                    const sourceX = wordPositions[wordIndex]?.x || 0;
                    const sourceY = wordPositions[wordIndex]?.y || 0;
                    const targetX = wordPositions[rel.relatedWordIndex]?.x || 0;
                    const targetY = wordPositions[rel.relatedWordIndex]?.y || 0;

                    // Skip if positions are invalid
                    if (!sourceX || !targetX) return null;

                    // Calculate midpoint and control points for curve
                    const dx = targetX - sourceX;
                    const dy = targetY - sourceY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Calculate perpendicular vector for control point
                    const nx = -dy / distance;
                    const ny = dx / distance;

                    // Control point offset (make curve bend more for longer distances)
                    const offset = Math.min(50, distance * 0.3);

                    // Calculate control point at the midpoint, offset perpendicularly
                    const cx = (sourceX + targetX) / 2 + nx * offset;
                    const cy = (sourceY + targetY) / 2 + ny * offset;

                    // Create path with quadratic Bezier curve
                    const path = `M ${sourceX} ${sourceY} Q ${cx} ${cy}, ${targetX} ${targetY}`;

                    // Determine which arrowhead to use based on part of speech
                    let arrowMarker = "";
                    if (word.partOfSpeech === "verb") {
                      arrowMarker = "url(#arrowhead-verb)";
                    } else if (word.partOfSpeech === "noun") {
                      arrowMarker = "url(#arrowhead-noun)";
                    } else if (word.partOfSpeech === "adjective") {
                      arrowMarker = "url(#arrowhead-adjective)";
                    }

                    // Determine if this relationship involves the selected word
                    const isSelectedRelationship =
                      selectedWordIndex === wordIndex ||
                      selectedWordIndex === rel.relatedWordIndex;

                    // Get the CSS class for this type of relationship
                    const relationClass = getRelationTypeClass(rel.type);

                    return (
                      <g
                        key={`${wordIndex}-${relIndex}`}
                        className="relationship-group"
                      >
                        {/* Create path with arrow */}
                        <path
                          d={path}
                          fill="none"
                          stroke={getRelationshipColor(word.partOfSpeech)}
                          strokeWidth={
                            rel.type.includes("subject") ? "2.5" : "2"
                          }
                          strokeDasharray={
                            rel.type.includes("subject") ? "" : "4,2"
                          }
                          markerEnd={arrowMarker}
                          className={`opacity-70 hover:opacity-100 transition-opacity ${
                            isSelectedRelationship
                              ? "relationship-selected"
                              : ""
                          }`}
                        />

                        {/* Path for text attachment */}
                        <path
                          id={`text-path-${wordIndex}-${relIndex}`}
                          d={path}
                          fill="none"
                          stroke="none"
                        />

                        {/* Label with background and specific relationship styling */}
                        <text className="relationship-text">
                          <textPath
                            href={`#text-path-${wordIndex}-${relIndex}`}
                            startOffset="50%"
                            textAnchor="middle"
                            fill="white"
                            fontSize="10"
                          >
                            <tspan className={relationClass}>{rel.type}</tspan>
                          </textPath>
                        </text>
                      </g>
                    );
                  })
              )}
            </svg>

            {/* Words - positioned absolutely */}
            <div className="relative z-10" style={{ minHeight: "400px" }}>
              {analysisData.words.map((word: any, index: number) => (
                <div
                  key={index}
                  className={`glass-panel p-2 text-center min-w-[100px] cursor-pointer word-box absolute
                             ${selectedWordIndex === index ? "selected" : ""}`}
                  style={{
                    backgroundColor: `rgba(${getWordColorRGB(
                      word.partOfSpeech
                    )}, 0.3)`,
                    borderColor: `rgba(${getWordColorRGB(
                      word.partOfSpeech
                    )}, 0.5)`,
                    left: `${wordPositions[index]?.x - 50}px`,
                    top: `${wordPositions[index]?.y - 30}px`,
                  }}
                  onClick={() =>
                    setSelectedWordIndex(
                      selectedWordIndex === index ? null : index
                    )
                  }
                >
                  <div className="font-serif">{word.word}</div>
                  <div className="text-xs opacity-70">{word.lemma}</div>
                  <div className="text-xs text-white/50 mt-1">
                    {word.partOfSpeech}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected word details */}
        {selectedWordIndex !== null && analysisData.words && (
          <div className="mt-4">
            {renderWordInfo(analysisData.words[selectedWordIndex])}
          </div>
        )}
      </div>
    );
  };

  // Function to render the Syntax Tree view
  const renderSyntaxTreeView = () => {
    if (!analysisData?.words?.length) return <p>No words to display in tree</p>;

    // Helper function to build a tree structure from the analyzed words
    const buildSyntaxTree = () => {
      // Create a copy of words with additional tree-related properties
      const nodes = analysisData.words.map((word: any, index: number) => ({
        ...word,
        id: index,
        children: [],
        isRoot: false,
        parent: null,
      }));

      // Identify relationships and build tree
      nodes.forEach((node: any) => {
        if (node.relationships && node.relationships.length > 0) {
          node.relationships.forEach((rel: any) => {
            // Handle subject-verb relationships
            if (rel.type.includes("subject") && node.partOfSpeech === "verb") {
              // Make verb the parent of the subject
              nodes[rel.relatedWordIndex].parent = node.id;
              node.children.push(nodes[rel.relatedWordIndex]);
            }
            // Handle verb-object relationships
            else if (
              rel.type.includes("object") &&
              node.partOfSpeech === "verb"
            ) {
              // Make verb the parent of the object
              nodes[rel.relatedWordIndex].parent = node.id;
              node.children.push(nodes[rel.relatedWordIndex]);
            }
            // Handle adjective-noun relationships
            else if (
              rel.type.includes("adjective-noun") &&
              node.partOfSpeech === "adjective"
            ) {
              // Make noun the parent of the adjective
              nodes[rel.relatedWordIndex].parent = node.id;
              node.children.push(nodes[rel.relatedWordIndex]);
            }
            // Other relationships based on grammar hierarchy
            else if (!node.parent) {
              // Default hierarchy if no clear parent
              const parentIdx = rel.relatedWordIndex;
              const childIdx = nodes.findIndex((n: any) => n.id === node.id);

              // Avoid circular references
              if (
                parentIdx !== childIdx &&
                !hasAncestor(nodes, parentIdx, childIdx)
              ) {
                nodes[childIdx].parent = parentIdx;
                nodes[parentIdx].children.push(nodes[childIdx]);
              }
            }
          });
        }
      });

      // Find root nodes (main verbs or subjects without parents)
      const rootNodes = nodes.filter((node: any) => {
        if (node.parent === null) {
          // Prioritize verbs and nouns as roots
          if (node.partOfSpeech === "verb") {
            node.isRoot = true;
            return true;
          } else if (
            node.partOfSpeech === "noun" &&
            !nodes.some((n: any) =>
              n.relationships?.some(
                (r: any) =>
                  r.relatedWordIndex === node.id && r.type.includes("subject")
              )
            )
          ) {
            node.isRoot = true;
            return true;
          }
        }
        return false;
      });

      // If no clear roots, pick the first word
      if (rootNodes.length === 0 && nodes.length > 0) {
        nodes[0].isRoot = true;
        rootNodes.push(nodes[0]);
      }

      return rootNodes;
    };

    // Helper to check if adding a parent would create a circular reference
    const hasAncestor = (
      nodes: any[],
      nodeIdx: number,
      potentialAncestorIdx: number
    ): boolean => {
      let current = nodes[nodeIdx];
      while (current && current.parent !== null) {
        if (current.parent === potentialAncestorIdx) return true;
        current = nodes[current.parent];
      }
      return false;
    };

    // Render a node and its children recursively
    const renderTreeNode = (
      node: any,
      level: number = 0,
      position: number = 0
    ) => {
      return (
        <div key={node.id} className="flex flex-col items-center">
          <div
            className={`glass-panel p-2 m-1 text-center cursor-pointer
                      ${
                        selectedWordIndex === node.id
                          ? "ring-2 ring-primary-400"
                          : ""
                      }`}
            style={{
              backgroundColor: `rgba(${getWordColorRGB(
                node.partOfSpeech
              )}, 0.3)`,
              borderColor: `rgba(${getWordColorRGB(node.partOfSpeech)}, 0.5)`,
              minWidth: "120px",
            }}
            onClick={() =>
              setSelectedWordIndex(
                selectedWordIndex === node.id ? null : node.id
              )
            }
          >
            <div className="font-serif">{node.word}</div>
            <div className="text-xs opacity-70">{node.lemma}</div>
            <div className="text-xs text-white/50 mt-1">
              {node.partOfSpeech}
            </div>
          </div>

          {node.children && node.children.length > 0 && (
            <div className="pt-6 relative">
              {/* Connector line to parent */}
              <div className="absolute top-0 left-1/2 w-px h-6 bg-white/20"></div>

              {/* Horizontal connector line */}
              {node.children.length > 1 && (
                <div className="absolute top-6 left-0 right-0 h-px bg-white/20"></div>
              )}

              <div className="flex flex-wrap justify-center gap-4">
                {node.children.map((child: any, idx: number) =>
                  renderTreeNode(child, level + 1, idx)
                )}
              </div>
            </div>
          )}
        </div>
      );
    };

    const rootNodes = buildSyntaxTree();

    return (
      <div className="p-4">
        <div className="glass-panel p-6 overflow-auto">
          <div className="flex justify-center min-h-[400px]">
            <div className="flex flex-col items-center">
              {rootNodes.map((node: any, idx: number) => (
                <div key={idx} className="mb-8">
                  {renderTreeNode(node)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected word details */}
        {selectedWordIndex !== null && analysisData.words && (
          <div className="mt-4">
            {renderWordInfo(analysisData.words[selectedWordIndex])}
          </div>
        )}
      </div>
    );
  };

  // Function to get the color for relationships based on part of speech
  const getRelationshipColor = (partOfSpeech: string): string => {
    switch (partOfSpeech) {
      case "noun":
        return "#93c5fd"; // primary-300
      case "verb":
        return "#c4b5fd"; // secondary-300
      case "adjective":
        return "#fcd34d"; // amber-300
      case "adverb":
        return "#a3e635"; // lime-300
      case "preposition":
        return "#fda4af"; // rose-300
      case "conjunction":
        return "#67e8f9"; // cyan-300
      case "pronoun":
        return "#fdba74"; // orange-300
      default:
        return "#e5e7eb"; // gray-300
    }
  };

  // Function to get RGB values for word backgrounds
  const getWordColorRGB = (partOfSpeech: string): string => {
    switch (partOfSpeech) {
      case "noun":
        return "147, 197, 253"; // primary-300
      case "verb":
        return "196, 181, 253"; // secondary-300
      case "adjective":
        return "252, 211, 77"; // amber-300
      case "adverb":
        return "163, 230, 53"; // lime-300
      case "preposition":
        return "253, 164, 175"; // rose-300
      case "conjunction":
        return "103, 232, 249"; // cyan-300
      case "pronoun":
        return "253, 186, 116"; // orange-300
      default:
        return "229, 231, 235"; // gray-300
    }
  };

  // Main render function with view selection and content
  return (
    <div className="animate-slide-in opacity-0">
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

      {/* Results header with attention animation */}
      <div className="mb-6 animate-attention">
        <h3 className="text-xl font-medium font-serif text-primary-300 mb-2">
          Analysis Results
        </h3>
        <p className="text-white/70 text-sm">
          Hover over words to see relationships and click for detailed
          information
        </p>
      </div>

      {/* Toolbar with view selection, export, and refresh */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        {/* View selection tabs */}
        <div className="flex items-center mb-2 md:mb-0">
          <span className="text-white/70 text-sm mr-3">View:</span>
          <div className="flex gap-1">
            <button
              className={`glass-button text-sm py-1 px-3 transition-all ${
                view === "annotated"
                  ? "bg-white/30 border-primary-400"
                  : "hover:bg-white/15"
              }`}
              onClick={() => setView("annotated")}
            >
              Annotated
            </button>
            <button
              className={`glass-button text-sm py-1 px-3 transition-all ${
                view === "relationships"
                  ? "bg-white/30 border-primary-400"
                  : "hover:bg-white/15"
              }`}
              onClick={() => setView("relationships")}
            >
              Relationships
            </button>
            <button
              className={`glass-button text-sm py-1 px-3 transition-all ${
                view === "tree"
                  ? "bg-white/30 border-primary-400"
                  : "hover:bg-white/15"
              }`}
              onClick={() => setView("tree")}
            >
              Syntax Tree
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            className="glass-button text-sm py-1 px-3 flex items-center gap-1 hover:bg-white/20"
            onClick={handleExport}
            disabled={!analysisData}
            title="Export analysis as JSON"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>

          <button
            className="glass-button text-sm py-1 px-3 flex items-center gap-1 hover:bg-white/20"
            onClick={handleRefresh}
            disabled={!analysisData || loading}
            title="Re-analyze current text"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Analyzing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Content based on selected view */}
      {view === "annotated" && (
        <>
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
                        console.log(
                          "Word clicked:",
                          word.word,
                          "at index",
                          index
                        );
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
                  .reduce((prev: any, curr: any, i: number) => [
                    prev,
                    " ",
                    curr,
                  ])
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
        </>
      )}

      {view === "relationships" && renderRelationshipsView()}

      {view === "tree" && renderSyntaxTreeView()}

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
