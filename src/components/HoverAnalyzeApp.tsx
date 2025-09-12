import { useEffect, useMemo, useState } from 'react';
import SentenceHoverAnalyzer from './SentenceHoverAnalyzer';
import InspectorDrawer from './InspectorDrawer';

const CHAR_LIMIT = 500;

const EXAMPLES = [
  {
    label: 'Caesar',
    text: "Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae, nostra Galli appellantur.",
  },
  {
    label: 'Cicero',
    text: "Quousque tandem abutere, Catilina, patientia nostra? Quam diu etiam furor iste tuus nos eludet?",
  },
];

export default function HoverAnalyzeApp() {
  const [text, setText] = useState(EXAMPLES[1].text);
  const [chars, setChars] = useState(text.length);
  const [locked, setLocked] = useState(false);
  const [inspector, setInspector] = useState<{
    sentenceIndex: number; analysis: any; wordIndex: number
  } | null>(null);

  useEffect(() => { setChars(text.length); }, [text]);

  const onAnalyze = () => {
    if (!text.trim()) return;
    setLocked(true);
  };

  const onUnlock = () => {
    setLocked(false);
    setInspector(null);
  };

  const charState = useMemo(() => chars > CHAR_LIMIT ? 'error' : chars > CHAR_LIMIT * .85 ? 'warn' : 'ok', [chars]);

  return (
    <div className="hover-app glass-panel p-0 overflow-hidden">
      <div className="header px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="title text-xl font-serif font-semibold">Latin Analyzer</div>
        <div className="subtitle text-sm" style={{ color: 'var(--muted)' }}>
          Paste text, lock it, then hover sentences for instant breakdowns
        </div>
      </div>

      <div className="body p-5">
        <div className="input-wrap relative">
          <textarea
            className="glass-input w-full h-48 font-serif leading-relaxed resize-none"
            placeholder="Enter Latin text..."
            disabled={locked}
            value={text}
            onChange={(e) => e.target.value.length <= CHAR_LIMIT && setText(e.target.value)}
          />
          {locked && (
            <div className="lock-overlay">
              <div className="lock-inner">
                <span className="dot" /> Locked for hover analysis
              </div>
              <button className="glass-button small" onClick={onUnlock}>Edit text</button>
            </div>
          )}
          <div className={`char ${charState}`}>{chars}/{CHAR_LIMIT}</div>
        </div>

        <div className="actions mt-3 flex gap-2 items-center">
          {!locked ? (
            <button className="cta" onClick={onAnalyze}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Lock & Hover
            </button>
          ) : (
            <div className="hint">Hover a sentence below to analyze it</div>
          )}
          <div className="spacer" />
          <div className="examples flex gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex.label} className="example" onClick={() => { setText(ex.text); setLocked(false); }}>
                {ex.label} example
              </button>
            ))}
          </div>
        </div>

        {text && (
          <div className="hover-zone mt-6 p-4 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-accent)' }}>
            <div className="zone-title text-sm mb-2" style={{ color: 'var(--muted)' }}>
              Hover a sentence to analyze it
            </div>
            <div className={`zone ${locked ? 'ready' : 'disabled'}`}>
              <SentenceHoverAnalyzer text={locked ? text : ''} onWordFocus={(p) => setInspector(p)} />
              {!locked && (
                <div className="zone-cover">
                  <div className="cover-inner">Lock the text first</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <InspectorDrawer open={!!inspector} onClose={() => setInspector(null)} payload={inspector} />

      <style>{`
        .hover-app { position: relative; }
        .header .title { margin-bottom: 2px; }
        .input-wrap { position: relative; }
        .char { position: absolute; right: 10px; bottom: 8px; font-size: .75rem; color: var(--muted); }
        .char.warn { color: #f59e0b; }
        .char.error { color: #ef4444; font-weight: 600; }

        .lock-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; border-radius: 8px; background: linear-gradient(to bottom, color-mix(in oklab, var(--bg) 40%, transparent) 0%, transparent 30%); pointer-events: none; }
        .lock-inner { pointer-events: auto; display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; background: var(--bg-accent); border: 1px solid var(--border); }
        .lock-overlay .small { pointer-events: auto; }
        .dot { width: 8px; height: 8px; border-radius: 999px; background: #22c55e; box-shadow: 0 0 12px #22c55eaa; }
        .cta { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 8px; background: linear-gradient(135deg, #7dd3fc66, #a78bfa66); border: 1px solid var(--border); }
        .hint { color: var(--muted); font-size: .9rem; }
        .example { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--button); }
        .zone { position: relative; min-height: 60px; }
        .zone.disabled { filter: grayscale(1) opacity(.6); }
        .zone .zone-cover { position: absolute; inset: 0; display: grid; place-items: center; }
        .cover-inner { background: var(--bg-accent); border: 1px solid var(--border); padding: 6px 10px; border-radius: 6px; }
      `}</style>
    </div>
  );
}

