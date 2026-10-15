import { useEffect, useMemo, useRef, useState } from "react";
import type { Clan } from "../art/ronin";
import { CLAN_INFO, CLAN_NAMES, REVEALED, SUPPLY, TOKENS, imageUrl, metaUrl, pad, type Token } from "../lib/roster";
import { gsap, MOTION_OK, ScrollTrigger, scrollToSection, useGSAP } from "../lib/motion";
import { StatBars } from "../components/StatBars";
import { Edge } from "../components/Edge";
import { ARMORY_EVENT } from "./Armory";

const PAGE = 24;
const TRAIT_KEYS = ["Background", "Armor", "Head", "Eyes", "Neon", "Helmet", "Mask", "Weapon", "Accessory", "Mon"] as const;
// Deterministic tilt per poster, so the wall looks hand-pasted but never reshuffles.
const tilt = (id: number) => (((id * 37) % 9) - 4) * 0.7;

function Dossier({ token, list, onPick, onClose }: { token: Token | null; list: Token[]; onPick(t: Token): void; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current!;
    if (token && !d.open) d.showModal();
    if (!token && d.open) d.close();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const key = (e: KeyboardEvent) => {
      const i = list.findIndex((t) => t.id === token.id);
      if (e.key === "ArrowRight") onPick(list[(i + 1) % list.length]);
      if (e.key === "ArrowLeft") onPick(list[(i - 1 + list.length) % list.length]);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [token, list, onPick]);

  const step = (d: number) => {
    if (!token) return;
    const i = list.findIndex((t) => t.id === token.id);
    onPick(list[(i + d + list.length) % list.length]);
  };

  const toArmory = () => {
    if (!token) return;
    window.dispatchEvent(new CustomEvent(ARMORY_EVENT, { detail: token.traits }));
    onClose();
    setTimeout(() => scrollToSection("armory"), 50);
  };

  return (
    <dialog ref={ref} className="dossier" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      {token && (
        <div className="dossier-body" style={{ "--clan": CLAN_INFO[token.traits.Clan].color } as React.CSSProperties}>
          <img src={imageUrl(token.id)} alt={`Neon Ronin #${token.id}`} />
          <div className="dossier-info">
            <p className="mono dossier-clan">
              {CLAN_INFO[token.traits.Clan].kanji} · {token.traits.Clan}
            </p>
            <h3>Neon Ronin #{pad(token.id)}</h3>
            <StatBars stats={token.stats} />
            <dl className="traits">
              {TRAIT_KEYS.filter((k) => token.traits[k as keyof typeof token.traits]).map((k) => (
                <div key={k}>
                  <dt className="mono">{k}</dt>
                  <dd>{token.traits[k as keyof typeof token.traits]}</dd>
                </div>
              ))}
            </dl>
            <div className="dossier-actions">
              <button className="btn btn-ghost" onClick={() => step(-1)} aria-label="Previous ronin">
                ‹ Prev
              </button>
              <button className="btn btn-ghost" onClick={() => step(1)} aria-label="Next ronin">
                Next ›
              </button>
              <button className="btn btn-neon" onClick={toArmory}>
                Open in armory
              </button>
              {REVEALED && (
                <a className="link mono" href={metaUrl(token.id)} target="_blank" rel="noreferrer">
                  metadata.json ↗
                </a>
              )}
            </div>
          </div>
          <button className="dossier-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      )}
    </dialog>
  );
}

export function Roster() {
  const root = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<Clan | "All">("All");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<Token | null>(null);
  const list = useMemo(() => TOKENS.filter((t) => filter === "All" || t.traits.Clan === filter), [filter]);

  // Posters slap onto the wall as they come into view; new pages and filters re-run it.
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        ScrollTrigger.batch(".poster:not(.is-up)", {
          start: "top 92%",
          onEnter: (els) => {
            els.forEach((el) => el.classList.add("is-up"));
            gsap.fromTo(els, { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, stagger: 0.04, ease: "back.out(2)" });
          },
        });
      });
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [filter, shown], revertOnUpdate: true },
  );

  return (
    <section id="roster" className="roster" ref={root}>
      <Edge kind="bricks" color="var(--brick)" />
      <div className="roster-inner">
        <div className="roster-head">
          <div>
            <p className="kicker mono">04 · {REVEALED ? "Wanted" : "Sneak peek"}</p>
            {REVEALED ? (
              <h2>
                All <em>{SUPPLY}</em> on the wall
              </h2>
            ) : (
              <>
                <h2>
                  Preview <em>ronin</em> on the wall
                </h2>
                <p className="roster-note">
                  Drawn by the same generator, but not part of the drop. The real {SUPPLY} stay sealed until every one of
                  them has a master, so nobody can pick the rare ones in advance.
                </p>
              </>
            )}
          </div>
          <div className="filters" role="group" aria-label="Filter by clan">
            {(["All", ...CLAN_NAMES] as const).map((c) => (
              <button
                key={c}
                className={filter === c ? "is-active" : ""}
                aria-pressed={filter === c}
                style={c === "All" ? undefined : ({ "--clan": CLAN_INFO[c].color } as React.CSSProperties)}
                onClick={() => {
                  setFilter(c);
                  setShown(PAGE);
                }}
              >
                {c}
                <small>{c === "All" ? TOKENS.length : TOKENS.filter((t) => t.traits.Clan === c).length}</small>
              </button>
            ))}
          </div>
        </div>

        <ul className="wall">
          {list.slice(0, shown).map((t) => (
            <li key={t.id}>
              <button
                className="poster"
                style={{ "--tilt": `${tilt(t.id)}deg`, "--clan": CLAN_INFO[t.traits.Clan].color } as React.CSSProperties}
                onClick={() => setOpen(t)}
              >
                <span className="tape" aria-hidden="true" />
                <img src={imageUrl(t.id)} alt={`Neon Ronin #${t.id}, ${t.traits.Clan}`} loading="lazy" />
                <span className="poster-foot">
                  <b>#{pad(t.id)}</b>
                  <span>{CLAN_INFO[t.traits.Clan].kanji}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="wall-foot mono">
          {Math.min(shown, list.length)} / {list.length} posted
          {shown < list.length && (
            <button className="btn btn-ghost" onClick={() => setShown((n) => n + PAGE)}>
              Post more
            </button>
          )}
        </p>
      </div>
      <Dossier token={open} list={list} onPick={setOpen} onClose={() => setOpen(null)} />
    </section>
  );
}
