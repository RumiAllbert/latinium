import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnalysisResult, AnalyzedWord } from '../types/AnalysisResult';
import { analyzeLatin } from '../utils/directGeminiApi';
import FloatingSentencePopover from './FloatingSentencePopover';

type Cache = Record<number, AnalysisResult>;

interface Props {
  text: string;
  onWordFocus?: (payload: { sentenceIndex: number; analysis: AnalysisResult; wordIndex: number } | null) => void;
  onSentenceSelect?: (index: number, sentence: string, analysis?: AnalysisResult) => void;
}

function splitIntoSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[\.\!\?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : text ? [text] : [];
}

export default function SentenceHoverAnalyzer({ text, onWordFocus, onSentenceSelect }: Props) {
  const sentences = useMemo(() => splitIntoSentences(text), [text]);
  const [cache, setCache] = useState<Cache>({});
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);
  const [popoverHover, setPopoverHover] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const timersRef = useRef<Record<number, number>>({});
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => () => {
    Object.values(timersRef.current).forEach((id) => clearTimeout(id));
  }, []);

  useEffect(() => {
    setCache({});
    setHoveredIdx(null);
    setLoadingIdx(null);
    setActiveWordIdx(null);
  }, [text]);

  useEffect(() => {
    const onScroll = () => {
      if (hoveredIdx != null) updateAnchor(hoveredIdx);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [hoveredIdx]);

  const updateAnchor = (idx: number) => {
    const el = spanRefs.current[idx];
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchorRect({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height });
  };

  const requestAnalysis = (idx: number, content: string) => {
    if (cache[idx]) return;
    setLoadingIdx(idx);
    analyzeLatin(content, { stream: false })
      .then((res) => setCache((c) => ({ ...c, [idx]: res.result })))
      .catch(() => {})
      .finally(() => setLoadingIdx((v) => (v === idx ? null : v)));
  };

  const handleEnter = (idx: number, s: string) => {
    setHoveredIdx(idx);
    updateAnchor(idx);
    const id = window.setTimeout(() => requestAnalysis(idx, s), 150);
    timersRef.current[idx] = id;
  };

  const handleLeave = (idx: number) => {
    const t = timersRef.current[idx];
    if (t) clearTimeout(t);
    setTimeout(() => {
      if (!popoverHover) {
        setHoveredIdx((v) => (v === idx ? null : v));
        setActiveWordIdx(null);
        onWordFocus && onWordFocus(null);
      }
    }, 80);
  };

  const getRelatedIndices = (analysis: AnalysisResult, wordIdx: number): number[] => {
    if (!analysis?.words?.[wordIdx]) return [];
    const outward = analysis.words[wordIdx].relationships?.map((r) => r.relatedWordIndex) || [];
    const inward = analysis.words
      .map((w, i) => ({ i, rels: (w.relationships || []).filter((r) => r.relatedWordIndex === wordIdx) }))
      .filter((x) => x.rels.length > 0)
      .map((x) => x.i);
    return Array.from(new Set([...outward, ...inward]));
  };

  const renderSentence = (s: string, idx: number) => {
    const analysis = cache[idx];
    const isLoading = loadingIdx === idx;
    const isActive = hoveredIdx === idx;
    const words = analysis?.words || [];

    return (
      <span
        ref={(el) => (spanRefs.current[idx] = el)}
        className={`sentence-chunk ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
        onMouseEnter={() => handleEnter(idx, s)}
        onMouseLeave={() => handleLeave(idx)}
        onClick={() => onSentenceSelect && onSentenceSelect(idx, s, analysis)}
      >
        {words.length > 0 ? (
          <span className="sentence-words">
            {words.map((w: AnalyzedWord, i: number) => {
              const related = activeWordIdx !== null && analysis ? getRelatedIndices(analysis, activeWordIdx) : [];
              const isActiveWord = activeWordIdx === i;
              const isRelated = related.includes(i);
              return (
                <span
                  key={`w-${i}`}
                  className={`sentence-word ${isActiveWord ? 'word-active' : ''} ${isRelated ? 'word-related' : ''}`}
                  onMouseEnter={() => {
                    setActiveWordIdx(i);
                    if (onWordFocus && analysis) onWordFocus({ sentenceIndex: idx, analysis, wordIndex: i });
                  }}
                >
                  {(w.word || '').replace(/\s+/g, ' ')}
                </span>
              );
            })}
          </span>
        ) : (
          <>{s}</>
        )}
        {isLoading && <span className="ring" aria-hidden="true" />}
      </span>
    );
  };

  if (!text?.trim()) return null;

  return (
    <div className="mt-6">
      <div className="mb-2 text-sm" style={{ color: 'var(--muted)' }}>
        Hover a sentence to analyze it
      </div>
      <div className="sentence-container">
        {sentences.map((s, idx) => (
          <span key={`s-${idx}`}>
            {renderSentence(s, idx)}
            {idx < sentences.length - 1 && <span className="space"> </span>}
          </span>
        ))}
      </div>

      {hoveredIdx !== null && anchorRect && (
        <FloatingSentencePopover
          open={true}
          anchorRect={anchorRect}
          sentence={sentences[hoveredIdx]}
          analysis={cache[hoveredIdx]}
          activeWordIndex={activeWordIdx}
          setActiveWordIndex={setActiveWordIdx}
          onClose={() => { setHoveredIdx(null); setActiveWordIdx(null); onWordFocus && onWordFocus(null); }}
          onPin={() => onSentenceSelect && onSentenceSelect(hoveredIdx, sentences[hoveredIdx], cache[hoveredIdx])}
          onHoverWord={(i) => {
            const analysis = cache[hoveredIdx!];
            if (analysis && onWordFocus) onWordFocus({ sentenceIndex: hoveredIdx!, analysis, wordIndex: i });
          }}
          onHoverChange={setPopoverHover}
        />
      )}

      <style>{`
        .sentence-container { position: relative; line-height: 1.9; }
        .sentence-chunk { position: relative; display: inline-block; padding: 1px 2px; border-radius: 8px; transition: all .2s ease; cursor: pointer; }
        .sentence-chunk.active { background: color-mix(in oklab, var(--button) 60%, transparent); box-shadow: 0 1px 0 0 rgba(99,102,241,0.15) inset; }
        .ring { position: absolute; inset: -2px; border-radius: 10px; pointer-events: none; box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.25); animation: glow 1.6s ease-in-out infinite; }
        @keyframes glow { 0% { box-shadow: 0 0 0 0 rgba(99,102,241,.28), 0 0 12px 1px rgba(59,130,246,.12) inset; } 50% { box-shadow: 0 0 0 6px rgba(99,102,241,0), 0 0 18px 2px rgba(59,130,246,.2) inset; } 100% { box-shadow: 0 0 0 0 rgba(99,102,241,.28), 0 0 12px 1px rgba(59,130,246,.12) inset; }
        }
        .sentence-words { display: inline; }
        .sentence-word { position: relative; padding: 0 1px; border-radius: 6px; transition: background .12s ease, box-shadow .12s ease; }
        .sentence-word.word-active { outline: 1px solid color-mix(in oklab, var(--fg) 22%, transparent); box-shadow: 0 0 0 2px color-mix(in oklab, var(--fg) 10%, transparent) inset; }
        .sentence-word.word-related { background: color-mix(in oklab, #60a5fa 20%, transparent); }
      `}</style>
    </div>
  );
}

