import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../lib/motion";
import { SUPPLY } from "../lib/roster";

const LOG: { date: string; title: string; body: string; tone?: "alert" | "anomaly" | "now" }[] = [
  { date: "2340.01.07", title: "The Shogunate rules", body: "Neo-Kyoto's neon districts are held by an army of war-frames, each sworn to a lord." },
  { date: "2346.11.30", title: "The council goes dark", body: "No orders are sent. No lords answer. The palace lights stay on for nobody.", tone: "alert" },
  { date: "2347.02.14", title: "The frames scatter", body: "Without masters the war-frames leave their posts. The streets start calling them ronin." },
  { date: "2347.03.02", title: "The clans split", body: "The Ashigaru rebuild themselves from scrap. The Samurai keep their lacquer clean and their code intact." },
  { date: "2347.03.11", title: "Into the rain, up the mountain", body: "Shinobi frames vanish over the rooftops. Sohei monks retreat to the shrines above the city." },
  { date: "2347.03.19", title: "Ghosts", body: "Units destroyed in battle are seen walking again. Nobody can explain what powers them.", tone: "anomaly" },
  { date: "2347.04.01", title: "The broadcast", body: `${SUPPLY.toLocaleString("en-US")} ronin are searching for a new master.`, tone: "now" },
];

export function Lore() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        // The gate grows as you walk toward it.
        gsap.fromTo(
          ".torii",
          { scale: 0.82, yPercent: 6 },
          { scale: 1.08, yPercent: -4, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
        // Each entry's lantern lights as it reaches the middle of the screen.
        gsap.utils.toArray<HTMLElement>(".log-entry").forEach((el) => {
          gsap.timeline({ scrollTrigger: { trigger: el, start: "top 70%", end: "top 40%", scrub: 0.5 } })
            .fromTo(el, { opacity: 0.25, y: 30 }, { opacity: 1, y: 0, ease: "power2.out" })
            .fromTo(el.querySelector(".lantern"), { "--lit": 0 }, { "--lit": 1, ease: "none" }, 0);
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="city" className="lore" ref={root}>
      <div className="lore-inner">
        <div className="lore-gate">
          <svg className="torii" viewBox="0 0 400 420" aria-hidden="true">
            <circle cx="200" cy="200" r="130" className="torii-sun" />
            <path d="M20 70 Q200 40 380 70 L372 96 Q200 72 28 96 Z" className="torii-beam" />
            <rect x="60" y="120" width="280" height="20" className="torii-beam" />
            <rect x="186" y="96" width="28" height="30" className="torii-beam" />
            <rect x="92" y="88" width="30" height="332" className="torii-post" />
            <rect x="278" y="88" width="30" height="332" className="torii-post" />
            <rect x="84" y="396" width="46" height="24" className="torii-foot" />
            <rect x="270" y="396" width="46" height="24" className="torii-foot" />
          </svg>
          <div className="lore-head">
            <p className="kicker mono">01 · The city</p>
            <h2>
              The night the <em>lords</em> went dark
            </h2>
            <p>Seven years of Neo-Kyoto, recovered from a broken shogunate archive.</p>
          </div>
        </div>

        <ol className="log">
          {LOG.map((e) => (
            <li key={e.date} className={`log-entry ${e.tone ?? ""}`}>
              <span className="lantern" aria-hidden="true">
                <i />
              </span>
              <p className="mono log-date">[{e.date}]</p>
              <h3>{e.title}</h3>
              <p>{e.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
