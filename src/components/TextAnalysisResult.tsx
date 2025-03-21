import { useEffect, useState } from "react";
import InteractiveWordRelationships from "./InteractiveWordRelationships";

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
  const [visiblePartsOfSpeech, setVisiblePartsOfSpeech] = useState<string[]>([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "preposition",
    "conjunction",
    "pronoun",
  ]);
  const [visibleRelationTypes, setVisibleRelationTypes] = useState<string[]>([
    "subject",
    "object",
    "adjective",
    "adverb",
    "other",
  ]);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [highlightedRelationship, setHighlightedRelationship] = useState<{
    sourceIndex: number;
    targetIndex: number;
    type: string;
  } | null>(null);
  const [useInteractiveView, setUseInteractiveView] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"words" | "relationships">(
    "words"
  );

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

  // Function to toggle part of speech visibility
  const togglePartOfSpeech = (partOfSpeech: string) => {
    if (visiblePartsOfSpeech.includes(partOfSpeech)) {
      setVisiblePartsOfSpeech(
        visiblePartsOfSpeech.filter((p) => p !== partOfSpeech)
      );
    } else {
      setVisiblePartsOfSpeech([...visiblePartsOfSpeech, partOfSpeech]);
    }
  };

  // Function to get word class name based on case and part of speech
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

    // Part of speech filtering - hide words that aren't in the visible parts list
    const isVisible = visiblePartsOfSpeech.includes(
      word.partOfSpeech?.toLowerCase() || "unknown"
    );
    if (!isVisible) {
      return `${baseClass} opacity-30 ${relatedClass}`;
    }

    // Case-based coloring (for nouns, adjectives, pronouns)
    let caseClass = "";
    if (word.morphology && word.morphology.case) {
      switch (word.morphology.case.toLowerCase()) {
        case "nominative":
          caseClass = "text-blue-300"; // Blue for nominative (subject)
          break;
        case "accusative":
          caseClass = "text-amber-300"; // Amber for accusative (direct object)
          break;
        case "genitive":
          caseClass = "text-green-300"; // Green for genitive (possession)
          break;
        case "dative":
          caseClass = "text-purple-300"; // Purple for dative (indirect object)
          break;
        case "ablative":
          caseClass = "text-rose-300"; // Rose for ablative (by/with/from)
          break;
        case "vocative":
          caseClass = "text-cyan-300"; // Cyan for vocative (direct address)
          break;
        default:
          break;
      }
    }

    // Special handling for verbs - always red
    if (word.partOfSpeech?.toLowerCase() === "verb") {
      caseClass = "text-red-400 font-medium"; // Verbs are always red and bold
    }

    // Apply default colors for parts of speech without case
    if (!caseClass) {
      if (word.partOfSpeech?.toLowerCase() === "adverb") {
        caseClass = "text-lime-300"; // Lime for adverbs
      } else if (word.partOfSpeech?.toLowerCase() === "preposition") {
        caseClass = "text-gray-300"; // Gray for prepositions
      } else if (word.partOfSpeech?.toLowerCase() === "conjunction") {
        caseClass = "text-orange-300"; // Orange for conjunctions
      }
    }

    return `${baseClass} ${caseClass} ${relatedClass}`.trim();
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
    console.log("Rendering relationships view with data:", {
      hasData: !!analysisData,
      wordCount: analysisData?.words?.length || 0,
      selectedWordIndex,
      focusModeEnabled,
    });

    if (!analysisData?.words?.length) {
      console.log("No words to display relationships - returning empty state");
      return (
        <div className="p-4 text-white/70">
          <p>No words available to display relationships</p>
          <p className="text-sm mt-2">
            Make sure your text has been analyzed properly
          </p>
        </div>
      );
    }

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

    // Toggle between interactive and traditional visualization
    const toggleVisualizationMode = () => {
      setUseInteractiveView(!useInteractiveView);
      // Reset selection when switching modes
      setSelectedWordIndex(null);
      setHighlightedRelationship(null);
    };

    // Function to handle word hover for interactive mode
    const handleWordHover = (index: number | null) => {
      if (!focusModeEnabled) {
        setSelectedWordIndex(index);
      }
    };

    // Function to handle word click for interactive mode
    const handleWordClick = (index: number) => {
      setSelectedWordIndex(index === selectedWordIndex ? null : index);
    };

    // Organize words hierarchically based on their grammatical relationships
    const organizeHierarchically = () => {
      // Create a map of word nodes with their relationships
      const wordNodes = analysisData.words.map((word: any, index: number) => {
        return {
          id: index,
          word: word,
          level: null, // Will be set during hierarchy creation
          column: null, // Will be set during layout
          parents: [], // Words this word depends on
          children: [], // Words that depend on this word
          relationships: word.relationships || [],
        };
      });

      // Build the parent-child relationships between words
      wordNodes.forEach((node) => {
        (node.word.relationships || []).forEach((rel: any) => {
          if (
            rel.relatedWordIndex !== undefined &&
            wordNodes[rel.relatedWordIndex]
          ) {
            // Subject-verb relationships
            if (
              rel.type.includes("subject") &&
              node.word.partOfSpeech === "verb"
            ) {
              node.children.push(wordNodes[rel.relatedWordIndex]);
              wordNodes[rel.relatedWordIndex].parents.push(node);
            }
            // Verb-object relationships
            else if (
              rel.type.includes("object") &&
              node.word.partOfSpeech === "verb"
            ) {
              node.children.push(wordNodes[rel.relatedWordIndex]);
              wordNodes[rel.relatedWordIndex].parents.push(node);
            }
            // Adjective-noun relationships
            else if (
              rel.type.includes("adjective-noun") &&
              node.word.partOfSpeech === "adjective"
            ) {
              wordNodes[rel.relatedWordIndex].children.push(node);
              node.parents.push(wordNodes[rel.relatedWordIndex]);
            }
            // Adverb-verb relationships
            else if (
              rel.type.includes("adverb") &&
              node.word.partOfSpeech === "adverb"
            ) {
              wordNodes[rel.relatedWordIndex].children.push(node);
              node.parents.push(wordNodes[rel.relatedWordIndex]);
            }
            // Default handling for other relationships
            else {
              const targetPOS =
                wordNodes[rel.relatedWordIndex].word.partOfSpeech;
              // Nouns tend to dominate relationships
              if (targetPOS === "noun" && node.word.partOfSpeech !== "verb") {
                wordNodes[rel.relatedWordIndex].children.push(node);
                node.parents.push(wordNodes[rel.relatedWordIndex]);
              }
              // Verbs also tend to dominate
              else if (
                targetPOS === "verb" &&
                node.word.partOfSpeech !== "noun"
              ) {
                wordNodes[rel.relatedWordIndex].children.push(node);
                node.parents.push(wordNodes[rel.relatedWordIndex]);
              }
            }
          }
        });
      });

      // Find root words (words without parents or verbs)
      let rootNodes = wordNodes.filter(
        (node) => node.parents.length === 0 || node.word.partOfSpeech === "verb"
      );

      // If no clear roots, use the first word
      if (rootNodes.length === 0 && wordNodes.length > 0) {
        rootNodes = [wordNodes[0]];
      }

      // Assign levels to nodes starting from roots (level 0)
      const assignLevels = (node: any, level: number, visited = new Set()) => {
        // Avoid cycles
        if (visited.has(node.id)) return;
        visited.add(node.id);

        // Only update level if it's null or higher (deeper) than current assignment
        if (node.level === null || level < node.level) {
          node.level = level;
        }

        // Recursively assign levels to children
        node.children.forEach((child: any) => {
          assignLevels(child, level + 1, visited);
        });
      };

      // Start assigning levels from root nodes
      rootNodes.forEach((root) => {
        assignLevels(root, 0);
      });

      // Handle any remaining nodes without levels (assign default level)
      wordNodes.forEach((node) => {
        if (node.level === null) {
          node.level = 2; // Default level for disconnected nodes
        }
      });

      // Group nodes by level for layout calculation
      const nodesByLevel = new Map<number, any[]>();
      wordNodes.forEach((node) => {
        if (!nodesByLevel.has(node.level)) {
          nodesByLevel.set(node.level, []);
        }
        nodesByLevel.get(node.level)?.push(node);
      });

      // Assign columns for each level
      const nodesByLevelArray = Array.from(nodesByLevel.entries());
      for (const [level, nodes] of nodesByLevelArray) {
        nodes.sort((a, b) => {
          // Try to maintain original word order when possible
          return a.id - b.id;
        });

        // Assign column positions
        nodes.forEach((node, index) => {
          node.column = index;
        });
      }

      // Calculate screen positions for each node
      const levelHeight = 150; // Vertical spacing between levels
      const columnWidth = 150; // Horizontal spacing between columns
      const positions = wordNodes.map((node) => {
        // Get the maximum number of columns in this level for centering
        const columnsInLevel = nodesByLevel.get(node.level)?.length || 1;
        const levelWidth = columnsInLevel * columnWidth;
        const offsetX = (1200 - levelWidth) / 2; // Center within a 1200px space

        return {
          id: node.id,
          word: node.word,
          x: offsetX + node.column * columnWidth + columnWidth / 2,
          y: 80 + node.level * levelHeight,
          level: node.level,
          parents: node.parents.map((p) => p.id),
          children: node.children.map((c) => c.id),
        };
      });

      return {
        positions,
        rootNodes: rootNodes.map((n) => n.id),
        wordNodes,
      };
    };

    // Generate the hierarchical layout
    const layout = organizeHierarchically();
    const wordPositions = layout.positions;

    // For Focus Mode: Get all nodes related to the selected word
    const getRelatedNodeIds = () => {
      if (selectedWordIndex === null) return new Set<number>();

      const relatedIds = new Set<number>([selectedWordIndex]);

      // Add all directly related words
      analysisData.words[selectedWordIndex].relationships?.forEach(
        (rel: any) => {
          if (rel.relatedWordIndex !== undefined) {
            relatedIds.add(rel.relatedWordIndex);
          }
        }
      );

      // Add words that have a relationship to the selected word
      analysisData.words.forEach((word: any, idx: number) => {
        word.relationships?.forEach((rel: any) => {
          if (rel.relatedWordIndex === selectedWordIndex) {
            relatedIds.add(idx);
          }
        });
      });

      return relatedIds;
    };

    const relatedNodeIds = getRelatedNodeIds();

    // Check if a node should be dimmed in focus mode
    const shouldDimNode = (nodeId: number) => {
      if (!focusModeEnabled || selectedWordIndex === null) return false;
      return !relatedNodeIds.has(nodeId);
    };

    // Check if a relationship should be visible
    const isRelationshipHighlighted = (
      sourceId: number,
      targetId: number,
      type: string
    ) => {
      if (!highlightedRelationship) return false;
      return (
        highlightedRelationship.sourceIndex === sourceId &&
        highlightedRelationship.targetIndex === targetId &&
        highlightedRelationship.type === type
      );
    };

    // Function to get relationship type class
    const getRelationTypeClass = (relType: string): string => {
      if (relType.includes("subject")) return "verb-subject";
      if (relType.includes("object")) return "verb-object";
      if (relType.includes("adjective")) return "adjective-noun";
      if (relType.includes("adverb")) return "adverb-verb";
      return "relation-label";
    };

    // Function to get a short explanation of the relationship type
    const getRelationshipExplanation = (relType: string): string => {
      if (relType.includes("subject-verb"))
        return "Subject of the verb (nominative)";
      if (relType.includes("verb-subject")) return "Verb with this subject";
      if (relType.includes("object")) return "Direct object (accusative)";
      if (relType.includes("adjective-noun"))
        return "Adjective modifying the noun";
      if (relType.includes("adverb-verb")) return "Adverb modifying the verb";
      if (relType.includes("genitive"))
        return "Possessive relationship (genitive)";
      if (relType.includes("dative")) return "Indirect object (dative)";
      if (relType.includes("ablative"))
        return "Means, manner, or place (ablative)";
      return "Grammatical relationship";
    };

    return (
      <div className="p-4">
        {/* Controls for relationship view */}
        <div className="mb-4 flex flex-col gap-3">
          {/* Filter controls for relationship types */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/80 font-medium mr-1">
              Show relationships:
            </span>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visibleRelationTypes.includes("subject")
                  ? "bg-purple-300 text-gray-900 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => toggleRelationshipType("subject")}
              title="Toggle subject relationships"
            >
              Subjects
            </button>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visibleRelationTypes.includes("object")
                  ? "bg-blue-300 text-gray-900 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => toggleRelationshipType("object")}
              title="Toggle object relationships"
            >
              Objects
            </button>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visibleRelationTypes.includes("adjective")
                  ? "bg-amber-300 text-gray-900 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => toggleRelationshipType("adjective")}
              title="Toggle adjective relationships"
            >
              Adjectives
            </button>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visibleRelationTypes.includes("adverb")
                  ? "bg-lime-300 text-gray-900 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => toggleRelationshipType("adverb")}
              title="Toggle adverb relationships"
            >
              Adverbs
            </button>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visibleRelationTypes.includes("other")
                  ? "bg-gray-300 text-gray-900 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => toggleRelationshipType("other")}
              title="Toggle other relationships"
            >
              Other
            </button>
          </div>

          {/* Focus mode toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="focus-mode"
              checked={focusModeEnabled}
              onChange={(e) => setFocusModeEnabled(e.target.checked)}
              className="w-4 h-4 accent-yellow-400/80"
            />
            <label
              htmlFor="focus-mode"
              className="text-sm text-white/80 cursor-pointer"
            >
              Focus Mode
            </label>
            <span className="text-xs text-white/50 italic ml-1">
              (highlight related words when selected)
            </span>
          </div>

          {/* Toggle between traditional and interactive view */}
          {useInteractiveView ? (
            <button
              className="self-end text-sm text-white/80 bg-gray-700/50 hover:bg-gray-700/80 px-4 py-1.5 rounded-md transition-colors"
              onClick={() => setUseInteractiveView(false)}
            >
              Switch to Traditional View
            </button>
          ) : (
            <button
              className="self-end text-sm text-white/80 bg-gray-700/50 hover:bg-gray-700/80 px-4 py-1.5 rounded-md transition-colors"
              onClick={() => setUseInteractiveView(true)}
            >
              Switch to Interactive View
            </button>
          )}
        </div>

        {/* Relationship visualization */}
        {useInteractiveView ? (
          <div className="p-4 bg-gray-800/50 rounded-lg border border-white/10">
            {selectedWordIndex !== null && (
              <div className="mb-4 p-3 bg-gray-700/50 rounded-lg border border-white/10">
                <h3 className="text-white font-medium">
                  Selected Word: {analysisData.words[selectedWordIndex].word}
                </h3>
                <p className="text-white/80 text-sm">
                  is • {analysisData.words[selectedWordIndex].partOfSpeech}
                </p>
              </div>
            )}

            <InteractiveWordRelationships
              words={analysisData.words}
              activeWordIndex={selectedWordIndex}
              onWordClick={(index) => setSelectedWordIndex(index)}
              onWordHover={(index) => {
                // Optional hover behavior
              }}
            />
          </div>
        ) : (
          <div className="relative">
            <div
              className="relationship-viz"
              style={{
                width: "100%",
                height: "600px",
                overflow: "hidden",
                position: "relative",
                backgroundColor: "rgb(30, 41, 59, 0.5)",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <svg
                width="100%"
                height="100%"
                className="relationship-svg"
                onClick={(e) => {
                  // Clear selection on background click
                  if (e.target === e.currentTarget) {
                    setSelectedWordIndex(null);
                    setHighlightedRelationship(null);
                  }
                }}
              >
                {/* SVG Definitions for markers, filters and patterns */}
                <defs>
                  {/* Drop shadow filter */}
                  <filter
                    id="shadow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="3"
                      floodColor="rgba(255,255,255,0.3)"
                      floodOpacity="0.5"
                    />
                  </filter>

                  {/* Glow filter for highlighted nodes */}
                  <filter
                    id="glow"
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
                  >
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>

                  {/* Improved arrowheads for different relationship types */}
                  <marker
                    id="arrowhead-verb"
                    viewBox="0 0 12 12"
                    refX="9"
                    refY="6"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                  >
                    <path
                      d="M 0 0 L 12 6 L 0 12 L 4 6 Z"
                      fill="#c4b5fd"
                      stroke="#c4b5fd"
                      strokeWidth="0.5"
                    />
                  </marker>

                  <marker
                    id="arrowhead-noun"
                    viewBox="0 0 12 12"
                    refX="9"
                    refY="6"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                  >
                    <path
                      d="M 0 0 L 12 6 L 0 12 L 4 6 Z"
                      fill="#93c5fd"
                      stroke="#93c5fd"
                      strokeWidth="0.5"
                    />
                  </marker>

                  <marker
                    id="arrowhead-adjective"
                    viewBox="0 0 12 12"
                    refX="9"
                    refY="6"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                  >
                    <path
                      d="M 0 0 L 12 6 L 0 12 L 4 6 Z"
                      fill="#fcd34d"
                      stroke="#fcd34d"
                      strokeWidth="0.5"
                    />
                  </marker>

                  <marker
                    id="arrowhead-adverb"
                    viewBox="0 0 12 12"
                    refX="9"
                    refY="6"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                  >
                    <path
                      d="M 0 0 L 12 6 L 0 12 L 4 6 Z"
                      fill="#a3e635"
                      stroke="#a3e635"
                      strokeWidth="0.5"
                    />
                  </marker>
                </defs>

                {/* Background grid pattern */}
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.03)"
                    strokeWidth="1"
                  />
                </pattern>
                <rect
                  width="100%"
                  height="100%"
                  fill="url(#grid)"
                  onClick={() => {
                    setSelectedWordIndex(null);
                    setHighlightedRelationship(null);
                  }}
                />

                {/* Draw relationship connections */}
                {analysisData.words.flatMap((word, wordIndex) =>
                  word.relationships?.map((rel, relIndex) => {
                    if (
                      rel.relatedWordIndex === undefined ||
                      !visibleRelationTypes.some((type) =>
                        rel.type.toLowerCase().includes(type.toLowerCase())
                      )
                    ) {
                      return null;
                    }

                    const sourceNode = wordPositions[wordIndex];
                    const targetNode = wordPositions[rel.relatedWordIndex];

                    if (!sourceNode || !targetNode) {
                      return null;
                    }

                    const sourceX = sourceNode.x;
                    const sourceY = sourceNode.y;
                    const targetX = targetNode.x;
                    const targetY = targetNode.y;

                    // Calculate path with curved lines
                    const dx = targetX - sourceX;
                    const dy = targetY - sourceY;
                    const dr = Math.sqrt(dx * dx + dy * dy);

                    // Make the arc more pronounced for better readability
                    const arcFactor = 1.5;

                    // Create a curved path with larger radius for better visibility
                    const path = `M ${sourceX} ${sourceY} A ${dr * arcFactor} ${
                      dr * arcFactor
                    } 0 0 1 ${targetX} ${targetY}`;

                    // Determine styling based on relationship type
                    let color = "";
                    let strokeWidth = 2;
                    let dashArray = "";
                    let arrowMarker = "";

                    if (rel.type.includes("subject")) {
                      color = "#c4b5fd"; // Purple for subject relationships
                      dashArray = "";
                      strokeWidth = 3.5; // Increased thickness
                      arrowMarker = "url(#arrowhead-verb)";
                    } else if (rel.type.includes("object")) {
                      color = "#93c5fd"; // Blue for object relationships
                      dashArray = "";
                      strokeWidth = 3.5; // Increased thickness
                      arrowMarker = "url(#arrowhead-noun)";
                    } else if (rel.type.includes("adjective")) {
                      color = "#fcd34d"; // Amber for adjective relationships
                      dashArray = "5,3";
                      strokeWidth = 3.5; // Increased thickness
                      arrowMarker = "url(#arrowhead-adjective)";
                    } else if (rel.type.includes("adverb")) {
                      color = "#a3e635"; // Lime for adverb relationships
                      dashArray = "5,3";
                      strokeWidth = 3.5; // Increased thickness
                      arrowMarker = "url(#arrowhead-adverb)";
                    } else {
                      color = "#e5e7eb"; // Gray for other relationships
                      dashArray = "3,2";
                      strokeWidth = 3; // Increased thickness
                    }

                    // Check if relationship is dimmed in focus mode
                    const opacity =
                      focusModeEnabled &&
                      selectedWordIndex !== null &&
                      !(
                        relatedNodeIds.has(wordIndex) &&
                        relatedNodeIds.has(rel.relatedWordIndex)
                      )
                        ? 0.2
                        : 0.9; // Increased opacity for better visibility

                    // Check if this relationship is highlighted
                    const isHighlighted = isRelationshipHighlighted(
                      wordIndex,
                      rel.relatedWordIndex,
                      rel.type
                    );

                    return (
                      <g
                        key={`${wordIndex}-${relIndex}`}
                        className="relationship-group"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          // Toggle highlight on click
                          if (isHighlighted) {
                            setHighlightedRelationship(null);
                          } else {
                            setHighlightedRelationship({
                              sourceIndex: wordIndex,
                              targetIndex: rel.relatedWordIndex,
                              type: rel.type,
                            });
                          }
                        }}
                      >
                        {/* Path for interaction detection (invisible, wider) */}
                        <path
                          d={path}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={strokeWidth + 10}
                          className="pointer-events-auto"
                          onMouseEnter={() => {
                            // Set as highlighted on hover
                            setHighlightedRelationship({
                              sourceIndex: wordIndex,
                              targetIndex: rel.relatedWordIndex,
                              type: rel.type,
                            });
                          }}
                          onMouseLeave={() => {
                            // Only clear if not clicked
                            if (!isHighlighted) {
                              setHighlightedRelationship(null);
                            }
                          }}
                        />

                        {/* Visible relationship line */}
                        <path
                          d={path}
                          fill="none"
                          stroke={color}
                          strokeWidth={
                            isHighlighted ? strokeWidth + 1.5 : strokeWidth
                          }
                          strokeDasharray={dashArray}
                          markerEnd={arrowMarker}
                          className="pointer-events-none"
                          style={{
                            opacity,
                            transition: "all 0.3s ease",
                            filter: isHighlighted
                              ? "url(#shadow)"
                              : "drop-shadow(0 0 2px rgba(0,0,0,0.5))",
                          }}
                        />

                        {/* Path for text attachment - Add background for better readability */}
                        {isHighlighted && (
                          <path
                            d={path}
                            id={`text-path-bg-${wordIndex}-${relIndex}`}
                            fill="none"
                            stroke="rgba(20, 25, 40, 0.85)"
                            strokeWidth={14}
                            className="pointer-events-none"
                            strokeLinecap="round"
                          />
                        )}

                        <path
                          id={`text-path-${wordIndex}-${relIndex}`}
                          d={path}
                          fill="none"
                          stroke="none"
                          className="pointer-events-none"
                        />

                        {/* Relationship type label */}
                        <text
                          className="relationship-text pointer-events-none"
                          style={{
                            opacity: isHighlighted ? 1 : opacity + 0.1,
                            fontWeight: isHighlighted ? "bold" : "normal",
                          }}
                        >
                          <textPath
                            href={`#text-path-${wordIndex}-${relIndex}`}
                            startOffset="50%"
                            textAnchor="middle"
                            fill={isHighlighted ? "white" : color}
                            fontSize={isHighlighted ? "12" : "10"}
                          >
                            <tspan className={getRelationTypeClass(rel.type)}>
                              {rel.type}
                            </tspan>
                          </textPath>
                        </text>

                        {/* Enhanced explanation - only shown when highlighted */}
                        {isHighlighted && (
                          <foreignObject
                            x={(sourceX + targetX) / 2 - 150}
                            y={(sourceY + targetY) / 2 - 40}
                            width="300"
                            height="80"
                            className="pointer-events-none"
                          >
                            <div
                              className="bg-gray-800/90 p-3 rounded-md shadow-lg border border-white/20 text-sm text-white"
                              style={{ backdropFilter: "blur(4px)" }}
                            >
                              <div className="font-medium text-base mb-1">
                                {rel.type}
                              </div>
                              <div className="text-white/90">
                                {getRelationshipExplanation(rel.type)}
                              </div>
                              <div className="text-white/80 mt-1 font-medium">
                                {word.word} →{" "}
                                {analysisData.words[rel.relatedWordIndex].word}
                              </div>
                            </div>
                          </foreignObject>
                        )}
                      </g>
                    );
                  })
                )}
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Main render function with view selection and content
  return (
    <div className="animate-slide-in">
      {/* Debug info */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-white/40 mb-2">
          View: {view}, Words: {analysisData?.words?.length || 0}, Selected:{" "}
          {selectedWordIndex !== null ? selectedWordIndex : "none"}
        </div>
      )}

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
          {/* Part of speech filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/80 font-medium mr-1">
              Show parts of speech:
            </span>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visiblePartsOfSpeech.includes("noun")
                  ? "bg-blue-300/30 border border-blue-300 text-blue-200 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => togglePartOfSpeech("noun")}
              title="Show/hide nouns"
            >
              Nouns
            </button>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visiblePartsOfSpeech.includes("verb")
                  ? "bg-red-400/30 border border-red-400 text-red-200 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => togglePartOfSpeech("verb")}
              title="Show/hide verbs"
            >
              Verbs
            </button>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visiblePartsOfSpeech.includes("adjective")
                  ? "bg-amber-300/30 border border-amber-300 text-amber-200 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => togglePartOfSpeech("adjective")}
              title="Show/hide adjectives"
            >
              Adjectives
            </button>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visiblePartsOfSpeech.includes("adverb")
                  ? "bg-lime-300/30 border border-lime-300 text-lime-200 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => togglePartOfSpeech("adverb")}
              title="Show/hide adverbs"
            >
              Adverbs
            </button>
            <button
              className={`text-xs rounded-full px-3 py-1 ${
                visiblePartsOfSpeech.includes("preposition")
                  ? "bg-gray-300/30 border border-gray-300 text-gray-200 font-medium"
                  : "bg-gray-700/70 text-white/60"
              }`}
              onClick={() => togglePartOfSpeech("preposition")}
              title="Show/hide prepositions"
            >
              Prepositions
            </button>
          </div>

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

      {view === "tree" && (
        <div className="p-4">
          <div className="glass-panel p-6 overflow-auto">
            <div className="flex justify-center min-h-[400px]">
              <div className="flex flex-col items-center">
                {analysisData.words.map((word: any, idx: number) => (
                  <div key={idx} className="mb-8">
                    {renderWordInfo(word)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 glass-panel p-4">
        <div className="text-sm font-medium mb-2">
          Case & Word Type Color Legend
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-blue-300 mr-2"></span>
            Nominative (Subject)
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-amber-300 mr-2"></span>
            Accusative (Direct Object)
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-green-300 mr-2"></span>
            Genitive (Possession)
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-purple-300 mr-2"></span>
            Dative (Indirect Object)
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-rose-300 mr-2"></span>
            Ablative (By/With/From)
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-cyan-300 mr-2"></span>
            Vocative (Direct Address)
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-red-400 mr-2"></span>
            Verbs (All types)
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-lime-300 mr-2"></span>
            Adverbs
          </div>
        </div>
      </div>
    </div>
  );
}
