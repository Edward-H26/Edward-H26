// Helpers shared by every generated SVG: themes, escaping, a seeded random source (so re-rendering
// never changes committed files), rough text measurement, and the document and card frames.
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

export function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// mulberry32.
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

export function svgDocument({ id, width, height, title, theme, defs = "", body }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${id}-title" font-family="${FONT}">`,
    `<title id="${id}-title">${escapeXml(title)}</title>`,
    `<defs>${defs}</defs>`,
    `<rect width="${width}" height="${height}" fill="${theme.bg}"/>`,
    body,
    `</svg>`
  ].join("\n")
}

export function cardFrame(theme, { x, y, width, height, radius = 18, id }) {
  return {
    defs: `<linearGradient id="${id}-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.cardTop}"/><stop offset="1" stop-color="${theme.card}"/></linearGradient>`,
    rect: `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="url(#${id}-fill)" stroke="${theme.border}"/>`
  }
}

export function chip(theme, { x, y, label, color, size = 15 }) {
  const padding = 14
  const width = round(textWidth(label, size, 600) + padding * 2)
  const height = size + 16
  return {
    width,
    svg: `<g transform="translate(${round(x)} ${round(y)})"><rect width="${width}" height="${height}" rx="${height / 2}" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-opacity="0.55"/><text x="${width / 2}" y="${height / 2 + size * 0.36}" text-anchor="middle" font-size="${size}" font-weight="600" fill="${theme.text}">${escapeXml(label)}</text></g>`
  }
}

// Film grain and soft glow, the two effects that make flat SVG shapes read as material.
export function grainFilter(id, alpha = 0.06) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="${alpha}"/></feComponentTransfer></filter>`
}

export function glowFilter(id, deviation = 4) {
  return `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${deviation}" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
}

export function linearGradient(id, stops, { x1 = "0", y1 = "0", x2 = "1", y2 = "0" } = {}) {
  const body = stops.map(([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}"${opacity === undefined ? "" : ` stop-opacity="${opacity}"`}/>`).join("")
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${body}</linearGradient>`
}

// Mix a hex colour toward white (amount > 0) or black (amount < 0) for lit and shaded faces.
export function shade(hex, amount) {
  const channels = hex.replace("#", "").match(/.{2}/g).map((c) => parseInt(c, 16))
  const target = amount > 0 ? 255 : 0
  const mixed = channels.map((c) => Math.round(c + (target - c) * Math.abs(amount)))
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`
}
