export default function LogoLoop() {
  const logos = [
    { name: "Caesar", text: "CAESAR" },
    { name: "Cicero", text: "CICERO" },
    { name: "Virgil", text: "VIRGIL" },
    { name: "Ovid", text: "OVID" },
    { name: "Livy", text: "LIVY" },
  ];
  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--border)", background: "var(--bg-accent)" }}
    >
      <div className="flex animate-logo-loop whitespace-nowrap">
        {[...Array(3)].map((_, k) => (
          <div
            key={k}
            className="flex min-w-full items-center justify-around gap-4 sm:gap-6 lg:gap-8 py-3 sm:py-4"
          >
            {logos.map((l, i) => (
              <div key={`${k}-${i}`} className="text-white/70">
                <span className="font-serif text-base sm:text-lg lg:text-xl tracking-wider opacity-80">
                  {l.text}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes logo-loop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-logo-loop {
          animation: logo-loop 18s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-logo-loop {
            animation: logo-loop 36s linear infinite;
          }
        }
      `}</style>
    </div>
  );
}
