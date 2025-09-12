import { useEffect, useRef } from 'react';

export default function GradualBlur({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) el.classList.add('blur-in');
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="gradual-blur">
      {children}
      <style>{`
        .gradual-blur { filter: blur(8px); opacity: .2; transform: translateY(12px); transition: filter .8s, opacity .8s, transform .8s; }
        .gradual-blur.blur-in { filter: blur(0px); opacity: 1; transform: translateY(0); }
      `}</style>
    </div>
  );
}

