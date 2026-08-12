/*
 * Rebuilds public/footer/starfield.svg from Figma's 10MB export, and emits the
 * twinkle subset the canvas overlay animates.
 *
 * The export is 13,780 tiny ellipses, each carrying its OWN <radialGradient> —
 * 11,290 of which are byte-for-byte the same two ramps, centred on the middle of
 * the artboard and spanning the whole 1823x572 field. So a star's fill is really
 * just a function of where it sits: across a 0.5px ellipse the ramp is constant,
 * and every one of them renders as a flat-coloured dot.
 *
 * That is the whole 10MB: 11,290 copies of two gradients.
 *
 * Kept so the two generated files are not unexplained magic. The input is the
 * original Figma export, which is NOT in the tree — it was replaced by this
 * script's own output. To re-run it, recover the export first:
 *
 *   git log --oneline -- public/footer/starfield.svg
 *   git show <rev>:public/footer/starfield.svg > /tmp/starfield-figma.svg
 *   node scripts/build-starfield.mjs /tmp/starfield-figma.svg
 *
 * The input path is required rather than defaulted, so a second run cannot
 * quietly consume the output of the first.
 */
import fs from "node:fs";

const SRC = process.argv[2];
if (!SRC) {
  console.error("usage: node scripts/build-starfield.mjs <original-figma-export.svg>");
  process.exit(1);
}
const OUT_SVG = "public/footer/starfield.svg";
const OUT_TS = "src/components/footer/twinkle-data.ts";

const svg = fs.readFileSync(SRC, "utf8");
const cut = svg.indexOf("<defs>");
const body = svg.slice(0, cut);
const defs = svg.slice(cut);

const W = 1823.31;
const H = 571.957;

/* ---------------------------------------------------------------- ramps --- */

const ramps = [];
const rampOf = new Map();
for (const m of defs.matchAll(
  /<radialGradient id="([^"]+)"[^>]*gradientTransform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)">([\s\S]*?)<\/radialGradient>/g,
)) {
  const stops = [...m[6].matchAll(/<stop(?: offset="([\d.]+)")? stop-color="#([0-9A-Fa-f]{6})"\/>/g)].map(
    (s) => ({ o: s[1] === undefined ? 0 : +s[1], c: s[2] }),
  );
  const sig = stops.map((s) => s.o + ":" + s.c).join(",");
  let i = ramps.findIndex((r) => r.sig === sig);
  if (i < 0) i = ramps.push({ sig, stops }) - 1;
  rampOf.set(m[1], { ramp: i, tx: +m[2], ty: +m[3], sx: +m[4], sy: +m[5] });
}

const hex = (c) => [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
const sample = (stops, t) => {
  t = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < stops.length - 2 && stops[i + 1].o < t) i++;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const f = b.o === a.o ? 0 : (t - a.o) / (b.o - a.o);
  const A = hex(a.c);
  const B = hex(b.c);
  return A.map((v, k) => Math.round(v + (B[k] - v) * Math.max(0, Math.min(1, f))));
};

/* ---------------------------------------------------------------- stars --- */

const bbox = (d) => {
  const n = d.match(/-?\d*\.?\d+(?:e-?\d+)?/g).map(Number);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < n.length - 1; i += 2) {
    x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]);
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2 };
};

const stars = [];
for (const m of body.matchAll(/<path d="([^"]+)" fill="url\(#([^)]+)\)"\/>/g)) {
  const b = bbox(m[1]);
  const g = rampOf.get(m[2]);
  const t = Math.hypot((b.cx - g.tx) / g.sx, (b.cy - g.ty) / g.sy);
  stars.push({ ...b, rgb: sample(ramps[g.ramp].stops, t) });
}

/* The ten big ones: Figma rasterized each glow into ~230 concentric rings.
   Collapsed back into one circle plus the radial gradient it was drawn from. */
const rings = new Map();
for (const m of body.matchAll(/<path d="([^"]+)" fill="(#[0-9A-Fa-f]{6})"\/>/g)) {
  const b = bbox(m[1]);
  const key = Math.round(b.cx) + "," + Math.round(b.cy);
  if (!rings.has(key)) rings.set(key, []);
  rings.get(key).push({ ...b, c: m[2].slice(1) });
}
const glows = [...rings.values()].map((rs) => {
  rs.sort((a, b) => b.rx - a.rx);
  const outer = rs[0];
  /* Six stops off the ring stack is indistinguishable from all 230. */
  const stops = [0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => {
    const r = rs[Math.min(rs.length - 1, Math.round(f * (rs.length - 1)))];
    return { o: 1 - r.rx / outer.rx, c: r.c };
  });
  return { cx: outer.cx, cy: outer.cy, rx: outer.rx, ry: outer.ry, stops: stops.reverse() };
});

