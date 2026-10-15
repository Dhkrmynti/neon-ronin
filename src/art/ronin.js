// Neon Ronin art library: trait tables + layered SVG renderer.
// Shared by the collection generator (scripts/generate.mjs) and the website (src/).


// ---------- seeded RNG ----------
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// ---------- palette ----------
const INK = '#1f2024';
const NEON = {
  'Cyber Cyan': '#22e3ff',
  'Hot Pink': '#ff2cb2',
  'Acid Lime': '#b6ff3b',
  'Volt Yellow': '#eedf39',
  'Ultraviolet': '#a774f9',
  'Blood Orange': '#ff7a1a',
  'Crimson': '#ff2d4b',
  'Ice White': '#eaf6ff',
};
const ARMOR = {
  Gunmetal: '#6b7280', Rust: '#b0643a', Olive: '#7a8a3e', 'Steel Blue': '#4a6fa5',
  'Lacquer Red': '#d1453b', 'Ink Black': '#34364a', Indigo: '#4b4fc4', Jade: '#2a9d8f',
  'Imperial Gold': '#e9b949', 'Royal Violet': '#7b2cbf',
  'Sakura Pink': '#e86fa3', 'Bone White': '#e8e1d0', Saffron: '#e8892b', 'Shadow Navy': '#3d5293', 'Forest Green': '#2f6b3a',
  Spectral: '#dfe9ff', Void: '#15161c',
};
const METAL = {
  Silver: '#cfd8dc', Chrome: '#eef2f5', Bronze: '#c39a62', 'Matte Black': '#55565f', Ectoplasm: '#c9f7f1',
  Gold: '#f2c94c', Carbon: '#575b6b', Patina: '#7fbfa8', 'Rose Gold': '#e8b4a0',
};

// ---------- clans & trait tables ----------
const CLANS = [
  ['Ashigaru', 48], ['Samurai', 24], ['Shinobi', 12], ['Sohei', 8], ['Shogun', 6], ['Ghost', 2],
];
const T = {
  Ashigaru: {
    Background: [['Neo-Kyoto Night', 25], ['Data Rain', 15], ['Torii Gate', 15], ['Citrus', 15], ['Cobalt', 15], ['Rainy Alley', 10], ['Great Wave', 10]],
    Armor: [['Gunmetal', 30], ['Rust', 20], ['Olive', 20], ['Steel Blue', 15], ['Forest Green', 15]],
    Head: [['Silver', 30], ['Bronze', 25], ['Matte Black', 25], ['Chrome', 10], ['Carbon', 10]],
    Eyes: [['Slit Visor', 30], ['Twin Eyes', 30], ['Cyclops', 15], ['Scarred Visor', 10], ['Triple Lens', 10], ['Angry Eyes', 10]],
    Helmet: [['Jingasa', 35], ['Hachigane', 25], ['Topknot', 15], ['Antennae', 10], ['Neon Mohawk', 10], ['None', 10]],
    Mask: [['Grille', 30], ['Shadow Cloth', 20], ['Rebreather', 20], ['LED Smile', 20], ['Skull Jaw', 10]],
    Weapon: [['None', 20], ['Katana', 30], ['Naginata', 20], ['Yumi', 15], ['Yari', 20]],
    Accessory: [['None', 35], ['Scarf', 20], ['Battle Damage', 15], ['Clan Mon', 15], ['Shoulder Cannon', 15], ['Prayer Beads', 10]],
  },
  Samurai: {
    Background: [['Neo-Kyoto Night', 20], ['Sakura Dusk', 15], ['Torii Gate', 15], ['Crimson Moon', 15], ['Cobalt', 10], ['Citrus', 10], ['Mount Fuji', 15], ['Great Wave', 15]],
    Armor: [['Lacquer Red', 30], ['Ink Black', 20], ['Indigo', 20], ['Jade', 15], ['Sakura Pink', 15], ['Bone White', 10]],
    Head: [['Silver', 25], ['Chrome', 20], ['Bronze', 20], ['Matte Black', 15], ['Rose Gold', 10], ['Patina', 10]],
    Eyes: [['Slit Visor', 25], ['Twin Eyes', 20], ['Kitsune Slits', 20], ['Scarred Visor', 15], ['Cross Visor', 15], ['Angry Eyes', 10]],
    Helmet: [['Kuwagata Kabuto', 40], ['Oni Kabuto', 20], ['Hachigane', 20], ['Topknot', 20], ['Neon Mohawk', 10]],
    Mask: [['Mempo', 35], ['Oni', 20], ['Grille', 15], ['Rebreather', 15], ['Tengu', 10]],
    Weapon: [['Katana', 35], ['Twin Katana', 20], ['Naginata', 15], ['Plasma Katana', 10], ['Nodachi', 15], ['Yari', 10]],
    Accessory: [['Clan Mon', 25], ['Scarf', 20], ['Sakura Petals', 15], ['Neon Circuit', 15], ['Sashimono', 20], ['Cape', 10], ['None', 10]],
  },
  Shinobi: {
    Background: [['Rainy Alley', 30], ['Bamboo Forest', 25], ['Neo-Kyoto Night', 20], ['Data Rain', 15], ['Snowfall', 10]],
    Armor: [['Shadow Navy', 35], ['Indigo', 20], ['Forest Green', 15], ['Gunmetal', 15], ['Ink Black', 15]],
    Head: [['Silver', 30], ['Carbon', 25], ['Patina', 25], ['Matte Black', 20]],
    Eyes: [['Slit Visor', 30], ['Angry Eyes', 25], ['Cross Visor', 25], ['Kitsune Slits', 20]],
    Helmet: [['Shinobi Hood', 60], ['Hachigane', 25], ['Antennae', 15]],
    Mask: [['Shadow Cloth', 50], ['Rebreather', 25], ['Skull Jaw', 25]],
    Weapon: [['Shuriken', 30], ['Kusarigama', 30], ['Katana', 25], ['Plasma Katana', 15]],
    Accessory: [['None', 30], ['Scarf', 25], ['Fireflies', 25], ['Battle Damage', 20]],
  },
  Sohei: {
    Background: [['Mount Fuji', 30], ['Snowfall', 25], ['Bamboo Forest', 25], ['Torii Gate', 20]],
    Armor: [['Saffron', 40], ['Bone White', 35], ['Ink Black', 25]],
    Head: [['Bronze', 35], ['Gold', 25], ['Rose Gold', 20], ['Silver', 20]],
    Eyes: [['Crescent Eyes', 35], ['Twin Eyes', 25], ['Triple Lens', 20], ['Cyclops', 20]],
    Helmet: [['Sohei Cowl', 65], ['Topknot', 20], ['None', 15]],
    Mask: [['Tengu', 35], ['Mempo', 25], ['LED Smile', 25], ['Grille', 15]],
    Weapon: [['Shakujo', 35], ['Naginata', 35], ['Kanabo', 30]],
    Accessory: [['Prayer Beads', 50], ['Clan Mon', 20], ['Cape', 15], ['Sakura Petals', 15]],
  },
  Shogun: {
    Background: [['Golden Palace', 40], ['Crimson Moon', 20], ['Sakura Dusk', 15], ['Mount Fuji', 15], ['Great Wave', 10]],
    Armor: [['Imperial Gold', 45], ['Royal Violet', 25], ['Lacquer Red', 15], ['Sakura Pink', 15]],
    Head: [['Chrome', 30], ['Gold', 30], ['Silver', 20], ['Matte Black', 20]],
    Eyes: [['Visor Grid', 30], ['Kitsune Slits', 25], ['Cyclops', 25], ['Triple Lens', 20]],
    Helmet: [['Crescent Kabuto', 40], ['Dragon Crest', 35], ['Oni Kabuto', 25]],
    Mask: [['Oni', 35], ['Mempo', 25], ['Kitsune', 20], ['Skull Jaw', 20]],
    Weapon: [['Plasma Katana', 30], ['Twin Katana', 25], ['Katana', 15], ['Nodachi', 30]],
    Accessory: [['Clan Mon', 25], ['Neon Circuit', 20], ['Sakura Petals', 15], ['Sashimono', 25], ['Cape', 15]],
  },
  Ghost: {
    Background: [['Void', 55], ['Data Rain', 25], ['Snowfall', 20]],
    Armor: [['Spectral', 60], ['Void', 40]],
    Head: [['Ectoplasm', 70], ['Matte Black', 30]],
    Eyes: [['Visor Grid', 30], ['Cyclops', 25], ['Kitsune Slits', 25], ['Cross Visor', 20]],
    Helmet: [['Hannya Horns', 50], ['Spirit Hood', 50]],
    Mask: [['Kitsune', 35], ['Shadow Cloth', 35], ['Skull Jaw', 30]],
    Weapon: [['Plasma Katana', 50], ['Shuriken', 20], ['None', 30]],
    Accessory: [['Sakura Petals', 30], ['Fireflies', 40], ['None', 30]],
  },
};
const NEON_TABLE = [
  ['Cyber Cyan', 24], ['Hot Pink', 20], ['Acid Lime', 16], ['Volt Yellow', 12], ['Ultraviolet', 9],
  ['Blood Orange', 9], ['Crimson', 6], ['Ice White', 4],
];
const MON_TABLE = [['Sakura Mon', 25], ['Kikko Mon', 22], ['Bishi Mon', 18], ['Moon Mon', 20], ['Wheel Mon', 15]];

