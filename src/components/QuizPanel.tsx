import { useEffect, useState } from 'react';
import type { AnalysisResult } from '../types/AnalysisResult';
import type { QuizPayload } from '../types/Learning';
import { generateQuiz } from '../utils/learningApi';

interface Props {
  sentence: string | null;
  analysis?: AnalysisResult;
}

export default function QuizPanel({ sentence, analysis }: Props) {
  const [data, setData] = useState<QuizPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!sentence) { setData(null); setAnswers({}); setShowResults(false); return; }
    setLoading(true);
    generateQuiz(sentence, analysis)
      .then(r => setData(r.result))
      .finally(() => setLoading(false));
  }, [sentence, analysis]);

  if (!sentence) return <div className="muted">Pin a sentence to generate a mini-quiz.</div>;
  if (loading) return <div className="muted">Generating quiz…</div>;
  if (!data) return null;

  const score = data.questions.reduce((acc, q) => acc + ((answers[q.id] ?? -1) === q.correctIndex ? 1 : 0), 0);

  return (
    <div>
      <div className="muted mb-2">Sentence: {data.sentence}</div>
      <div className="flex flex-col gap-3">
        {data.questions.map((q, idx) => (
          <div key={q.id} className="q">
            <div className="q-title">{idx + 1}. {q.prompt}</div>
            <div className="opts">
              {q.options.map((o, i) => {
                const picked = answers[q.id] === i;
                const correct = i === q.correctIndex;
                const wrong = picked && showResults && !correct;
                const ok = picked && showResults && correct;
                return (
                  <button key={i} className={`opt ${picked ? 'picked' : ''} ${ok ? 'ok' : ''} ${wrong ? 'wrong' : ''}`} onClick={() => !showResults && setAnswers(prev => ({...prev, [q.id]: i}))}>
                    {o.text}
                  </button>
                );
              })}
            </div>
            {showResults && q.explanation && (
              <div className="exp">{q.explanation}</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        {!showResults ? (
          <button className="cta" onClick={() => setShowResults(true)}>Check answers</button>
        ) : (
          <div className="score">Score: {score}/{data.questions.length}</div>
        )}
        <button className="ghost" onClick={() => { setShowResults(false); setAnswers({}); }}>Reset</button>
      </div>

      <style>{`
        .muted { color: var(--muted); }
        .q { border: 1px solid var(--border); border-radius: 10px; padding: 10px; background: color-mix(in oklab, var(--button) 70%, transparent); }
        .q-title { font-weight: 600; margin-bottom: 8px; }
        .opts { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 6px; }
        .opt { padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-accent); text-align: left; }
        .opt.picked { outline: 2px solid color-mix(in oklab, var(--fg) 25%, transparent); }
        .opt.ok { background: rgba(34,197,94,.15); border-color: rgba(34,197,94,.35); }
        .opt.wrong { background: rgba(239,68,68,.15); border-color: rgba(239,68,68,.35); }
        .exp { margin-top: 6px; font-size: .9rem; color: #a78bfa; }
        .cta { padding: 6px 10px; border-radius: 8px; background: linear-gradient(135deg, #7dd3fc66, #a78bfa66); border: 1px solid var(--border); }
        .ghost { padding: 4px 8px; border-radius: 8px; background: var(--button); border: 1px solid var(--border); }
        .score { font-weight: 700; }
      `}</style>
    </div>
  );
}

