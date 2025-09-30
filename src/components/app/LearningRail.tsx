import { Children, useMemo, useState } from "react";

const LearningRail = ({ children }: { children: React.ReactNode }) => {
  const [active, setActive] = useState(0);
  const tabs = useMemo(() => ["Tutor", "Quiz", "Vocab", "Graph"], []);
  const items = useMemo(() => Children.toArray(children), [children]);

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}>
      <div className="flex gap-2 mb-3">
        {tabs.map((label, i) => (
          <button
            key={label}
            onClick={() => setActive(i)}
            className={`px-3 py-1 text-sm rounded-md border ${active === i ? "" : "opacity-70"}`}
            style={{ backgroundColor: active === i ? "var(--button-hover)" : "var(--button)", color: "var(--fg)", borderColor: "var(--border)" }}
          >
            {label}
          </button>
        ))}
      </div>
      <div>
        {items[active]}
      </div>
    </div>
  );
};

export default LearningRail;
