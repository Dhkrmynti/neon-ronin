#!/usr/bin/env node
// Neon Ronin generator: seeded, layered, dependency-free SVG art. Two jobs:
//
// 1. The drop (the real collection). Sealed until it sells out, so it is written to vault/, which is
//    never served or committed. Only its provenance hash and the sealed placeholder go public.
//      npm run generate -- --drop --count 888 --seed <SECRET> --site-url https://your-domain
//    Keep the seed: the same seed and count redraw exactly the same drop.
//      vault/collection/images|transparent|metadata/<id>   the real art and ERC-721 metadata
//      vault/collection/rarity.json, provenance.json        trait counts; sha256 of every image
//      vault/roster.json                                    what the site shows after the reveal
//      public/hidden/<id>.json, public/hidden/sealed.svg    what wallets show before the reveal
//      public/provenance.json                               the hash the contract stores, and the supply
//
// 2. The preview set the site shows before the reveal: hero, districts, wall. Not part of the drop.
//      npm run generate                                     (100 ronin, public seed)
//      public/preview/images|transparent/<id>.svg, src/data/roster.json
//
// After the drop sells out: npm run reveal (scripts/reveal.mjs).

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { hashSeed, mulberry32, rollTraits, render, layers, svg, stats, TRAIT_ORDER } from "../src/art/ronin.js";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def;
};
const DROP = args.includes("--drop");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const VAULT = path.join(ROOT, "vault");
const DATA = path.join(ROOT, "src", "data");
const PREVIEW_SEED = "neon-ronin-preview";

const LORE = {
  Ashigaru: "A foot-soldier unit of Neo-Kyoto, rebuilt from scrap and loyal to no lord.",
  Samurai: "A lacquered war-frame that still follows the old code of bushido.",
  Shinobi: "A stealth-frame built for the rooftops, trained to strike unseen and vanish into the rain.",
  Sohei: "A warrior-monk frame from the mountain temples, guarding the old shrines with staff and blade.",
  Shogun: "One of the few command-frames that once ruled the neon districts.",
  Ghost: "A ronin that died in battle and refused to power down.",
};
const ABOUT = "Neon Ronin is a collection of masterless robot samurai wandering the rain-soaked streets of Neo-Kyoto.";

const sha256 = (x) => createHash("sha256").update(x).digest("hex");
const dna = (t) => TRAIT_ORDER.map((k) => t[k]).concat(t.Mon || "").join("|");
const fresh = (dir) => {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
};
const writeJson = (file, value, pretty = true) => fs.writeFileSync(file, JSON.stringify(value, null, pretty ? 2 : 0));

function roll(seed, count) {
  const rng = mulberry32(hashSeed(seed)());
  const seen = new Set();
  const tokens = [];
  let attempts = 0;
  while (tokens.length < count) {
    if (++attempts > count * 50) throw new Error("Ran out of unique combinations; add traits or lower --count");
    const t = rollTraits(rng);
    if (seen.has(dna(t))) continue;
    seen.add(dna(t));
    tokens.push(t);
  }
  return tokens;
}

function drawSet(tokens, seed, dir) {
  for (const d of ["images", "transparent"]) fresh(path.join(dir, d));
  const hashes = tokens.map((t, i) => {
    const image = render(t, i + 1, true, seed);
    fs.writeFileSync(path.join(dir, "images", `${i + 1}.svg`), image);
    fs.writeFileSync(path.join(dir, "transparent", `${i + 1}.svg`), render(t, i + 1, false, seed));
    return sha256(image);
  });
  return hashes;
}

const siteRoster = (tokens, extra) => ({ ...extra, tokens: tokens.map((t, i) => ({ id: i + 1, traits: t, stats: stats(t, i + 1) })) });

