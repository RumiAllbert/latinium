import { useMemo } from 'react';
import { CheckCircle2, Circle, Loader2, Pin } from 'lucide-react';

export type SentenceStatus = 'idle' | 'loading' | 'ready';

export default function SentenceNavigator({
  text,
  hoveredIndex,
  loadingIndex,
  pinnedIndex,
  activeIndex,
  onJump,
}: {
  text: string;
  hoveredIndex: number | null;
  loadingIndex: number | null;
  pinnedIndex: number | null;
  activeIndex: number | null;
  onJump: (index: number) => void;
}) {
  const sentences = useMemo(() => splitIntoSentences(text), [text]);

  return (
    <div className="flex flex-col gap-1">
      {sentences.map((s, i) => {
        const status: SentenceStatus = loadingIndex === i ? 'loading' : hoveredIndex === i || pinnedIndex === i ? 'ready' : 'idle';
        const isActive = activeIndex === i;
        const isPinned = pinnedIndex === i;
        return (
          <button
            key={i}
            className={`group flex w-full items-start gap-2 rounded-md border p-2 text-left transition ${
              isActive ? 'ring-1' : ''
            }`}
            style={{ borderColor: 'var(--border)', background: isActive ? 'var(--button)' : 'transparent' }}
            onClick={() => onJump(i)}
          >
            <span className="mt-0.5 h-5 w-5 flex-none">
              {status === 'loading' ? (
                <Loader2 className="h-5 w-5 animate-spin opacity-70" />
              ) : status === 'ready' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 opacity-40" />
              )}
            </span>
            <span className="line-clamp-2 flex-1 font-serif leading-relaxed opacity-90">{s}</span>
            {isPinned && (
              <span className="flex h-5 w-5 items-center justify-center opacity-80"><Pin className="h-4 w-4" /></span>
            )}
          </button>
        );
      })}
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

