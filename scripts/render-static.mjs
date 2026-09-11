// Hand-designed, animated SVG cards for the profile README: the hero, the skills marquee, the link
// icons, the paper buttons, and the paper thumbnails. Everything is plain SVG with SMIL animation,
// so GitHub's image proxy can serve it. The research planet is a three.js loop rendered by
// scenes/render.mjs into assets/scenes/.
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { faceGradient, keycap } from "./materials.mjs"
import { LINKS, PAPERS, PAPER_BUTTONS, PROFILE, SKILL_COLORS, SKILL_ROWS, paperButtonId } from "./profile-data.mjs"
import { MONO, THEMES, chip, escapeXml, linearGradient, mix, rng, round, shade, svgDocument, textWidth } from "./svg.mjs"

export const WIDTH = 1200
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// Measured width of the hero font at weight 700, per character per font-size unit. `textWidth`'s
// generic 0.6 overshoots bold text by about 18%, which would strand the caret past the last letter,
// so the taglines use this calibrated factor and pin it with textLength.
const TAGLINE_FACTOR = 0.505

// Each tagline owns one slot of a shared loop and types itself out: a clipPath rect widens to the
// text width, holds, then collapses before the next one begins, so the SMIL loop closes seamlessly.
// WebKit ignores a clip rect of width 0, so the collapsed state floors at 0.01.
function typeTrack({ index, count, left, width, seconds }) {
  const slot = 1 / count
  const start = index * slot
  const at = (fraction) => round(start + slot * fraction)
  const keyTimes = `0;${round(start)};${at(0.3)};${at(0.86)};${at(0.96)};1`
  const track = (attribute, values) =>
    `<animate attributeName="${attribute}" values="${values}" keyTimes="${keyTimes}" dur="${seconds}s" repeatCount="indefinite"/>`
  return {
    clip: track("width", `0.01;0.01;${width};${width};0.01;0.01`),
    caret: track("x", `${left};${left};${left + width};${left + width};${left};${left}`) + track("opacity", "0;0;1;1;0;0")
  }
}

export function renderHero(theme) {
  // Text only: the name, the role, and a typed line that cycles through the research taglines.
  const left = 56
  const size = 34
  const baseline = 214
  const seconds = PROFILE.taglines.length * 4.5
  const lines = PROFILE.taglines.map((text, index) => {
    const width = round(text.length * size * TAGLINE_FACTOR)
    return { text, width, ...typeTrack({ index, count: PROFILE.taglines.length, left, width, seconds }) }
  })
  const width = round(left * 2 + Math.max(...lines.map((line) => line.width)) + 12)
  const body = [
    `<text x="${left}" y="104" font-size="72" font-weight="800" letter-spacing="-1.8" fill="${theme.text}">${escapeXml(PROFILE.name)}</text>`,
    `<text x="${left}" y="150" font-size="26" font-weight="700" letter-spacing="0.4" fill="${theme.accent}">${escapeXml(PROFILE.role)}</text>`,
    ...lines.map((line, index) =>
      `<g clip-path="url(#hero-type-${index})"><text x="${left}" y="${baseline}" font-size="${size}" font-weight="700" textLength="${line.width}" lengthAdjust="spacing" fill="${theme.accent2}">${escapeXml(line.text)}</text></g>` +
      `<rect x="${left}" y="${baseline - size + 6}" width="4" height="${size}" rx="1" fill="${theme.accent}" opacity="0">${line.caret}</rect>`
    )
  ].join("\n")
  const defs = lines
    .map((line, index) => `<clipPath id="hero-type-${index}"><rect x="${left}" y="${baseline - size - 4}" height="${size + 16}" width="0.01">${line.clip}</rect></clipPath>`)
    .join("")
  return svgDocument({ id: "hero", width, height: 250, title: `${PROFILE.name}, ${PROFILE.role}`, theme, defs, body })
}

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

// Official brand marks (simple-icons, CC0) for the four services that have one, and Material
// Symbols' filled mail and globe (Apache-2.0) so every glyph is a solid 24x24 path. The classic
// site draws the same set in src/components/logos/BrandIcons.tsx; keep the two in step.
const LINK_ICONS = {
  scholar: `M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z`,
  website: `M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 0 1 5.08 16zm2.95-8H5.08a7.987 7.987 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z`,
  linkedin: `M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z`,
  github: `M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12`,
  email: `M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z`,
  x: `M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z`,
}

// A round icon button like the website's sidebar: a warm disc with a line icon and a slow sheen.
export function renderLinkIcon(theme, link) {
  const size = 64
  const dark = theme.name === "dark"
  const id = `link-${link.id}`
  const body = [
    `<circle cx="32" cy="32" r="30" fill="${dark ? "#f7e3c9" : "#fdefd9"}"/>`,
    `<g clip-path="url(#${id}-clip)"><rect x="-70" y="0" width="34" height="${size}" fill="url(#${id}-shine)" transform="skewX(-22)"><animate attributeName="x" from="-70" to="110" dur="7s" begin="${LINKS.indexOf(link) * 0.6}s" repeatCount="indefinite"/></rect></g>`,
    `<g transform="translate(32 32) scale(1.17) translate(-12 -12)" fill="#3d4a5c"><path d="${LINK_ICONS[link.icon]}"/></g>`
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
  hero: renderHero,
  "skills-marquee": renderSkillsMarquee,
  ...Object.fromEntries(LINKS.map((link) => [`link-${link.id}`, (theme) => renderLinkIcon(theme, link)])),
  ...Object.fromEntries(PAPER_BUTTONS.map((label) => [paperButtonId(label), (theme) => renderPaperButton(theme, label)]))
}

// Theme-independent files, written once as assets/<name>.svg.
export const SINGLE_ASSETS = Object.fromEntries(PAPERS.filter((paper) => paper.thumbnail).map((paper) => [`papers/${paper.id}`, () => renderPaperThumbnail(paper)]))
