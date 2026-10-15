import { useMemo } from "react";
import { hashSeed, mulberry32 } from "../art/ronin";

const NEONS = ["#22e3ff", "#ff2cb2", "#eedf39", "#a774f9", "#b6ff3b"];

type Props = { seed: string; depth: "far" | "mid" | "near"; className?: string };

// A seeded row of towers with lit windows, 1600 wide. Three depths stack into the hero city.
export function Skyline({ seed, depth, className = "" }: Props) {
  const markup = useMemo(() => {
    const r = mulberry32(hashSeed(`${seed}:${depth}`)());
    const cfg = {
      far: { fill: "#161a3d", minH: 260, maxH: 470, minW: 50, maxW: 110, lit: 0.18, op: 0.55 },
      mid: { fill: "#0f1230", minH: 180, maxH: 380, minW: 70, maxW: 150, lit: 0.22, op: 0.75 },
      near: { fill: "#070814", minH: 90, maxH: 230, minW: 110, maxW: 220, lit: 0.12, op: 0.9 },
    }[depth];
    let s = "";
    let x = -20;
    while (x < 1600) {
      const w = cfg.minW + r() * (cfg.maxW - cfg.minW);
      const h = cfg.minH + r() * (cfg.maxH - cfg.minH);
      const top = 600 - h;
      s += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${cfg.fill}"/>`;
      // Pagoda-style roof caps on some near and mid towers.
      if (depth !== "far" && r() < 0.35)
        s += `<path d="M${x - 14} ${top} Q${x + w / 2} ${top - 34} ${x + w + 14} ${top} Z" fill="${cfg.fill}"/>`;
      if (depth !== "near")
        for (let wy = top + 14; wy < 590; wy += 18)
          for (let wx = x + 8; wx < x + w - 10; wx += 14)
            if (r() < cfg.lit)
              s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="6" height="8" fill="${NEONS[Math.floor(r() * NEONS.length)]}" opacity="${(cfg.op * (0.4 + r() * 0.6)).toFixed(2)}"/>`;
      // A vertical neon sign now and then.
      if (depth === "mid" && r() < 0.18) {
        const c = NEONS[Math.floor(r() * NEONS.length)];
        s += `<rect x="${(x + w - 18).toFixed(0)}" y="${(top + 20).toFixed(0)}" width="12" height="${(60 + r() * 60).toFixed(0)}" rx="3" fill="${c}" opacity="0.85"/>`;
      }
      x += w + (depth === "near" ? 0 : 6);
    }
    return s;
  }, [seed, depth]);

  return (
    <svg
      className={`skyline skyline-${depth} ${className}`}
      viewBox="0 0 1600 600"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
