# Neon Ronin

888 masterless robot samurai in six clans, wandering the rain of Neo-Kyoto, on Robinhood Chain. This repo holds
the art generator, the website (Vite + React + TypeScript, GSAP ScrollTrigger + Lenis) and the contract.

**Launching on mainnet: follow [DEPLOY-MAINNET.md](DEPLOY-MAINNET.md) step by step.**

```bash
npm install && npm --prefix contracts install
npm run dev        # http://localhost:5195
npm run build      # type-check + production build into dist/
npm run generate   # redraw the site's preview set (see below)
```

## Layout

```
src/art/ronin.js        art library: trait tables, weights, layered SVG renderer, stats (plain JS + ronin.d.ts)
scripts/generate.mjs    draws the sealed drop (--drop) or the site's preview set
scripts/reveal.mjs      opens the drop: vault/ → public/collection/, after checking the provenance
vault/                  the sealed drop: real art + metadata. Private: gitignored, never uploaded
public/hidden/          what every token shows before the reveal (sealed.svg + <id>.json)
public/preview/         preview ronin the site shows before the reveal (not part of the drop)
public/provenance.json  the drop's supply and provenance hash (what the contract stores)
src/data/roster.json    what the site shows: the preview set, or the drop after the reveal
scripts/install-server.sh  VPS install: nginx site, /rpc proxy, HTTPS
src/data/deployment.json  contract address/chain; empty address = mint not open
src/sections/           one file per stop on the page (see DESIGN.md)
src/components/         Rain, Skyline, Edge, StatBars
src/lib/                motion (GSAP/Lenis), roster (data + clan copy), wallet (connect + mint)
```

## The collection

The drop is sealed until it sells out, so nobody can see which ids are rare and pick them:

- `npm run generate -- --drop --count 888 --seed <SECRET> --site-url https://<domain>` draws the real drop into
  `vault/` and publishes only its provenance hash and a sealed placeholder per token. Keep the seed: the same seed and
  count always redraw the same drop.
- `npm run generate` draws 100 preview ronin (public seed) for the hero, districts and wall.
- `npm run reveal` checks `vault/` against the published provenance and swaps the real collection into the site.

- Clans roll first: Ashigaru 48%, Samurai 24%, Shinobi 12%, Sohei 8%, Shogun 6%, Ghost 2%.
- Each clan has its own weighted tables for background, armor, head, eyes, helmet, mask, weapon and accessory.
- Every combination is unique; the generator stops if it runs out.
- To add a trait: add it to a clan table in `src/art/ronin.js`, draw it in the matching layer function,
  give it a stat in `STAT_BASE` if it is a weapon, helmet or mask, then run `npm run generate`.
  The site's Armory, counts and rarity scroll pick it up automatically.

## Contract (`contracts/`)

`contracts/contracts/NeonRonin.sol` — ERC-721 + ERC-2981 (OpenZeppelin 5), Hardhat 3.

- `mint(qty)` payable, ronin minted in order from #1, exact payment of `price * qty`.
- Supply, price, per-wallet and per-transaction limits and the provenance hash are immutable.
- Owner can: open/close the mint, `reserve` for the team (only before the mint ever opens), move the
  metadata base until `freezeMetadata`, and `withdraw`. 5% royalty to the deployer.
- Counts are updated before tokens are handed over, so a receiving contract cannot re-enter past the limits (tested).

```bash
npm run contracts:test   # 10 tests
npm run chain            # local chain on :8545 (keep it running)
npm run deploy:local     # deploys, opens the mint, writes src/data/deployment.json
```

The site reads `src/data/deployment.json`: live supply counter, price, how many this wallet can still
mint, and the minted ronin after a transaction. An empty address means "Mint opens soon".

To test in MetaMask locally: add network `http://127.0.0.1:8545` (chain id 31337) and import one of the
private keys printed by `npm run chain`. The local chain starts empty every time it restarts, so redeploy.

### Mainnet

Robinhood Chain (chain 4663), the chain the token projects in this folder run on. `npm run deploy:robinhood` only
prints a dry run until `RONIN_CONFIRM=yes`; then `npm run mint:open`, `npm run contract:reveal` and
`npm run contract:withdraw`. The full sequence is in [DEPLOY-MAINNET.md](DEPLOY-MAINNET.md).
