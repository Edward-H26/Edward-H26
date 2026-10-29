// @ts-check
// The skills marquee: one scrolling row of keycap chips per SKILL_ROWS entry, alternating
// direction. Each row is drawn twice end to end, so the loop never shows a gap.
import { mix } from "../color.mjs"
import { SKILL_COLORS, SKILL_ROWS } from "../data/index.mjs"
import { faceGradient } from "../materials.mjs"
import { round } from "../numbers.mjs"
import { CARD_WIDTH, chip, linearGradient, svgDocument } from "../svg.mjs"

const VERTICAL_PADDING = 18
const FIRST_ROW_Y = 16
const ROW_PITCH = 52
const CHIP_FONT_SIZE = 14
const CHIP_GAP = 12
// Pixels per second; a row's loop lasts its width divided by this.
const SCROLL_SPEED = 34
// The fade to the page background at both edges.
const FADE_WIDTH = 140

/** @param {import("../svg.mjs").Theme} theme */
export function renderSkillsMarquee(theme) {
  const height = VERTICAL_PADDING + SKILL_ROWS.length * ROW_PITCH
  const dark = theme.name === "dark"
  const rows = SKILL_ROWS.map((row, rowIndex) => {
    let x = 0
    const chips = row.map(([label, category]) => {
      const item = chip(theme, { x, y: 0, label, color: theme[SKILL_COLORS[category]], size: CHIP_FONT_SIZE, face: `url(#chip-face-${category})` })
      x += item.width + CHIP_GAP
      return item.svg
    })
    const rowWidth = round(x)
    const y = FIRST_ROW_Y + rowIndex * ROW_PITCH
    const from = rowIndex === 0 ? 0 : -rowWidth
    const to = rowIndex === 0 ? -rowWidth : 0
    return `<g transform="translate(0 ${y})"><g><animateTransform attributeName="transform" type="translate" from="${from} 0" to="${to} 0" dur="${round(rowWidth / SCROLL_SPEED)}s" repeatCount="indefinite"/>${chips.join("")}<g transform="translate(${rowWidth} 0)">${chips.join("")}</g></g></g>`
  })
  const fades = `<rect width="${FADE_WIDTH}" height="${height}" fill="url(#marquee-left)"/><rect x="${CARD_WIDTH - FADE_WIDTH}" width="${FADE_WIDTH}" height="${height}" fill="url(#marquee-right)"/>`
  const faces = Object.entries(SKILL_COLORS)
    .map(([category, token]) => faceGradient(`chip-face-${category}`, mix(theme.card, theme[token], dark ? 0.42 : 0.3), { top: 0.18, bottom: -0.12 }))
    .join("")
  const defs =
    faces +
    linearGradient("marquee-left", [
      ["0", theme.bg],
      ["1", theme.bg, 0]
    ]) +
    linearGradient("marquee-right", [
      ["0", theme.bg, 0],
      ["1", theme.bg]
    ])
  return svgDocument({ id: "skills-marquee", width: CARD_WIDTH, height, title: "Tools and skills", theme, defs, body: [...rows, fades].join("\n") })
}
