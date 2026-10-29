// @ts-check
// The hero card: the name, the role, and one line that types itself out, cycling through the
// research taglines.
import { PROFILE } from "../data/index.mjs"
import { round } from "../numbers.mjs"
import { escapeXml, svgDocument } from "../svg.mjs"

// Measured width of the hero font at weight 700, per character per font-size unit. `textWidth`'s
// generic 0.6 overshoots bold text by about 18%, which would strand the caret past the last letter,
// so the taglines use this calibrated factor and pin it with textLength.
const TAGLINE_FACTOR = 0.505
const HEIGHT = 250
const LEFT = 56
const TAGLINE_SIZE = 34
const TAGLINE_BASELINE = 214
const SECONDS_PER_TAGLINE = 4.5
// Room past the longest tagline for the caret.
const CARET_ROOM = 12

// Each tagline owns one slot of a shared loop and types itself out: a clipPath rect widens to the
// text width, holds, then collapses before the next one begins, so the SMIL loop closes seamlessly.
// WebKit ignores a clip rect of width 0, so the collapsed state floors at 0.01.
function typeTrack({ index, count, left, width, seconds }) {
  const slot = 1 / count
  const start = index * slot
  const at = (fraction) => round(start + slot * fraction)
  const keyTimes = `0;${round(start)};${at(0.3)};${at(0.86)};${at(0.96)};1`
  const track = (attribute, values) => `<animate attributeName="${attribute}" values="${values}" keyTimes="${keyTimes}" dur="${seconds}s" repeatCount="indefinite"/>`
  return {
    clip: track("width", `0.01;0.01;${width};${width};0.01;0.01`),
    caret: track("x", `${left};${left};${left + width};${left + width};${left};${left}`) + track("opacity", "0;0;1;1;0;0")
  }
}

/** @param {import("../svg.mjs").Theme} theme */
export function renderHero(theme) {
  const seconds = PROFILE.taglines.length * SECONDS_PER_TAGLINE
  const lines = PROFILE.taglines.map((text, index) => {
    const width = round(text.length * TAGLINE_SIZE * TAGLINE_FACTOR)
    return { text, width, ...typeTrack({ index, count: PROFILE.taglines.length, left: LEFT, width, seconds }) }
  })
  const width = round(LEFT * 2 + Math.max(...lines.map((line) => line.width)) + CARET_ROOM)
  const body = [
    `<text x="${LEFT}" y="104" font-size="72" font-weight="800" letter-spacing="-1.8" fill="${theme.text}">${escapeXml(PROFILE.name)}</text>`,
    `<text x="${LEFT}" y="150" font-size="26" font-weight="700" letter-spacing="0.4" fill="${theme.accent}">${escapeXml(PROFILE.role)}</text>`,
    ...lines.map(
      (line, index) =>
        `<g clip-path="url(#hero-type-${index})"><text x="${LEFT}" y="${TAGLINE_BASELINE}" font-size="${TAGLINE_SIZE}" font-weight="700" textLength="${line.width}" lengthAdjust="spacing" fill="${theme.accent2}">${escapeXml(line.text)}</text></g>` +
        `<rect x="${LEFT}" y="${TAGLINE_BASELINE - TAGLINE_SIZE + 6}" width="4" height="${TAGLINE_SIZE}" rx="1" fill="${theme.accent}" opacity="0">${line.caret}</rect>`
    )
  ].join("\n")
  const defs = lines
    .map((line, index) => `<clipPath id="hero-type-${index}"><rect x="${LEFT}" y="${TAGLINE_BASELINE - TAGLINE_SIZE - 4}" height="${TAGLINE_SIZE + 16}" width="0.01">${line.clip}</rect></clipPath>`)
    .join("")
  return svgDocument({ id: "hero", width, height: HEIGHT, title: `${PROFILE.name}, ${PROFILE.role}`, theme, defs, body })
}
