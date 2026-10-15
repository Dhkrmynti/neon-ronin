import { useEffect, useMemo, useRef, useState } from "react";
import { layers, svg, T, type Clan } from "../art/ronin";
import { CLAN_INFO, CLAN_NAMES, RATE, REVEALED, SEED, SUPPLY, TOKENS, byClan, cutoutUrl, pad } from "../lib/roster";
import { gsap, MOTION_OK, ScrollTrigger, WIDE, scrollToY, useGSAP } from "../lib/motion";

const SWIPE = "(max-width: 899px)";

// One district per clan: the clan's scenery full-bleed, a signboard, and its ronin taking turns in front.
function District({ clan, index }: { clan: Clan; index: number }) {
  const info = CLAN_INFO[clan];
  const members = useMemo(() => byClan(clan), [clan]);
  const [k, setK] = useState(0);
  const scene = useMemo(() => {
    const sample = { ...TOKENS[0].traits, Clan: clan, Background: info.scene, Neon: "Cyber Cyan" };
    const l = layers(sample, `d${index}`, SEED);
    return svg(l.background).replace('width="400" height="400"', 'preserveAspectRatio="xMidYMid slice"');
  }, [clan, index, info.scene]);

  // The next ronin is downloaded first and only swapped in once it has loaded, so the portrait never goes blank.
  useEffect(() => {
    if (members.length < 2 || !window.matchMedia(MOTION_OK).matches) return;
    let live = true;
    let timer = 0;
    let n = 0;
    const next = () => {
      const i = (n + 1) % members.length;
      const img = new Image();
      img.onload = img.onerror = () => {
        if (!live) return;
        n = i;
        setK(i);
        timer = window.setTimeout(next, 2200 + index * 130);
      };
      img.src = cutoutUrl(members[i].id);
    };
    timer = window.setTimeout(next, 2200 + index * 130);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [members, index]);

  const current = members[k];
  return (
    <article className="district" style={{ "--clan": info.color } as React.CSSProperties} aria-labelledby={`clan-${clan}`}>
      <div className="district-scene" aria-hidden="true" dangerouslySetInnerHTML={{ __html: scene }} />
      <div className="district-shade" aria-hidden="true" />
      <span className="district-kanji" aria-hidden="true">
        {info.kanji}
      </span>

      <div className="district-card">
        <p className="mono district-no">
          District {String(index + 1).padStart(2, "0")} / {String(CLAN_NAMES.length).padStart(2, "0")} · {info.district}
        </p>
        <h3 id={`clan-${clan}`}>{clan}</h3>
        <p>{info.blurb}</p>
        <div className="district-rate">
          <b>{RATE[clan]}%</b>
          <span className="mono">
            drop rate · {info.rank}
            <br />
            {REVEALED ? `${members.length} of ${SUPPLY} in the drop` : `${members.length} in the preview set`}
          </span>
        </div>
        <dl className="district-gear">
          <div>
            <dt className="mono">Helmets</dt>
            <dd>{T[clan].Helmet.map(([v]) => v).join(" · ")}</dd>
          </div>
          <div>
            <dt className="mono">Weapons</dt>
            <dd>{T[clan].Weapon.map(([v]) => v).join(" · ")}</dd>
          </div>
        </dl>
      </div>

      <figure className="district-ronin">
        {current && <img key={current.id} src={cutoutUrl(current.id)} alt={`Neon Ronin #${current.id}, ${clan}`} />}
        {current && <figcaption className="mono">#{pad(current.id)}</figcaption>}
      </figure>
    </article>
  );
}

export function Districts() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLOListElement>(null);
  // On narrow screens the districts are a swipeable row (CSS scroll-snap) instead of a pinned slide.
  const swipe = () => window.matchMedia(SWIPE).matches;

  const onSwipe = () => {
    const t = track.current!;
    if (swipe()) setActive(Math.min(CLAN_NAMES.length - 1, Math.round(t.scrollLeft / t.clientWidth)));
  };

  // Keep the active tab in view in the scrollable tab row.
  useEffect(() => {
    const list = tabs.current;
    const tab = list?.children[active] as HTMLElement | undefined;
    if (list && tab && swipe()) list.scrollTo({ left: tab.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  useGSAP(
    () => {
      gsap.matchMedia().add(`${MOTION_OK} and ${WIDE}`, () => {
        const track = root.current!.querySelector<HTMLElement>(".district-track")!;
        const distance = () => track.scrollWidth - window.innerWidth;
        const slide = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            id: "clans",
            trigger: root.current,
            pin: true,
            scrub: 0.8,
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => setActive(Math.round(self.progress * (CLAN_NAMES.length - 1))),
          },
        });
        gsap.utils.toArray<HTMLElement>(".district").forEach((d, i) => {
          gsap.fromTo(
            d.querySelector(".district-ronin"),
            { xPercent: 30 },
            { xPercent: -20, ease: "none", scrollTrigger: { trigger: d, containerAnimation: slide, start: "left right", end: "right left", scrub: true } },
          );
          gsap.fromTo(
            d.querySelector(".district-kanji"),
            { xPercent: -30 },
            { xPercent: 30, ease: "none", scrollTrigger: { trigger: d, containerAnimation: slide, start: "left right", end: "right left", scrub: true } },
          );
          // The first district is already on screen when the pin starts, so only the others make an entrance.
          if (i > 0) gsap.from(d.querySelectorAll(".district-card > *"), {
            y: 40,
            opacity: 0,
            stagger: 0.06,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: d, containerAnimation: slide, start: "left 55%", toggleActions: "play none none reverse" },
          });
        });
      });
    },
    { scope: root },
  );

  const jump = (i: number) => {
    const t = track.current!;
    if (swipe()) return t.scrollTo({ left: i * t.clientWidth, behavior: window.matchMedia(MOTION_OK).matches ? "smooth" : "auto" });
    const st = ScrollTrigger.getById("clans");
    if (st) scrollToY(st.start + (st.end - st.start) * (i / (CLAN_NAMES.length - 1)));
    else document.getElementById(`clan-${CLAN_NAMES[i]}`)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="clans" className="districts" ref={root}>
      <header className="districts-bar">
        <p className="mono">02 · Six clans, six districts</p>
        <ol ref={tabs}>
          {CLAN_NAMES.map((c, i) => (
            <li key={c}>
              <button className={i === active ? "is-active" : ""} style={{ "--clan": CLAN_INFO[c].color } as React.CSSProperties} onClick={() => jump(i)}>
                {c}
              </button>
            </li>
          ))}
        </ol>
        <div className="districts-nav" aria-hidden="true">
          <button onClick={() => jump(Math.max(0, active - 1))} disabled={active === 0} tabIndex={-1}>
            ‹
          </button>
          <span className="mono">
            {String(active + 1).padStart(2, "0")} / {String(CLAN_NAMES.length).padStart(2, "0")}
          </span>
          <button onClick={() => jump(Math.min(CLAN_NAMES.length - 1, active + 1))} disabled={active === CLAN_NAMES.length - 1} tabIndex={-1}>
            ›
          </button>
        </div>
      </header>
      <div className="district-track" ref={track} onScroll={onSwipe} tabIndex={0} role="region" aria-label="Clan districts">
        {CLAN_NAMES.map((c, i) => (
          <District key={c} clan={c} index={i} />
        ))}
      </div>
    </section>
  );
}
