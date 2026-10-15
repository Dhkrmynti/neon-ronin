import { useRef } from "react";
import { layers, svg, type LayerName, type TraitKey } from "../art/ronin";
import { SEED, SUPPLY, TOKENS, pad } from "../lib/roster";
import { gsap, MOTION_OK, WIDE, scrollToSection, useGSAP } from "../lib/motion";
import { Rain } from "../components/Rain";
import { Skyline } from "../components/Skyline";
import { Edge } from "../components/Edge";

export const FEATURED =
  TOKENS.find((t) => t.traits.Clan === "Shogun" && t.traits.Accessory !== "None" && t.traits.Weapon !== "None") ??
  TOKENS.find((t) => t.traits.Clan === "Shogun") ??
  TOKENS[0];

// How each layer flies apart when the hero is scrolled: offsets in % of the stack, and where its label sits.
type Part = { layer: LayerName; trait: TraitKey | null; x: number; y: number; r: number; label: [number, number] };
const PARTS: Part[] = [
  { layer: "back", trait: "Accessory", x: -38, y: -4, r: -8, label: [14, 18] },
  { layer: "weapon", trait: "Weapon", x: 36, y: -10, r: 10, label: [80, 12] },
  { layer: "body", trait: "Armor", x: 0, y: 8, r: 0, label: [50, 96] },
  { layer: "head", trait: "Head", x: 0, y: -6, r: 0, label: [14, 40] },
  { layer: "eyes", trait: "Eyes", x: -32, y: 0, r: -4, label: [30, 52] },
  { layer: "mask", trait: "Mask", x: 30, y: 12, r: 5, label: [70, 66] },
  { layer: "helmet", trait: "Helmet", x: 0, y: -20, r: 0, label: [80, 16] },
  { layer: "accessory", trait: "Accessory", x: -8, y: 28, r: -3, label: [16, 78] },
];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const l = layers(FEATURED.traits, "hero", SEED);
  const parts = PARTS.filter((p) => l[p.layer] && !(p.trait && FEATURED.traits[p.trait] === "None"));

  // On a phone the ronin starts tucked in the bottom-right corner; for the exploded view it moves to the
  // middle of the screen, above the spec card.
  const phoneStack = () => {
    const stack = root.current!.querySelector<HTMLElement>(".hero-stack")!;
    return {
      x: () => (window.innerWidth - stack.offsetWidth) / 2 - stack.offsetLeft,
      y: () => window.innerHeight * 0.14 - stack.offsetTop,
      scale: 0.86,
    };
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_OK, wide: WIDE }, (ctx) => {
        const { motion, wide } = ctx.conditions as { motion: boolean; wide: boolean };
        if (!motion) return;
        const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
        intro
          .from(".hero-title .line > span", { yPercent: 40, opacity: 0, duration: 1.1, stagger: 0.1 })
          .from(".hero-kicker, .hero-lede, .hero-actions", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 }, "-=0.7")
          .from(".hero-stack .part", { y: -60, opacity: 0, duration: 0.9, stagger: 0.07, ease: "back.out(1.5)" }, 0.2)
          .from(".kanji-sign", { opacity: 0, duration: 0.2, repeat: 3, yoyo: true, ease: "none" }, 0.6);

        const tl = gsap.timeline({
          scrollTrigger: { id: "top", trigger: root.current, start: "top top", end: "+=140%", pin: true, scrub: 0.7, invalidateOnRefresh: true },
        });
        tl.to(".hero-copy", { y: -120, opacity: 0, ease: "power2.in" }, 0)
          .to(".scroll-hint", { opacity: 0, duration: 0.15 }, 0)
          .to(".skyline-far", { yPercent: 6 }, 0)
          .to(".skyline-mid", { yPercent: 12 }, 0)
          .to(".skyline-near", { yPercent: 22 }, 0)
          .to(".hero-moon", { yPercent: 40, scale: 0.9 }, 0)
          .to(".hero-stack", wide ? { xPercent: -48, scale: 0.92 } : phoneStack(), 0);
        // On a phone the parts fly apart less, so they stay on screen.
        const spread = wide ? 1 : 0.62;
        gsap.utils.toArray<HTMLElement>(".hero-stack .part").forEach((el) => {
          tl.to(el, { xPercent: Number(el.dataset.x) * spread, yPercent: Number(el.dataset.y) * spread, rotate: Number(el.dataset.r), ease: "power2.out" }, 0.05);
        });
        tl.to(".hero-stack .tag", { opacity: 1, scale: 1, stagger: 0.03 }, 0.35).to(".hero-spec", { opacity: 1, y: 0 }, 0.45);
      });
    },
    { scope: root },
  );

  return (
    <section id="top" className="hero" ref={root}>
      <div className="hero-sky" aria-hidden="true">
        <div className="hero-moon" />
        <Skyline seed={SEED} depth="far" />
        <div className="kanji-sign">
          <span>浪</span>
          <span>人</span>
        </div>
        <Skyline seed={SEED} depth="mid" />
        <Skyline seed={SEED} depth="near" />
      </div>
      <Rain />

      <div className="hero-inner">
        <div className="hero-copy">
          <p className="hero-kicker mono">Neo-Kyoto · Year 2347 · {SUPPLY.toLocaleString("en-US")} units</p>
          <h1 className="hero-title">
            <span className="line">
              <span className="neon-word">Neon</span>
            </span>
            <span className="line">
              <span>Ronin</span>
            </span>
          </h1>
          <p className="hero-lede">
            The lords of Neo-Kyoto are gone. Their war-frames walk the rain without a master. Each ronin is assembled from
            armor, kabuto, masks, blades and neon, and each one is looking for someone to follow.
          </p>
          <div className="hero-actions">
            <button className="btn btn-neon" onClick={() => scrollToSection("mint")}>
              Recruit a ronin
            </button>
            <button className="btn btn-ghost" onClick={() => scrollToSection("armory")}>
              Build your own
            </button>
          </div>
        </div>

        <div className="hero-stack" role="img" aria-label={`Neon Ronin #${pad(FEATURED.id)}, a ${FEATURED.traits.Clan}`}>
          {parts.map((p) => (
            <div key={p.layer} className="part" data-x={p.x} data-y={p.y} data-r={p.r}>
              <div className="part-art" dangerouslySetInnerHTML={{ __html: svg(l.defs + l[p.layer]) }} />
              {p.trait && (
                <span className="tag mono" style={{ left: `${p.label[0]}%`, top: `${p.label[1]}%` }}>
                  <em>{p.trait}</em> {FEATURED.traits[p.trait]}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="hero-spec">
          <p className="mono">Unit #{pad(FEATURED.id)} · {FEATURED.traits.Clan}</p>
          <p>
            Every ronin is drawn from layers. Scroll and this one comes apart: one helmet, one mask, one blade, one set of
            eyes, all picked by its clan.
          </p>
        </div>
      </div>

      <p className="scroll-hint mono" aria-hidden="true">
        Scroll <span>↓</span>
      </p>
      <Edge kind="roofs" color="var(--lacquer)" stroke="var(--vermilion)" />
    </section>
  );
}
