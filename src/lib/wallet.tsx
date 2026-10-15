// Wallet + contract state shared by the header and the recruitment office.
// Reading goes through the public RPC in deployment.json, so the counter shows without a wallet.
// ethers is loaded on demand, so it stays out of the first page load.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import deployment from "../data/deployment.json";

export { deployment };
export const deployed = deployment.address !== "";

const ABI = [
  "function mint(uint256 qty) payable",
  "function price() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function maxPerTx() view returns (uint256)",
  "function mintOpen() view returns (bool)",
  "function mintableBy(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "error MintClosed()",
  "error BadQuantity(uint256 max)",
  "error SoldOut(uint256 left)",
  "error WalletLimitReached(uint256 left)",
  "error WrongPayment(uint256 expected)",
];

interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, fn: (...args: any[]) => void): void;
  removeListener?(event: string, fn: (...args: any[]) => void): void;
}
const provider = (): Eip1193 | null => (window as unknown as { ethereum?: Eip1193 }).ethereum ?? null;

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Wei to a plain ETH string, without pulling ethers into the first page load. */
export function formatEther(wei: bigint) {
  const s = wei.toString().padStart(19, "0");
  const frac = s.slice(-18).replace(/0+$/, "");
  return frac ? `${s.slice(0, -18)}.${frac}` : s.slice(0, -18);
}

export type MintState = { minted: number; supply: number; price: bigint; perTx: number; open: boolean; mintable: number };

type Wallet = {
  account: string;
  chainId: number;
  hasWallet: boolean;
  rightChain: boolean;
  busy: boolean;
  error: string;
  state: MintState | null;
  connect(): Promise<void>;
  mint(qty: number): Promise<{ hash: string; ids: number[] }>;
  refresh(): void;
};

const Ctx = createContext<Wallet | null>(null);

async function readState(account: string): Promise<MintState> {
  const { Contract, JsonRpcProvider } = await import("ethers");
  // Reads can go through the site's own /rpc proxy, for visitors whose DNS blocks the chain's RPC.
  const read = (deployment as { readRpcUrl?: string }).readRpcUrl ?? deployment.rpcUrl;
  const url = read.startsWith("/") ? `${window.location.origin}${read}` : read;
  const ronin = new Contract(deployment.address, ABI, new JsonRpcProvider(url, deployment.chainId, { staticNetwork: true }));
  const [minted, supply, price, perTx, open, mintable] = await Promise.all([
    ronin.totalSupply(),
    ronin.maxSupply(),
    ronin.price(),
    ronin.maxPerTx(),
    ronin.mintOpen(),
    account ? ronin.mintableBy(account) : 0n,
  ]);
  return { minted: Number(minted), supply: Number(supply), price, perTx: Number(perTx), open, mintable: Number(mintable) };
}

/** Moves the wallet to the contract's chain, adding the chain first if the wallet has never seen it. */
async function useRightChain(w: Eip1193) {
  const chainId = `0x${deployment.chainId.toString(16)}`;
  try {
    await w.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (err) {
    if ((err as { code?: number }).code !== 4902) throw err;
    await w.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          chainName: deployment.chainName,
          rpcUrls: [deployment.rpcUrl],
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          ...(deployment.explorer ? { blockExplorerUrls: [deployment.explorer] } : {}),
        },
      ],
    });
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<MintState | null>(null);
  const [tick, setTick] = useState(0);
  const w = provider();

  useEffect(() => {
    if (!w) return;
    const onAccounts = (a: string[]) => setAccount(a[0] ?? "");
    const onChain = (c: string) => setChainId(parseInt(c, 16));
    // Accounts the wallet already shares with this site, without opening it.
    w.request({ method: "eth_accounts" }).then((a) => onAccounts(a as string[])).catch(() => {});
    w.request({ method: "eth_chainId" }).then((c) => onChain(c as string)).catch(() => {});
    w.on?.("accountsChanged", onAccounts);
    w.on?.("chainChanged", onChain);
    return () => {
      w.removeListener?.("accountsChanged", onAccounts);
      w.removeListener?.("chainChanged", onChain);
    };
  }, [w]);

  // Live counter: on load, when the account changes, after a mint, and every 20 seconds.
  useEffect(() => {
    if (!deployed) return;
    let live = true;
    const load = () => readState(account).then((s) => live && setState(s)).catch(() => live && setState(null));
    load();
    const id = window.setInterval(load, 20000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [account, tick]);

  const connect = useCallback(async () => {
    setError("");
    if (!w) return setError("No wallet found in this browser. Install MetaMask or open the site in a wallet app.");
    setBusy(true);
    try {
      const [a] = (await w.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(a ?? "");
      setChainId(parseInt((await w.request({ method: "eth_chainId" })) as string, 16));
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }, [w]);

  const mint = useCallback(
    async (qty: number) => {
      if (!w || !deployed) throw new Error("The contract is not deployed yet.");
      setBusy(true);
      try {
        await useRightChain(w);
        const { BrowserProvider, Contract } = await import("ethers");
        const signer = await new BrowserProvider(w).getSigner();
        const ronin = new Contract(deployment.address, ABI, signer);
        const price: bigint = await ronin.price();
        const tx = await ronin.mint(qty, { value: price * BigInt(qty) });
        const receipt = await tx.wait();
        const ids: number[] = [];
        for (const log of receipt?.logs ?? []) {
          const parsed = ronin.interface.parseLog(log);
          if (parsed?.name === "Transfer") ids.push(Number(parsed.args.tokenId));
        }
        return { hash: tx.hash as string, ids };
      } finally {
        setBusy(false);
        setTick((n) => n + 1);
      }
    },
    [w],
  );

  const value = useMemo<Wallet>(
    () => ({
      account,
      chainId,
      hasWallet: !!w,
      rightChain: chainId === deployment.chainId,
      busy,
      error,
      state,
      connect,
      mint,
      refresh: () => setTick((n) => n + 1),
    }),
    [account, chainId, w, busy, error, state, connect, mint],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet outside WalletProvider");
  return v;
}

/** Turns whatever the wallet or the contract threw into one plain sentence. */
export function explain(err: unknown): string {
  const e = err as { code?: unknown; shortMessage?: string; message?: string; revert?: { name?: string; args?: unknown[] }; info?: { error?: { code?: number } } };
  if (e.code === 4001 || e.code === "ACTION_REJECTED" || e.info?.error?.code === 4001) return "You closed the wallet without confirming. Nothing was sent.";
  const left = e.revert?.args?.[0];
  switch (e.revert?.name) {
    case "MintClosed":
      return "The mint is closed right now.";
    case "SoldOut":
      return `Not enough ronin left: ${left} remaining.`;
    case "WalletLimitReached":
      return `This wallet can only recruit ${left} more.`;
    case "BadQuantity":
      return `You can recruit up to ${left} per transaction.`;
    case "WrongPayment":
      return "The payment did not match the price. Refresh and try again.";
  }
  if (e.code === "INSUFFICIENT_FUNDS") return `This wallet does not have enough ${deployment.chainName} ETH.`;
  return e.shortMessage ?? e.message ?? "Something went wrong talking to the wallet.";
}
