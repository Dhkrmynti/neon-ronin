---
name: Neon Ronin — One night in Neo-Kyoto
description: "An NFT collection of robot samurai as one walk through a rainy neon city: from a rooftop, through a torii gate, across six clan districts, into an armory, past a wanted wall, over a makimono of ranks, and out at dawn."
colors:
  night: "#070814 (rooftop, districts)"
  lacquer: "#1c070b (the torii gate)"
  vermilion: "#e2412f (the gate, roof outlines, numbers on paper)"
  wood: "#2a170f (the armory)"
  brick: "#1e0f12 (the wanted wall)"
  indigo: "#0d1033 (the makimono)"
  washi: "#f1e8d4 (posters, the scroll)"
  dawn: "#24183f → #ffb36b (mint, footer)"
  neon: "pink #ff2cb2 (the one loud colour: buttons, emphasis), cyan #22e3ff (labels, focus)"
  clans: "Ashigaru #9aa3b5 · Samurai #22e3ff · Shinobi #a774f9 · Sohei #ff9a3c · Shogun #eedf39 · Ghost #ff2cb2"
typography:
  display: "Dela Gothic One — headlines, numbers, kanji"
  body: "Zen Kaku Gothic New — running text"
  data: "JetBrains Mono — kickers, labels, dates, IDs, buttons"
---

# Neon Ronin — one night in Neo-Kyoto

The page is one place, top to bottom, like the other projects in this folder. Every stop has its own
ground and its own drawn thing, and the border between two stops is drawn too (`src/components/Edge.tsx`):
each edge sits on top of a stop, in that stop's ground colour, and rises into the stop above it.

| # | Stop | Section | Ground | The thing drawn | Edge into it |
|---|---|---|---|---|---|
| 00 | Rooftop | `Hero.tsx` | night sky, moon, three seeded skylines, rain | the featured ronin, built from its layers | - |
| 01 | Torii gate | `Lore.tsx` | lacquer | a vermilion torii with the sun behind it, a lantern per log entry | temple roofs with neon outlines |
| 02 | Districts | `Districts.tsx` | each clan's scenery, full-bleed | signboard, outlined kanji, the clan's ronin taking turns | - |
| 03 | Armory | `Armory.tsx` | wood planks | a framed prototype and a rack of wooden part tags | roof tiles |
| 04 | Wanted wall | `Roster.tsx` | brick | taped washi posters; a dossier opens on click | bricks |
| 05 | Scroll of ranks | `Rarity.tsx` | indigo night | a makimono with rollers, stamped 珍 | waves |
| 06 | Dawn | `Dawn.tsx` | night → sunrise | recruitment office, FAQ, ronin walking the ridge, footer | mountain ridge |

## Motion (GSAP + ScrollTrigger + Lenis)
- Rooftop: pinned. The title lifts away, the skylines sink at three speeds, and the ronin comes apart into
  its layers, each labelled with its trait. The kanji sign flickers.
- Torii: the gate grows as you approach; each lantern lights as its entry reaches the middle of the screen.
- Districts: pinned and slid sideways on wide screens. The ronin and the kanji drift at opposite speeds,
  each signboard's lines rise in. Narrow screens stack the districts.
- Armory: the rack tags slide in. Loading a ronin from the wall pulses the frame.
- Wall: posters slap on in batches as they scroll in.
- Scroll of ranks: the paper unrolls from the middle with the rollers, bars fill, the seal stamps.
- Dawn: the sun rises and the rain stops as you scroll; the six ronin walk the ridge at different speeds.
- With reduced motion nothing is pinned or scrubbed; districts stack, labels on the hero stay hidden,
  lanterns are lit, rain is not drawn.

## Rules
- Pink is for the one thing to press or the one word to notice. Clan colours only mark their clan.
- Mono is for labels and numbers, never for paragraphs.
- Before the reveal, every ronin the site shows is from the preview set and says so. The drop stays sealed:
  minted tokens show the seal, the rarity scroll shows the provenance hash instead of the scarcest traits.
- The office says "Mint opens soon" until `src/data/deployment.json` has an address.