const TRAIT_ORDER = ['Clan', 'Background', 'Armor', 'Head', 'Eyes', 'Neon', 'Helmet', 'Mask', 'Weapon', 'Accessory'];

// ---------- helpers ----------
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
const S = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const mirror = (inner) => `<g transform="translate(400 0) scale(-1 1)">${inner}</g>`;

// Per-token deterministic sub-RNG for scenery details (skyline, rain, petals).
let SEED = 'neon-ronin';
const detailRng = (id) => mulberry32(hashSeed(`${SEED}:${id}`)());

// ---------- layers ----------
function background(name, id, neon) {
  const r = detailRng(id);
  const rect = (fill) => `<rect width="400" height="400" fill="${fill}"/>`;
  switch (name) {
    case 'Citrus': return rect('#eedf39') + `<circle cx="200" cy="215" r="150" fill="#f9e174"/>`;
    case 'Cobalt': return rect('#5879ff') + `<circle cx="200" cy="215" r="150" fill="#7590ff"/>`;
    case 'Neo-Kyoto Night': {
      let s = `<defs><linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0f2b"/><stop offset="1" stop-color="#3a1859"/></linearGradient></defs>`;
      s += `<rect width="400" height="400" fill="url(#bg${id})"/>`;
      let x = -10;
      while (x < 400) {
        const w = 30 + r() * 40, h = 90 + r() * 170;
        s += `<rect x="${x.toFixed(1)}" y="${(400 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#151735"/>`;
        for (let wy = 400 - h + 10; wy < 390; wy += 16)
          for (let wx = x + 6; wx < x + w - 8; wx += 12)
            if (r() < 0.35) s += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="5" height="7" fill="${neon}" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
        x += w + 4;
      }
      return s;
    }
    case 'Data Rain': {
      let s = rect('#06120d');
      for (let i = 0; i < 70; i++) {
        const x = r() * 400, y = r() * 400, h = 20 + r() * 70;
        s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="3" height="${h.toFixed(1)}" fill="${r() < 0.5 ? '#2bff88' : neon}" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`;
      }
      return s;
    }
    case 'Torii Gate':
      return rect('#1d6f74') + `<circle cx="200" cy="170" r="110" fill="#ff8a3d"/>` +
        `<g fill="#b8322a" ${S}><rect x="40" y="70" width="320" height="22" rx="6"/><rect x="70" y="112" width="260" height="16"/>` +
        `<rect x="88" y="80" width="26" height="320"/><rect x="286" y="80" width="26" height="320"/></g>`;
    case 'Sakura Dusk': {
      let s = `<defs><linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7eb6"/><stop offset="1" stop-color="#6a2c91"/></linearGradient></defs>`;
      s += `<rect width="400" height="400" fill="url(#bg${id})"/><circle cx="200" cy="200" r="140" fill="#ffd36e"/>`;
      for (let i = 0; i < 6; i++) s += `<rect x="40" y="${215 + i * 22}" width="320" height="${4 + i * 2}" fill="#c0428a"/>`;
      return s;
    }
    case 'Crimson Moon':
      return rect('#2a0b12') + `<circle cx="200" cy="180" r="150" fill="#d1243c"/><circle cx="160" cy="130" r="22" fill="#b81e33"/><circle cx="260" cy="230" r="34" fill="#b81e33"/>`;
    case 'Golden Palace': {
      let s = `<defs><radialGradient id="bg${id}"><stop offset="0" stop-color="#fff2b0"/><stop offset="1" stop-color="#d49a1e"/></radialGradient></defs>`;
      s += `<rect width="400" height="400" fill="url(#bg${id})"/>`;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        s += `<path d="M200 200 L${(200 + Math.cos(a) * 320).toFixed(1)} ${(200 + Math.sin(a) * 320).toFixed(1)} L${(200 + Math.cos(a + 0.12) * 320).toFixed(1)} ${(200 + Math.sin(a + 0.12) * 320).toFixed(1)} Z" fill="#fff7d1" opacity="0.45"/>`;
      }
      return s;
    }
    case 'Void': {
      let s = rect('#08080d');
      for (let i = 0; i < 40; i++) s += `<circle cx="${(r() * 400).toFixed(1)}" cy="${(r() * 400).toFixed(1)}" r="${(1 + r() * 2.5).toFixed(1)}" fill="${neon}" opacity="${(0.2 + r() * 0.6).toFixed(2)}"/>`;
      return s;
    }
    case 'Bamboo Forest': {
      let s = `<defs><linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9f0c8"/><stop offset="1" stop-color="#7fb069"/></linearGradient></defs>`;
      s += `<rect width="400" height="400" fill="url(#bg${id})"/>`;
      for (let i = 0; i < 9; i++) {
        const x = i * 46 + r() * 20 - 10, w = 12 + r() * 10, fill = r() < 0.5 ? '#3f7d3a' : '#5a9a4a';
        s += `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="400" fill="${fill}"/>`;
        for (let y = 30 + r() * 40; y < 400; y += 70 + r() * 30)
          s += `<rect x="${(x - 2).toFixed(1)}" y="${y.toFixed(1)}" width="${(w + 4).toFixed(1)}" height="4" fill="#2c5a28"/>`;
      }
      return s;
    }
    case 'Mount Fuji': {
      let s = `<defs><linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ec5ff"/><stop offset="1" stop-color="#ffd1dc"/></linearGradient></defs>`;
      s += `<rect width="400" height="400" fill="url(#bg${id})"/><circle cx="300" cy="90" r="40" fill="#ff5a4e"/>`;
      s += `<path d="M-20 400 L150 170 Q200 150 250 170 L420 400 Z" fill="#4a5d8a"/>`;
      s += `<path d="M150 170 Q200 150 250 170 L282 214 L252 200 L226 222 L200 200 L174 222 L148 200 L118 214 Z" fill="#fff"/>`;
      return s;
    }
    case 'Great Wave': {
      let s = rect('#f3e6c8') + `<circle cx="300" cy="110" r="44" fill="#e8574a"/>`;
      const waves = [['#9cc3e6', 230], ['#4f86c6', 280], ['#2b4c7e', 330]];
      waves.forEach(([fill, y], k) => {
        const o = k * 40;
        s += `<path d="M-40 ${y} Q${20 - o} ${y - 80} ${80 - o} ${y - 20} T${200 - o} ${y - 20} T${320 - o} ${y - 20} T${440 - o} ${y - 20} L440 400 L-40 400 Z" fill="${fill}"/>`;
      });
      for (let i = 0; i < 18; i++) s += `<circle cx="${(r() * 400).toFixed(1)}" cy="${(190 + r() * 120).toFixed(1)}" r="${(3 + r() * 5).toFixed(1)}" fill="#fff" opacity="0.85"/>`;
      return s;
    }
    case 'Snowfall': {
      let s = `<defs><linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a4a"/><stop offset="1" stop-color="#5b7bab"/></linearGradient></defs>`;
      s += `<rect width="400" height="400" fill="url(#bg${id})"/><path d="M0 360 Q200 330 400 360 L400 400 L0 400 Z" fill="#eef4ff"/>`;
      for (let i = 0; i < 60; i++) s += `<circle cx="${(r() * 400).toFixed(1)}" cy="${(r() * 380).toFixed(1)}" r="${(1.5 + r() * 3).toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
      return s;
    }
    case 'Rainy Alley': {
      let s = rect('#141821');
      s += `<path d="M0 0 L90 0 L90 400 L0 400 Z M310 0 L400 0 L400 400 L310 400 Z" fill="#0b0d14"/>`;
      s += `<rect x="40" y="60" width="30" height="130" rx="4" fill="none" stroke="${neon}" stroke-width="4" opacity="0.9"/>`;
      s += `<rect x="330" y="120" width="40" height="22" rx="4" fill="${neon}" opacity="0.55"/><rect x="330" y="150" width="40" height="22" rx="4" fill="#ff2cb2" opacity="0.45"/>`;
      for (let i = 0; i < 80; i++) {
        const x = r() * 420, y = r() * 400;
        s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l-6 18" stroke="#9fb4d9" stroke-width="2" opacity="${(0.2 + r() * 0.4).toFixed(2)}"/>`;
      }
      return s;
    }
  }
  return '';
}

