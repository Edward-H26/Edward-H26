// Hand-designed, animated SVG cards for the profile README: the skills marquee, the footer, the
// link and paper buttons, and the paper thumbnails. Everything is plain SVG with SMIL animation, so
// GitHub's image proxy can serve it. The hero, planet, and featured paper are three.js loops rendered
// by scenes/render.mjs into assets/scenes/.
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { faceGradient, glassBody, glassDefs, keycap } from "./materials.mjs"
import { LINKS, PAPERS, PAPER_BUTTONS, SKILL_COLORS, SKILL_ROWS, paperButtonId } from "./profile-data.mjs"
import { THEMES, chip, escapeXml, linearGradient, mix, round, shade, svgDocument, textWidth } from "./svg.mjs"

export const WIDTH = 1200
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export function renderSkillsMarquee(theme) {
  const height = 122
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
  spark: `<path d="M0,-9 L2.4,-2.4 L9,0 L2.4,2.4 L0,9 L-2.4,2.4 L-9,0 L-2.4,-2.4 Z" fill="currentColor"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite"/></path>`,
  globe: `<circle r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse rx="3.5" ry="8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M-8,0 H8 M-6.5,-4.5 H6.5 M-6.5,4.5 H6.5" stroke="currentColor" stroke-width="1.2"/>`,
  cap: `<path d="M-9,-2 L0,-6.5 L9,-2 L0,2.5 Z" fill="currentColor"/><path d="M-5,0 V4 Q0,7.5 5,4 V0" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8,-1.5 V4" stroke="currentColor" stroke-width="1.6"/>`,
  in: `<rect x="-8" y="-8" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M-4.5,-1 V5 M-4.5,-4.2 V-4 M0,5 V-1 M0,1.5 Q1.5,-1.5 4.5,0.5 V5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  x: `<path d="M-7,-8 L7,8 M7,-8 L-7,8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  mail: `<rect x="-9" y="-6" width="18" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M-9,-5 L0,1.5 L9,-5" fill="none" stroke="currentColor" stroke-width="1.8"/>`
}

// One glass pill per link, with the icon on a small glass disc; the README wraps each image in an
// anchor. A light sweep crosses the glass every few seconds.
export function renderLinkButton(theme, link) {
  const height = 60
  const width = link.width
  const dark = theme.name === "dark"
  const accent = link.id === "collab" ? theme.accent : theme.accent2
  const ink = link.id === "collab" ? theme.accent : theme.text
  const id = `link-${link.id}`
  const glass = glassBody(id, { x: 3, y: 4, width: width - 6, height: 48, radius: 24, dark })
  const shimmer = `<g clip-path="url(#${id}-shape)"><rect x="-120" y="0" width="90" height="${height}" fill="url(#${id}-shine)" transform="skewX(-22)"><animate attributeName="x" from="-120" to="${width + 100}" dur="${round(4 + width / 120)}s" repeatCount="indefinite"/></rect></g>`
  const body = [
    glass.svg,
    shimmer,
    `<circle cx="30" cy="28" r="15" fill="#ffffff" fill-opacity="${dark ? 0.16 : 0.7}" stroke="url(#${id}-rim)" stroke-width="1"/>`,
    `<g transform="translate(30 28)" style="color:${accent}">${LINK_ICONS[link.icon]}</g>`,
    `<text x="54" y="34" font-size="15" font-weight="700" fill="${dark ? "#000000" : "#ffffff"}" opacity="${dark ? 0.35 : 0.8}">${escapeXml(link.label)}</text>`,
    `<text x="54" y="33" font-size="15" font-weight="700" fill="${ink}">${escapeXml(link.label)}</text>`,
    `<path d="M${width - 30},23 l5,5 -5,5" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0 0;3 0;0 0" dur="1.6s" repeatCount="indefinite"/></path>`
  ].join("")
  const defs = [
    glassDefs(id, { dark, tint: accent }),
    glass.defs,
    linearGradient(`${id}-shine`, [["0", "#ffffff", 0], ["0.5", "#ffffff", dark ? 0.22 : 0.7], ["1", "#ffffff", 0]])
  ].join("")
  return svgDocument({ id, width, height, title: link.label, theme, defs, body })
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

// Sea footer: layered waves built from identical 300px cycles (so the loop never jumps) and a
// sailboat crossing slowly. Each wave is lit along its crest and darker below.
export function renderFooter(theme) {
  const height = 110
  const cycle = 300
  const wave = (amplitude, baseline, fill, opacity, duration) => {
    let d = `M0 ${baseline}`
    for (let i = 0; i < 6; i += 1) d += ` q 75 ${-amplitude} 150 0 t 150 0`
    d += ` V ${height} H 0 Z`
    return `<path d="${d}" fill="${fill}" opacity="${opacity}"><animateTransform attributeName="transform" type="translate" from="0 0" to="${-cycle} 0" dur="${duration}s" repeatCount="indefinite"/></path>`
  }
  const boat = `<g><animateMotion dur="40s" repeatCount="indefinite" path="M -40 62 C 300 58 700 66 1240 60"/><g transform="scale(0.8)"><path d="M-16,0 L16,0 L11,7 L-11,7 Z" fill="${theme.name === "dark" ? "#dbe4f2" : "#2b4f86"}"/><line x1="0" y1="0" x2="0" y2="-24" stroke="${theme.name === "dark" ? "#dbe4f2" : "#2b4f86"}" stroke-width="1.4"/><path d="M0,-24 L14,-4 L0,-4 Z" fill="${theme.name === "dark" ? "#dbe4f2" : "#2b4f86"}"/><animateTransform attributeName="transform" type="rotate" values="-3;3;-3" dur="3s" repeatCount="indefinite" additive="sum"/></g></g>`
  const body = [wave(14, 64, "url(#footer-wave-0)", 0.45, 9), boat, wave(18, 74, "url(#footer-wave-1)", 0.5, 13), wave(12, 84, "url(#footer-wave-2)", 0.6, 7)].join("")
  const defs = [
    linearGradient("footer-wave-0", [["0", shade(theme.accent2, 0.35)], ["1", shade(theme.accent2, -0.4)]], { x2: "0", y2: "1" }),
    linearGradient("footer-wave-1", [["0", shade(theme.accent2, 0.2)], ["1", shade(theme.accent2, -0.55)]], { x2: "0", y2: "1" }),
    linearGradient("footer-wave-2", [["0", shade(theme.accent, 0.25)], ["1", shade(theme.accent, -0.5)]], { x2: "0", y2: "1" })
  ].join("")
  return svgDocument({ id: "footer", width: WIDTH, height, title: "Footer", theme, defs, body })
}

export const STATIC_ASSETS = {
  "skills-marquee": renderSkillsMarquee,
  footer: renderFooter,
  ...Object.fromEntries(LINKS.map((link) => [`link-${link.id}`, (theme) => renderLinkButton(theme, link)])),
  ...Object.fromEntries(PAPER_BUTTONS.map((label) => [paperButtonId(label), (theme) => renderPaperButton(theme, label)]))
}

// Theme-independent files, written once as assets/<name>.svg.
export const SINGLE_ASSETS = Object.fromEntries(PAPERS.filter((paper) => paper.thumbnail).map((paper) => [`papers/${paper.id}`, () => renderPaperThumbnail(paper)]))
