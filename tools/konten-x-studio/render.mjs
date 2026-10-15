/**
 * Renders the X content for Neon Ronin into konten-x/ (gitignored) from the art library and the
 * site's preview set. Never touches the sealed drop. No server needed.
 *
 *   node render.mjs                                  everything, "CA soon" on the CA cards
 *   node render.mjs launch ca --ca 0x…               the video and the CA gif with the real contract address
 *   node render.mjs --domain neonronin.art           another domain on every piece
 *   names: avatar banner launch ca armory clans sealed ghost pick
 */
import { chromium } from "playwright-core";
import ffmpeg from "ffmpeg-static";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "konten-x");
const FRAMES = path.join(import.meta.dirname, ".frames");
const SITE = "http://ronin.local";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".png": "image/png" };
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const CA = flag("ca", "");
const DOMAIN = flag("domain", "neonronin.xyz");
const only = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const want = (k) => !only.length || only.includes(k);

if (JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/roster.json"), "utf8")).revealed === false && !fs.existsSync(path.join(ROOT, "public/hidden/sealed.svg")))
  throw new Error("public/hidden/sealed.svg is missing. Run `npm run generate -- --drop …` in the project root first.");

const folder = (name) => {
  const d = path.join(OUT, name);
  fs.mkdirSync(d, { recursive: true });
  return d;
};
const sizeMB = (f) => (fs.statSync(f).size / 1048576).toFixed(2);
function ff(a) {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...a], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${a.join(" ")}`);
}
/** Frames to an MP4 that X takes as is: H.264, yuv420p, fast start. */
const mp4 = (dir, file, fps) =>
  ff(["-framerate", String(fps), "-i", path.join(dir, "%05d.jpg"), "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file]);
/** An MP4 to a looping GIF with its own palette, kept well under X's 15 MB. */
function gif(src, file, { width = 600, fps = 15 } = {}) {
  const pal = file.replace(/\.gif$/, ".palette.png");
  ff(["-i", src, "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`, pal]);
  ff(["-i", src, "-i", pal, "-lavfi", `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4`, "-loop", "0", file]);
  fs.rmSync(pal);
}

const b = await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb"] });

/** A tab on the stage; every request is answered from the project folder. */
async function stage(name) {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1600 }, deviceScaleFactor: 1 });
  await ctx.route(`${SITE}/**`, (route) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(route.request().url()).pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ status: 200, contentType: TYPES[path.extname(file)] || "application/octet-stream", body: fs.readFileSync(file) });
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error("  page error:", String(e)));
  await page.goto(`${SITE}/tools/konten-x-studio/stage.html`, { waitUntil: "load" });
  await page.waitForFunction(() => window.stageReady === true);
  const size = await page.evaluate(([n, o]) => window.setup(n, o), [name, { ca: CA, domain: DOMAIN }]);
  await page.setViewportSize({ width: size.W, height: size.H });
  return { ctx, page, size };
}

async function still(name, dir, file) {
  console.log(name);
  const { ctx, page } = await stage(name);
  const out = path.join(folder(dir), `${file}.png`);
  await page.locator("#stage").screenshot({ path: out });
  console.log(`  ${path.relative(ROOT, out)} ${sizeMB(out)} MB`);
  await ctx.close();
}

async function film(name, dir, file, { fps = 30, gifWidth = 0, gifOnly = false } = {}) {
  console.log(name);
  const { ctx, page, size } = await stage(name);
  const frames = path.join(FRAMES, name);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  const total = Math.round(size.duration * fps);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.draw(t), i / fps);
    fs.writeFileSync(path.join(frames, `${String(i).padStart(5, "0")}.jpg`), await page.locator("#stage").screenshot({ type: "jpeg", quality: 92 }));
  }
  const d = folder(dir);
  const video = path.join(d, `${file}.mp4`);
  mp4(frames, video, fps);
  let line = `  ${path.relative(ROOT, video)} ${sizeMB(video)} MB`;
  if (gifWidth) {
    const g = path.join(d, `${file}.gif`);
    gif(video, g, { width: gifWidth });
    line += ` · .gif ${sizeMB(g)} MB`;
    if (gifOnly) fs.rmSync(video);
  }
  console.log(line);
  await ctx.close();
}

try {
  const soon = CA ? "" : "-soon";
  if (want("avatar")) await still("avatar", "00-brand", "neon-ronin-avatar");
  if (want("banner")) await still("banner", "00-brand", "neon-ronin-banner");
  if (want("launch")) await film("launch", "01-video-launch", `neon-ronin-launch${soon}`);
  if (want("ca")) await film("ca", "02-gif-ca", `neon-ronin-ca${soon}`, { gifWidth: 600 });
  if (want("clans")) await still("clans", "03-six-clans", "neon-ronin-six-clans");
  if (want("sealed")) await still("sealed", "04-sealed", "neon-ronin-sealed");
  if (want("ghost")) await still("ghost", "05-ghost", "neon-ronin-ghost-2pct");
  if (want("pick")) await still("pick", "06-pick-your-clan", "neon-ronin-pick-your-clan");
  if (want("armory")) await film("armory", "07-armory", "neon-ronin-forge-yours", { gifWidth: 600 });
} finally {
  await b.close();
  fs.rmSync(FRAMES, { recursive: true, force: true });
}
