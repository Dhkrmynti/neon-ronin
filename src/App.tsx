import { useEffect } from "react";
import { ScrollTrigger, startSmoothScroll } from "./lib/motion";
import { WalletProvider } from "./lib/wallet";
import { Header } from "./sections/Header";
import { Hero } from "./sections/Hero";
import { Lore } from "./sections/Lore";
import { Districts } from "./sections/Districts";
import { Armory } from "./sections/Armory";
import { Roster } from "./sections/Roster";
import { Rarity } from "./sections/Rarity";
import { Dawn } from "./sections/Dawn";

export function App() {
  useEffect(() => {
    const stop = startSmoothScroll();
    // Pins are measured before the web fonts arrive; measure again once the text has its real size.
    document.fonts.ready.then(() => ScrollTrigger.refresh());

    // Dev only: open /?y=1800 to land on a scroll position, for screenshots.
    const y = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get("y")) : 0;
    if (y) window.setTimeout(() => window.scrollTo(0, y), 400);
    return stop;
  }, []);

  return (
    <WalletProvider>
      <Header />
      <main>
        <Hero />
        <Lore />
        <Districts />
        <Armory />
        <Roster />
        <Rarity />
        <Dawn />
      </main>
    </WalletProvider>
  );
}
