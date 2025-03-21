import React, { useEffect, useRef, useState } from "react";
import type { AnalyzedWord, WordRelationship } from "../types/AnalysisResult";

interface InteractiveWordRelationshipsProps {
  words: AnalyzedWord[];
  activeWordIndex?: number;
  onWordHover?: (index: number | null) => void;
  onWordClick?: (index: number) => void;
}

// Map of relationship types to colors for visual consistency
const RELATIONSHIP_COLORS = {
  subject: "#c4b5fd", // Purple
  object: "#93c5fd", // Blue
  adjective: "#fcd34d", // Amber
  adverb: "#a3e635", // Lime
  genitive: "#84d69b", // Green
  dative: "#a78bfa", // Purple
  ablative: "#f472b6", // Pink
  vocative: "#60a5fa", // Blue
  default: "#e5e7eb", // Gray
};

// Map of case types to colors for consistency with text analysis
const CASE_COLORS = {
  nominative: "#93c5fd", // Blue
  accusative: "#fcd34d", // Amber
  genitive: "#84d69b", // Green
  dative: "#a78bfa", // Purple
  ablative: "#f472b6", // Pink
  vocative: "#60a5fa", // Blue
  verb: "#f87171", // Red (verbs are always red)
  default: "#e5e7eb", // Gray
};

// Relationship type descriptions for the legend
const RELATIONSHIP_DESCRIPTIONS = {
  "subject-verb": "Subject of the verb (nominative)",
  "verb-subject": "Verb with this subject",
  object: "Direct object (accusative)",
  "adjective-noun": "Adjective modifying the noun",
  "adverb-verb": "Adverb modifying the verb",
  genitive: "Possessive relationship (genitive)",
  dative: "Indirect object (dative)",
  ablative: "Means, manner, or place (ablative)",
  vocative: "Direct address (vocative)",
  default: "Grammatical relationship",
};

