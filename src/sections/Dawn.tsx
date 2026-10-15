import { useRef, useState } from "react";
import { CLAN_NAMES, REVEALED, SUPPLY, byClan, cutoutUrl, mintedUrl, pad } from "../lib/roster";
import { gsap, MOTION_OK, useGSAP } from "../lib/motion";
import { deployed, deployment, explain, formatEther, short, useWallet } from "../lib/wallet";
import { Edge } from "../components/Edge";
import { Rain } from "../components/Rain";

const FAQ: [string, string][] = [
  [
    "What is Neon Ronin?",
    `A collection of ${SUPPLY.toLocaleString("en-US")} generated robot samurai, minted as NFTs on Robinhood Chain. Each one is assembled from layered traits: clan, armor, helmet, mask, eyes, weapon, accessory and neon.`,
  ],
  ["How rare is my ronin?", "The clan is rolled first, from Ashigaru (48%) down to Ghost (2%). The clan then decides which parts your ronin can roll. The scroll of ranks above has every number."],
  ["What do I get?", "Your ronin as a resolution-free SVG, with its background and as a transparent cut-out, plus its full trait metadata. Holders may create and sell derivatives of the ronin they own."],
  ["When can I mint?", "Mint opens on Robinhood Chain at 0.001 ETH per ronin, up to 10 per wallet. Follow X and Discord for the date."],
  ["Why does my ronin look sealed?", `So nobody can pick the rare ones. Every ronin shows the same seal until all ${SUPPLY} have masters, then the real art is revealed. The order was fixed before the mint: the contract stores a fingerprint (provenance hash) of every image.`],
  ["How do I mint?", "Install MetaMask or another Ethereum wallet, add some ETH, press Connect, choose how many and confirm. Every transaction includes a gas fee."],
];

// One ronin per clan walks the ridge at dawn.
const WALKERS = CLAN_NAMES.map((c) => byClan(c)[0]).filter(Boolean);

function Office() {
  const { account, rightChain, busy, error, state, connect, mint } = useWallet();
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState("");
  const [recruited, setRecruited] = useState<{ hash: string; ids: number[] } | null>(null);

  const open = deployed && !!state?.open;
  const soldOut = !!state && state.minted >= state.supply;
  const max = Math.max(1, Math.min(state?.perTx ?? 5, account && state ? state.mintable || 1 : 5));
  const cost = state ? formatEther(state.price * BigInt(qty)) : "";
  const tx = recruited && deployment.explorer ? `${deployment.explorer}/tx/${recruited.hash}` : "";

  const onMint = async () => {
    if (!open) return setStatus(deployed ? "The mint is closed right now." : `Mint is not open yet. The contract goes live on ${deployment.chainName} first.`);
    try {
      setRecruited(null);
      setStatus("Confirm in your wallet…");
      const r = await mint(qty);
      setRecruited(r);
      setStatus(`Recruited ${r.ids.map((id) => "#" + pad(id)).join(", ")}. Transaction ${short(r.hash)}.`);
    } catch (e) {
      setStatus(explain(e));
    }
  };

  return (
    <div className="office">
      <p className="mono office-top">
        <span className={`dot ${account ? "on" : ""}`} /> Recruitment office · {account ? short(account) : "wallet offline"}
      </p>
      <h3>Recruit a ronin</h3>
      <p className="office-state mono">
        {!deployed ? "Mint opens soon" : !state ? `Reading ${deployment.chainName}…` : soldOut ? "All ronin have masters" : open ? `Live on ${deployment.chainName}` : "Mint closed"}
        {account && deployed && !rightChain && ` · wallet will switch to ${deployment.chainName}`}
      </p>
      {state && (
        <div className="supply">
          <div className="supply-bar">
            <i style={{ width: `${(state.minted / state.supply) * 100}%` }} />
          </div>
          <p className="mono">
            <b>{state.minted}</b> / {state.supply} recruited · {formatEther(state.price)} ETH each
          </p>
        </div>
      )}
      <div className="qty" role="group" aria-label="How many">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One fewer" disabled={qty <= 1}>
          −
        </button>
        <output aria-live="polite">{qty}</output>
        <button onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="One more" disabled={qty >= max}>
          +
        </button>
      </div>
      {account ? (
        <button className="btn btn-neon btn-big" onClick={onMint} disabled={busy || soldOut}>
          {busy ? "Recruiting…" : `Mint ${qty} ronin${cost ? ` · ${cost} ETH` : ""}`}
        </button>
      ) : (
        <button className="btn btn-neon btn-big" onClick={connect} disabled={busy}>
          {busy ? "Connecting…" : "Connect wallet"}
        </button>
      )}
      <p className="office-log mono" role="status">
        {error || status || (account && state?.open ? `This wallet can recruit ${state.mintable} more.` : `Up to ${state?.perTx ?? 5} per transaction.`)}
        {tx && (
          <>
            {" "}
            <a className="link" href={tx} target="_blank" rel="noreferrer">
              View ↗
            </a>
          </>
        )}
      </p>
      {recruited && recruited.ids.length > 0 && (
        <ul className="recruits">
          {recruited.ids.map((id) => (
            <li key={id}>
              <img src={mintedUrl(id)} alt={`Neon Ronin #${id}`} />
              <span className="mono">
                #{pad(id)}
                {!REVEALED && " · sealed"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Dawn() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: 0.6 } });
        tl.fromTo(".dawn-sun", { yPercent: 60 }, { yPercent: -10, ease: "none" }, 0).fromTo(".dawn-rain", { opacity: 1 }, { opacity: 0, ease: "none" }, 0);
        gsap.utils.toArray<HTMLElement>(".walker").forEach((el, i) => {
          gsap.fromTo(el, { x: () => -window.innerWidth * 0.2 }, { x: () => window.innerWidth * 0.12, ease: "none", scrollTrigger: { trigger: ".ridge", start: "top bottom", end: "bottom top", scrub: 1 + i * 0.2 } });
        });
        gsap.from(".farewell span", { y: 60, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power4.out", scrollTrigger: { trigger: ".farewell", start: "top 85%" } });
      });
    },
    { scope: root },
  );

  return (
    <section id="mint" className="dawn" ref={root}>
      <Edge kind="ridge" color="var(--dawn-top)" />
      <div className="dawn-sky" aria-hidden="true">
        <div className="dawn-sun" />
      </div>
      <Rain className="dawn-rain" density={0.5} />

      <div className="dawn-inner">
        <div className="dawn-head">
          <p className="kicker mono">06 · Dawn</p>
          <h2>
            Every ronin needs a <em>master</em>
          </h2>
        </div>
        <Office />
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="ridge" aria-hidden="true">
        {WALKERS.map((t, i) => (
          <img key={t.id} className="walker" src={cutoutUrl(t.id)} alt="" style={{ left: `${8 + i * 15}%` }} />
        ))}
      </div>

      <footer className="footer">
        <p className="farewell">
          <span>Arigato,</span> <span className="neon-word">ronin</span>
        </p>
        <nav className="mono">
          <a href="https://x.com" target="_blank" rel="noreferrer">
            X
          </a>
          <a href="https://discord.com" target="_blank" rel="noreferrer">
            Discord
          </a>
          {deployed && deployment.explorer && (
            <a href={`${deployment.explorer}/address/${deployment.address}`} target="_blank" rel="noreferrer">
              Contract
            </a>
          )}
          <span>© 2347 Neo-Kyoto Armory</span>
        </nav>
      </footer>
    </section>
  );
}
