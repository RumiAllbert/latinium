export default function LaserFlow() {
  return (
    <div className="relative overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'linear-gradient(180deg, rgba(2,6,23,.6), rgba(2,6,23,.2))' }}>
      <div className="pointer-events-none absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <span key={i} className="absolute h-px w-[120%] -left-10 opacity-40 laser-line" style={{ top: `${(i+1)*10}%` }} />
        ))}
      </div>
      <div className="p-8 text-center">
        <div className="text-sm opacity-70">Laser Flow</div>
        <div className="font-serif text-2xl">Smooth data vibes for scholars</div>
      </div>
      <style>{`
        @keyframes sweep { from { transform: translateX(-10%) } to { transform: translateX(10%) } }
        .laser-line {
          background: linear-gradient(90deg, transparent, rgba(99,102,241,.7), transparent);
          animation: sweep 3.5s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
}