export default function InteractiveWordRelationships({
  words,
  activeWordIndex,
  onWordHover,
  onWordClick,
}: InteractiveWordRelationshipsProps) {
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [relatedWords, setRelatedWords] = useState<number[]>([]);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [activeRelationships, setActiveRelationships] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to update related words when active or hovered word changes
  useEffect(() => {
    if (hoveredWordIndex !== null) {
      // Use hover state as priority
      updateRelatedWords(hoveredWordIndex);
    } else if (activeWordIndex !== undefined) {
      // Fall back to active word (from props)
      updateRelatedWords(activeWordIndex);
    } else {
      // Clear if nothing is active
      setRelatedWords([]);
      setActiveRelationships([]);
    }
  }, [hoveredWordIndex, activeWordIndex]);

  // Helper to find all related words for a given word index
  const updateRelatedWords = (wordIndex: number) => {
    if (!words[wordIndex]) return;

    const relationships = words[wordIndex].relationships || [];
    const relatedIndices = relationships.map((rel) => rel.relatedWordIndex);

    // Extract active relationship types
    const relationshipTypes = relationships.map((rel) => rel.type);

    // Find words that have relationships pointing to this word
    const incomingRelationships = words.flatMap((word, idx) => {
      const incoming = word.relationships.filter(
        (rel) => rel.relatedWordIndex === wordIndex
      );

      // Add these relationship types too
      incoming.forEach((rel) => relationshipTypes.push(rel.type));

      return incoming.map(() => idx);
    });

    // Combine both directions of relationships
    setRelatedWords([
      ...new Set([...relatedIndices, ...incomingRelationships]),
    ]);

    // Set active relationship types for highlighting in the legend
    setActiveRelationships([...new Set(relationshipTypes)]);
  };

  // Handle mouse events
  const handleMouseEnter = (index: number) => {
    setHoveredWordIndex(index);
    if (onWordHover) onWordHover(index);
  };

  const handleMouseLeave = () => {
    setHoveredWordIndex(null);
    if (onWordHover) onWordHover(null);
  };

  const handleWordClick = (index: number) => {
    if (onWordClick) onWordClick(index);
  };

  // Get relationship types between two words
  const getRelationshipTypes = (
    fromIndex: number,
    toIndex: number
  ): WordRelationship[] => {
    if (!words[fromIndex]) return [];

    return words[fromIndex].relationships.filter(
      (rel) => rel.relatedWordIndex === toIndex
    );
  };

  // Helper function to get color for a relationship type
  const getRelationshipColor = (type: string): string => {
    if (type.includes("subject")) return RELATIONSHIP_COLORS.subject;
    if (type.includes("object")) return RELATIONSHIP_COLORS.object;
    if (type.includes("adjective")) return RELATIONSHIP_COLORS.adjective;
    if (type.includes("adverb")) return RELATIONSHIP_COLORS.adverb;
    if (type.includes("genitive")) return RELATIONSHIP_COLORS.genitive;
    if (type.includes("dative")) return RELATIONSHIP_COLORS.dative;
    if (type.includes("ablative")) return RELATIONSHIP_COLORS.ablative;
    return RELATIONSHIP_COLORS.default;
  };

  // Get description for a relationship type
  const getRelationshipDescription = (type: string): string => {
    if (type.includes("subject-verb"))
      return RELATIONSHIP_DESCRIPTIONS["subject-verb"];
    if (type.includes("verb-subject"))
      return RELATIONSHIP_DESCRIPTIONS["verb-subject"];
    if (type.includes("object")) return RELATIONSHIP_DESCRIPTIONS.object;
    if (type.includes("adjective"))
      return RELATIONSHIP_DESCRIPTIONS["adjective-noun"];
    if (type.includes("adverb"))
      return RELATIONSHIP_DESCRIPTIONS["adverb-verb"];
    if (type.includes("genitive")) return RELATIONSHIP_DESCRIPTIONS.genitive;
    if (type.includes("dative")) return RELATIONSHIP_DESCRIPTIONS.dative;
    if (type.includes("ablative")) return RELATIONSHIP_DESCRIPTIONS.ablative;
    return RELATIONSHIP_DESCRIPTIONS.default;
  };

  // Determine if a word is related to the active/hovered word
  const isRelated = (index: number) =>
    relatedWords.includes(index) ||
    index === activeWordIndex ||
    index === hoveredWordIndex;

  // Get appropriate CSS classes for a word
  const getWordClasses = (index: number) => {
    const classes = ["latin-word"];

    if (index === hoveredWordIndex) {
      classes.push("hovered");
    } else if (index === activeWordIndex) {
      classes.push("active");
    }

    if (
      isRelated(index) &&
      index !== hoveredWordIndex &&
      index !== activeWordIndex
    ) {
      classes.push("related");
    }

    return classes.join(" ");
  };

  // Get the color for a word based on part of speech or case
  const getWordColor = (word: AnalyzedWord): string => {
    // Verbs are always red
    if (word.partOfSpeech?.toLowerCase() === "verb") {
      return CASE_COLORS.verb;
    }

    // For nouns, adjectives, and pronouns, use case-based coloring
    if (
      ["noun", "adjective", "pronoun"].includes(
        word.partOfSpeech?.toLowerCase() || ""
      )
    ) {
      const gramCase = word.morphology?.case?.toLowerCase();
      if (gramCase && CASE_COLORS[gramCase as keyof typeof CASE_COLORS]) {
        return CASE_COLORS[gramCase as keyof typeof CASE_COLORS];
      }
    }

    // Default coloring for other parts of speech
    return CASE_COLORS.default;
  };

  // Group words by parts of speech for better visual organization
  const groupedWords = words.reduce((groups, word, index) => {
    const pos = word.partOfSpeech || "unknown";
    if (!groups[pos]) groups[pos] = [];
    groups[pos].push({ word, index });
    return groups;
  }, {} as Record<string, { word: AnalyzedWord; index: number }[]>);

  // Order of parts of speech for display (verbs and nouns are most important)
  const posOrder = [
    "verb",
    "noun",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "interjection",
    "unknown",
  ];

  return (
    <div ref={containerRef} className="interactive-latin-text">
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm font-medium text-white/80">
          Interactive Word Relationships
        </div>
        <button
          className="text-xs text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded px-2 py-1"
          onClick={() => setShowLegend(!showLegend)}
        >
          {showLegend ? "Hide Legend" : "Show Legend"}
        </button>
      </div>

      {showLegend && (
        <div className="relationship-legend mb-4 bg-gray-800/50 p-2 rounded-md text-xs">
          <div className="text-white/80 mb-2 font-medium">
            Relationship Types:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
              <div
                key={type}
                className={`flex items-center p-1 rounded ${
                  activeRelationships.some((r) => r.includes(type))
                    ? "bg-gray-700/50 border border-white/10"
                    : ""
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="capitalize">
                  {type} {type === "default" ? "(other)" : ""}
                </span>
              </div>
            ))}
          </div>

          <div className="text-white/80 mt-3 mb-2 font-medium">
            Case Colors:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CASE_COLORS).map(([caseType, color]) => (
              <div key={caseType} className="flex items-center p-1 rounded">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="capitalize">
                  {caseType} {caseType === "default" ? "(other)" : ""}
                </span>
              </div>
            ))}
          </div>

          {hoveredWordIndex !== null && (
            <div className="mt-2 text-white/90 bg-gray-700/50 p-2 rounded">
              <span className="font-medium">Selected: </span>
              {words[hoveredWordIndex].word}
              <span className="text-white/60 ml-1">
                ({words[hoveredWordIndex].partOfSpeech}
                {words[hoveredWordIndex].morphology?.case &&
                  `, ${words[hoveredWordIndex].morphology.case}`}
                )
              </span>
            </div>
          )}
        </div>
      )}

      <div className="words-container">
        {posOrder.map((pos) => {
          if (!groupedWords[pos] || groupedWords[pos].length === 0) return null;

          return (
            <div key={pos} className="part-of-speech-group mb-4">
              <div className="pos-label text-xs text-white/60 mb-1 capitalize">
                {pos}s:
              </div>
              <div className="flex flex-wrap gap-2">
                {groupedWords[pos].map(({ word, index }) => (
                  <div
                    key={`word-${index}`}
                    className={getWordClasses(index)}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleWordClick(index)}
                    style={
                      {
                        "--word-color": getWordColor(word),
                        borderColor: isRelated(index)
                          ? getWordColor(word)
                          : "transparent",
                      } as React.CSSProperties
                    }
                  >
                    <span className="latin-word-text">
                      {word.word}
                      {word.morphology?.case && (
                        <span className="word-case-label">
                          {word.morphology.case.slice(0, 3)}
                        </span>
                      )}
                    </span>
                    <div className="relationship-info">
                      {isRelated(index) &&
                        index !== hoveredWordIndex &&
                        index !== activeWordIndex && (
                          <div className="relationship-markers">
                            {hoveredWordIndex !== null &&
                              getRelationshipTypes(hoveredWordIndex, index)
                                .length > 0 &&
                              getRelationshipTypes(hoveredWordIndex, index).map(
                                (rel, i) => (
                                  <span
                                    key={`rel-${i}`}
                                    className="relationship-type from-active"
                                    style={{
                                      color: getRelationshipColor(rel.type),
                                      borderColor: getRelationshipColor(
                                        rel.type
                                      ),
                                    }}
                                    title={getRelationshipDescription(rel.type)}
                                  >
                                    {rel.type} →
                                  </span>
                                )
                              )}

                            {hoveredWordIndex !== null &&
                              getRelationshipTypes(index, hoveredWordIndex)
                                .length > 0 &&
                              getRelationshipTypes(index, hoveredWordIndex).map(
                                (rel, i) => (
                                  <span
                                    key={`rel-to-${i}`}
                                    className="relationship-type to-active"
                                    style={{
                                      color: getRelationshipColor(rel.type),
                                      borderColor: getRelationshipColor(
                                        rel.type
                                      ),
                                    }}
                                    title={getRelationshipDescription(rel.type)}
                                  >
                                    ← {rel.type}
                                  </span>
                                )
                              )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual connection lines - rendered using SVG */}
      {relatedWords.length > 0 && hoveredWordIndex !== null && (
        <svg className="relationship-lines">
          <defs>
            <marker
              id="arrowhead-relationship"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
            </marker>
          </defs>

          {relatedWords.map((relatedIndex) => {
            // We don't render lines to self
            if (relatedIndex === hoveredWordIndex) return null;

            const fromRelationships = getRelationshipTypes(
              hoveredWordIndex,
              relatedIndex
            );
            const toRelationships = getRelationshipTypes(
              relatedIndex,
              hoveredWordIndex
            );

            return (
              <React.Fragment key={`line-${relatedIndex}`}>
                {fromRelationships.length > 0 &&
                  fromRelationships.map((rel, i) => (
                    <line
                      key={`from-${relatedIndex}-${i}`}
                      className="relationship-line from"
                      x1="50%"
                      y1="50%"
                      x2={`${relatedIndex > hoveredWordIndex ? "75%" : "25%"}`}
                      y2="50%"
                      style={{
                        stroke: getRelationshipColor(rel.type),
                        markerEnd: "url(#arrowhead-relationship)",
                      }}
                    />
                  ))}

                {toRelationships.length > 0 &&
                  toRelationships.map((rel, i) => (
                    <line
                      key={`to-${relatedIndex}-${i}`}
                      className="relationship-line to"
                      x1="50%"
                      y1="50%"
                      x2={`${relatedIndex > hoveredWordIndex ? "75%" : "25%"}`}
                      y2="50%"
                      style={{
                        stroke: getRelationshipColor(rel.type),
                        markerEnd: "url(#arrowhead-relationship)",
                      }}
                    />
                  ))}
              </React.Fragment>
            );
          })}
        </svg>
      )}

      <style>{`
        .interactive-latin-text {
          position: relative;
          padding: 1.5rem;
          margin: 1rem 0;
          background: rgba(30, 40, 60, 0.3);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .words-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          z-index: 2;
        }

        .part-of-speech-group {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          padding: 0.75rem;
        }

        .latin-word {
          display: inline-flex;
          position: relative;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid transparent;
          color: var(--word-color, white);
        }

        .latin-word:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .latin-word.active,
        .latin-word.hovered {
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          z-index: 3;
        }

        .latin-word.related {
          border-width: 2px;
          background: rgba(0, 0, 0, 0.3);
        }
        
        .word-case-label {
          font-size: 0.65rem;
          opacity: 0.8;
          margin-left: 4px;
          background: rgba(0, 0, 0, 0.4);
          padding: 2px 4px;
          border-radius: 3px;
          vertical-align: super;
        }

        .relationship-info {
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translate(-50%, -100%);
          min-width: 120px;
          z-index: 5;
          visibility: hidden;
          opacity: 0;
          transition: all 0.2s ease;
        }

        .latin-word.related:hover .relationship-info {
          visibility: visible;
          opacity: 1;
          transform: translate(-50%, -110%);
        }

        .relationship-markers {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(20, 25, 40, 0.9);
          border-radius: 4px;
          padding: 0.5rem;
          gap: 0.25rem;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .relationship-type {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          white-space: nowrap;
          background: rgba(0, 0, 0, 0.3);
          border-left: 3px solid;
        }

        .relationship-legend {
          backdrop-filter: blur(8px);
        }

        .relationship-lines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .relationship-line {
          stroke-width: 2;
          stroke-dasharray: 4 2;
          opacity: 0.7;
          transition: all 0.3s ease;
        }

        .relationship-line.from {
          stroke-dasharray: none;
        }

        .relationship-line.to {
          stroke-dasharray: 3 2;
        }
      `}</style>
    </div>
  );
}
