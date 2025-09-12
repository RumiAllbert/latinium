import { useEffect, useState } from 'react';
import type { AnalysisResult } from '../types/AnalysisResult';
import type { TutorExplanation } from '../types/Learning';
import { explainSentence } from '../utils/learningApi';

interface Props {
  sentence: string | null;
  analysis?: AnalysisResult;
}

export default function TutorPanel({ sentence, analysis }: Props) {
  const [data, setData] = useState<TutorExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<number, { hint?: boolean; answer?: boolean }>>({});

  useEffect(() => {
    if (!sentence) { setData(null); setError(null); return; }
    setLoading(true); setError(null);
    explainSentence(sentence, analysis, 'basic')
      .then(r => setData(r.result))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [sentence, analysis]);

  if (!sentence) return <div className="muted">Pin a sentence to get a guided walk-through.</div>;
  if (loading) return <div className="muted">Building steps…</div>;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!data) return null;

  return (
    <div>
      {data.translation && (
        <div className="translation mb-3">
          <span className="label">Translation:</span>
          <span className="text">{data.translation}</span>
        </div>
      )}

      <div className="steps flex flex-col gap-3">
        {data.steps.map((s, i) => {
          const r = revealed[i] || {};
          return (
            <div key={i} className="step">
              <div className="step-title">{i+1}. {s.title}</div>
              <div className="step-prompt">{s.prompt}</div>
              <div className="row gap-2 mt-2">
                {s.hint && <button className="ghost" onClick={() => setRevealed(prev => ({...prev, [i]: {...prev[i], hint: !r.hint}}))}>{r.hint ? 'Hide' : 'Show'} hint</button>}
                {s.answer && <button className="ghost" onClick={() => setRevealed(prev => ({...prev, [i]: {...prev[i], answer: !r.answer}}))}>{r.answer ? 'Hide' : 'Show'} answer</button>}
              </div>
              {r.hint && s.hint && <div className="hint">{s.hint}</div>}
              {r.answer && s.answer && <div className="answer">{s.answer}</div>}
            </div>
          );
        })}
      </div>

      <style>{`
        .muted { color: var(--muted); }
        .translation { display:flex; gap:8px; align-items: baseline; }
        .translation .label { font-weight: 700; opacity: .8; }
        .step { border: 1px solid var(--border); border-radius: 10px; padding: 10px; background: color-mix(in oklab, var(--button) 70%, transparent); }
        .step-title { font-weight: 700; margin-bottom: 4px; }
        .step-prompt { opacity: .9; }
        .ghost { padding: 4px 8px; border-radius: 8px; background: var(--button); border: 1px solid var(--border); }
        .hint { margin-top: 6px; font-size: .9rem; color: #a78bfa; }
        .answer { margin-top: 6px; font-size: .9rem; color: #60a5fa; }
      `}</style>
    </div>
  );
}

