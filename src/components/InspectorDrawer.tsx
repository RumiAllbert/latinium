import { useEffect } from 'react';
import type { AnalysisResult, AnalyzedWord } from '../types/AnalysisResult';

interface Props {
  open: boolean;
  onClose: () => void;
  payload: { sentenceIndex: number; analysis: AnalysisResult; wordIndex: number } | null;
}

export default function InspectorDrawer({ open, onClose, payload }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const word: AnalyzedWord | null = payload?.analysis?.words?.[payload.wordIndex] || null;

  return (
    <div className={`inspector ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="header">
        <div className="title">Inspector</div>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {!word ? (
        <div className="empty">Hover a word to see details</div>
      ) : (
        <div className="content">
          <div className="word-row">
            <div className="token">{word.word}</div>
            <div className="pos">{word.partOfSpeech}</div>
          </div>
          {word.lemma && (
            <div className="row"><span className="label">Lemma:</span><span className="value">{word.lemma}</span></div>
          )}
          {word.meaning?.short && (
            <div className="row"><span className="label">Meaning:</span><span className="value">{word.meaning.short}</span></div>
          )}
          <div className="row"><span className="label">Morphology:</span>
            <div className="chips">
              {Object.entries(word.morphology || {}).map(([k,v]) => (
                v ? <span key={k} className="chip">{k}: {String(v)}</span> : null
              ))}
            </div>
          </div>
          {word.relationships?.length ? (
            <div className="section">
              <div className="section-title">Relationships</div>
              <div className="list">
                {word.relationships.map((r, i) => (
                  <div key={i} className="rel-item">
                    <span className="type">{r.type}</span>
                    <span className="arrow">→</span>
                    <span className="target">{payload.analysis.words[r.relatedWordIndex]?.word}</span>
                    {r.description && <div className="desc">{r.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {word.relatedWords && (
            <div className="section">
              <div className="section-title">Related Words</div>
              {word.relatedWords.synonyms?.length ? (
                <div className="row"><span className="label">Synonyms:</span><span className="value">{word.relatedWords.synonyms.join(', ')}</span></div>
              ) : null}
              {word.relatedWords.derivedForms?.length ? (
                <div className="row"><span className="label">Derived:</span><span className="value">{word.relatedWords.derivedForms.join(', ')}</span></div>
              ) : null}
              {word.relatedWords.usageExamples?.length ? (
                <div className="row"><span className="label">Examples:</span><span className="value italic">{word.relatedWords.usageExamples.join('; ')}</span></div>
              ) : null}
            </div>
          )}
        </div>
      )}

      <style>{`
        .inspector { position: fixed; top: 0; right: 0; height: 100vh; width: 360px; transform: translateX(100%); transition: transform .28s ease; background: var(--bg-accent); border-left: 1px solid var(--border); box-shadow: -8px 0 30px rgba(0,0,0,0.1); z-index: 50; display: flex; flex-direction: column; }
        .inspector.open { transform: translateX(0); }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--border); }
        .title { font-weight: 700; letter-spacing: .02em; }
        .close { background: var(--button); border: 1px solid var(--border); padding: 4px 8px; border-radius: 6px; }
        .content { padding: 12px; overflow: auto; }
        .empty { padding: 16px; color: var(--muted); }
        .word-row { display: flex; gap: 8px; align-items: baseline; margin-bottom: 8px; }
        .token { font-weight: 800; font-size: 1.25rem; }
        .pos { font-size: .85rem; opacity: .75; border: 1px solid var(--border); padding: 2px 6px; border-radius: 6px; }
        .row { display: flex; gap: 8px; margin: 6px 0; align-items: baseline; }
        .label { width: 84px; opacity: .7; font-size: .85rem; }
        .value { flex: 1; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { border: 1px solid var(--border); padding: 2px 6px; border-radius: 6px; font-size: .75rem; background: var(--button); }
        .section { margin-top: 12px; }
        .section-title { font-weight: 700; margin-bottom: 6px; opacity: .9; }
        .rel-item { padding: 6px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 6px; background: color-mix(in oklab, var(--button) 70%, transparent); }
        .rel-item .type { color: #a78bfa; font-weight: 600; }
        .rel-item .target { color: #60a5fa; font-weight: 600; }
        .rel-item .arrow { opacity: .6; margin: 0 6px; }
        .rel-item .desc { font-size: .8rem; opacity: .8; margin-top: 4px; }
      `}</style>
    </div>
  );
}

