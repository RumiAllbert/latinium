import React, { useEffect, useRef, useState } from "react";
import type { AnalyzedWord, WordRelationship } from "../types/AnalysisResult";

interface InteractiveWordRelationshipsProps {
  words: AnalyzedWord[];
  activeWordIndex?: number;
  onWordHover?: (index: number | null) => void;
  onWordClick?: (index: number) => void;
}

export default function InteractiveWordRelationships({
  words,
  activeWordIndex,
  onWordHover,
  onWordClick,
}: InteractiveWordRelationshipsProps) {
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [relatedWords, setRelatedWords] = useState<number[]>([]);
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
    }
  }, [hoveredWordIndex, activeWordIndex]);

  // Helper to find all related words for a given word index
  const updateRelatedWords = (wordIndex: number) => {
    if (!words[wordIndex]) return;

    const relationships = words[wordIndex].relationships || [];
    const relatedIndices = relationships.map((rel) => rel.relatedWordIndex);

    // Find words that have relationships pointing to this word
    const incomingRelationships = words.flatMap((word, idx) =>
      word.relationships
        .filter((rel) => rel.relatedWordIndex === wordIndex)
        .map(() => idx)
    );

    // Combine both directions of relationships
    setRelatedWords([
      ...new Set([...relatedIndices, ...incomingRelationships]),
    ]);
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

  return (
    <div ref={containerRef} className="interactive-latin-text">
      <div className="words-container">
        {words.map((word, index) => (
          <div
            key={`word-${index}`}
            className={getWordClasses(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleWordClick(index)}
          >
            <span className="latin-word-text">{word.word}</span>
            <div className="relationship-info">
              {isRelated(index) &&
                index !== hoveredWordIndex &&
                index !== activeWordIndex && (
                  <div className="relationship-markers">
                    {/* Show relationship types */}
                    {hoveredWordIndex !== null &&
                      getRelationshipTypes(hoveredWordIndex, index).length >
                        0 &&
                      getRelationshipTypes(hoveredWordIndex, index).map(
                        (rel, i) => (
                          <span
                            key={`rel-${i}`}
                            className="relationship-type from-active"
                          >
                            {rel.type} →
                          </span>
                        )
                      )}

                    {/* Show relationships from this word to the active word */}
                    {hoveredWordIndex !== null &&
                      getRelationshipTypes(index, hoveredWordIndex).length >
                        0 &&
                      getRelationshipTypes(index, hoveredWordIndex).map(
                        (rel, i) => (
                          <span
                            key={`rel-to-${i}`}
                            className="relationship-type to-active"
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

      {/* Visual connection lines - rendered using absolute positioning */}
      {relatedWords.length > 0 && hoveredWordIndex !== null && (
        <svg className="relationship-lines">
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
                {fromRelationships.length > 0 && (
                  <line
                    className="relationship-line from"
                    x1="50%"
                    y1="50%"
                    x2={`${relatedIndex > hoveredWordIndex ? "75%" : "25%"}`}
                    y2="50%"
                  />
                )}

                {toRelationships.length > 0 && (
                  <line
                    className="relationship-line to"
                    x1="50%"
                    y1="50%"
                    x2={`${relatedIndex > hoveredWordIndex ? "75%" : "25%"}`}
                    y2="50%"
                  />
                )}
              </React.Fragment>
            );
          })}
        </svg>
      )}

      <style jsx>{`
        .interactive-latin-text {
          position: relative;
          padding: 1rem;
          margin: 1rem 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .words-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          position: relative;
          z-index: 2;
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
        }

        .latin-word:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .latin-word.active,
        .latin-word.hovered {
          background: var(--primary-color, #deb887);
          color: #000;
          box-shadow: 0 0 10px rgba(222, 184, 135, 0.5);
          transform: translateY(-2px);
          z-index: 3;
        }

        .latin-word.related {
          border-color: var(--primary-color, #deb887);
          background: rgba(222, 184, 135, 0.15);
        }

        .relationship-info {
          position: absolute;
          top: 100%;
          left: 0;
          width: max-content;
          padding-top: 0.5rem;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s ease;
          z-index: 10;
        }

        .latin-word.related:hover .relationship-info {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .relationship-markers {
          background: rgba(0, 0, 0, 0.8);
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          display: flex;
          flex-direction: column;
          font-size: 0.8rem;
        }

        .relationship-type {
          white-space: nowrap;
          padding: 0.1rem 0;
        }

        .relationship-type.from-active {
          color: #add8e6;
        }

        .relationship-type.to-active {
          color: #90ee90;
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
          stroke: var(--primary-color, #deb887);
          stroke-width: 1.5;
          stroke-dasharray: 4;
          opacity: 0.6;
        }

        .relationship-line.from {
          stroke: #add8e6;
          animation: dash 20s linear infinite;
        }

        .relationship-line.to {
          stroke: #90ee90;
          animation: dash 20s linear infinite reverse;
        }

        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>
    </div>
  );
}