function katana(tx, ty, rot, blade, plasma, glowId, len = 250) {
  const bladeFill = plasma ? blade : '#e5e7eb';
  return `<g transform="translate(${tx} ${ty}) rotate(${rot})">` +
    `<path d="M-7 0 L-7 -${len} Q0 -${len + 25} 9 -${len - 5} L7 0 Z" fill="${bladeFill}" ${S}${plasma ? ` filter="url(#${glowId})"` : ''}/>` +
    `<rect x="-8" y="0" width="16" height="72" rx="4" fill="${INK}"/>` +
    `<path d="M-6 12 L6 22 M-6 22 L6 12 M-6 36 L6 46 M-6 46 L6 36" stroke="#d1453b" stroke-width="3"/>` +
    `<ellipse cx="0" cy="0" rx="20" ry="7" fill="#e9b949" ${S}/></g>`;
}

function weapon(name, neon, glowId) {
  switch (name) {
    case 'Katana': return katana(290, 250, -140, neon, false, glowId);
    case 'Plasma Katana': return katana(290, 250, -140, neon, true, glowId);
    case 'Twin Katana': return katana(290, 250, -140, neon, false, glowId) + katana(110, 250, 140, neon, false, glowId);
    case 'Naginata':
      return `<g transform="translate(70 410) rotate(8)"><rect x="-6" y="-300" width="12" height="300" rx="4" fill="#8b5a2b" ${S}/>` +
        `<path d="M-6 -298 Q-10 -360 22 -398 Q14 -350 8 -298 Z" fill="#e5e7eb" ${S}/></g>`;
    case 'Yumi':
      return `<path d="M110 40 Q0 220 110 400" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>` +
        `<path d="M110 40 Q0 220 110 400" fill="none" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M110 40 L110 400" stroke="#f3ead7" stroke-width="2"/>`;
    case 'Nodachi': return katana(304, 310, 14, neon, false, glowId, 280);
    case 'Yari':
      return `<g transform="translate(76 410) rotate(4)"><rect x="-6" y="-310" width="12" height="310" rx="4" fill="#5b3a1e" ${S}/>` +
        `<rect x="-10" y="-316" width="20" height="14" rx="3" fill="#e9b949" ${S}/>` +
        `<path d="M-12 -314 Q-14 -358 0 -394 Q14 -358 12 -314 Z" fill="#e5e7eb" ${S}/></g>`;
    case 'Kanabo': {
      let s = `<g transform="translate(312 318) rotate(16)"><rect x="-7" y="0" width="14" height="70" rx="4" fill="${INK}"/>` +
        `<path d="M-12 0 L-22 -210 Q0 -226 22 -210 L12 0 Z" fill="#3b3d47" ${S}/>`;
      for (let y = -30; y > -200; y -= 30) s += `<circle cx="-9" cy="${y}" r="4" fill="#cfd8dc" stroke="${INK}" stroke-width="2"/><circle cx="9" cy="${y - 15}" r="4" fill="#cfd8dc" stroke="${INK}" stroke-width="2"/>`;
      return s + `</g>`;
    }
    case 'Shakujo':
      return `<g transform="translate(320 410) rotate(-4)"><rect x="-6" y="-302" width="12" height="302" rx="4" fill="#8b5a2b" ${S}/>` +
        `<path d="M0 -302 Q-34 -312 -30 -346 Q-24 -380 0 -384 Q24 -380 30 -346 Q34 -312 0 -302" fill="none" stroke="#e9b949" stroke-width="12" stroke-linejoin="round"/>` +
        `<path d="M0 -302 Q-34 -312 -30 -346 Q-24 -380 0 -384 Q24 -380 30 -346 Q34 -312 0 -302" fill="none" stroke="${INK}" stroke-width="3"/>` +
        `<circle cx="-30" cy="-324" r="9" fill="none" stroke="#e9b949" stroke-width="5"/><circle cx="30" cy="-324" r="9" fill="none" stroke="#e9b949" stroke-width="5"/>` +
        `<circle cx="0" cy="-392" r="7" fill="${neon}" ${S} filter="url(#${glowId})"/></g>`;
    case 'Kusarigama':
      return `<path d="M300 300 Q370 220 330 140 Q300 90 340 40" fill="none" stroke="${INK}" stroke-width="9" stroke-dasharray="10 5" stroke-linecap="round"/>` +
        `<path d="M300 300 Q370 220 330 140 Q300 90 340 40" fill="none" stroke="#9aa3b5" stroke-width="4" stroke-dasharray="10 5"/>` +
        `<circle cx="340" cy="40" r="12" fill="#55565f" ${S}/>` +
        `<g transform="translate(96 300) rotate(-20)"><rect x="-7" y="-10" width="14" height="90" rx="4" fill="#8b5a2b" ${S}/>` +
        `<path d="M-6 -6 Q-10 -70 50 -86 Q20 -60 8 -6 Z" fill="${neon}" ${S} filter="url(#${glowId})"/></g>`;
    case 'Shuriken': {
      const star = (x, y, size, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${size})">` +
        `<path d="M0 -26 L7 -7 L26 0 L7 7 L0 26 L-7 7 L-26 0 L-7 -7 Z" fill="#cfd8dc" ${S}/>` +
        `<circle r="5" fill="${neon}" filter="url(#${glowId})"/></g>`;
      return star(66, 110, 1, 15) + star(338, 92, 0.8, 40) + star(346, 236, 0.9, 5);
    }
  }
  return '';
}

