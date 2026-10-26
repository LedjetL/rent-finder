/**
 * Deterministic SVG placeholder interiors.
 *
 * Seeded listings need photographs, and pulling them from an image CDN would make
 * the dev environment depend on the network and on someone else's rate limit. This
 * renders a stable, room-like interior from a hash of the seed instead.
 *
 * It tries to look like a photograph rather than a diagram: warm directional light
 * from a window, layered depth, soft shadows and a film grain. On a photo-led
 * layout the images carry the page, so a flat grey box makes the whole design look
 * unfinished no matter how good the typography is.
 *
 * Real uploads do not come through here.
 */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Light conditions, not just colour schemes — each is a time of day in a room. */
const MOODS = [
  {
    // Late afternoon, warm sun across a plastered wall
    wall: ["#E8DCC8", "#CFBDA2"],
    floor: ["#8A6A4B", "#6B4F36"],
    light: "#FFE6B8",
    shade: "#4A3826",
    accent: "#B9793F",
  },
  {
    // Cool overcast morning, grey-blue
    wall: ["#DCE1E4", "#B8C1C8"],
    floor: ["#7C7269", "#5C544D"],
    light: "#EAF2F8",
    shade: "#38403F",
    accent: "#5E7183",
  },
  {
    // Evening, lamp-lit, deeper tones
    wall: ["#C9B9A8", "#9C8874"],
    floor: ["#5E4433", "#402D21"],
    light: "#FFD79A",
    shade: "#2A1F17",
    accent: "#9C5B33",
  },
  {
    // Fresh white flat, green plant tones
    wall: ["#EDEBE4", "#D2D0C6"],
    floor: ["#A98C68", "#876C4E"],
    light: "#FFF6DF",
    shade: "#3F4239",
    accent: "#6E7F5B",
  },
  {
    // Blloku pink-grey, newer build
    wall: ["#E5DCDC", "#C3B4B6"],
    floor: ["#8C7A72", "#695954"],
    light: "#FFEDE6",
    shade: "#3A2F2E",
    accent: "#A86A63",
  },
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ seed: string }> },
) {
  const { seed } = await params;
  const h = hash(seed);
  const m = MOODS[h % MOODS.length];

  // Deterministic 0..1 draws from different bits of the hash.
  const r = (n: number) => ((h >> n) % 1000) / 1000;

  const W = 1200;
  const H = 800;

  const horizon = Math.round(H * (0.56 + r(3) * 0.12));
  const winW = Math.round(W * (0.2 + r(5) * 0.14));
  const winH = Math.round(winW * (1.25 + r(7) * 0.35));
  const winX = Math.round(W * (0.06 + r(9) * 0.5));
  const winY = Math.round(horizon - winH - H * (0.06 + r(11) * 0.12));

  // The light spill on the floor is what sells it as a photograph.
  const spillX = winX + winW * 0.15;
  const spillW = winW * 1.7;

  const sofaW = Math.round(W * (0.26 + r(13) * 0.16));
  const sofaH = Math.round(H * (0.15 + r(15) * 0.07));
  const sofaX = Math.round(W * (0.42 + r(17) * 0.3));
  const sofaY = horizon - Math.round(sofaH * 0.35);

  const rugW = Math.round(W * (0.3 + r(19) * 0.24));
  const rugX = Math.round(W * (0.1 + r(21) * 0.3));
  const rugY = horizon + Math.round((H - horizon) * (0.3 + r(23) * 0.3));

  const plant = r(25) > 0.45;
  const plantX = Math.round(W * (0.05 + r(27) * 0.12));
  const lamp = r(29) > 0.5;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${m.wall[0]}"/>
      <stop offset="100%" stop-color="${m.wall[1]}"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="${m.floor[0]}"/>
      <stop offset="100%" stop-color="${m.floor[1]}"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${m.light}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${m.light}" stop-opacity="0.25"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.78">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="${m.shade}" stop-opacity="0.42"/>
    </radialGradient>
    <linearGradient id="spill" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${m.light}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${m.light}" stop-opacity="0"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${h % 500}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.06"/></feComponentTransfer>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="softer"><feGaussianBlur stdDeviation="34"/></filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#wall)"/>
  <rect x="0" y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#floor)"/>

  <!-- light thrown across the floor from the window -->
  <polygon points="${spillX},${horizon} ${spillX + spillW},${horizon} ${spillX + spillW * 1.5},${H} ${spillX - spillW * 0.2},${H}"
           fill="url(#spill)" filter="url(#soft)"/>

  <!-- window -->
  <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" fill="${m.shade}" opacity="0.28"/>
  <rect x="${winX + 6}" y="${winY + 6}" width="${winW - 12}" height="${winH - 12}" fill="url(#glow)"/>
  <line x1="${winX + winW / 2}" y1="${winY + 6}" x2="${winX + winW / 2}" y2="${winY + winH - 6}" stroke="${m.wall[1]}" stroke-width="8"/>
  <line x1="${winX + 6}" y1="${winY + winH * 0.44}" x2="${winX + winW - 6}" y2="${winY + winH * 0.44}" stroke="${m.wall[1]}" stroke-width="8"/>
  <rect x="${winX - 10}" y="${winY + winH}" width="${winW + 20}" height="10" fill="${m.wall[0]}"/>

  <!-- rug -->
  <ellipse cx="${rugX + rugW / 2}" cy="${rugY}" rx="${rugW / 2}" ry="${rugW * 0.16}" fill="${m.accent}" opacity="0.3"/>
  <ellipse cx="${rugX + rugW / 2}" cy="${rugY}" rx="${rugW / 2.5}" ry="${rugW * 0.115}" fill="${m.accent}" opacity="0.22"/>

  <!-- sofa: shadow, body, back, cushions -->
  <ellipse cx="${sofaX + sofaW / 2}" cy="${sofaY + sofaH + 12}" rx="${sofaW * 0.58}" ry="26" fill="${m.shade}" opacity="0.35" filter="url(#soft)"/>
  <rect x="${sofaX}" y="${sofaY - sofaH * 0.75}" width="${sofaW}" height="${sofaH * 0.9}" rx="10" fill="${m.accent}" opacity="0.85"/>
  <rect x="${sofaX}" y="${sofaY}" width="${sofaW}" height="${sofaH}" rx="12" fill="${m.accent}"/>
  <rect x="${sofaX + sofaW * 0.06}" y="${sofaY + 8}" width="${sofaW * 0.4}" height="${sofaH * 0.42}" rx="8" fill="${m.light}" opacity="0.22"/>
  <rect x="${sofaX + sofaW * 0.52}" y="${sofaY + 8}" width="${sofaW * 0.4}" height="${sofaH * 0.42}" rx="8" fill="${m.light}" opacity="0.14"/>

  ${
    plant
      ? `<ellipse cx="${plantX + 34}" cy="${horizon + 46}" rx="52" ry="16" fill="${m.shade}" opacity="0.3" filter="url(#soft)"/>
  <rect x="${plantX + 16}" y="${horizon - 4}" width="38" height="52" rx="5" fill="${m.shade}" opacity="0.55"/>
  <path d="M${plantX + 35},${horizon - 4} C${plantX - 8},${horizon - 90} ${plantX + 6},${horizon - 150} ${plantX + 30},${horizon - 176}
           C${plantX + 60},${horizon - 148} ${plantX + 76},${horizon - 86} ${plantX + 35},${horizon - 4} Z"
        fill="#5C7048" opacity="0.8"/>`
      : ""
  }
  ${
    lamp
      ? `<line x1="${W - 150}" y1="${horizon}" x2="${W - 150}" y2="${horizon - 210}" stroke="${m.shade}" stroke-width="6" opacity="0.6"/>
  <path d="M${W - 196},${horizon - 210} L${W - 104},${horizon - 210} L${W - 122},${horizon - 268} L${W - 178},${horizon - 268} Z" fill="${m.light}" opacity="0.85"/>
  <circle cx="${W - 150}" cy="${horizon - 214}" r="90" fill="${m.light}" opacity="0.18" filter="url(#softer)"/>`
      : ""
  }

  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.55"/>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
