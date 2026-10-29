// @ts-check
// Primitives shared by every generated SVG: the two themes, escaping, rough text measurement, and
// the document, card, pill, gradient and filter builders. Rendering is deterministic, so a
// re-render only changes a committed file when the data or the code changed.
import { shade } from "./color.mjs"
import { materialDefs } from "./materials.mjs"
import { round } from "./numbers.mjs"

/**
 * @typedef {object} Theme
 * @property {"dark" | "light"} name
 * @property {string} bg page background
 * @property {string} card card face
 * @property {string} cardTop lighter top of a card face
 * @property {string} text
 * @property {string} muted secondary text
 * @property {string} faint tertiary text and axes
 * @property {string} accent orange
 * @property {string} accent2 blue
 * @property {string} accent3 green
 * @property {string} accent4 purple
 * @property {string} border card outline
 */

/** @type {{ dark: Theme, light: Theme }} */
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
    border: "rgba(255,255,255,0.12)"
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
    border: "rgba(19,41,75,0.16)"
  }
}

/** Width of the full-width cards: the skills marquee and the live GitHub cards. */
export const CARD_WIDTH = 1200

const FONT = "ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

/** @param {unknown} value */
export function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/**
 * GitHub renders SVGs with system fonts, so widths are estimated, never measured.
 * @param {string} text
 * @param {number} size font size in pixels
 * @param {number} [weight]
 */
export function textWidth(text, size, weight = 400) {
  const factor = weight >= 600 ? 0.6 : 0.54
  return text.length * size * factor
}

/**
 * A complete SVG file. Every document carries the shared material defs, so any card can use the
 * lit surfaces. `background: false` leaves the page showing through, for images with rounded corners.
 * @param {{ id: string, width: number, height: number, title: string, theme: Theme, defs?: string, body: string, background?: boolean }} options
 */
export function svgDocument({ id, width, height, title, theme, defs = "", body, background = true }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${id}-title" font-family="${FONT}">`,
    `<title id="${id}-title">${escapeXml(title)}</title>`,
    `<defs>${materialDefs()}${defs}</defs>`,
    background ? `<rect width="${width}" height="${height}" fill="${theme.bg}"/>` : "",
    body,
    `</svg>`
  ].join("\n")
}

/**
 * A card is a slab: a shaded edge below the face and a sheen along the top. Returns the gradient
 * for `<defs>` and the rectangles for the body.
 * @param {Theme} theme
 * @param {{ x: number, y: number, width: number, height: number, radius?: number, id: string }} frame
 */
export function cardFrame(theme, { x, y, width, height, radius = 18, id }) {
  const dark = theme.name === "dark"
  const side = dark ? "#04070d" : "#c3cddd"
  return {
    defs: `<linearGradient id="${id}-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.cardTop}"/><stop offset="1" stop-color="${theme.card}"/></linearGradient>`,
    rect: `<rect x="${x}" y="${y + 5}" width="${width}" height="${height}" rx="${radius}" fill="${side}"/><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="url(#${id}-fill)" stroke="${theme.border}"/><rect x="${x + 1}" y="${y + 1}" width="${width - 2}" height="${round(height * 0.35)}" rx="${radius}" fill="url(#mat-gloss)" opacity="${dark ? 0.1 : 0.45}"/>`
  }
}

/**
 * A pill with a shaded edge and a gloss: `face` is the paint of the top surface, otherwise the
 * pill is a translucent tint of `color`. Returns the markup and the width it takes.
 * @param {Theme} theme
 * @param {{ x: number, y: number, label: string, color: string, size?: number, face?: string }} options
 */
export function chip(theme, { x, y, label, color, size = 15, face }) {
  const padding = 14
  const width = round(textWidth(label, size, 600) + padding * 2)
  const height = size + 16
  const top = face
    ? `<rect width="${width}" height="${height}" rx="${height / 2}" fill="${face}" stroke="${color}" stroke-opacity="0.5"/>`
    : `<rect width="${width}" height="${height}" rx="${height / 2}" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-opacity="0.55"/>`
  return {
    width,
    svg: `<g transform="translate(${round(x)} ${round(y)})"><rect y="3" width="${width}" height="${height}" rx="${height / 2}" fill="${shade(color, -0.5)}"/>${top}<rect x="1.5" y="1.5" width="${width - 3}" height="${round(height / 2 - 2)}" rx="${round(height / 2 - 2)}" fill="url(#mat-gloss)" opacity="0.4"/><text x="${width / 2}" y="${height / 2 + size * 0.36}" text-anchor="middle" font-size="${size}" font-weight="600" fill="${theme.text}">${escapeXml(label)}</text></g>`
  }
}

/**
 * Soft glow: the blurred shape merged under itself.
 * @param {string} id
 * @param {number} [deviation] blur radius
 */
export function glowFilter(id, deviation = 4) {
  return `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${deviation}" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
}

/**
 * @param {string} id
 * @param {[string, string, number?][]} stops [offset, colour, opacity] triples
 * @param {{ x1?: string, y1?: string, x2?: string, y2?: string }} [direction] left to right by default
 */
export function linearGradient(id, stops, { x1 = "0", y1 = "0", x2 = "1", y2 = "0" } = {}) {
  const body = stops.map(([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}"${opacity === undefined ? "" : ` stop-opacity="${opacity}"`}/>`).join("")
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${body}</linearGradient>`
}
