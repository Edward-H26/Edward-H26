// Small helpers shared by every generated SVG: themes, escaping, a seeded random source
// (so re-rendering never changes committed files), and rough text measurement.
export const THEMES = {
  dark: {
    name: "dark",
    bg: "#0d1117",
    card: "#0f1a2e",
    cardTop: "#162a4d",
    text: "#e6edf3",
    muted: "#9fb0cc",
    faint: "#6b7a93",
    accent: "#ff7a4d",
    accent2: "#58a6ff",
    accent3: "#3fb950",
    accent4: "#d2a8ff",
    border: "rgba(255,255,255,0.12)",
    grid: "rgba(255,255,255,0.05)",
    glow: "#E84A27"
  },
  light: {
    name: "light",
    bg: "#ffffff",
    card: "#f6f8fa",
    cardTop: "#eaf0fa",
    text: "#13294B",
    muted: "#4c5b73",
    faint: "#6b7893",
    accent: "#E84A27",
    accent2: "#0969da",
    accent3: "#1a7f37",
    accent4: "#8250df",
    border: "rgba(19,41,75,0.16)",
    grid: "rgba(19,41,75,0.06)",
    glow: "#E84A27"
  }
}

export const FONT = "ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

export function escape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// mulberry32: deterministic pseudo random numbers from a seed.
export function rng(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// GitHub renders SVGs with system fonts, so widths are estimated, never measured.
export function textWidth(text, size, weight = 400) {
  const factor = weight >= 600 ? 0.6 : 0.54
  return text.length * size * factor
}

export function round(value) {
  return Math.round(value * 100) / 100
}

export function svgDocument({ width, height, title, theme, defs = "", body }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title" font-family="${FONT}">`,
    `<title id="title">${escape(title)}</title>`,
    `<defs>${defs}</defs>`,
    `<rect width="${width}" height="${height}" fill="${theme.bg}"/>`,
    body,
    `</svg>`
  ].join("\n")
}

export function cardFrame(theme, { x, y, width, height, radius = 18, id }) {
  return [
    `<linearGradient id="${id}-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.cardTop}"/><stop offset="1" stop-color="${theme.card}"/></linearGradient>`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="url(#${id}-fill)" stroke="${theme.border}"/>`
  ]
}

export function chip(theme, { x, y, label, color, size = 15 }) {
  const padding = 14
  const width = round(textWidth(label, size, 600) + padding * 2)
  const height = size + 16
  return {
    width,
    svg: `<g transform="translate(${round(x)} ${round(y)})"><rect width="${width}" height="${height}" rx="${height / 2}" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-opacity="0.55"/><text x="${width / 2}" y="${height / 2 + size * 0.36}" text-anchor="middle" font-size="${size}" font-weight="600" fill="${theme.text}">${escape(label)}</text></g>`
  }
}
