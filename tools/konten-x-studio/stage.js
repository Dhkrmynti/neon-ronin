// The stage the content is filmed on. Every scene is a pure function of time: render.mjs calls
// window.setup(name, opts) once, then window.draw(t) for every frame, and screenshots it.
// Only the preview set (src/data/roster.json before the reveal) is ever shown: never the sealed drop.
import { render, layers, svg, hashSeed, mulberry32, CLANS, T } from "/src/art/ronin.js";

const roster = await (await fetch("/src/data/roster.json")).json();
const SEED = "neon-ronin-preview";
const TOK = roster.tokens;
const SUPPLY = roster.supply ?? 888;
const RATE = Object.fromEntries(CLANS);
const CLAN = {
  Ashigaru: { k: "足軽", c: "#9aa3b5", rank: "Common" },
  Samurai: { k: "侍", c: "#22e3ff", rank: "Less common" },
  Shinobi: { k: "忍", c: "#a774f9", rank: "Uncommon" },
  Sohei: { k: "僧兵", c: "#ff9a3c", rank: "Scarce" },
  Shogun: { k: "将軍", c: "#eedf39", rank: "Rare" },
  Ghost: { k: "幽霊", c: "#ff2cb2", rank: "Super rare" },
};
const NAMES = CLANS.map(([c]) => c);
const byClan = (c) => TOK.filter((t) => t.traits.Clan === c);
const FEATURED =
  TOK.find((t) => t.traits.Clan === "Shogun" && t.traits.Accessory !== "None" && t.traits.Weapon !== "None") ?? TOK[0];
// Shuffle order that alternates clans, so a fast flick-through shows the variety.
const MIX = (() => {
  const q = NAMES.map(byClan);
  const out = [];
  while (q.some((x) => x.length)) for (const x of q) if (x.length) out.push(x.shift());
  return out;
})();

// ---------- helpers ----------
const stage = document.getElementById("stage");
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const backOut = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
/** 0→1 over `f` seconds after `a`, 1→0 over `f` seconds before `b`. */
const win = (t, a, b, f = 0.3) => clamp(Math.min((t - a) / f, (b - t) / f));
const flicker = (t) => (t % 3.1 > 2.85 && t % 3.1 < 2.95 ? 0.35 : t % 3.1 > 3.0 ? 0.6 : 1);

function el(tag, css = {}, html, parent = stage) {
  const e = document.createElement(tag);
  // Anything placed with left/top/right/bottom is positioned, wherever it sits (stage children already are).
  if (!css.position && ["left", "top", "right", "bottom"].some((k) => k in css)) css = { position: "absolute", ...css };
  Object.assign(e.style, css);
  if (html != null) e.innerHTML = html;
  parent.append(e);
  return e;
}
const group = (css = {}) => el("div", { position: "absolute", inset: "0", ...css });
const cache = new Map();
const art = (t, id, bg) => {
  const k = `${id}:${bg}:${JSON.stringify(t)}`;
  if (!cache.has(k)) cache.set(k, render(t, id, bg, SEED));
  return cache.get(k);
};
const sized = (markup) => markup.replace('width="400" height="400"', 'width="100%" height="100%"');

