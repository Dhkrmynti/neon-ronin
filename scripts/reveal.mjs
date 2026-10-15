#!/usr/bin/env node
// Opens the drop: copies the sealed collection from vault/ into the site, then tells you what to
// set on the contract. Run it once the drop has sold out (or whenever you decide to reveal).
//   npm run reveal
// Then rebuild and upload the site, and point the contract at the real metadata:
//   RONIN_BASE_URI=https://your-domain/collection/metadata/ npm run contract:reveal

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VAULT = path.join(ROOT, "vault");
const from = path.join(VAULT, "collection");
const to = path.join(ROOT, "public", "collection");
if (!fs.existsSync(path.join(VAULT, "roster.json"))) throw new Error("vault/ is empty. Run `npm run generate -- --drop …` with the drop's seed first.");

// Check the vault still matches the provenance the contract was deployed with.
const pub = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "provenance.json"), "utf8"));
const sha256 = (x) => createHash("sha256").update(x).digest("hex");
const hashes = Array.from({ length: pub.supply }, (_, i) => sha256(fs.readFileSync(path.join(from, "images", `${i + 1}.svg`))));
const check = `0x${sha256(hashes.join(""))}`;
if (check !== pub.provenance) throw new Error(`vault/ does not match the published provenance (${check} vs ${pub.provenance}). Regenerate with the original seed.`);

fs.rmSync(to, { recursive: true, force: true });
fs.cpSync(from, to, { recursive: true });
fs.copyFileSync(path.join(VAULT, "roster.json"), path.join(ROOT, "src", "data", "roster.json"));
fs.writeFileSync(path.join(ROOT, "public", "provenance.json"), JSON.stringify({ ...pub, hashes }, null, 2));

console.log(`Revealed ${pub.supply} ronin into public/collection/. Provenance checks out: ${check}`);
console.log("Next: npm run build, upload the site, then RONIN_BASE_URI=https://<domain>/collection/metadata/ npm run contract:reveal");