const dropped = [...body.matchAll(/<path\b[^>]*\/?>/g)].length - stars.length - [...body.matchAll(/<path d="[^"]+" fill="#[0-9A-Fa-f]{6}"\/>/g)].length;

/* ------------------------------------------------------------------ svg --- */

/* Quantised into groups so the fill is written once per shade rather than once
   per star — the single biggest win in the file after the gradients go. */
const BUCKETS = 64;
const groups = new Map();
for (const s of stars) {
  const key = s.rgb.map((v) => Math.round(v / (256 / BUCKETS)) * (256 / BUCKETS)).map((v) => Math.min(255, v)).join(",");
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(s);
}

const n2 = (v) => (Math.round(v * 100) / 100).toString().replace(/^0\./, ".");
const toHex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

let out = `<svg preserveAspectRatio="none" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
out += `<defs>`;
glows.forEach((g, i) => {
  out += `<radialGradient id="g${i}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${n2(g.cx)} ${n2(g.cy)}) scale(${n2(g.rx)} ${n2(g.ry)})">`;
  out += g.stops.map((s) => `<stop offset="${n2(s.o)}" stop-color="#${s.c}"/>`).join("");
  out += `</radialGradient>`;
});
out += `</defs>`;
for (const [key, list] of groups) {
  out += `<g fill="${toHex(key.split(",").map(Number))}">`;
  for (const s of list) {
    out += s.rx === s.ry
      ? `<circle cx="${n2(s.cx)}" cy="${n2(s.cy)}" r="${n2(s.rx)}"/>`
      : `<ellipse cx="${n2(s.cx)}" cy="${n2(s.cy)}" rx="${n2(s.rx)}" ry="${n2(s.ry)}"/>`;
  }
  out += `</g>`;
}
glows.forEach((g, i) => {
  out += `<ellipse cx="${n2(g.cx)}" cy="${n2(g.cy)}" rx="${n2(g.rx)}" ry="${n2(g.ry)}" fill="url(#g${i})"/>`;
});
out += `</svg>`;

/* -------------------------------------------------------------- twinkle --- */

/*
 * Which stars sparkle: every bright one in the field.
 *
 * This was a 720 subset, thinned to a spread so it did not clump into a flicker
 * in one corner. The cap is now above the number of candidates, so the thinning
 * is a no-op and the rule is simply "if it is bright enough to be worth
 * twinkling, it twinkles" — 2,993 of them, which is what stops the sky reading
 * as a handful of lights blinking in an otherwise dead field. The sort is kept
 * so that lowering this below the candidate count still spreads rather than
 * taking one corner of the sky.
 */
const COUNT = 3000;
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
/* Bright ones only. A star out at the edge of the field is nearly the colour of
   the sky behind it, and a dark dot brightening reads as a speck of dust. */
const bright = stars
  .filter((s) => s.rx > 0.5 && lum(s.rgb) > 110)
  .sort((a, b) => ((a.cx * 12.9898 + a.cy * 78.233) % 1) - ((b.cx * 12.9898 + b.cy * 78.233) % 1));
const step = Math.max(1, Math.floor(bright.length / COUNT));
const picked = bright.filter((_, i) => i % step === 0).slice(0, COUNT);
console.log(`candidates       ${bright.length} bright stars -> every ${step}`);

const buf = Buffer.alloc(picked.length * 5);
picked.forEach((s, i) => {
  const o = i * 5;
  buf.writeUInt16LE(Math.round(s.cx * 16), o);
  buf.writeUInt16LE(Math.round(s.cy * 16), o + 2);
  buf.writeUInt8(Math.min(255, Math.round(s.rx * 64)), o + 4);
});

const ts = `/*
 * The stars that twinkle, packed.
 *
 * Generated from the footer starfield artwork — see the note in Twinkle.tsx for
 * why only a subset of the field is here. Five bytes each: x and y as sixteenths
 * of an artwork pixel, then the radius in sixty-fourths. No colour: every star in
 * here was picked for being bright to begin with, and what a bright star does
 * when it flares is whiten.
 *
 * Do not hand-edit.
 */

/** The coordinate space the packed positions are in. */
export const FIELD = { w: ${W}, h: ${H} } as const;

export const TWINKLE_COUNT = ${picked.length};

const PACKED =
  "${buf.toString("base64")}";

export type Star = { x: number; y: number; r: number };

/** Unpacks once, on first use. */
export function unpack(): Star[] {
  const bin = atob(PACKED);
  const out: Star[] = [];
  for (let i = 0; i < bin.length; i += 5) {
    const at = (k: number) => bin.charCodeAt(i + k);
    out.push({
      x: (at(0) | (at(1) << 8)) / 16,
      y: (at(2) | (at(3) << 8)) / 16,
      r: at(4) / 64,
    });
  }
  return out;
}
`;

fs.mkdirSync("src/components/footer", { recursive: true });
fs.writeFileSync(OUT_TS, ts);
fs.writeFileSync(OUT_SVG, out);

const before = svg.length;
console.log(`ramps            ${ramps.length}`);
console.log(`small stars      ${stars.length}`);
console.log(`glow stars       ${glows.length} (from ${[...rings.values()].reduce((a, r) => a + r.length, 0)} rings)`);
console.log(`dropped          ${dropped} black hairline slivers`);
console.log(`colour groups    ${groups.size}`);
console.log(`twinklers        ${picked.length}  (${(buf.length / 1024).toFixed(1)} KB packed, ${(buf.toString("base64").length / 1024).toFixed(1)} KB base64)`);
console.log(`svg              ${(before / 1048576).toFixed(2)} MB -> ${(out.length / 1024).toFixed(0)} KB  (${(before / out.length).toFixed(0)}x smaller)`);
