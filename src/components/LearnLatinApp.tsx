import { useState } from 'react';
import SentenceHoverAnalyzer from './SentenceHoverAnalyzer';
import TutorPanel from './TutorPanel';
import QuizPanel from './QuizPanel';
import VocabDeck from './VocabDeck';
import type { AnalysisResult } from '../types/AnalysisResult';

const CHAR_LIMIT = 500;

export default function LearnLatinApp() {
  const [text, setText] = useState('Quousque tandem abutere, Catilina, patientia nostra? Quam diu etiam furor iste tuus nos eludet?');
  const [locked, setLocked] = useState(false);
  const [pinned, setPinned] = useState<{ index: number; sentence: string; analysis?: AnalysisResult } | null>(null);
  const [wordFocus, setWordFocus] = useState<{ sentenceIndex: number; analysis: AnalysisResult; wordIndex: number } | null>(null);
  const [tab, setTab] = useState<'tutor' | 'quiz' | 'vocab'>('tutor');

  const onSentenceSelect = (index: number, sentence: string, analysis?: AnalysisResult) => {
    setPinned({ index, sentence, analysis });
  };

  return (
    <div className="workspace grid" style={{ gridTemplateColumns: '1.2fr .8fr', gap: '16px' }}>
      <div className="left glass-panel p-0 overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xl font-serif font-semibold">Study Workspace</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Lock the text, hover sentences, then pin one for tutoring/quiz.
          </div>
        </div>

        <div className="p-5">
          <div className="relative">
            <textarea className="glass-input w-full h-44 font-serif leading-relaxed resize-none" value={text} disabled={locked}
              onChange={(e) => e.target.value.length <= CHAR_LIMIT && setText(e.target.value)} />
            <div className="char">{text.length}/{CHAR_LIMIT}</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {!locked ? (
              <button className="cta" onClick={() => setLocked(true)}>Lock & Analyze</button>
            ) : (
              <>
                <div className="hint">Hover sentences below • Click to pin</div>
                <button className="ghost" onClick={() => { setLocked(false); setPinned(null); }}>Edit text</button>
              </>
            )}
          </div>

          <div className="mt-5 p-4 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-accent)' }}>
            <div className="text-sm mb-2" style={{ color: 'var(--muted)' }}>Hover a sentence to analyze • Click a sentence to pin it</div>
            <SentenceHoverAnalyzer text={locked ? text : ''} onWordFocus={setWordFocus} onSentenceSelect={onSentenceSelect as any} />
            {!locked && <div className="muted">Lock the text to enable analysis.</div>}
            {pinned && (
              <div className="mt-3 pinned">
                <div className="label">Pinned sentence</div>
                <div className="bubble">{pinned.sentence}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="right glass-panel p-0 overflow-hidden">
        <div className="tabs">
          <button className={`tab ${tab==='tutor'?'active':''}`} onClick={() => setTab('tutor')}>Tutor</button>
          <button className={`tab ${tab==='quiz'?'active':''}`} onClick={() => setTab('quiz')}>Quiz</button>
          <button className={`tab ${tab==='vocab'?'active':''}`} onClick={() => setTab('vocab')}>Vocab</button>
          <div className="bar" style={{ transform: `translateX(${tab==='tutor'?0:tab==='quiz'?100:200}%)` }} />
        </div>
        <div className="panel p-4">
          {tab==='tutor' && <TutorPanel sentence={pinned?.sentence || null} analysis={pinned?.analysis} />}
          {tab==='quiz' && <QuizPanel sentence={pinned?.sentence || null} analysis={pinned?.analysis} />}
          {tab==='vocab' && <VocabDeck words={pinned?.analysis?.words} />}
        </div>
      </div>

      <style>{`
        .workspace { align-items: start; }
        .char { position: absolute; right: 10px; bottom: 8px; font-size: .75rem; color: var(--muted); }
        .cta { padding: 8px 12px; border-radius: 8px; background: linear-gradient(135deg, #7dd3fc66, #a78bfa66); border: 1px solid var(--border); }
        .ghost { padding: 6px 10px; border-radius: 8px; background: var(--button); border: 1px solid var(--border); }
        .hint { color: var(--muted); font-size: .9rem; }
        .pinned .label { font-size: .8rem; color: var(--muted); margin-bottom: 4px; }
        .bubble { border: 1px solid var(--border); padding: 6px 10px; border-radius: 8px; background: var(--bg-accent); }
        .muted { color: var(--muted); }
        .tabs { display: grid; grid-template-columns: repeat(3, 1fr); position: relative; border-bottom: 1px solid var(--border); }
        .tab { text-align: center; padding: 10px; cursor: pointer; color: var(--muted); background: transparent; border: none; }
        .tab.active { color: var(--fg); font-weight: 700; }
        .bar { position: absolute; bottom: -1px; left: 0; width: 33.333%; height: 2px; background: linear-gradient(90deg,#7dd3fc,#a78bfa); transition: transform .25s ease; }
      `}</style>
    </div>
  );
}
