// Opens or closes the public mint on the contract in ../src/data/deployment.json, from the owner wallet.
//   RONIN_OPEN=1 npx hardhat run scripts/mint-open.ts --network robinhood   (0 closes it)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "deployment.json");
const { address, chainId } = JSON.parse(readFileSync(file, "utf8")) as { address: string; chainId: number };
const { ethers } = await network.getOrCreate();
const actual = Number((await ethers.provider.getNetwork()).chainId);
if (!address || actual !== chainId) throw new Error(`deployment.json is for chain ${chainId}, but this network is chain ${actual}.`);

const open = process.env.RONIN_OPEN !== "0";
const ronin = await ethers.getContractAt("NeonRonin", address);
await (await ronin.setMintOpen(open)).wait();
console.log(`Mint ${open ? "opened" : "closed"} on ${address}. totalSupply ${await ronin.totalSupply()} / ${await ronin.maxSupply()}`);
