import { useEffect, useRef } from 'react';

export default function TargetCursor() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.setProperty('--x', e.clientX + 'px');
      el.style.setProperty('--y', e.clientY + 'px');
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 z-10">
      <div className="absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-2xl" style={{ top: 'var(--y)', left: 'var(--x)', background: 'radial-gradient(circle, rgba(99,102,241,.35) 0%, rgba(56,189,248,.15) 60%, transparent 70%)' }} />
      <div className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ top: 'var(--y)', left: 'var(--x)', borderColor: 'var(--border)', boxShadow: '0 0 0 2px rgba(99,102,241,.25)' }} />
    </div>
  );
}

