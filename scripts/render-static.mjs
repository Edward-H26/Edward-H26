// Hand-designed, animated SVG cards for the profile README: the skills marquee, the link icons,
// the paper buttons, and the paper thumbnails. Everything is plain SVG with SMIL animation, so
// GitHub's image proxy can serve it. The hero, planet, and featured paper are three.js loops rendered
// by scenes/render.mjs into assets/scenes/.
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { faceGradient, keycap } from "./materials.mjs"
import { LINKS, PAPERS, PAPER_BUTTONS, SKILL_COLORS, SKILL_ROWS, paperButtonId } from "./profile-data.mjs"
import { THEMES, chip, escapeXml, linearGradient, mix, round, shade, svgDocument, textWidth } from "./svg.mjs"

export const WIDTH = 1200
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export function renderSkillsMarquee(theme) {
  // One scrolling row per SKILL_ROWS entry, alternating direction; the card grows with the rows.
  const height = 18 + SKILL_ROWS.length * 52
  const gap = 12
  const speed = 34
  const dark = theme.name === "dark"
  const rows = SKILL_ROWS.map((row, rowIndex) => {
    let x = 0
    const chips = row.map(([label, category]) => {
      const item = chip(theme, { x, y: 0, label, color: theme[SKILL_COLORS[category]], size: 14, face: `url(#chip-face-${category})` })
      x += item.width + gap
      return item.svg
    })
    const rowWidth = round(x)
    const y = 16 + rowIndex * 52
    const from = rowIndex === 0 ? 0 : -rowWidth
    const to = rowIndex === 0 ? -rowWidth : 0
    return `<g transform="translate(0 ${y})"><g><animateTransform attributeName="transform" type="translate" from="${from} 0" to="${to} 0" dur="${round(rowWidth / speed)}s" repeatCount="indefinite"/>${chips.join("")}<g transform="translate(${rowWidth} 0)">${chips.join("")}</g></g></g>`
  })
  const fades = `<rect width="140" height="${height}" fill="url(#marquee-left)"/><rect x="${WIDTH - 140}" width="140" height="${height}" fill="url(#marquee-right)"/>`
  const faces = Object.entries(SKILL_COLORS).map(([category, token]) => faceGradient(`chip-face-${category}`, mix(theme.card, theme[token], dark ? 0.42 : 0.3), { top: 0.18, bottom: -0.12 })).join("")
  const defs = faces + linearGradient("marquee-left", [["0", theme.bg], ["1", theme.bg, 0]]) + linearGradient("marquee-right", [["0", theme.bg, 0], ["1", theme.bg]])
  return svgDocument({ id: "skills-marquee", width: WIDTH, height, title: "Tools and skills", theme, defs, body: [...rows, fades].join("\n") })
}

const LINK_ICONS = {
  globe: `<circle r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse rx="3.5" ry="8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M-8,0 H8 M-6.5,-4.5 H6.5 M-6.5,4.5 H6.5" stroke="currentColor" stroke-width="1.2"/>`,
  cap: `<path d="M-9,-2 L0,-6.5 L9,-2 L0,2.5 Z" fill="currentColor"/><path d="M-5,0 V4 Q0,7.5 5,4 V0" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8,-1.5 V4" stroke="currentColor" stroke-width="1.6"/>`,
  in: `<rect x="-8" y="-8" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M-4.5,-1 V5 M-4.5,-4.2 V-4 M0,5 V-1 M0,1.5 Q1.5,-1.5 4.5,0.5 V5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  x: `<path d="M-7,-8 L7,8 M7,-8 L-7,8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  mail: `<rect x="-9" y="-6" width="18" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M-9,-5 L0,1.5 L9,-5" fill="none" stroke="currentColor" stroke-width="1.8"/>`
}

// A round icon button like the website's sidebar: a warm disc with a line icon and a slow sheen.
export function renderLinkIcon(theme, link) {
  const size = 64
  const dark = theme.name === "dark"
  const id = `link-${link.id}`
  const body = [
    `<circle cx="32" cy="32" r="30" fill="${dark ? "#f7e3c9" : "#fdefd9"}"/>`,
    `<g clip-path="url(#${id}-clip)"><rect x="-70" y="0" width="34" height="${size}" fill="url(#${id}-shine)" transform="skewX(-22)"><animate attributeName="x" from="-70" to="110" dur="7s" begin="${LINKS.indexOf(link) * 0.6}s" repeatCount="indefinite"/></rect></g>`,
    `<g transform="translate(32 32) scale(1.55)" style="color:#3d4a5c">${LINK_ICONS[link.icon]}</g>`
  ].join("")
  const defs = [
    `<clipPath id="${id}-clip"><circle cx="32" cy="32" r="30"/></clipPath>`,
    linearGradient(`${id}-shine`, [["0", "#ffffff", 0], ["0.5", "#ffffff", 0.7], ["1", "#ffffff", 0]])
  ].join("")
  return svgDocument({ id, width: size, height: size, title: link.label, theme, defs, body, background: false })
}

