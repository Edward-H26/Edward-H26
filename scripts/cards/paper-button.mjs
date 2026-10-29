// @ts-check
// A paper link button in the style of academic homepages: a plain outlined pill (arXiv, Code,
// Video, BibTeX), reused by every paper. A faint sweep keeps it alive.
import { paperButtonId } from "../data/index.mjs"
import { round } from "../numbers.mjs"
import { escapeXml, linearGradient, svgDocument, textWidth } from "../svg.mjs"

const HEIGHT = 36
const FONT_SIZE = 13
// Space around the label, both sides together.
const LABEL_PADDING = 36

/**
 * @param {import("../svg.mjs").Theme} theme
 * @param {string} label
 */
export function renderPaperButton(theme, label) {
  const width = round(textWidth(label, FONT_SIZE, 600) + LABEL_PADDING)
  const dark = theme.name === "dark"
  const id = paperButtonId(label)
  const body = [
    `<rect x="1" y="2.5" width="${width - 2}" height="30" rx="15" fill="${dark ? "#161b22" : "#ffffff"}" stroke="${dark ? "#3d444d" : "#c9d3e3"}" stroke-width="1.2"/>`,
    `<g clip-path="url(#${id}-clip)"><rect x="-80" y="0" width="50" height="${HEIGHT}" fill="url(#${id}-shine)" transform="skewX(-22)"><animate attributeName="x" from="-80" to="${width + 60}" dur="${round(5 + width / 60)}s" repeatCount="indefinite"/></rect></g>`,
    `<text x="${width / 2}" y="22" text-anchor="middle" font-size="${FONT_SIZE}" font-weight="600" fill="${dark ? "#e6edf3" : "#13294B"}">${escapeXml(label)}</text>`
  ].join("")
  const defs = [
    `<clipPath id="${id}-clip"><rect x="1" y="2.5" width="${width - 2}" height="30" rx="15"/></clipPath>`,
    linearGradient(`${id}-shine`, [
      ["0", "#ffffff", 0],
      ["0.5", "#ffffff", dark ? 0.08 : 0.5],
      ["1", "#ffffff", 0]
    ])
  ].join("")
  return svgDocument({ id, width, height: HEIGHT, title: label, theme, defs, body })
}
