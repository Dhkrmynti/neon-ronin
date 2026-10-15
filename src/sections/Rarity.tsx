import { useRef } from "react";
import { CLAN_INFO, CLAN_NAMES, PROVENANCE, RATE, REVEALED, SUPPLY, TRAIT_TOTAL, VARIATIONS, rarest } from "../lib/roster";
import { gsap, MOTION_OK, useGSAP } from "../lib/motion";
import { Edge } from "../components/Edge";

const RAREST = rarest(5);

// A makimono hand-scroll that unrolls from the middle as you scroll, then gets stamped.
export function Rarity() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: ".makimono", start: "top 75%", end: "center 55%", scrub: 0.6 } });
        tl.fromTo(".scroll-paper", { clipPath: "inset(0 50% 0 50%)" }, { clipPath: "inset(0 0% 0 0%)", ease: "power2.inOut" }, 0)
          .fromTo(".roller-l", { xPercent: 0, left: "50%" }, { left: "0%", ease: "power2.inOut" }, 0)
          .fromTo(".roller-r", { right: "50%" }, { right: "0%", ease: "power2.inOut" }, 0);
        // Bars fill as soon as the clan list is on screen, however tall the scroll is (it is very tall on a phone).
        gsap.from(".rate-bar i", { width: 0, stagger: 0.06, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: ".rates", start: "top 85%" } });
        gsap.from(".hanko", {
          scale: 2.6,
          opacity: 0,
          rotate: -30,
          duration: 0.5,
          ease: "power4.in",
          scrollTrigger: { trigger: ".hanko", start: "top 80%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="rarity" className="rarity" ref={root}>
      <Edge kind="waves" color="var(--indigo)" />
      <div className="rarity-inner">
        <div className="rarity-head">
          <p className="kicker mono">05 · The scroll of ranks</p>
          <h2>
            {TRAIT_TOTAL} parts, <em>one</em> of you
          </h2>
          <p>Your clan is rolled first. It decides which helmets, masks and blades your ronin can draw from.</p>
        </div>

        <div className="makimono">
          <span className="roller roller-l" aria-hidden="true" />
          <div className="scroll-paper">
            <div className="scroll-col">
              <h3>Clans</h3>
              <ul className="rates">
                {CLAN_NAMES.map((c) => (
                  <li key={c} style={{ "--clan": CLAN_INFO[c].color } as React.CSSProperties}>
                    <span className="rate-kanji">{CLAN_INFO[c].kanji}</span>
                    <span className="rate-name">
                      {c}
                      <small className="mono">{CLAN_INFO[c].rank}</small>
                    </span>
                    <span className="rate-bar">
                      <i style={{ width: `${(RATE[c] / 48) * 100}%` }} />
                    </span>
                    <b className="mono">{RATE[c]}%</b>
                  </li>
                ))}
              </ul>
            </div>
            <div className="scroll-col">
              <h3>Variations</h3>
              <ul className="variations">
                {VARIATIONS.map(([label, n]) => (
                  <li key={label}>
                    <b>{n}</b>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
              {REVEALED ? (
                <>
                  <h3>Scarcest in the drop</h3>
                  <ul className="scarce mono">
                    {RAREST.map((r) => (
                      <li key={`${r.key}${r.value}`}>
                        <span>{r.key}</span> {r.value} <b>×{r.count}</b>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h3>The drop is sealed</h3>
                  <p className="sealed-note">
                    All {SUPPLY} ronin are drawn and locked. This fingerprint of every image, in order, is stored in the
                    contract, so after the reveal anyone can check nothing was reshuffled.
                    {PROVENANCE && <code>{PROVENANCE}</code>}
                  </p>
                </>
              )}
            </div>
            <span className="hanko" aria-hidden="true">
              珍
            </span>
          </div>
          <span className="roller roller-r" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