function body(armor, metal, ghost) {
  const dark = shade(armor, -0.3);
  const op = ghost ? ' opacity="0.85"' : '';
  const sode = `<path d="M74 286 L138 296 L132 366 L64 354 Z" fill="${armor}" ${S}/>` +
    `<path d="M70 308 L136 316 M68 330 L134 338" stroke="${dark}" stroke-width="5"/>`;
  return `<g${op}>` +
    `<rect x="176" y="240" width="48" height="60" fill="${shade(metal, -0.25)}" ${S}/>` +
    `<path d="M116 405 L132 300 Q200 278 268 300 L284 405 Z" fill="${armor}" ${S}/>` +
    `<path d="M128 330 Q200 316 272 330 M124 356 Q200 342 276 356 M121 382 Q200 368 279 382" fill="none" stroke="${dark}" stroke-width="5"/>` +
    sode + mirror(sode) + `</g>`;
}

function head(metal) {
  return `<rect x="118" y="108" width="164" height="152" rx="42" fill="${metal}" ${S}/>` +
    `<circle cx="116" cy="188" r="13" fill="${shade(metal, -0.25)}" ${S}/>` +
    `<circle cx="284" cy="188" r="13" fill="${shade(metal, -0.25)}" ${S}/>` +
    `<path d="M140 128 Q150 118 168 116" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.6"/>`;
}

