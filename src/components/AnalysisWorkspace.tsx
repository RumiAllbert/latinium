import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Unlock,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  FolderOpenDot,
} from "lucide-react";
import SentenceHoverAnalyzer from "./SentenceHoverAnalyzer";
import InspectorDrawer from "./InspectorDrawer";
import TutorPanel from "./TutorPanel";
import QuizPanel from "./QuizPanel";
import VocabDeck from "./VocabDeck";
import type { AnalysisResult } from "../types/AnalysisResult";
import SentenceNavigator from "./SentenceNavigator";

const CHAR_LIMIT = 800;

const samples = [
  {
    label: "Caesar",
    text: "Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae, nostra Galli appellantur.",
  },
  {
    label: "Cicero",
    text: "Quousque tandem abutere, Catilina, patientia nostra? Quam diu etiam furor iste tuus nos eludet?",
  },
  {
    label: "Virgil",
    text: "Arma virumque cano, Troiae qui primus ab oris Italiam, fato profugus, Laviniaque venit litora.",
  },
];

export default function AnalysisWorkspace() {
  const [text, setText] = useState(samples[0].text);
  const [locked, setLocked] = useState(false);
  const [pinned, setPinned] = useState<{
    index: number;
    sentence: string;
    analysis?: AnalysisResult;
  } | null>(null);
  const [tab, setTab] = useState<"tutor" | "quiz" | "vocab">("tutor");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusPayload, setFocusPayload] = useState<{
    sentenceIndex: number;
    analysis: AnalysisResult;
    wordIndex: number;
  } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sentences = useMemo(() => splitIntoSentences(text), [text]);

  const onSentenceSelect = useCallback(
    (index: number, sentence: string, analysis?: AnalysisResult) => {
      setPinned({ index, sentence, analysis });
      setTab("tutor");
    },
    []
  );

  // Update active sentence from word focus
  useEffect(() => {
    if (focusPayload?.sentenceIndex != null) {
      setActiveIndex(focusPayload.sentenceIndex);
    }
  }, [focusPayload]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (!locked) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => nextIndex(i, sentences.length));
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => prevIndex(i, sentences.length));
      }
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        const idx = activeIndex ?? 0;
        const s = sentences[idx] || "";
        if (s) onSentenceSelect(idx, s, focusPayload?.analysis);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, sentences, activeIndex, onSentenceSelect, focusPayload]);

  const pinnedIndex = pinned?.index ?? null;

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "320px 1fr 380px" }}
    >
      {/* Left column: Input + Navigator */}
      <motion.aside
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-panel h-full overflow-hidden"
      >
        <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-serif text-lg font-semibold">Text</div>
              <div className="text-xs opacity-70">Paste or select a sample</div>
            </div>
            <div className="flex items-center gap-2">
              {!locked ? (
                <button
                  className="glass-button"
                  onClick={() => setLocked(true)}
                  aria-label="Lock text"
                >
                  <Lock className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className="glass-button"
                  onClick={() => {
                    setLocked(false);
                    setPinned(null);
                  }}
                  aria-label="Unlock text"
                >
                  <Unlock className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {samples.map((s) => (
              <button
                key={s.label}
                className="rounded-md border px-2 py-1 text-sm opacity-90 transition hover:opacity-100"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--button)",
                }}
                onClick={() => !locked && setText(s.text)}
              >
                <FolderOpenDot className="mr-1 inline-block h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
          <div className="relative mt-3">
            <textarea
              className={`glass-input h-40 w-full resize-none font-serif leading-relaxed ${
                text.length > CHAR_LIMIT
                  ? "textarea-error"
                  : text.length > CHAR_LIMIT * 0.9
                  ? "textarea-warning"
                  : ""
              }`}
              value={text}
              disabled={locked}
              onChange={(e) =>
                e.target.value.length <= CHAR_LIMIT && setText(e.target.value)
              }
              placeholder="Paste Latin text here…"
            />
            <div className="pointer-events-none absolute bottom-2 right-2 text-xs opacity-70">
              {text.length}/{CHAR_LIMIT}
            </div>
          </div>
        </div>
        <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm opacity-80">Sentence Navigator</div>
            <div className="flex items-center gap-1 text-xs opacity-60">
              <Keyboard className="h-3.5 w-3.5" /> j/k to move, p to pin
            </div>
          </div>
          <SentenceNavigator
            text={locked ? text : ""}
            hoveredIndex={activeIndex}
            loadingIndex={null}
            pinnedIndex={pinnedIndex}
            activeIndex={activeIndex}
            onJump={(i) => setActiveIndex(i)}
          />
        </div>
      </motion.aside>

      {/* Center column: Analyzer */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="glass-panel relative min-h-[540px] p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="font-serif text-lg font-semibold">
            Sentence Explorer
          </div>
          <div className="flex items-center gap-2 text-xs opacity-70">
            <Wand2 className="h-4 w-4" /> Hover to analyze • Click to pin
          </div>
        </div>
        {/* POS Legend */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] opacity-80">
          <span
            className="rounded-full border px-2 py-0.5"
            style={{ borderColor: "var(--border)", color: "#60a5fa" }}
          >
            noun
          </span>
          <span
            className="rounded-full border px-2 py-0.5"
            style={{ borderColor: "var(--border)", color: "#ef4444" }}
          >
            verb
          </span>
          <span
            className="rounded-full border px-2 py-0.5"
            style={{ borderColor: "var(--border)", color: "#f59e0b" }}
          >
            adjective
          </span>
          <span
            className="rounded-full border px-2 py-0.5"
            style={{ borderColor: "var(--border)", color: "#22c55e" }}
          >
            adverb
          </span>
          <span
            className="rounded-full border px-2 py-0.5"
            style={{ borderColor: "var(--border)", color: "#a78bfa" }}
          >
            pronoun
          </span>
          <span
            className="rounded-full border px-2 py-0.5"
            style={{ borderColor: "var(--border)", color: "#f472b6" }}
          >
            preposition
          </span>
          <span
            className="rounded-full border px-2 py-0.5"
            style={{ borderColor: "var(--border)", color: "#06b6d4" }}
          >
            conjunction
          </span>
        </div>
        {!locked ? (
          <div className="flex h-[460px] items-center justify-center text-center opacity-80">
            <div>
              <div className="text-sm">
                Lock the text to enable live analysis
              </div>
              <div className="mt-2 text-xs">
                We analyze at the sentence level for speed and clarity
              </div>
            </div>
          </div>
        ) : (
          <div>
            <SentenceHoverAnalyzer
              text={text}
              onWordFocus={(p) => {
                setFocusPayload(p);
                setDrawerOpen(!!p);
              }}
              onSentenceSelect={onSentenceSelect as any}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/5 to-transparent" />
          </div>
        )}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button
            className="glass-button ml-2 hidden rounded-full p-2 md:inline-flex"
            onClick={() =>
              setActiveIndex((i) => prevIndex(i, sentences.length))
            }
            aria-label="Previous sentence"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            className="glass-button mr-2 hidden rounded-full p-2 md:inline-flex"
            onClick={() =>
              setActiveIndex((i) => nextIndex(i, sentences.length))
            }
            aria-label="Next sentence"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.section>

      {/* Right column: Tutor/Quiz/Vocab */}
      <motion.aside
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-panel overflow-hidden"
      >
        <div className="border-b" style={{ borderColor: "var(--border)" }}>
          <div className="relative grid grid-cols-3">
            {(["tutor", "quiz", "vocab"] as const).map((t) => (
              <button
                key={t}
                className={`px-3 py-2 text-sm ${
                  tab === t ? "font-semibold opacity-100" : "opacity-70"
                }`}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
            <div
              className="absolute bottom-0 h-0.5 w-1/3 bg-gradient-to-r from-sky-400 to-violet-400 transition-transform"
              style={{
                transform: `translateX(${
                  tab === "tutor" ? 0 : tab === "quiz" ? 100 : 200
                }%)`,
              }}
            />
          </div>
        </div>
        <div className="p-4">
          {tab === "tutor" && (
            <TutorPanel
              sentence={pinned?.sentence || null}
              analysis={pinned?.analysis}
            />
          )}
          {tab === "quiz" && (
            <QuizPanel
              sentence={pinned?.sentence || null}
              analysis={pinned?.analysis}
            />
          )}
          {tab === "vocab" && <VocabDeck words={pinned?.analysis?.words} />}
          {!pinned && (
            <div className="mt-2 text-sm opacity-70">
              Pin a sentence to begin.
            </div>
          )}
        </div>
      </motion.aside>

      <InspectorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        payload={focusPayload}
      />
    </div>
  );
}

function splitIntoSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[\.\!\?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : text ? [text] : [];
}

function nextIndex(i: number | null, len: number): number {
  if (len === 0) return 0;
  if (i == null) return 0;
  return Math.min(i + 1, len - 1);
}

function prevIndex(i: number | null, len: number): number {
  if (len === 0) return 0;
  if (i == null) return 0;
  return Math.max(i - 1, 0);
}
