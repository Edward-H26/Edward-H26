// @ts-check
// A paper thumbnail: the cropped figure (assets/papers/figures/<id>.webp) under a rounded frame,
// with the venue badge as a keycap in the corner. One file serves both themes.
import { readFileSync } from "node:fs"
import path from "node:path"
import { shade } from "../color.mjs"
import { UNDER_REVIEW } from "../data/index.mjs"
import { faceGradient, keycap } from "../materials.mjs"
import { round } from "../numbers.mjs"
import { FIGURES_DIR } from "../paths.mjs"
import { THEMES, escapeXml, linearGradient, svgDocument, textWidth } from "../svg.mjs"

const WIDTH = 600
// normalize-paper-figures.py places every figure on one 16:9 canvas with a white band on top for
// the badge, so this frame matches the file exactly and the keycap sits in that band.
const HEIGHT = 338
const BADGE_HEIGHT = 34
const BADGE_FONT_SIZE = 17
const NAVY = "#13294B"
const UNDER_REVIEW_NAVY = "#4c5b73"

/** @param {import("../data/papers.mjs").Paper & { thumbnail: import("../data/papers.mjs").PaperThumbnail }} paper */
export function renderPaperThumbnail(paper) {
  const { badge, alt } = paper.thumbnail
  const figure = readFileSync(path.join(FIGURES_DIR, `${paper.id}.webp`)).toString("base64")
  const navy = badge === UNDER_REVIEW ? UNDER_REVIEW_NAVY : NAVY
  const badgeWidth = round(textWidth(badge, BADGE_FONT_SIZE, 700) + 34)
  const id = `paper-${paper.id}`
  const body = [
    `<g clip-path="url(#${id}-frame)"><image xlink:href="data:image/webp;base64,${figure}" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid meet"/><rect x="1" y="1" width="${WIDTH - 2}" height="${round(HEIGHT * 0.3)}" rx="23" fill="url(#mat-gloss)" opacity="0.35"/></g>`,
    `<rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" rx="23" fill="none" stroke="${NAVY}" stroke-opacity="0.22" stroke-width="2"/>`,
    `<g transform="translate(18 15)">${keycap({ width: badgeWidth, height: BADGE_HEIGHT, radius: 10, fill: `url(#${id}-badge)`, side: shade(navy, -0.5), depth: 4 })}<g clip-path="url(#${id}-badge-clip)"><rect x="-60" y="0" width="30" height="${BADGE_HEIGHT}" fill="url(#${id}-shine)" transform="skewX(-22)"><animate attributeName="x" from="-60" to="${badgeWidth + 40}" dur="6s" repeatCount="indefinite"/></rect></g><text x="${badgeWidth / 2}" y="24" text-anchor="middle" font-size="${BADGE_FONT_SIZE}" font-weight="700" letter-spacing="0.6" fill="#ffffff">${escapeXml(badge)}</text></g>`
  ].join("")
  const defs = [
    `<clipPath id="${id}-frame"><rect width="${WIDTH}" height="${HEIGHT}" rx="24"/></clipPath>`,
    `<clipPath id="${id}-badge-clip"><rect width="${badgeWidth}" height="${BADGE_HEIGHT}" rx="10"/></clipPath>`,
    faceGradient(`${id}-badge`, navy, { top: 0.2, bottom: -0.12 }),
    linearGradient(`${id}-shine`, [
      ["0", "#ffffff", 0],
      ["0.5", "#ffffff", 0.35],
      ["1", "#ffffff", 0]
    ])
  ].join("")
  return svgDocument({ id, width: WIDTH, height: HEIGHT, title: alt, theme: THEMES.light, defs, body, background: false })
}
