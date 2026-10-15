// The drawn border on top of a section, in that section's ground colour, rising into the one above.
type Kind = "roofs" | "tiles" | "bricks" | "waves" | "ridge";

function shape(kind: Kind): string {
  switch (kind) {
    case "roofs": {
      // Temple roofs with upturned eaves: [centre, width, height].
      const roofs = [[90, 220, 52], [330, 300, 96], [560, 180, 44], [800, 360, 110], [1040, 200, 58], [1270, 320, 92], [1500, 220, 60]];
      let s = `<rect y="104" width="1600" height="16"/>`;
      for (const [c, w, h] of roofs) {
        const b = 120, l = c - w / 2, r = c + w / 2;
        s += `<path d="M${l + 16} ${b} L${l + 16} ${b - h * 0.32} L${l - 10} ${b - h * 0.42} Q${l + w * 0.12} ${b - h * 0.46} ${c - w * 0.2} ${b - h * 0.86} L${c + w * 0.2} ${b - h * 0.86} Q${r - w * 0.12} ${b - h * 0.46} ${r + 10} ${b - h * 0.42} L${r - 16} ${b - h * 0.32} L${r - 16} ${b} Z"/>`;
        s += `<rect x="${c - w * 0.24}" y="${b - h * 0.92}" width="${w * 0.48}" height="${h * 0.08}"/>`;
      }
      return s;
    }
    case "tiles": {
      let d = "M0 120 L0 60";
      for (let x = 0; x < 1600; x += 40) d += ` Q${x + 20} 30 ${x + 40} 60`;
      return `<path d="${d} L1600 120 Z"/><rect y="56" width="1600" height="8" opacity="0.5"/>`;
    }
    case "bricks": {
      let s = "";
      for (let x = -40, i = 0; x < 1600; x += 80, i++) {
        const h = [62, 74, 54, 80, 68][i % 5];
        s += `<rect x="${x}" y="${120 - h}" width="78" height="${h}"/>`;
      }
      return s;
    }
    case "waves": {
      let d = "M0 120 L0 80";
      for (let x = 0; x < 1600; x += 200) d += ` Q${x + 60} 10 ${x + 140} 40 Q${x + 110} 60 ${x + 130} 80 L${x + 200} 80`;
      return `<path d="${d} L1600 120 Z"/>`;
    }
    case "ridge":
      return `<path d="M0 120 L0 90 L180 60 L320 80 L520 20 L640 50 L760 30 L960 85 L1120 40 L1260 70 L1420 25 L1600 75 L1600 120 Z"/>`;
  }
}

export function Edge({ kind, color, stroke }: { kind: Kind; color: string; stroke?: string }) {
  return (
    <svg
      className="edge"
      viewBox="0 0 1600 120"
      preserveAspectRatio="xMidYMax slice"
      fill={color}
      stroke={stroke}
      strokeWidth={stroke ? 3 : undefined}
      style={stroke ? { filter: `drop-shadow(0 0 6px ${stroke})` } : undefined}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: shape(kind) }}
    />
  );
}
