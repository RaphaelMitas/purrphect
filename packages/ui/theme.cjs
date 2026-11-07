const MOODS = ["bright", "soft", "dim", "dark", "black"];

const PAGE = {
  bright: { lightness: 99, saturate: (s) => s + 10 },
  soft: { lightness: 97, saturate: (s) => s + 85 },
  dim: { lightness: 18, saturate: (s) => s * 0.45 },
  dark: { lightness: 9, saturate: (s) => s * 0.45 },
  black: { lightness: 3, saturate: (s) => s * 0.45 },
};

const PRESETS = [
  {
    id: "purrphect",
    name: "Purrphect",
    accent: "#FF70A0",
    second: "#5FCFAE",
    highlight: "#FFD36B",
    danger: "#E86F6F",
    warmth: 90,
    mood: "soft",
  },
  {
    id: "midnight",
    name: "Midnight",
    accent: "#FF70A0",
    second: "#5FCFAE",
    highlight: "#FFD36B",
    danger: "#DB5C5C",
    warmth: 61,
    mood: "dark",
  },
  {
    id: "pub",
    name: "Pub",
    accent: "#D2302C",
    second: "#1E7F4F",
    highlight: "#E8B23A",
    danger: "#C0392B",
    warmth: 100,
    mood: "soft",
  },
  {
    id: "matcha",
    name: "Matcha",
    accent: "#7DAA6A",
    second: "#E9A07A",
    highlight: "#F0CF6A",
    danger: "#D86A5E",
    warmth: 100,
    mood: "bright",
  },
  {
    id: "lavender",
    name: "Lavender",
    accent: "#A58CFF",
    second: "#FF9466",
    highlight: "#FFD36B",
    danger: "#E86F6F",
    warmth: 25,
    mood: "bright",
  },
  {
    id: "deep-sea",
    name: "Deep sea",
    accent: "#5DB7F0",
    second: "#F2B84B",
    highlight: "#FFD36B",
    danger: "#E86F6F",
    warmth: 5,
    mood: "dark",
  },
];

const WHITE = [255, 255, 255];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb) {
  return `#${rgb
    .map((v) =>
      Math.round(clamp(v, 0, 255))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function rgbToHsl([r, g, b]) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n) => {
    const k = (n + (((h % 360) + 360) % 360) / 30) % 12;
    return 255 * (ln - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

const hexToHsl = (hex) => rgbToHsl(hexToRgb(hex));
const hslToHex = (h, s, l) => rgbToHex(hslToRgb(h, s, l));

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const mix = (a, b, weight) => a.map((v, i) => v + (b[i] - v) * weight);

const triplet = (rgb) => {
  const [h, s, l] = rgbToHsl(rgb);
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
};

const isDarkRgb = (rgb) => luminance(rgb) < 0.2;

const isLightOn = (text, page) => luminance(text) > luminance(page);

const snap = (rgb) => hslToRgb(...rgbToHsl(rgb).map(Math.round)).map(Math.round);

// Contrast is measured on the rounded values the tokens actually carry.
function readable(rgb, page, min) {
  const [h, s, l] = rgbToHsl(rgb);
  const step = isDarkRgb(page) ? 1 : -1;
  let out = rgb;
  for (let next = l + step; contrast(snap(out), snap(page)) < min && next >= 0 && next <= 100; next += step) {
    out = hslToRgb(h, s, next);
  }
  return out;
}

function pageColor(theme) {
  const mood = PAGE[theme.mood];
  const hue = 220 + (180 * theme.warmth) / 100;
  const saturation = 12 + Math.abs(theme.warmth - 50) * 0.9;
  return hslToRgb(hue, mood.saturate(saturation), mood.lightness);
}

function themeTokens(theme) {
  const page = theme.page ? hexToRgb(theme.page) : pageColor(theme);
  const accent = hexToRgb(theme.accent);
  const [accentHue] = rgbToHsl(accent);
  const lightText = hslToRgb(accentHue, 67, 96);
  const darkText = hslToRgb(accentHue, 17, 20);
  const autoText = contrast(lightText, page) > contrast(darkText, page) ? lightText : darkText;
  const text = theme.text ? hexToRgb(theme.text) : autoText;
  const dark = isLightOn(text, page);
  const cards = theme.cards ? hexToRgb(theme.cards) : mix(page, WHITE, dark ? 0.06 : 0.9);
  const on = (rgb) => (contrast(rgb, WHITE) >= 2.2 ? WHITE : darkText);
  const soft = (rgb) => mix(page, rgb, dark ? 0.24 : 0.16);
  const ink = (rgb) => readable(rgb, soft(rgb), 3);
  const tone = (name, hex) => {
    const rgb = hexToRgb(hex);
    return {
      [name]: triplet(rgb),
      [`${name}-foreground`]: triplet(on(rgb)),
      [`${name}-soft`]: triplet(soft(rgb)),
      [`${name}-ink`]: triplet(ink(rgb)),
    };
  };
  const muted = dark ? mix(cards, text, 0.05) : mix(mix(page, accent, 0.07), text, 0.04);
  const border = dark ? mix(cards, text, 0.08) : mix(mix(page, accent, 0.14), text, 0.05);
  return {
    background: triplet(page),
    foreground: triplet(text),
    card: triplet(cards),
    "card-foreground": triplet(text),
    popover: triplet(cards),
    "popover-foreground": triplet(text),
    primary: triplet(accent),
    "primary-foreground": triplet(on(accent)),
    secondary: triplet(soft(accent)),
    "secondary-foreground": triplet(ink(accent)),
    muted: triplet(muted),
    "muted-foreground": triplet(readable(mix(text, page, dark ? 0.35 : 0.45), muted, 3)),
    accent: triplet(muted),
    "accent-foreground": triplet(text),
    ...tone("destructive", theme.danger),
    border: triplet(border),
    input: triplet(border),
    ring: triplet(accent),
    ...tone("pink", theme.accent),
    ...tone("mint", theme.second),
    ...tone("butter", theme.highlight),
    "board-face": triplet(dark ? mix(page, text, 0.04) : cards),
    "board-single": triplet(dark ? mix(cards, text, 0.03) : page),
    "board-single-alt": triplet(soft(accent)),
  };
}

const parseTriplet = (value) => value.split(" ").map((part) => Number.parseFloat(part));

const tripletToHex = (value) => hslToHex(...parseTriplet(value));

const isDark = (tokens) =>
  isLightOn(hslToRgb(...parseTriplet(tokens.foreground)), hslToRgb(...parseTriplet(tokens.background)));

const autoColors = (theme) => {
  const tokens = themeTokens(theme);
  return {
    page: tripletToHex(tokens.background),
    cards: tripletToHex(tokens.card),
    text: tripletToHex(tokens.foreground),
  };
};

module.exports = {
  MOODS,
  PRESETS,
  themeTokens,
  isDark,
  autoColors,
  tripletToHex,
  hexToHsl,
  hslToHex,
  hexToRgb,
  contrast,
};
