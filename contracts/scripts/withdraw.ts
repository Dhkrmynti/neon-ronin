// Sends everything the mint has paid in to the owner wallet.
//   npx hardhat run scripts/withdraw.ts --network robinhood
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "deployment.json");
const { address, chainId } = JSON.parse(readFileSync(file, "utf8")) as { address: string; chainId: number };
const { ethers } = await network.getOrCreate();
const actual = Number((await ethers.provider.getNetwork()).chainId);
if (!address || actual !== chainId) throw new Error(`deployment.json is for chain ${chainId}, but this network is chain ${actual}.`);

const ronin = await ethers.getContractAt("NeonRonin", address);
const owner = await ronin.owner();
const held = await ethers.provider.getBalance(address);
if (held === 0n) {
  console.log("Nothing to withdraw.");
} else {
  await (await ronin.withdraw()).wait();
  console.log(`Withdrew ${ethers.formatEther(held)} ETH to ${owner}.`);
}
