import { useEffect, useMemo, useRef, useState } from "react";
import { render, rollTraits, stats, type Traits } from "../art/ronin";
import { OPTIONS, SEED } from "../lib/roster";
import { gsap, MOTION_OK, useGSAP } from "../lib/motion";
import { StatBars } from "../components/StatBars";
import { Edge } from "../components/Edge";
import { FEATURED } from "./Hero";

/** Fired by the roster's dossier to load a ronin into the Armory. */
export const ARMORY_EVENT = "ronin:armory";

const KEYS = Object.keys(OPTIONS);

export function Armory() {
  const root = useRef<HTMLElement>(null);
  const [proto, setProto] = useState<Traits>({ ...FEATURED.traits });
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    const load = (e: Event) => {
      setProto({ ...(e as CustomEvent<Traits>).detail });
      setFlash((n) => n + 1);
    };
    window.addEventListener(ARMORY_EVENT, load);
    return () => window.removeEventListener(ARMORY_EVENT, load);
  }, []);

  const art = useMemo(() => render(proto, "armory", true, SEED), [proto]);
  const st = useMemo(() => stats(proto, "armory"), [proto]);

  const cycle = (key: string, d: number) => {
    setProto((p) => {
      const opts = OPTIONS[key];
      const cur = (p as Record<string, string | undefined>)[key];
      const next = { ...p, [key]: opts[(opts.indexOf(cur ?? opts[0]) + d + opts.length) % opts.length] } as Traits;
      if (next.Accessory === "Clan Mon") next.Mon ??= OPTIONS.Mon[0];
      else delete next.Mon;
      return next;
    });
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([art], { type: "image/svg+xml" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `neon-ronin-prototype-${proto.Clan.toLowerCase()}.svg` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from(".rack-row", {
          x: 40,
          opacity: 0,
          stagger: 0.04,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: ".rack", start: "top 75%" },
        });
        gsap.from(".forge", { scale: 0.9, opacity: 0, duration: 0.9, ease: "back.out(1.4)", scrollTrigger: { trigger: ".forge", start: "top 80%" } });
      });
    },
    { scope: root },
  );

  // A short pulse on the frame whenever a ronin is loaded from the roster.
  useEffect(() => {
    if (flash && window.matchMedia(MOTION_OK).matches)
      gsap.fromTo(".forge-frame", { boxShadow: "0 0 0 0 var(--cyan)" }, { boxShadow: "0 0 60px 6px var(--cyan)", duration: 0.35, yoyo: true, repeat: 1 });
  }, [flash]);

  return (
    <section id="armory" className="armory" ref={root}>
      <Edge kind="tiles" color="var(--wood)" />
      <div className="armory-inner">
        <div className="armory-head">
          <p className="kicker mono">03 · The armory</p>
          <h2>
            Forge a <em>prototype</em>
          </h2>
          <p>
            Swap any part and the ronin is redrawn on the spot, with the same renderer that drew the collection. Prototypes
            are for fun: minted ronin are assigned at random, at the drop rates of their clan.
          </p>
        </div>

        <div className="forge">
          <div className="forge-frame" dangerouslySetInnerHTML={{ __html: art }} />
          <div className="forge-meta">
            <p className="mono">
              Prototype · {proto.Clan} · {proto.Neon}
            </p>
            <StatBars stats={st} />
            <div className="forge-actions">
              <button className="btn btn-neon" onClick={() => setProto(rollTraits(Math.random))}>
                Randomize
              </button>
              <button className="btn btn-ghost" onClick={download}>
                Download SVG
              </button>
            </div>
          </div>
        </div>

        <ul className="rack" aria-label="Parts">
          {KEYS.filter((k) => k !== "Mon" || proto.Mon).map((key) => (
            <li key={key} className="rack-row">
              <span className="mono rack-key">{key}</span>
              <button aria-label={`Previous ${key}`} onClick={() => cycle(key, -1)}>
                ‹
              </button>
              <output aria-live="polite">{(proto as Record<string, string | undefined>)[key] ?? "None"}</output>
              <button aria-label={`Next ${key}`} onClick={() => cycle(key, 1)}>
                ›
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