// Seeded towers with lit windows, as on the site's rooftop.
function skyline(seed, depth) {
  const r = mulberry32(hashSeed(`${seed}:${depth}`)());
  const NEONS = ["#22e3ff", "#ff2cb2", "#eedf39", "#a774f9", "#b6ff3b"];
  const cfg = {
    far: { fill: "#161a3d", minH: 260, maxH: 470, minW: 50, maxW: 110, lit: 0.18, op: 0.55 },
    mid: { fill: "#0f1230", minH: 180, maxH: 380, minW: 70, maxW: 150, lit: 0.22, op: 0.75 },
    near: { fill: "#070814", minH: 90, maxH: 230, minW: 110, maxW: 220, lit: 0, op: 0 },
  }[depth];
  let s = "";
  for (let x = -20; x < 1600; ) {
    const w = cfg.minW + r() * (cfg.maxW - cfg.minW), h = cfg.minH + r() * (cfg.maxH - cfg.minH), top = 600 - h;
    s += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${cfg.fill}"/>`;
    if (depth !== "far" && r() < 0.35) s += `<path d="M${x - 14} ${top} Q${x + w / 2} ${top - 34} ${x + w + 14} ${top} Z" fill="${cfg.fill}"/>`;
    for (let wy = top + 14; wy < 590 && cfg.lit; wy += 18)
      for (let wx = x + 8; wx < x + w - 10; wx += 14)
        if (r() < cfg.lit) s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="6" height="8" fill="${NEONS[Math.floor(r() * 5)]}" opacity="${(cfg.op * (0.4 + r() * 0.6)).toFixed(2)}"/>`;
    x += w + (depth === "near" ? 0 : 6);
  }
  return `<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">${s}</svg>`;
}

/** The night city: sky, moon, three skylines and rain. Returns a draw(t) for the rain. */
function city(W, H, { moon = [0.68, 0.12, 0.16], heights = [0.62, 0.48, 0.24], rain = 1, parent = stage } = {}) {
  el("div", { position: "absolute", inset: "0" }, null, parent).className = "sky";
  if (moon) {
    const [mx, my, mr] = moon, r = mr * W;
    const m = el("div", { position: "absolute", left: `${mx * W - r}px`, top: `${my * H}px`, width: `${2 * r}px`, height: `${2 * r}px` }, null, parent);
    m.className = "moon";
  }
  ["far", "mid", "near"].forEach((d, i) =>
    el("div", { position: "absolute", left: "0", bottom: "0", width: "100%", height: `${heights[i] * H}px` }, skyline("neon-ronin-film", d), parent),
  );
  if (!rain) return () => {};
  const c = el("canvas", { position: "absolute", inset: "0", width: `${W}px`, height: `${H}px` }, null, parent);
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const r = mulberry32(99);
  const drops = Array.from({ length: Math.round(((W * H) / 9000) * rain) }, () => ({ x: r() * (W + 300), y: r() * H, len: 14 + r() * 26, v: 420 + r() * 420, hot: r() < 0.08 }));
  return (t) => {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 2;
    for (const d of drops) {
      const y = (d.y + d.v * t) % (H + d.len) - d.len;
      const x = ((d.x - 0.3 * d.v * t) % (W + 300) + W + 300) % (W + 300) - 150;
      ctx.strokeStyle = d.hot ? "rgba(34,227,255,.6)" : "rgba(170,190,255,.32)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - d.len * 0.3, y + d.len);
      ctx.stroke();
    }
  };
}

const neonTitle = (size) => `<p class="h neon" style="font-size:${size}px">Neon</p><p class="h" style="font-size:${size}px">Ronin</p>`;
const caBox = (ca) => `<div class="ca ${ca ? "" : "soon"}">${ca ? `CA ${ca}` : "CA soon"}</div>`;

// ---------- scenes ----------
const SCENES = {
  /** 15 s launch video: the title, a ronin built part by part, 888 flicked through, the six clans, the end card. */
  launch({ ca, domain }) {
    const W = 1080, H = 1080;
    const rain = city(W, H);
    const sign = el("div", { right: "60px", top: "150px" }, "<span>浪</span><span>人</span>");
    sign.className = "sign";

    const A = group();
    el("div", { left: "0", right: "0", top: "290px", textAlign: "center" }, neonTitle(205), A);
    el("p", { left: "0", right: "0", top: "800px", textAlign: "center", margin: 0 }, `<span class="kicker">Neo-Kyoto · Year 2347</span>`, A);

    const B = group();
    el("p", { left: "0", right: "0", top: "70px", textAlign: "center", margin: 0 }, `<span class="kicker">every ronin is built from parts</span>`, B);
    el("p", { left: "0", right: "0", top: "120px", textAlign: "center", fontSize: "84px", margin: 0 }, `Piece by piece`, B).className = "h center";
    const L = layers(FEATURED.traits, "launch", SEED);
    const PARTS = [
      ["back", "Accessory", [16, 22]], ["weapon", "Weapon", [84, 18]], ["body", "Armor", [50, 95]], ["head", "Head", [15, 44]],
      ["eyes", "Eyes", [22, 58]], ["mask", "Mask", [80, 64]], ["helmet", "Helmet", [74, 8]], ["accessory", "Accessory", [30, 84]],
    ].filter(([l, k]) => L[l] && FEATURED.traits[k] !== "None");
    const stack = el("div", { left: "190px", top: "250px", width: "700px", height: "700px" }, null, B);
    const parts = PARTS.map(([l, k, [lx, ly]], i) => {
      const p = el("div", { position: "absolute", inset: "0" }, sized(svg(L.defs + L[l])), stack);
      const tag = el("div", { left: `${lx}%`, top: `${ly}%` }, `<em>${k}</em>${FEATURED.traits[k]}`, stack);
      tag.className = "tag";
      return { p, tag, at: 1.9 + i * 0.45 };
    });

    const C = group();
    el("p", { left: "0", right: "0", top: "70px", textAlign: "center", margin: 0 }, `<span class="kicker">no two alike</span>`, C);
    el("p", { left: "0", right: "0", top: "120px", textAlign: "center", fontSize: "110px", margin: 0 }, `${SUPPLY} of them.`, C).className = "h center";
    const frame = el("div", { left: "230px", top: "290px", width: "620px", height: "620px" }, "", C);
    frame.className = "frame";
    const label = el("div", { left: "0", right: "0", top: "950px", textAlign: "center", font: "700 34px/1 var(--mono)", letterSpacing: ".14em" }, "", C);

    const D = group();
    el("p", { left: "0", right: "0", top: "70px", textAlign: "center", margin: 0 }, `<span class="kicker">one of them is 2%</span>`, D);
    el("p", { left: "0", right: "0", top: "120px", textAlign: "center", fontSize: "120px", margin: 0 }, `Six clans.`, D).className = "h center";
    const cols = NAMES.map((c, i) => {
      const t = byClan(c)[0];
      const col = el("div", { left: `${i * 180}px`, top: "330px", width: "180px", textAlign: "center" }, "", D);
      el("div", { width: "180px", height: "180px", position: "relative" }, t ? sized(art(t.traits, `c${t.id}`, false)) : "", col);
      el("p", { margin: "18px 0 0", font: "400 48px/1 var(--display)", color: CLAN[c].c }, CLAN[c].k, col);
      el("p", { margin: "14px 0 0", font: "700 22px/1 var(--mono)", letterSpacing: ".1em", textTransform: "uppercase" }, c, col);
      el("p", { margin: "16px 0 0", font: "400 56px/1 var(--display)", color: CLAN[c].c, textShadow: `0 0 24px ${CLAN[c].c}` }, `${RATE[c]}%`, col);
      return { col, at: 9.9 + i * 0.12, ghost: c === "Ghost" };
    });

    const E = group({ background: "rgba(6,7,18,.9)", display: "grid", placeContent: "center", justifyItems: "center", gap: "26px", textAlign: "center" });
    el("div", { position: "static" }, neonTitle(170), E);
    el("p", { position: "static", margin: 0, font: "400 46px/1 var(--display)", color: "var(--pink)" }, "浪人", E);
    el("p", { position: "static", margin: 0, font: "700 40px/1.2 var(--body)" }, `${SUPPLY} masterless robot samurai`, E);
    el("p", { position: "static", margin: 0 }, `<span class="meta">Robinhood Chain · 0.001 ETH · ${ca ? "mint live" : "mint soon"}</span>`, E);
    el("div", { position: "static" }, caBox(ca), E);
    el("div", { position: "static" }, `<span class="domain">${domain}</span>`, E);

    return {
      W, H, duration: 15,
      draw(t) {
        rain(t);
        sign.style.opacity = String(flicker(t) * win(t, -1, 1.7));
        A.style.opacity = String(win(t, -1, 1.7) * (t < 0.3 ? flicker(t * 10) : 1));
        B.style.opacity = String(win(t, 1.6, 6.6));
        for (const { p, tag, at } of parts) {
          const k = prog(t, at, at + 0.45);
          p.style.opacity = String(k);
          p.style.transform = `translateY(${(1 - backOut(k)) * -90}px)`;
          const q = prog(t, at + 0.2, at + 0.5);
          tag.style.opacity = String(q);
          tag.style.transform = `translate(-50%,-50%) scale(${0.8 + 0.2 * easeOut(q)})`;
        }
        C.style.opacity = String(win(t, 6.5, 9.9));
        const tok = MIX[Math.floor(Math.max(0, t - 6.5) / 0.11) % MIX.length];
        const key = `${tok.id}`;
        if (frame.dataset.k !== key) {
          frame.dataset.k = key;
          frame.innerHTML = sized(art(tok.traits, tok.id, true));
          label.innerHTML = `<span style="color:${CLAN[tok.traits.Clan].c}">#${String(tok.id).padStart(3, "0")} · ${tok.traits.Clan}</span>`;
        }
        D.style.opacity = String(win(t, 9.8, 12.5));
        for (const { col, at, ghost } of cols) {
          const k = backOut(prog(t, at, at + 0.4));
          col.style.opacity = String(prog(t, at, at + 0.25));
          col.style.transform = `translateY(${(1 - k) * 60}px) scale(${ghost ? 1 + 0.06 * Math.max(0, Math.sin((t - 11) * 6)) : 1})`;
        }
        E.style.opacity = String(prog(t, 12.2, 12.6));
      },
    };
  },

  /** 6 s loop for the CA post: ronin flick past ever slower and land on the seal. */
  ca({ ca }) {
    const W = 1080, H = 1080;
    const rain = city(W, H, { heights: [0.5, 0.36, 0.16] });
    el("p", { left: "0", right: "0", top: "56px", textAlign: "center", margin: 0 }, `<span class="kicker">${SUPPLY} sealed ronin</span>`);
    el("p", { left: "0", right: "0", top: "104px", textAlign: "center", fontSize: "88px", margin: 0 }, `Which one<br>is <span class="pink">yours?</span>`).className = "h center";
    const frame = el("div", { left: "290px", top: "320px", width: "500px", height: "500px" });
    frame.className = "frame";
    const sealed = el("img", { position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0" }, null, frame);
    sealed.src = "/public/hidden/sealed.svg";
    const pic = el("div", { position: "absolute", inset: "0" }, "", frame);
    const bottom = el("div", { left: "0", right: "0", top: "870px", display: "grid", justifyItems: "center", gap: "16px" }, `${caBox(ca)}<span class="meta">Robinhood Chain · ${SUPPLY} · 0.001 ETH</span>`);
    return {
      W, H, duration: 6,
      ready: () => sealed.decode(),
      draw(t) {
        rain(t);
        // Decelerating flick: fast at first, landing on the seal at 3.8 s.
        const n = Math.floor(14 * t - 1.6 * t * t);
        const landed = t >= 3.8;
        if (!landed) {
          const tok = MIX[Math.max(0, n) % MIX.length];
          if (pic.dataset.k !== `${tok.id}`) {
            pic.dataset.k = `${tok.id}`;
            pic.innerHTML = sized(art(tok.traits, tok.id, true));
          }
        }
        pic.style.opacity = landed ? "0" : "1";
        sealed.style.opacity = landed ? "1" : "0";
        const s = prog(t, 3.8, 4.05);
        frame.style.transform = landed ? `scale(${1 + 0.08 * (1 - easeOut(s))})` : "scale(1)";
        bottom.style.opacity = "1";
      },
    };
  },

  /** 6 s loop: one ronin trying on helmets, then blades, like the site's Armory. */
  armory({ domain }) {
    const W = 1080, H = 1080;
    const rain = city(W, H, { heights: [0.5, 0.36, 0.16], moon: [0.18, 0.08, 0.12] });
    el("p", { left: "0", right: "0", top: "56px", textAlign: "center", margin: 0 }, `<span class="kicker">the armory is open</span>`);
    el("p", { left: "0", right: "0", top: "104px", textAlign: "center", fontSize: "104px", margin: 0 }, `Forge <span class="pink">yours</span>`).className = "h center";
    const frame = el("div", { left: "250px", top: "250px", width: "580px", height: "580px" });
    frame.className = "frame";
    const row = el("div", { left: "170px", right: "170px", top: "870px", height: "84px", display: "grid", gridTemplateColumns: "180px 60px 1fr 60px", alignItems: "center",
      background: "linear-gradient(180deg,#4a2c1b,#3a2115)", border: "3px solid #150b06", font: "700 34px/1 var(--body)", color: "#fff" });
    const key = el("span", { position: "static", paddingLeft: "22px", font: "700 20px/1 var(--mono)", letterSpacing: ".18em", color: "#e9b949" }, "", row);
    el("span", { position: "static", textAlign: "center", fontSize: "44px" }, "‹", row);
    const val = el("span", { position: "static", textAlign: "center" }, "", row);
    el("span", { position: "static", textAlign: "center", fontSize: "44px" }, "›", row);
    el("div", { left: "40px", bottom: "34px" }, `<span class="domain">${domain} · armory</span>`);
    const base = { ...FEATURED.traits, Background: "Golden Palace", Accessory: "None" };
    delete base.Mon;
    const helmets = [...new Set(Object.values(T).flatMap((x) => x.Helmet.map(([v]) => v)))].filter((v) => v !== "None").slice(0, 6);
    const weapons = ["Plasma Katana", "Nodachi", "Kanabo", "Naginata", "Shakujo", "Kusarigama"];
    return {
      W, H, duration: 6,
      draw(t) {
        rain(t);
        const i = Math.floor(t / 0.5);
        const which = i < 6 ? ["Helmet", helmets[i]] : ["Weapon", weapons[(i - 6) % 6]];
        const traits = { ...base, Helmet: i < 6 ? which[1] : "Crescent Kabuto", Weapon: i < 6 ? "Katana" : which[1] };
        const k = `${traits.Helmet}|${traits.Weapon}`;
        if (frame.dataset.k !== k) {
          frame.dataset.k = k;
          frame.innerHTML = sized(art(traits, "armory", true));
          key.textContent = which[0].toUpperCase();
          val.textContent = which[1];
        }
        const pop = prog(t % 0.5, 0, 0.12);
        frame.style.transform = `scale(${1 + 0.025 * (1 - pop)})`;
        frame.style.outlineColor = pop < 1 ? "#fff" : "var(--cyan)";
      },
    };
  },

  /** Profile picture: the featured ronin's head on a neon moon. Safe for a round crop. */
  avatar() {
    const W = 1000, H = 1000;
    el("div", { inset: "0", background: "radial-gradient(circle at 50% 40%, #ff5fc8 0%, #b02a8c 34%, #2a0f4a 62%, #070814 82%)" });
    const L = layers(FEATURED.traits, "avatar", SEED);
    el("div", { left: "110px", top: "120px", width: "780px", height: "780px" }, svg(L.defs + L.head + L.eyes + L.mask + L.helmet).replace('width="400" height="400" viewBox="0 0 400 400"', 'width="100%" height="100%" viewBox="60 0 280 280"'));
    return { W, H, duration: 0, draw() {} };
  },

  /** Header 1500×500: the city, the wordmark top-left, one ronin per clan on the right. Bottom-left stays clear for the avatar. */
  banner({ domain }) {
    const W = 1500, H = 500;
    const rain = city(W, H, { moon: [0.5, 0.06, 0.09], heights: [0.8, 0.62, 0.3], rain: 0.6 });
    el("div", { left: "420px", top: "56px" }, `<p class="h neon" style="font-size:110px">Neon Ronin</p>`);
    el("p", { left: "424px", top: "184px", margin: 0 }, `<span class="kicker">${SUPPLY} masterless robot samurai · Robinhood Chain</span>`);
    el("div", { left: "424px", top: "236px" }, `<span class="domain">${domain}</span>`);
    NAMES.forEach((c, i) => {
      const t = byClan(c)[0];
      if (t) el("div", { left: `${780 + i * 118}px`, bottom: "-10px", width: "220px", height: "220px", filter: `drop-shadow(0 0 16px ${CLAN[c].c})` }, sized(art(t.traits, `b${t.id}`, false)));
    });
    return { W, H, duration: 0, draw: rain };
  },

  /** 16:9 post: the six clans and their drop rates. */
  clans({ domain }) {
    const W = 1600, H = 900;
    city(W, H, { moon: [0.86, 0.04, 0.07], heights: [0.5, 0.36, 0.14], rain: 0.5 })(1.3);
    el("p", { left: "0", right: "0", top: "50px", textAlign: "center", margin: 0 }, `<span class="kicker">${SUPPLY} ronin · six clans · one city</span>`);
    el("p", { left: "0", right: "0", top: "96px", textAlign: "center", fontSize: "92px", margin: 0 }, `Which clan <span class="pink">are you?</span>`).className = "h center";
    NAMES.forEach((c, i) => {
      const t = byClan(c)[0];
      const col = el("div", { left: `${50 + i * 252}px`, top: "250px", width: "236px", height: "590px", textAlign: "center", background: "rgba(7,8,20,.82)", borderTop: `6px solid ${CLAN[c].c}`, padding: "18px 10px" });
      el("p", { position: "static", margin: 0, font: "400 50px/1 var(--display)", color: CLAN[c].c }, CLAN[c].k, col);
      el("div", { position: "relative", width: "216px", height: "216px", margin: "10px 0" }, t ? sized(art(t.traits, `k${t.id}`, false)) : "", col);
      el("p", { position: "static", margin: 0, font: "400 29px/1 var(--display)", textTransform: "uppercase" }, c, col);
      el("p", { position: "static", margin: "8px 0 0", font: "700 16px/1 var(--mono)", letterSpacing: ".16em", textTransform: "uppercase", color: "#9096c2" }, CLAN[c].rank, col);
      el("p", { position: "static", margin: "22px 0 0", font: "400 76px/1 var(--display)", color: CLAN[c].c, textShadow: `0 0 26px ${CLAN[c].c}` }, `${RATE[c]}%`, col);
    });
    el("div", { left: "50px", bottom: "26px" }, `<span class="domain">${domain}</span>`);
    return { W, H, duration: 0, draw() {} };
  },

  /** 4:5 post: the drop is sealed, and why that is fair. */
  sealed({ domain }) {
    const W = 1080, H = 1350;
    city(W, H, { moon: false, heights: [0.4, 0.3, 0.12], rain: 0.8 })(2.1);
    el("p", { left: "0", right: "0", top: "70px", textAlign: "center", margin: 0 }, `<span class="kicker">no snipes · no favourites</span>`);
    el("p", { left: "0", right: "0", top: "120px", textAlign: "center", fontSize: "100px", margin: 0 }, `${SUPPLY} ronin.<br><span class="pink">All sealed.</span>`).className = "h center";
    const f = el("div", { left: "240px", top: "380px", width: "600px", height: "600px" });
    f.className = "frame";
    const img = el("img", { width: "100%", height: "100%" }, null, f);
    img.src = "/public/hidden/sealed.svg";
    el("div", { left: "0", right: "0", top: "1000px", bottom: "0", background: "linear-gradient(180deg, rgba(7,8,20,0) 0%, rgba(7,8,20,.92) 18%)" });
    el("p", { left: "90px", right: "90px", top: "1030px", textAlign: "center", margin: 0, font: "400 34px/1.4 var(--body)", color: "#d7dcef" },
      "Nobody can pick a Ghost before the mint. Not even us.<br>The fingerprint of all " + SUPPLY + " is locked on-chain.");
    el("p", { left: "0", right: "0", top: "1180px", textAlign: "center", margin: 0, font: "700 22px/1 var(--mono)", color: "var(--vermilion)" }, roster.provenance ? `provenance ${roster.provenance.slice(0, 18)}…${roster.provenance.slice(-6)}` : "");
    el("div", { left: "40px", bottom: "40px" }, `<span class="domain">${domain}</span>`);
    return { W, H, duration: 0, ready: () => img.decode(), draw() {} };
  },

  /** 4:5 post: the rarest clan. */
  ghost({ domain }) {
    const W = 1080, H = 1350;
    el("div", { inset: "0", background: "radial-gradient(70% 50% at 50% 55%, #3a0f3a 0%, #0a0612 70%)" });
    const r = mulberry32(5);
    let stars = "";
    for (let i = 0; i < 70; i++) stars += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(1 + r() * 3).toFixed(1)}" fill="#ff2cb2" opacity="${(0.2 + r() * 0.6).toFixed(2)}"/>`;
    el("div", { inset: "0" }, `<svg width="${W}" height="${H}">${stars}</svg>`);
    el("p", { left: "0", right: "0", top: "110px", textAlign: "center", margin: 0, font: "400 420px/1 var(--display)", color: "transparent", WebkitTextStroke: "4px #ff2cb2", opacity: ".55" }, "2%");
    const g = byClan("Ghost")[0] ?? FEATURED;
    el("div", { left: "150px", top: "290px", width: "780px", height: "780px", filter: "drop-shadow(0 0 40px #ff2cb2)" }, sized(art(g.traits, `g${g.id}`, false)));
    el("p", { left: "0", right: "0", top: "60px", textAlign: "center", margin: 0 }, `<span class="kicker" style="color:#ff2cb2">幽霊 · super rare</span>`);
    el("p", { left: "0", right: "0", top: "1120px", textAlign: "center", fontSize: "96px", margin: 0 }, `Ghost`).className = "h neon center";
    el("p", { left: "0", right: "0", top: "1225px", textAlign: "center", margin: 0, font: "400 30px/1.3 var(--body)", color: "#e6d0ea" }, "destroyed in battle. refused to power down.");
    el("div", { left: "40px", top: "40px" }, `<span class="domain">${domain}</span>`);
    return { W, H, duration: 0, draw() {} };
  },

  /** Square engagement post: pick a clan in the replies. */
  pick({ domain }) {
    const W = 1080, H = 1080;
    city(W, H, { moon: false, heights: [0.4, 0.3, 0.1], rain: 0.5 })(0.7);
    el("p", { left: "0", right: "0", top: "50px", textAlign: "center", fontSize: "84px", margin: 0 }, `Pick your <span class="pink">clan</span>`).className = "h center";
    el("p", { left: "0", right: "0", top: "150px", textAlign: "center", margin: 0 }, `<span class="kicker">reply with a kanji</span>`);
    NAMES.forEach((c, i) => {
      const t = byClan(c)[i === 0 ? 1 : 0] ?? byClan(c)[0];
      const x = 40 + (i % 3) * 340, y = 220 + Math.floor(i / 3) * 400;
      const card = el("div", { left: `${x}px`, top: `${y}px`, width: "320px", height: "380px", background: "rgba(7,8,20,.86)", border: `3px solid ${CLAN[c].c}`, boxShadow: `0 0 30px ${CLAN[c].c}55`, overflow: "hidden" });
      el("div", { position: "absolute", left: "40px", top: "20px", width: "240px", height: "240px" }, t ? sized(art(t.traits, `p${t.id}`, false)) : "", card);
      el("p", { position: "absolute", left: "0", right: "0", top: "262px", textAlign: "center", margin: 0, font: "400 52px/1 var(--display)", color: CLAN[c].c }, CLAN[c].k, card);
      el("p", { position: "absolute", left: "0", right: "0", top: "326px", textAlign: "center", margin: 0, font: "700 22px/1 var(--mono)", letterSpacing: ".16em", textTransform: "uppercase" }, `${c} · ${RATE[c]}%`, card);
    });
    el("div", { right: "40px", bottom: "28px" }, `<span class="domain">${domain}</span>`);
    return { W, H, duration: 0, draw() {} };
  },
};

let scene = null;
window.setup = async (name, opts) => {
  stage.innerHTML = "";
  scene = SCENES[name](opts);
  Object.assign(stage.style, { width: `${scene.W}px`, height: `${scene.H}px` });
  await document.fonts.ready;
  if (scene.ready) await scene.ready();
  scene.draw(0);
  return { W: scene.W, H: scene.H, duration: scene.duration };
};
window.draw = (t) => scene.draw(t);
window.stageReady = true;