function eyes(name, neon, glowId) {
  const g = `filter="url(#${glowId})"`;
  const plate = (y, h) => `<rect x="134" y="${y}" width="132" height="${h}" rx="${h / 2}" fill="${INK}"/>`;
  switch (name) {
    case 'Slit Visor':
      return plate(170, 32) + `<rect x="146" y="180" width="108" height="12" rx="6" fill="${neon}" ${g}/>`;
    case 'Scarred Visor':
      return plate(170, 32) + `<rect x="146" y="180" width="108" height="12" rx="6" fill="${neon}" ${g}/>` +
        `<path d="M150 146 L184 232" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M156 168 L172 162 M164 190 L180 184 M172 212 L188 206" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
    case 'Twin Eyes':
      return plate(164, 46) + `<circle cx="170" cy="187" r="12" fill="${neon}" ${g}/><circle cx="230" cy="187" r="12" fill="${neon}" ${g}/>`;
    case 'Cyclops':
      return plate(164, 46) + `<circle cx="200" cy="187" r="19" fill="${neon}" ${g}/><circle cx="205" cy="182" r="6" fill="#fff"/>`;
    case 'Kitsune Slits':
      return `<path d="M140 198 L186 176 L190 190 L146 208 Z" fill="${neon}" ${S} ${g}/>` +
        `<path d="M260 198 L214 176 L210 190 L254 208 Z" fill="${neon}" ${S} ${g}/>`;
    case 'Visor Grid': {
      let s = plate(160, 54);
      for (let x = 150; x <= 250; x += 14) s += `<rect x="${x}" y="172" width="8" height="8" fill="${neon}" ${g}/><rect x="${x}" y="190" width="8" height="8" fill="${neon}" opacity="0.6"/>`;
      return s;
    }
    case 'Triple Lens':
      return plate(164, 46) + [158, 200, 242].map((x) => `<circle cx="${x}" cy="187" r="${x === 200 ? 13 : 9}" fill="${neon}" ${g}/>`).join('');
    case 'Cross Visor':
      return plate(166, 42) + `<path d="M150 187 L250 187 M200 172 L200 202" stroke="${neon}" stroke-width="8" stroke-linecap="round" ${g}/>`;
    case 'Crescent Eyes':
      return plate(164, 46) + `<path d="M154 196 Q170 172 186 196 M214 196 Q230 172 246 196" fill="none" stroke="${neon}" stroke-width="8" stroke-linecap="round" ${g}/>`;
    case 'Angry Eyes':
      return plate(164, 46) + `<path d="M150 176 L190 190 L188 200 L152 198 Z" fill="${neon}" ${g}/><path d="M250 176 L210 190 L212 200 L248 198 Z" fill="${neon}" ${g}/>`;
  }
  return '';
}

function mask(name, armor, metal, neon, glowId) {
  const shape = 'M134 214 Q200 202 266 214 L256 252 Q200 274 144 252 Z';
  switch (name) {
    case 'Grille':
      return `<rect x="168" y="222" width="64" height="24" rx="6" fill="${shade(metal, -0.35)}" ${S}/>` +
        `<path d="M184 226 L184 242 M200 226 L200 242 M216 226 L216 242" stroke="${INK}" stroke-width="4"/>`;
    case 'Mempo':
      return `<path d="${shape}" fill="${armor}" ${S}/><path d="M200 210 L190 234 L210 234 Z" fill="${shade(armor, -0.25)}" ${S}/>` +
        `<path d="M160 244 Q180 236 196 246 M240 244 Q220 236 204 246" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    case 'Oni':
      return `<path d="${shape}" fill="#c0392b" ${S}/>` +
        `<path d="M162 246 Q200 232 238 246" fill="none" stroke="${INK}" stroke-width="5"/>` +
        `<path d="M168 244 L174 262 L180 242 Z M232 244 L226 262 L220 242 Z" fill="#fff" ${S}/>` +
        `<path d="M150 224 L170 230 M250 224 L230 230" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    case 'Rebreather':
      return `<rect x="160" y="216" width="80" height="38" rx="14" fill="${shade(metal, -0.4)}" ${S}/>` +
        `<circle cx="146" cy="236" r="14" fill="${INK}"/><circle cx="254" cy="236" r="14" fill="${INK}"/>` +
        `<circle cx="146" cy="236" r="6" fill="${shade(metal, -0.1)}"/><circle cx="254" cy="236" r="6" fill="${shade(metal, -0.1)}"/>`;
    case 'Kitsune':
      return `<path d="${shape}" fill="#f8f5ee" ${S}/>` +
        `<path d="M170 226 Q180 220 186 230 M230 226 Q220 220 214 230" fill="none" stroke="#d1243c" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M186 250 Q200 258 214 250" fill="none" stroke="#d1243c" stroke-width="5" stroke-linecap="round"/>`;
    case 'Shadow Cloth':
      return `<path d="M118 210 Q200 198 282 210 L282 236 Q282 262 244 262 L156 262 Q118 262 118 236 Z" fill="#23243a" ${S}/>` +
        `<path d="M150 230 Q200 222 250 230" fill="none" stroke="#3b3d5c" stroke-width="5"/>`;
    case 'Tengu':
      return `<path d="${shape}" fill="#c62f2f" ${S}/>` +
        `<path d="M192 210 Q200 202 208 210 L266 262 Q262 272 252 268 Z" fill="#d94a3d" ${S}/>` +
        `<path d="M156 246 Q176 238 190 248 M244 246 Q230 240 220 250" fill="none" stroke="#f8f5ee" stroke-width="5" stroke-linecap="round"/>`;
    case 'Skull Jaw':
      return `<path d="M148 216 L252 216 L244 256 Q200 272 156 256 Z" fill="#f3ead7" ${S}/>` +
        `<path d="M200 220 L192 234 L208 234 Z" fill="${INK}"/>` +
        `<path d="M164 244 L236 244 M176 238 L176 258 M188 238 L188 262 M200 238 L200 264 M212 238 L212 262 M224 238 L224 258" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    case 'LED Smile': {
      let s = `<rect x="150" y="214" width="100" height="40" rx="12" fill="${INK}"/>`;
      for (const [x, y] of [[162, 224], [172, 234], [184, 240], [196, 240], [208, 240], [220, 234], [230, 224]])
        s += `<rect x="${x}" y="${y}" width="8" height="8" fill="${neon}" filter="url(#${glowId})"/>`;
      return s;
    }
  }
  return '';
}

function helmet(name, armor, metal, neon, glowId) {
  const dark = shade(armor, -0.3);
  const gold = '#e9b949';
  const kabuto = (crest) => {
    const shikoro = `<path d="M114 150 L66 206 L80 222 L122 192 Z" fill="${armor}" ${S}/>`;
    return shikoro + mirror(shikoro) +
      `<path d="M108 162 Q108 66 200 62 Q292 66 292 162 Z" fill="${dark}" ${S}/>` +
      `<path d="M150 76 L150 156 M200 64 L200 156 M250 76 L250 156" stroke="${shade(armor, -0.5)}" stroke-width="4"/>` +
      `<path d="M100 166 Q200 142 300 166 L306 178 Q200 156 94 178 Z" fill="${armor}" ${S}/>` + crest;
  };
  switch (name) {
    case 'Jingasa':
      return `<path d="M64 156 Q200 26 336 156 Q200 132 64 156 Z" fill="${armor}" ${S}/>` +
        `<path d="M140 96 Q200 80 260 96" fill="none" stroke="${dark}" stroke-width="5"/>` +
        `<circle cx="200" cy="70" r="9" fill="${dark}" ${S}/>`;
    case 'Hachigane':
      return `<rect x="112" y="126" width="176" height="30" rx="10" fill="#d1453b" ${S}/>` +
        `<rect x="170" y="122" width="60" height="38" rx="6" fill="${metal}" ${S}/>` +
        `<circle cx="200" cy="141" r="7" fill="${neon}" filter="url(#${glowId})"/>`;
    case 'Topknot':
      return `<rect x="186" y="70" width="28" height="44" rx="8" fill="${shade(metal, -0.2)}" ${S}/>` +
        `<path d="M200 70 L200 40" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
        `<circle cx="200" cy="36" r="9" fill="${neon}" ${S} filter="url(#${glowId})"/>`;
    case 'Kuwagata Kabuto':
      return kabuto(`<path d="M186 150 Q140 110 144 30 Q166 100 198 140 Z" fill="${gold}" ${S}/>` +
        `<path d="M214 150 Q260 110 256 30 Q234 100 202 140 Z" fill="${gold}" ${S}/>`);
    case 'Crescent Kabuto':
      return kabuto(`<path d="M74 34 Q200 186 326 34 Q200 128 74 34 Z" fill="${gold}" ${S}/>` +
        `<circle cx="200" cy="112" r="10" fill="${neon}" ${S} filter="url(#${glowId})"/>`);
    case 'Dragon Crest':
      return kabuto(`<path d="M200 10 L222 70 L252 44 L232 132 L168 132 L148 44 L178 70 Z" fill="${gold}" ${S}/>` +
        `<circle cx="200" cy="96" r="10" fill="${neon}" ${S} filter="url(#${glowId})"/>`);
    case 'Hannya Horns': {
      const horn = `<path d="M140 122 Q104 74 122 22 Q142 82 166 112 Z" fill="#f3ead7" ${S}/>`;
      return horn + mirror(horn);
    }
    case 'Spirit Hood':
      return `<path d="M96 290 Q84 70 200 62 Q316 70 304 290 L278 290 Q290 128 200 116 Q110 128 122 290 Z" fill="#2a2b45" ${S}/>` +
        `<path d="M200 62 L200 116" stroke="${neon}" stroke-width="4" filter="url(#${glowId})"/>`;
    case 'Oni Kabuto': {
      const horn = `<path d="M150 84 Q112 52 120 4 Q140 46 176 70 Z" fill="#c0392b" ${S}/>`;
      return kabuto(horn + mirror(horn) + `<circle cx="200" cy="112" r="10" fill="${neon}" ${S} filter="url(#${glowId})"/>`);
    }
    case 'Shinobi Hood': {
      const cloth = shade(armor, 0.12);
      return `<path d="M292 136 Q336 120 352 148 L340 160 Q322 140 298 156 Z" fill="${cloth}" ${S}/>` +
        `<path d="M296 152 Q330 168 336 204 L322 206 Q314 178 292 168 Z" fill="${cloth}" ${S}/>` +
        `<path d="M104 262 Q96 96 200 92 Q304 96 296 262 L270 262 Q280 150 200 146 Q120 150 130 262 Z" fill="${cloth}" ${S}/>` +
        `<path d="M132 150 Q200 132 268 150" fill="none" stroke="${neon}" stroke-width="4" filter="url(#${glowId})"/>`;
    }
    case 'Sohei Cowl':
      return `<path d="M100 300 Q88 92 200 86 Q312 92 300 300 L272 300 Q284 152 200 150 Q116 152 128 300 Z" fill="#efe9dc" ${S}/>` +
        `<path d="M126 120 Q200 100 274 120 M112 180 Q118 150 132 140 M288 180 Q282 150 268 140" fill="none" stroke="#c9bfa8" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M160 150 Q200 166 240 150" fill="none" stroke="${shade(armor, -0.2)}" stroke-width="8" stroke-linecap="round"/>`;
    case 'Neon Mohawk':
      return `<path d="M168 116 L174 60 L188 104 L200 40 L212 104 L226 60 L232 116 Z" fill="${neon}" ${S} filter="url(#${glowId})"/>`;
    case 'Antennae':
      return `<path d="M164 112 L136 46 M236 112 L264 46" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
        `<circle cx="136" cy="42" r="10" fill="${neon}" ${S} filter="url(#${glowId})"/><circle cx="264" cy="42" r="10" fill="${neon}" ${S} filter="url(#${glowId})"/>`;
  }
  return '';
}

function accessory(name, mon, armor, neon, glowId, id) {
  switch (name) {
    case 'Scarf':
      return `<path d="M166 270 Q200 292 234 270 L240 296 Q200 316 160 296 Z" fill="#d1243c" ${S}/>` +
        `<path d="M232 292 Q290 300 330 268 L338 290 Q296 326 236 312 Z" fill="#d1243c" ${S}/>`;
    case 'Battle Damage':
      return `<path d="M232 330 L248 346 L240 360 L256 376" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M96 300 L108 318 L100 330" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M262 128 L268 140 L280 136 L272 148" fill="none" stroke="${neon}" stroke-width="4" filter="url(#${glowId})"/>`;
    case 'Neon Circuit':
      return `<path d="M150 340 L170 340 L180 330 L220 330 L230 340 L250 340 M76 320 L96 324 L110 316 M324 320 L304 324 L290 316" fill="none" stroke="${neon}" stroke-width="4" stroke-linecap="round" filter="url(#${glowId})"/>`;
    case 'Clan Mon': {
      const c = `<circle cx="200" cy="352" r="26" fill="#f8f5ee" ${S}/>`;
      if (mon === 'Sakura Mon') {
        let s = c;
        for (let i = 0; i < 5; i++) s += `<ellipse cx="200" cy="340" rx="7" ry="11" fill="#ff7eb6" transform="rotate(${i * 72} 200 352)"/>`;
        return s + `<circle cx="200" cy="352" r="4" fill="${INK}"/>`;
      }
      if (mon === 'Kikko Mon') return c + `<path d="M200 334 L216 343 L216 361 L200 370 L184 361 L184 343 Z" fill="none" stroke="${shade(armor, -0.4)}" stroke-width="5"/>`;
      if (mon === 'Moon Mon') return c + `<path d="M200 334 A18 18 0 1 0 200 370 A22 22 0 0 1 200 334 Z" fill="${INK}"/>`;
      if (mon === 'Wheel Mon') {
        let s = c + `<circle cx="200" cy="352" r="16" fill="none" stroke="${INK}" stroke-width="4"/>`;
        for (let i = 0; i < 8; i++) s += `<path d="M200 352 L200 336" stroke="${INK}" stroke-width="3" transform="rotate(${i * 45} 200 352)"/>`;
        return s;
      }
      return c + `<path d="M200 334 L208 343 L200 352 L192 343 Z M209 343 L217 352 L209 361 L201 352 Z M191 343 L199 352 L191 361 L183 352 Z M200 352 L208 361 L200 370 L192 361 Z" fill="#d1243c"/>`;
    }
    case 'Sakura Petals': {
      const r = detailRng(id + 7777);
      let s = '';
      for (let i = 0; i < 9; i++) {
        const x = 30 + r() * 340, y = 30 + r() * 340, a = r() * 360;
        s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="5" fill="#ffb7d5" stroke="${INK}" stroke-width="2.5" transform="rotate(${a.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }
      return s;
    }
    case 'Prayer Beads': {
      let s = '';
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (i / 12);
        const x = 200 - Math.cos(a) * 52, y = 280 + Math.sin(a) * 40;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === 6 ? 10 : 7}" fill="${i === 6 ? neon : '#6b3b1e'}" stroke="${INK}" stroke-width="3"${i === 6 ? ` filter="url(#${glowId})"` : ''}/>`;
      }
      return s + `<path d="M200 330 L194 352 L206 352 Z" fill="#d1243c" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    }
    case 'Shoulder Cannon':
      return `<g transform="rotate(-24 290 280)"><rect x="262" y="262" width="84" height="30" rx="8" fill="${shade(armor, -0.2)}" ${S}/>` +
        `<rect x="340" y="266" width="16" height="22" rx="4" fill="${INK}"/><circle cx="350" cy="277" r="6" fill="${neon}" filter="url(#${glowId})"/>` +
        `<path d="M280 270 L280 284 M296 270 L296 284" stroke="${INK}" stroke-width="4"/></g>`;
    case 'Fireflies': {
      const r = detailRng(id + 4242);
      let s = '';
      for (let i = 0; i < 14; i++) {
        const x = 20 + r() * 360, y = 20 + r() * 360;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 + r() * 3).toFixed(1)}" fill="${neon}" opacity="${(0.5 + r() * 0.5).toFixed(2)}" filter="url(#${glowId})"/>`;
      }
      return s;
    }
  }
  return '';
}

