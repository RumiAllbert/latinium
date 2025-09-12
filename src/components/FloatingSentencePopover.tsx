import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Pin, X } from 'lucide-react';
import type { AnalysisResult, AnalyzedWord } from '../types/AnalysisResult';

type Rect = { top: number; left: number; width: number; height: number };

export default function FloatingSentencePopover({
  open,
  anchorRect,
  sentence,
  analysis,
  activeWordIndex,
  setActiveWordIndex,
  onClose,
  onPin,
  onHoverWord,
  onHoverChange,
}: {
  open: boolean;
  anchorRect: Rect | null;
  sentence: string;
  analysis: AnalysisResult | null;
  activeWordIndex: number | null;
  setActiveWordIndex: (i: number | null) => void;
  onClose: () => void;
  onPin: () => void;
  onHoverWord?: (index: number) => void;
  onHoverChange?: (hovering: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !anchorRect || !cardRef.current) return;
    const card = cardRef.current;
    const rect = anchorRect;
    // Default to top, flip if not enough space
    const estimatedHeight = card.offsetHeight || 220;
    const topSpace = rect.top;
    setPlacement(topSpace > estimatedHeight + 16 ? 'top' : 'bottom');
  }, [open, anchorRect]);

  if (!mounted || !open || !anchorRect) return null;

  const centerX = anchorRect.left + anchorRect.width / 2;
  const baseTop = placement === 'top' ? anchorRect.top - 8 : anchorRect.top + anchorRect.height + 8;

  const words: AnalyzedWord[] = analysis?.words || [];
  const translation = (analysis as any)?.sentences?.[0]?.translation;

  const getPosColor = (pos?: string) => {
    const p = (pos || '').toLowerCase();
    if (p.includes('verb')) return '#ef4444';
    if (p.includes('noun')) return '#60a5fa';
    if (p.includes('adject')) return '#f59e0b';
    if (p.includes('adverb')) return '#22c55e';
    if (p.includes('pronoun')) return '#a78bfa';
    if (p.includes('prep')) return '#f472b6';
    if (p.includes('conj')) return '#06b6d4';
    return '#94a3b8';
  };

  const handleMouse = (hovering: boolean) => {
    onHoverChange && onHoverChange(hovering);
  };

  return createPortal(
    <motion.div
      ref={cardRef}
      onMouseEnter={() => handleMouse(true)}
      onMouseLeave={() => handleMouse(false)}
      initial={{ opacity: 0, y: placement === 'top' ? -8 : 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: placement === 'top' ? -8 : 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="z-[60]" // ensure on top
      style={{
        position: 'absolute',
        top: baseTop,
        left: centerX,
        transform: `translate(-50%, ${placement === 'top' ? '-100%' : '0'})`,
      }}
    >
      <div className="relative rounded-xl border backdrop-blur"
           style={{ borderColor: 'var(--border)', background: 'color-mix(in oklab, var(--panel) 90%, transparent)' }}>
        <div className="pointer-events-none absolute -inset-0.5 rounded-xl opacity-40"
             style={{ background: 'radial-gradient(120px 30px at 50% 0%, rgba(99,102,241,.25), transparent 70%)' }} />
        <div className="relative max-w-[640px] min-w-[380px] p-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] uppercase tracking-wide opacity-60">Sentence</div>
              <div className="font-serif text-[15px] leading-relaxed opacity-95">{sentence}</div>
              {translation && (
                <div className="mt-1 text-[13px] italic opacity-75">{translation}</div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                className="glass-button h-8 rounded-md px-2 text-xs"
                onClick={onPin}
                title="Pin to workspace"
              >
                <Pin className="mr-1 inline-block h-3.5 w-3.5" /> Pin
              </button>
              <button className="glass-button h-8 rounded-md px-2" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Words grid */}
          <div className="grid grid-cols-2 gap-2">
            {words.map((w, i) => {
              const hue = getPosColor(w.partOfSpeech);
              const active = activeWordIndex === i;
              return (
                <button
                  key={i}
                  className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left transition ${active ? 'ring-1' : ''}`}
                  style={{ borderColor: 'var(--border)', background: 'var(--button)' }}
                  onMouseEnter={() => {
                    setActiveWordIndex(i);
                    onHoverWord && onHoverWord(i);
                  }}
                  onFocus={() => setActiveWordIndex(i)}
                >
                  <div>
                    <div className="font-semibold leading-tight" style={{ color: hue }}>{w.word}</div>
                    <div className="mt-0.5 text-[12px] opacity-70">{w.lemma || w.partOfSpeech}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full border px-2 py-0.5 text-[11px]" style={{ borderColor: hue, color: hue }}>
                      {w.partOfSpeech}
                    </span>
                    {w?.morphology?.case && (
                      <span className="rounded-full border px-2 py-0.5 text-[11px] opacity-80" style={{ borderColor: 'var(--border)' }}>
                        {w.morphology.case}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Relationships for the active word */}
          {activeWordIndex != null && words[activeWordIndex] && (
            <div className="mt-2 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
              <div className="mb-1 text-[12px] uppercase tracking-wide opacity-60">Relationships</div>
              <div className="flex flex-wrap gap-1.5">
                {(words[activeWordIndex].relationships || []).map((r, j) => {
                  const t = words[r.relatedWordIndex]?.word || '?';
                  return (
                    <span key={j} className="rounded-full border px-2 py-1 text-[12px]"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg-accent)' }}>
                      <span className="opacity-80">{r.type}</span>
                      <span className="mx-1 opacity-50">→</span>
                      <span className="font-semibold opacity-90">{t}</span>
                    </span>
                  );
                })}
                {!(words[activeWordIndex].relationships || []).length && (
                  <span className="text-[12px] opacity-60">No explicit relationships found</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

