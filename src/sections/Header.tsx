import { useEffect, useState } from "react";
import { scrollToSection } from "../lib/motion";
import { short, useWallet } from "../lib/wallet";
import { FEATURED } from "./Hero";
import { layers, svg } from "../art/ronin";
import { SEED } from "../lib/roster";

export const NAV: [string, string][] = [
  ["city", "City"],
  ["clans", "Clans"],
  ["armory", "Armory"],
  ["roster", "Roster"],
  ["rarity", "Rarity"],
  ["mint", "Mint"],
];

// Head crop of the featured ronin, used as the logo mark.
const l = layers(FEATURED.traits, "logo", SEED);
const MARK = svg(l.defs + l.head + l.eyes + l.mask + l.helmet).replace('viewBox="0 0 400 400"', 'viewBox="60 0 280 280"');

export function Header() {
  const { account, connect, busy } = useWallet();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <header className={`header ${solid ? "is-solid" : ""} ${open ? "is-open" : ""}`}>
      <button className="brand" onClick={() => go("top")} aria-label="Neon Ronin, back to top">
        <span className="brand-mark" dangerouslySetInnerHTML={{ __html: MARK }} />
        <span className="brand-name">
          Neon Ronin <small>浪人</small>
        </span>
      </button>
      <nav className="nav" aria-label="Sections">
        {NAV.map(([id, label], i) => (
          <button key={id} onClick={() => go(id)}>
            <span className="nav-n">{String(i + 1).padStart(2, "0")}</span>
            {label}
          </button>
        ))}
      </nav>
      <button className="btn btn-neon connect" onClick={connect} disabled={busy}>
        {account ? short(account) : busy ? "Connecting…" : "Connect"}
      </button>
      <button className="menu" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
        <i />
        <i />
      </button>
    </header>
  );
}
