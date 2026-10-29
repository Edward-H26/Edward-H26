// @ts-check
// The language donut of the 3D contributions chart: commits per primary language over every year,
// with a legend. Colours come from the assignment the stats card shares.
import { round } from "../../numbers.mjs"
import { escapeXml } from "../../svg.mjs"
import { donutLanguages, languageColors } from "../language-colors.mjs"

const CENTER = { x: 190, y: 640 }
const OUTER_RADIUS = 110
const INNER_RADIUS = 62
const LEGEND_PITCH = 34

/**
 * @param {import("../../github/summary.mjs").Stats} stats
 * @param {import("./radar.mjs").ChartPalette} palette
 */
export function languageDonut(stats, palette) {
  const colors = languageColors(stats)
  const { shown, rest } = donutLanguages(stats.commitLanguages)
  const named = shown.map((language) => ({ ...language, color: /** @type {string} */ (colors.get(language.name)) }))
  const slices = rest > 0 ? [...named, { name: "Other", color: palette.other, commits: rest }] : named
  const total = slices.reduce((acc, slice) => acc + slice.commits, 0)
  if (total === 0) return ""
  /** @param {number} radius @param {number} angle */
  const polar = (radius, angle) => `${round(Math.cos(angle) * radius)},${round(Math.sin(angle) * radius)}`
  let start = -Math.PI / 2
  const arcs = slices
    .map((slice) => {
      const sweep = (slice.commits / total) * 2 * Math.PI
      const end = start + sweep
      const large = sweep > Math.PI ? 1 : 0
      // A single language is a full ring, which one arc cannot draw.
      const shape =
        slices.length === 1
          ? `<circle r="${(OUTER_RADIUS + INNER_RADIUS) / 2}" fill="none" stroke="${slice.color}" stroke-width="${OUTER_RADIUS - INNER_RADIUS}"/>`
          : `<path d="M${polar(OUTER_RADIUS, start)}A${OUTER_RADIUS},${OUTER_RADIUS} 0 ${large} 1 ${polar(OUTER_RADIUS, end)}L${polar(INNER_RADIUS, end)}A${INNER_RADIUS},${INNER_RADIUS} 0 ${large} 0 ${polar(INNER_RADIUS, start)}Z" fill="${slice.color}" stroke="${palette.bg}" stroke-width="2"/>`
      start = end
      return shape
    })
    .join("")
  const legend = slices
    .map((slice, i) => {
      const y = round(-OUTER_RADIUS * 0.62 + i * LEGEND_PITCH)
      return `<rect x="${OUTER_RADIUS + 40}" y="${y - 11}" width="22" height="22" rx="3" fill="${slice.color}"/><text x="${OUTER_RADIUS + 72}" y="${y + 7}" font-size="20" fill="${palette.text}">${escapeXml(slice.name)}<title>${slice.commits} commits</title></text>`
    })
    .join("")
  return `<g transform="translate(${CENTER.x} ${CENTER.y})"><g><animate attributeName="opacity" values="0;1" dur="1.2s" fill="freeze"/>${arcs}</g>${legend}</g>`
}
