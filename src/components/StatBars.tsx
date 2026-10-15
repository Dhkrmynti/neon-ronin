import type { Stats } from "../art/ronin";

const COLOR: Record<string, string> = { Power: "var(--pink)", Defense: "var(--cyan)", Honor: "var(--yellow)", Stealth: "var(--violet)" };

export function StatBars({ stats }: { stats: Stats }) {
  return (
    <dl className="stats">
      {Object.entries(stats).map(([k, v]) => (
        <div key={k} className="stat">
          <dt>{k}</dt>
          <dd>
            <span className="meter">
              <i style={{ width: `${v}%`, background: COLOR[k] }} />
            </span>
            <b>{v}</b>
          </dd>
        </div>
      ))}
    </dl>
  );
}
