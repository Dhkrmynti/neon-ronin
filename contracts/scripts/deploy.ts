// Deploys NeonRonin and tells the site where it lives by writing ../src/data/deployment.json.
//   npm run deploy:local       (needs `npm run node` running in another terminal)
//   npm run deploy:sepolia     (needs SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY in the Hardhat keystore)
//   npm run deploy:robinhood   (mainnet, real ETH: needs ROBINHOOD_PRIVATE_KEY in the keystore and RONIN_CONFIRM=yes)
//
// Terms come from the generated collection and these environment variables:
//   RONIN_PRICE       price per ronin in ETH                      (default 0.001)
//   RONIN_PER_WALLET  most one wallet may mint                    (default 10)
//   RONIN_BASE_URI    where token JSON is served from, ending "/": https://<domain>/hidden/ until the reveal
//                     (default: the local dev server; required off local)
//   RONIN_ROYALTY_TO  who receives the 5% royalty                 (default: the deployer)
//   RONIN_OPEN        "1" opens the mint right away               (default: on local, off elsewhere)
//   RONIN_CONFIRM     must be "yes" to deploy to a mainnet
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// Written by `npm run generate -- --drop …`: the sealed drop's size and provenance hash.
const drop = JSON.parse(readFileSync(join(ROOT, "public", "provenance.json"), "utf8")) as { provenance: string; supply: number };

// What the site needs to know about each network, keyed by the network name in hardhat.config.ts.
const CHAINS: Record<string, { chainName: string; rpcUrl: string; explorer: string; mainnet: boolean; readRpcUrl?: string }> = {
  localhost: { chainName: "Hardhat local", rpcUrl: "http://127.0.0.1:8545", explorer: "", mainnet: false },
  sepolia: { chainName: "Sepolia", rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com", explorer: "https://sepolia.etherscan.io", mainnet: false },
  robinhood: {
    chainName: "Robinhood Chain",
    rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
    explorer: "https://explorer.mainnet.chain.robinhood.com",
    // The site reads through its own nginx proxy (scripts/install-server.sh): Indonesian DNS blocks the RPC.
    readRpcUrl: "/rpc",
    mainnet: true,
  },
};

const { ethers, networkName } = await network.getOrCreate();
const chain = CHAINS[networkName];
if (!chain) throw new Error(`No site settings for network "${networkName}". Add it to CHAINS in scripts/deploy.ts.`);
const chainId = (await ethers.provider.getNetwork()).chainId;
const local = networkName === "localhost";

// The contract can only mint what has art: supply is the size of the generated drop.
const SUPPLY = drop.supply;
const PRICE = ethers.parseEther(process.env.RONIN_PRICE ?? "0.001");
const PER_WALLET = Number(process.env.RONIN_PER_WALLET ?? 10);
const PER_TX = Math.min(5, PER_WALLET);
// Until the reveal every token points at its sealed placeholder in /hidden/.
const BASE_URI = process.env.RONIN_BASE_URI ?? (local ? "http://localhost:5195/hidden/" : "");
const OPEN = process.env.RONIN_OPEN ? process.env.RONIN_OPEN === "1" : local;
const ROYALTY_BPS = 500;

const [deployer] = await ethers.getSigners();
const ROYALTY_TO = process.env.RONIN_ROYALTY_TO ?? deployer.address;

// Off this computer the metadata has to be reachable by wallets and marketplaces.
if (!local && (!BASE_URI || /localhost|127\.0\.0\.1/.test(BASE_URI)))
  throw new Error("Set RONIN_BASE_URI to a public address for the token JSON (https://… or ipfs://…/), ending in a slash.");
if (!local && !BASE_URI.endsWith("/")) throw new Error(`RONIN_BASE_URI must end in "/": ${BASE_URI}`);

const balance = await ethers.provider.getBalance(deployer.address);
const factory = await ethers.getContractFactory("NeonRonin");
const args = [BASE_URI, SUPPLY, PRICE, PER_WALLET, PER_TX, drop.provenance, ROYALTY_TO, ROYALTY_BPS] as const;
const gas = await ethers.provider.estimateGas(await factory.getDeployTransaction(...args));
const { maxFeePerGas, gasPrice } = await ethers.provider.getFeeData();
const cost = gas * (maxFeePerGas ?? gasPrice ?? 0n);

console.log(`Network     ${chain.chainName} (chain ${chainId})${chain.mainnet ? "  ** MAINNET, REAL ETH **" : ""}`);
console.log(`Deployer    ${deployer.address}  balance ${ethers.formatEther(balance)} ETH`);
console.log(`Terms       supply ${SUPPLY} · price ${ethers.formatEther(PRICE)} ETH · ${PER_WALLET}/wallet · ${PER_TX}/tx`);
console.log(`Royalty     ${ROYALTY_BPS / 100}% to ${ROYALTY_TO}`);
console.log(`Metadata    ${BASE_URI}<id>.json`);
console.log(`Provenance  ${drop.provenance}`);
console.log(`Gas         ~${gas} units, up to ~${ethers.formatEther(cost)} ETH`);
console.log(`Mint        ${OPEN ? "opens right after deploy" : "stays closed until setMintOpen(true)"}`);

if (balance < cost) throw new Error("The deployer does not have enough ETH for gas.");
if (chain.mainnet && process.env.RONIN_CONFIRM !== "yes") {
  console.log("\nDry run only. Supply, price and limits can never change after this. Check every line above,");
  console.log("then run again with RONIN_CONFIRM=yes to deploy.");
  process.exit(0);
}

const ronin = await ethers.deployContract("NeonRonin", [...args]);
await ronin.waitForDeployment();
const address = await ronin.getAddress();
if (OPEN) await (await ronin.setMintOpen(true)).wait();

const { mainnet: _, ...site } = chain;
const file = join(ROOT, "src", "data", "deployment.json");
writeFileSync(file, JSON.stringify({ address, chainId: Number(chainId), ...site }, null, 2) + "\n");

console.log(`\nNeonRonin is at ${address}${OPEN ? " (mint open)" : " (mint closed: call setMintOpen(true) when ready)"}`);
if (chain.explorer) console.log(`${chain.explorer}/address/${address}`);
console.log(`Wrote ${file}`);