// A paper link button in the style of academic homepages: a plain outlined pill (PDF, Project
// Page, Video, BibTeX), reused by every paper. A faint sweep keeps it alive.
export function renderPaperButton(theme, label) {
  const height = 36
  const width = round(textWidth(label, 13, 600) + 36)
  const dark = theme.name === "dark"
  const id = paperButtonId(label)
  const body = [
    `<rect x="1" y="2.5" width="${width - 2}" height="30" rx="15" fill="${dark ? "#161b22" : "#ffffff"}" stroke="${dark ? "#3d444d" : "#c9d3e3"}" stroke-width="1.2"/>`,
    `<g clip-path="url(#${id}-clip)"><rect x="-80" y="0" width="50" height="${height}" fill="url(#${id}-shine)" transform="skewX(-22)"><animate attributeName="x" from="-80" to="${width + 60}" dur="${round(5 + width / 60)}s" repeatCount="indefinite"/></rect></g>`,
    `<text x="${width / 2}" y="22" text-anchor="middle" font-size="13" font-weight="600" fill="${dark ? "#e6edf3" : "#13294B"}">${escapeXml(label)}</text>`
  ].join("")
  const defs = [
    `<clipPath id="${id}-clip"><rect x="1" y="2.5" width="${width - 2}" height="30" rx="15"/></clipPath>`,
    linearGradient(`${id}-shine`, [["0", "#ffffff", 0], ["0.5", "#ffffff", dark ? 0.08 : 0.5], ["1", "#ffffff", 0]])
  ].join("")
  return svgDocument({ id, width, height, title: label, theme, defs, body })
}

// A paper thumbnail: the cropped figure (assets/papers/figures/<id>.webp, 1000x700) under a
// rounded frame, with the venue badge as a keycap in the corner. One file serves both themes.
export function renderPaperThumbnail(paper) {
  const width = 600
  const height = 420
  const { badge, alt } = paper.thumbnail
  const figure = readFileSync(path.join(ROOT, "assets/papers/figures", `${paper.id}.webp`)).toString("base64")
  const navy = badge === "Under Review" ? "#4c5b73" : "#13294B"
  const badgeWidth = round(textWidth(badge, 17, 700) + 34)
  const id = `paper-${paper.id}`
  const body = [
    `<g clip-path="url(#${id}-frame)"><image xlink:href="data:image/webp;base64,${figure}" width="${width}" height="${height}" preserveAspectRatio="xMidYMin slice"/><rect x="1" y="1" width="${width - 2}" height="${round(height * 0.3)}" rx="23" fill="url(#mat-gloss)" opacity="0.35"/></g>`,
    `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="23" fill="none" stroke="#13294B" stroke-opacity="0.22" stroke-width="2"/>`,
    `<g transform="translate(18 18)">${keycap({ width: badgeWidth, height: 34, radius: 10, fill: `url(#${id}-badge)`, side: shade(navy, -0.5), depth: 4 })}<g clip-path="url(#${id}-badge-clip)"><rect x="-60" y="0" width="30" height="34" fill="url(#${id}-shine)" transform="skewX(-22)"><animate attributeName="x" from="-60" to="${badgeWidth + 40}" dur="6s" repeatCount="indefinite"/></rect></g><text x="${badgeWidth / 2}" y="24" text-anchor="middle" font-size="17" font-weight="700" letter-spacing="0.6" fill="#ffffff">${escapeXml(badge)}</text></g>`
  ].join("")
  const defs = [
    `<clipPath id="${id}-frame"><rect width="${width}" height="${height}" rx="24"/></clipPath>`,
    `<clipPath id="${id}-badge-clip"><rect width="${badgeWidth}" height="34" rx="10"/></clipPath>`,
    faceGradient(`${id}-badge`, navy, { top: 0.2, bottom: -0.12 }),
    linearGradient(`${id}-shine`, [["0", "#ffffff", 0], ["0.5", "#ffffff", 0.35], ["1", "#ffffff", 0]])
  ].join("")
  return svgDocument({ id, width, height, title: alt, theme: THEMES.light, defs, body, background: false })
}

export const STATIC_ASSETS = {
  "skills-marquee": renderSkillsMarquee,
  ...Object.fromEntries(LINKS.map((link) => [`link-${link.id}`, (theme) => renderLinkIcon(theme, link)])),
  ...Object.fromEntries(PAPER_BUTTONS.map((label) => [paperButtonId(label), (theme) => renderPaperButton(theme, label)]))
}

// Theme-independent files, written once as assets/<name>.svg.
export const SINGLE_ASSETS = Object.fromEntries(PAPERS.filter((paper) => paper.thumbnail).map((paper) => [`papers/${paper.id}`, () => renderPaperThumbnail(paper)]))
