// What the site shows (src/data/roster.json) plus everything it says about each clan.
// Before the reveal that is the preview set, not the drop; `npm run reveal` swaps in the real collection.
import data from "../data/roster.json";
import { CLANS, T, NEON_TABLE, MON_TABLE, ARMOR, METAL, type Clan, type Traits, type Stats } from "../art/ronin";

export type Token = { id: number; traits: Traits; stats: Stats };
type Roster = { revealed: boolean; dir: string; supply: number; provenance: string; tokens: Token[] };
const roster = data as unknown as Roster;

/** Seed for art the site draws itself (hero, districts, armory). Public; the drop's seed never reaches the site. */
export const SEED = "neon-ronin-preview";
export const TOKENS = roster.tokens;
export const REVEALED = roster.revealed;
/** Size of the drop, the number the contract mints up to. */
export const SUPPLY = roster.supply;
export const PROVENANCE = roster.provenance;

const base = import.meta.env.BASE_URL;
export const imageUrl = (id: number) => `${base}${roster.dir}/images/${id}.svg`;
export const cutoutUrl = (id: number) => `${base}${roster.dir}/transparent/${id}.svg`;
export const metaUrl = (id: number) => `${base}collection/metadata/${id}.json`;
/** What a freshly minted token looks like: its real art after the reveal, the seal before. */
export const mintedUrl = (id: number) => (REVEALED ? `${base}collection/images/${id}.svg` : `${base}hidden/sealed.svg`);
export const pad = (n: number, w = 3) => String(n).padStart(w, "0");

export const RATE = Object.fromEntries(CLANS) as Record<Clan, number>;
export const CLAN_NAMES = CLANS.map(([c]) => c);
export const byClan = (c: Clan) => TOKENS.filter((t) => t.traits.Clan === c);

export type ClanInfo = {
  kanji: string;
  color: string;
  rank: string;
  district: string;
  /** A background from the art library, drawn full-bleed behind the district. */
  scene: string;
  blurb: string;
};

export const CLAN_INFO: Record<Clan, ClanInfo> = {
  Ashigaru: {
    kanji: "足軽",
    color: "#9aa3b5",
    rank: "Common",
    district: "Scrapyard Ward",
    scene: "Neo-Kyoto Night",
    blurb: "Foot soldiers rebuilt from scrap. Cheap, tough and everywhere. Half the city's blades belong to them.",
  },
  Samurai: {
    kanji: "侍",
    color: "#22e3ff",
    rank: "Less common",
    district: "Sakura Terraces",
    scene: "Sakura Dusk",
    blurb: "Lacquered war-frames that still follow the code of bushido, long after the lords who wrote it went dark.",
  },
  Shinobi: {
    kanji: "忍",
    color: "#a774f9",
    rank: "Uncommon",
    district: "Rain Alleys",
    scene: "Rainy Alley",
    blurb: "Stealth-frames of the rooftops. Hooded, silent, and gone before the alarm finishes its first note.",
  },
  Sohei: {
    kanji: "僧兵",
    color: "#ff9a3c",
    rank: "Scarce",
    district: "Mountain Shrines",
    scene: "Mount Fuji",
    blurb: "Warrior-monks from the temples above the city. Staff, beads and a very calm temper, until you touch the shrine.",
  },
  Shogun: {
    kanji: "将軍",
    color: "#eedf39",
    rank: "Rare",
    district: "The Golden Palace",
    scene: "Golden Palace",
    blurb: "Former command-frames that once ruled the neon districts. Gold armor, plasma blades, enormous egos.",
  },
  Ghost: {
    kanji: "幽霊",
    color: "#ff2cb2",
    rank: "Super rare",
    district: "The Void",
    scene: "Void",
    blurb: "Destroyed in battle, they refused to power down. Nobody knows what keeps them walking.",
  },
};

// Every value a trait can take, across all clans. Used by the Armory cyclers and the variation counts.
const union = (key: keyof (typeof T)["Ashigaru"]) => [...new Set(Object.values(T).flatMap((t) => t[key].map(([v]) => v)))];
export const OPTIONS: Record<string, string[]> = {
  Clan: CLAN_NAMES,
  Background: union("Background"),
  Armor: union("Armor"),
  Head: union("Head"),
  Eyes: union("Eyes"),
  Neon: NEON_TABLE.map(([v]) => v),
  Helmet: union("Helmet"),
  Mask: union("Mask"),
  Weapon: union("Weapon"),
  Accessory: union("Accessory"),
  Mon: MON_TABLE.map(([v]) => v),
};

export const VARIATIONS: [string, number][] = [
  ["Armor colors", Object.keys(ARMOR).length],
  ["Backgrounds", OPTIONS.Background.length],
  ["Helmets", OPTIONS.Helmet.length],
  ["Weapons", OPTIONS.Weapon.length],
  ["Accessories", OPTIONS.Accessory.length],
  ["Eyes", OPTIONS.Eyes.length],
  ["Masks", OPTIONS.Mask.length],
  ["Head metals", Object.keys(METAL).length],
  ["Neon colors", OPTIONS.Neon.length],
  ["Clan mons", OPTIONS.Mon.length],
];
export const TRAIT_TOTAL = VARIATIONS.reduce((s, [, n]) => s + n, 0) + CLANS.length;

/** The scarcest trait values in this drop, ignoring "None". */
export function rarest(n: number) {
  const counts = new Map<string, { key: string; value: string; count: number }>();
  for (const t of TOKENS)
    for (const [key, value] of Object.entries(t.traits)) {
      if (key === "Clan" || value === "None") continue;
      const id = `${key}:${value}`;
      const c = counts.get(id) ?? { key, value, count: 0 };
      c.count++;
      counts.set(id, c);
    }
  return [...counts.values()].sort((a, b) => a.count - b.count).slice(0, n);
}