// Accessories worn on the back, drawn behind the weapon and body.
function backAccessory(name, armor, neon, glowId) {
  switch (name) {
    case 'Cape':
      return `<path d="M128 292 Q50 350 30 404 L370 404 Q350 350 272 292 Z" fill="${shade(armor, -0.45)}" ${S}/>` +
        `<path d="M80 380 Q120 340 140 300 M320 380 Q280 340 260 300" fill="none" stroke="${shade(armor, -0.6)}" stroke-width="5"/>`;
    case 'Sashimono':
      return `<rect x="88" y="20" width="10" height="300" rx="3" fill="${INK}"/>` +
        `<path d="M26 34 L92 34 L92 190 L26 190 Z" fill="${armor}" ${S}/>` +
        `<rect x="26" y="34" width="14" height="156" fill="${neon}" filter="url(#${glowId})"/>` +
        `<circle cx="66" cy="96" r="16" fill="#f8f5ee" ${S}/><circle cx="66" cy="96" r="6" fill="${INK}"/>`;
  }
  return '';
}

// ---------- compose ----------
// Draw order, back to front. The site animates these one by one; render() stacks them.
const LAYER_ORDER = ['background', 'back', 'weapon', 'body', 'head', 'eyes', 'mask', 'helmet', 'accessory'];

