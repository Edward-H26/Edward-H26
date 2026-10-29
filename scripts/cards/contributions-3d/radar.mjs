// @ts-check
// The radar of the 3D contributions chart: all-time commits, issues, pull requests, reviews and
// repositories on a log scale, as in the action this chart follows.
import { round } from "../../numbers.mjs"

const CENTER = { x: 1010, y: 262 }
// Radius of one decade; the five rings read 1, 10, 100, 1K and 10K.
const UNIT = 31.2
const RINGS = 5
const LABEL_OFFSET = 26
const SCALE_LABELS = ["1", "10", "100", "1K", "10K"]

/**
 * @typedef {{ text: string, weak: string, strong: string, radar: string, other: string, bg: string }} ChartPalette
 */

/**
 * @param {import("../../github/summary.mjs").Stats} stats
 * @param {ChartPalette} palette
 */
export function radarChart(stats, palette) {
  /** @type {[string, number][]} */
  const axes = [
    ["Commit", stats.commits],
    ["Issue", stats.issues],
    ["PullReq", stats.pullRequests],
    ["Review", stats.reviews],
    ["Repo", stats.repositoriesCreated]
  ]
  /** @param {number} i @param {number} radius */
  const point = (i, radius) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length
    return [round(Math.cos(angle) * radius), round(Math.sin(angle) * radius)]
  }
  const dashed = `fill="none" stroke="${palette.weak}" stroke-width="1" stroke-dasharray="4 4"`
  const rings = Array.from({ length: RINGS }, (_, index) => index + 1)
    .map((k) => `<polygon points="${axes.map((_, i) => point(i, UNIT * k).join(",")).join(" ")}" ${dashed}/>`)
    .join("")
  const spokes = axes.map((_, i) => `<line x1="0" y1="0" x2="${point(i, UNIT * RINGS)[0]}" y2="${point(i, UNIT * RINGS)[1]}" ${dashed}/>`).join("")
  const scale = SCALE_LABELS.map((label, k) => `<text x="3" y="${round(-UNIT * (k + 1))}" font-size="13" fill="${palette.weak}">${label}</text>`).join("")
  // Zero sits just inside the "1" ring, as in the action; ten thousand and more stay on the rim.
  /** @param {number} value */
  const reach = (value) => (value >= 1 ? Math.min(RINGS, 1 + Math.log10(value)) : 0.8) * UNIT
  const shape = axes.map(([, value], i) => point(i, reach(value)).join(",")).join(" ")
  const labels = axes
    .map(([label, value], i) => {
      const [x, y] = point(i, UNIT * RINGS + LABEL_OFFSET)
      const anchor = x > 4 ? "start" : x < -4 ? "end" : "middle"
      return `<text x="${x}" y="${round(y + 7)}" text-anchor="${anchor}" font-size="20" fill="${palette.text}">${label}<title>${value}</title></text>`
    })
    .join("")
  return `<g transform="translate(${CENTER.x} ${CENTER.y})">${rings}${spokes}${scale}<g><animateTransform attributeName="transform" type="scale" values="0;1" dur="2s" fill="freeze"/><polygon points="${shape}" fill="${palette.radar}" fill-opacity="0.5" stroke="${palette.radar}" stroke-width="4" stroke-linejoin="round"/></g>${labels}</g>`
}
