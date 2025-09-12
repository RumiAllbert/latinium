import { useEffect, useState } from 'react';
import type { AnalyzedWord } from '../types/AnalysisResult';

const KEY = 'latin_vocab_deck';

function loadDeck(): AnalyzedWord[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function saveDeck(deck: AnalyzedWord[]) {
  try { localStorage.setItem(KEY, JSON.stringify(deck)); } catch {}
}

interface Props {
  words?: AnalyzedWord[];
}

export default function VocabDeck({ words = [] }: Props) {
  const [deck, setDeck] = useState<AnalyzedWord[]>([]);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  useEffect(() => { setDeck(loadDeck()); }, []);
  useEffect(() => { saveDeck(deck); }, [deck]);

  const add = (w: AnalyzedWord, idx: number) => {
    setDeck((d) => (d.find(x => x.word === w.word && x.lemma === w.lemma) ? d : [...d, w]));
    setAdded((a) => ({ ...a, [idx]: true }));
  };
  const remove = (i: number) => setDeck(d => d.filter((_, idx) => idx !== i));

  return (
    <div>
      {words.length > 0 && (
        <div className="mb-3">
          <div className="label">Add from pinned sentence</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 6 }}>
            {words.map((w, i) => (
              <button key={i} className="add" onClick={() => add(w, i)} disabled={!!added[i]}>
                + {w.word} <span className="muted">({w.partOfSpeech})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="title">My Deck</div>
      {deck.length === 0 ? (
        <div className="muted">No saved words yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {deck.map((w, i) => (
            <div key={i} className="card">
              <div className="head">
                <div className="token">{w.word}</div>
                <div className="pos">{w.partOfSpeech}</div>
                <button className="ghost" onClick={() => remove(i)}>Remove</button>
              </div>
              {w.lemma && <div className="row"><span className="label">Lemma:</span><span>{w.lemma}</span></div>}
              {w.meaning?.short && <div className="row"><span className="label">Meaning:</span><span>{w.meaning.short}</span></div>}
              {w.morphology?.case && <div className="row"><span className="label">Case:</span><span>{w.morphology.case}</span></div>}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .muted { color: var(--muted); }
        .title { font-weight: 800; margin-bottom: 6px; }
        .add { padding: 6px 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--button); text-align: left; }
        .card { border: 1px solid var(--border); border-radius: 10px; padding: 10px; background: color-mix(in oklab, var(--button) 70%, transparent); }
        .head { display:flex; gap:8px; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .token { font-weight: 700; }
        .pos { font-size: .85rem; opacity: .75; border: 1px solid var(--border); padding: 2px 6px; border-radius: 6px; }
        .row { display:flex; gap:8px; align-items: baseline; }
        .label { width: 70px; opacity: .7; font-size: .85rem; }
        .ghost { padding: 4px 8px; border-radius: 8px; background: var(--button); border: 1px solid var(--border); }
      `}</style>
    </div>
  );
}