// The placeholder every token shows until the reveal: a ronin silhouette in the rain, one neon question.
function sealedArt() {
  const t = { Clan: "Samurai", Background: "Void", Armor: "Ink Black", Head: "Matte Black", Eyes: "Slit Visor", Neon: "Hot Pink", Helmet: "Kuwagata Kabuto", Mask: "Mempo", Weapon: "Katana", Accessory: "None" };
  const l = layers(t, "sealed");
  const r = mulberry32(7);
  let rain = "";
  for (let i = 0; i < 70; i++) rain += `<path d="M${(r() * 420).toFixed(0)} ${(r() * 400).toFixed(0)} l-6 18" stroke="#9fb4d9" stroke-width="2" opacity="${(0.15 + r() * 0.35).toFixed(2)}"/>`;
  const body = l.weapon + l.body + l.head + l.mask + l.helmet;
  return svg(
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0f3d"/><stop offset="1" stop-color="#070814"/></linearGradient>` +
      // Black silhouette with a neon rim: the shape dilated in pink, then the shape itself in ink on top.
      `<filter id="sil" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="4" result="fat"/>` +
      `<feFlood flood-color="#ff2cb2"/><feComposite in2="fat" operator="in" result="rim"/><feGaussianBlur in="rim" stdDeviation="4" result="glow"/>` +
      `<feFlood flood-color="#05050c"/><feComposite in2="SourceAlpha" operator="in" result="ink"/>` +
      `<feMerge><feMergeNode in="glow"/><feMergeNode in="rim"/><feMergeNode in="ink"/></feMerge></filter>` +
      `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
      `<rect width="400" height="400" fill="url(#sky)"/><circle cx="200" cy="190" r="150" fill="#ff2cb2" opacity="0.18"/>` +
      `<g filter="url(#sil)">${body}</g>` +
      `<text x="200" y="232" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="120" font-weight="900" fill="#fff" stroke="#ff2cb2" stroke-width="4" filter="url(#glow)">?</text>` +
      `<rect x="292" y="24" width="84" height="84" rx="8" fill="none" stroke="#e2412f" stroke-width="5" transform="rotate(8 334 66)"/>` +
      `<text x="334" y="86" text-anchor="middle" font-family="serif" font-size="54" font-weight="700" fill="#e2412f" transform="rotate(8 334 66)">封</text>` +
      rain,
  );
}

if (DROP) {
  const COUNT = parseInt(opt("count", "888"), 10);
  const SEED = opt("seed", "");
  const SITE = (opt("site-url", "") || "").replace(/\/$/, "");
  if (!SEED || SEED === PREVIEW_SEED || SEED === "neon-ronin") throw new Error("The drop needs a secret --seed. Anyone with the seed can see every ronin before the reveal.");
  if (!SITE) throw new Error("The drop needs --site-url (e.g. https://neonronin.xyz): metadata points at absolute image URLs.");

  const tokens = roll(SEED, COUNT);
  const out = path.join(VAULT, "collection");
  fs.mkdirSync(out, { recursive: true });
  const hashes = drawSet(tokens, SEED, out);
  fresh(path.join(out, "metadata"));
  const counts = {};
  tokens.forEach((t, i) => {
    const id = i + 1;
    const attributes = TRAIT_ORDER.map((k) => ({ trait_type: k, value: t[k] }));
    if (t.Mon) attributes.push({ trait_type: "Mon", value: t.Mon });
    writeJson(path.join(out, "metadata", `${id}.json`), {
      name: `Neon Ronin #${id}`,
      description: `${LORE[t.Clan]} ${ABOUT}`,
      image: `${SITE}/collection/images/${id}.svg`,
      attributes,
    });
    for (const a of attributes) {
      counts[a.trait_type] ??= {};
      counts[a.trait_type][a.value] = (counts[a.trait_type][a.value] || 0) + 1;
    }
  });

  // Provenance: sha256 over the image hashes in token order. Stored in the contract before minting,
  // so anyone can check after the reveal that the art and its order were fixed in advance.
  const provenance = `0x${sha256(hashes.join(""))}`;
  const algorithm = "sha256(concat(sha256(image_i))) over the SVG files, in token order";
  writeJson(path.join(out, "rarity.json"), { count: COUNT, traits: counts });
  writeJson(path.join(out, "provenance.json"), { provenance, algorithm, hashes });
  writeJson(path.join(VAULT, "roster.json"), siteRoster(tokens, { revealed: true, dir: "collection", supply: COUNT, provenance }), false);

  // Public side: the hash, the supply, and one sealed token per id.
  writeJson(path.join(PUBLIC, "provenance.json"), { provenance, algorithm, supply: COUNT });
  const hidden = path.join(PUBLIC, "hidden");
  fresh(hidden);
  fs.writeFileSync(path.join(hidden, "sealed.svg"), sealedArt());
  for (let id = 1; id <= COUNT; id++)
    writeJson(path.join(hidden, `${id}.json`), {
      name: `Neon Ronin #${id}`,
      description: `A sealed ronin. Its clan, armor and blade are revealed when all ${COUNT} have found a master. ${ABOUT}`,
      image: `${SITE}/hidden/sealed.svg`,
      attributes: [{ trait_type: "Status", value: "Sealed" }],
    });

  // The site's preview roster carries the drop's supply and provenance.
  const site = path.join(DATA, "roster.json");
  if (fs.existsSync(site)) {
    const r = JSON.parse(fs.readFileSync(site, "utf8"));
    if (!r.revealed) writeJson(site, { ...r, supply: COUNT, provenance }, false);
  }

  console.log(`Drop: ${COUNT} ronin sealed in vault/ (never commit or upload this folder).`);
  console.log("Clan split:", counts.Clan);
  console.log("Provenance:", provenance);
  console.log(`Contract base URI until the reveal: ${SITE}/hidden/`);
} else {
  const COUNT = parseInt(opt("count", "100"), 10);
  const tokens = roll(PREVIEW_SEED, COUNT);
  drawSet(tokens, PREVIEW_SEED, path.join(PUBLIC, "preview"));
  fs.mkdirSync(DATA, { recursive: true });
  const drop = fs.existsSync(path.join(PUBLIC, "provenance.json")) ? JSON.parse(fs.readFileSync(path.join(PUBLIC, "provenance.json"), "utf8")) : {};
  writeJson(path.join(DATA, "roster.json"), siteRoster(tokens, { revealed: false, dir: "preview", supply: drop.supply ?? 888, provenance: drop.provenance ?? "" }), false);
  console.log(`Preview: ${COUNT} ronin in public/preview/ (seed "${PREVIEW_SEED}", not part of the drop).`);
}