function layers(t, id, seed = 'neon-ronin') {
  SEED = seed;
  const neon = NEON[t.Neon];
  const armor = ARMOR[t.Armor];
  const metal = METAL[t.Head];
  const glowId = `glow${id}`;
  return {
    defs: `<defs><filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`,
    background: background(t.Background, id, neon),
    back: backAccessory(t.Accessory, armor, neon, glowId),
    weapon: weapon(t.Weapon, neon, glowId),
    body: body(armor, metal, t.Clan === 'Ghost'),
    head: head(metal),
    eyes: eyes(t.Eyes, neon, glowId),
    mask: mask(t.Mask, armor, metal, neon, glowId),
    helmet: helmet(t.Helmet, armor, metal, neon, glowId),
    accessory: accessory(t.Accessory, t.Mon, armor, neon, glowId, id),
  };
}

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${inner}</svg>`;

function render(t, id, withBg = true, seed = 'neon-ronin') {
  const l = layers(t, id, seed);
  return svg(l.defs + LAYER_ORDER.filter((k) => withBg || k !== 'background').map((k) => l[k]).join(''));
}

// Weighted pick from [[value, weight], ...] using the given rng.
function pick(table, rng) {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of table) if ((r -= w) < 0) return v;
  return table[table.length - 1][0];
}

function rollTraits(rng, clan) {
  const t = { Clan: clan || pick(CLANS, rng) };
  const tbl = T[t.Clan];
  for (const k of Object.keys(tbl)) t[k] = pick(tbl[k], rng);
  t.Neon = pick(NEON_TABLE, rng);
  if (t.Accessory === 'Clan Mon') t.Mon = pick(MON_TABLE, rng);
  return t;
}

// Cosmetic combat stats for the website, derived from traits (0-99).
const STAT_BASE = {
  Power: ['Weapon', { None: 20, Yumi: 45, Naginata: 60, Katana: 55, 'Twin Katana': 75, 'Plasma Katana': 90, Nodachi: 80, Kanabo: 70, Yari: 58, Shakujo: 50, Kusarigama: 62, Shuriken: 52 }],
  Defense: ['Helmet', { None: 15, Topknot: 25, Hachigane: 35, Jingasa: 45, 'Kuwagata Kabuto': 65, 'Hannya Horns': 55, 'Spirit Hood': 60, 'Crescent Kabuto': 85, 'Dragon Crest': 90, 'Oni Kabuto': 80, 'Shinobi Hood': 40, 'Sohei Cowl': 45, 'Neon Mohawk': 30, Antennae: 25 }],
  Honor: ['Clan', { Ashigaru: 40, Samurai: 65, Shinobi: 45, Sohei: 75, Shogun: 85, Ghost: 30 }],
  Stealth: ['Mask', { Grille: 30, Rebreather: 45, Mempo: 40, Oni: 25, 'Shadow Cloth': 85, Kitsune: 70, Tengu: 35, 'Skull Jaw': 55, 'LED Smile': 20 }],
};
function stats(t, id) {
  const r = mulberry32(hashSeed(`stats:${id}`)());
  const out = {};
  for (const [name, [trait, table]] of Object.entries(STAT_BASE)) {
    let v = (table[t[trait]] ?? 40) + Math.round(r() * 14 - 4);
    if (t.Clan === 'Ghost' && name === 'Stealth') v += 15;
    if (t.Clan === 'Shinobi' && name === 'Stealth') v += 10;
    out[name] = Math.max(1, Math.min(99, v));
  }
  return out;
}

export {
  hashSeed, mulberry32, pick, rollTraits, render, layers, svg, stats,
  CLANS, T, NEON, NEON_TABLE, MON_TABLE, TRAIT_ORDER, LAYER_ORDER, ARMOR, METAL, STAT_BASE,
};
