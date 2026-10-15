// Points the contract at the real metadata after `npm run reveal` and the site upload.
//   RONIN_BASE_URI=https://<domain>/collection/metadata/ npx hardhat run scripts/reveal.ts --network robinhood
//   RONIN_FREEZE=1 also freezes the metadata for good (it can never be moved again).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "deployment.json");
const { address, chainId } = JSON.parse(readFileSync(file, "utf8")) as { address: string; chainId: number };
const { ethers } = await network.getOrCreate();
const actual = Number((await ethers.provider.getNetwork()).chainId);
if (!address || actual !== chainId) throw new Error(`deployment.json is for chain ${chainId}, but this network is chain ${actual}.`);

const base = process.env.RONIN_BASE_URI ?? "";
if (!base.endsWith("/collection/metadata/")) throw new Error("Set RONIN_BASE_URI to https://<domain>/collection/metadata/ (ending in a slash).");
// Make sure the real metadata is actually online before wallets start reading it.
const probe = await fetch(`${base}1.json`).catch(() => null);
if (!probe?.ok) throw new Error(`${base}1.json is not reachable. Run npm run reveal, rebuild and upload the site first.`);

const ronin = await ethers.getContractAt("NeonRonin", address);
await (await ronin.setBaseURI(base)).wait();
console.log(`tokenURI(1) is now ${await ronin.tokenURI(1).catch(() => "(no token #1 yet)")}`);
if (process.env.RONIN_FREEZE === "1") {
  await (await ronin.freezeMetadata()).wait();
  console.log("Metadata frozen for good.");
}
