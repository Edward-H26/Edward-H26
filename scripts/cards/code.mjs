// @ts-check
// The lines-of-code card: all-time and trailing-year totals, and a weekly chart of the past year
// where additions rise above the baseline and deletions hang below it, both as lit extruded bars.
// (The busiest-repositories bars were dropped on 2026-09-18.)
import { shade } from "../color.mjs"
import { abbreviate, round } from "../numbers.mjs"
import { CARD_WIDTH, MONO, cardFrame, escapeXml, svgDocument } from "../svg.mjs"

const HEIGHT = 324
// The weekly chart: 52 columns between `left` and `right`, additions up to `up` pixels above the
// baseline and deletions down to `down` pixels below it.
const CHART = { left: 330, right: 1140, baseline: 214, up: 118, down: 52 }
const WEEKS = 52
// Each bar takes this share of its column.
const BAR_SHARE = 0.62

/**
 * The chart uses a log scale: one bulk data commit would otherwise flatten every other bar.
 * @param {number} value
 * @param {number} max
 */
const logScale = (value, max) => (value > 0 ? Math.log10(1 + value) / Math.log10(1 + max) : 0)

/**
 * A bar with a lit top and a shaded right side, drawn upward from the origin.
 * @param {number} width
 * @param {number} height
 * @param {string} color
 * @param {number} [depth]
 */
function extruded(width, height, color, depth = 6) {
  return `<polygon points="0,0 ${width},0 ${width + depth},${-depth} ${depth},${-depth}" fill="${shade(color, 0.35)}"/><polygon points="${width},0 ${width + depth},${-depth} ${width + depth},${round(height - depth)} ${width},${height}" fill="${shade(color, -0.35)}"/><rect width="${width}" height="${height}" fill="${color}"/>`
}

/**
 * @param {import("../github/summary.mjs").Stats} stats
 * @param {import("../svg.mjs").Theme} theme
 */
export function renderCode(stats, theme) {
  const dark = theme.name === "dark"
  const card = cardFrame(theme, { x: 20, y: 14, width: CARD_WIDTH - 40, height: HEIGHT - 28, radius: 20, id: "code" })
  const { code } = stats
  const green = theme.accent3
  const red = dark ? "#f85149" : "#cf222e"
  // Two stacked blocks: the whole history, then the trailing year the chart covers.
  /** @param {{ added: number, deleted: number }} sums */
  const net = (sums) => `${sums.added - sums.deleted >= 0 ? "+" : "-"}${abbreviate(Math.abs(sums.added - sums.deleted))}`
  /**
   * @param {number} y
   * @param {string} label
   * @param {{ added: number, deleted: number }} sums
   * @param {number} size font size of the additions line
   */
  const block = (y, label, sums, size) =>
    `<g transform="translate(60 ${y})"><text font-size="11" font-weight="700" letter-spacing="1.3" fill="${theme.accent}">${label}</text>` +
    `<text y="${size + 8}" font-size="${size}" font-weight="800" fill="${green}">+${escapeXml(abbreviate(sums.added))}</text>` +
    `<text y="${size + 34}" font-size="${size - 8}" font-weight="800" fill="${red}">-${escapeXml(abbreviate(sums.deleted))}</text>` +
    `<text x="${size * 3.4}" y="${size + 34}" font-size="${size - 8}" font-weight="800" fill="${theme.text}">${escapeXml(net(sums))}</text></g>`
  const totals = [
    block(78, "ALL TIME", code.allTime ?? code, 30),
    block(190, "PAST 12 MONTHS", code, 24),
    `<text x="60" y="272" font-size="12.5" fill="${theme.muted}">${escapeXml(abbreviate(code.commits))} commits in the past year across ${code.byRepo.length} ${code.byRepo.length === 1 ? "repository" : "repositories"}</text>`
  ].join("")

  const slot = (CHART.right - CHART.left) / WEEKS
  const barWidth = round(slot * BAR_SHARE)
  const maxAdded = Math.max(1, ...code.weeks.map((week) => week.added))
  const maxDeleted = Math.max(1, ...code.weeks.map((week) => week.deleted))
  const columns = code.weeks
    .map((week, i) => {
      const x = round(CHART.left + i * slot)
      const up = round(logScale(week.added, maxAdded) * CHART.up)
      const down = round(logScale(week.deleted, maxDeleted) * CHART.down)
      const begin = round(0.2 + i * 0.03)
      const rise =
        up > 0
          ? `<g transform="translate(${x} ${CHART.baseline}) scale(1 -1)"><g transform="scale(1 0.01)"><animateTransform attributeName="transform" type="scale" values="1 0.01;1 1" begin="${begin}s" dur="0.7s" fill="freeze"/>${extruded(barWidth, up, green, 4)}</g></g>`
          : ""
      const fall =
        down > 0
          ? `<g transform="translate(${x} ${CHART.baseline + 4})"><g transform="scale(1 0.01)"><animateTransform attributeName="transform" type="scale" values="1 0.01;1 1" begin="${begin}s" dur="0.7s" fill="freeze"/><rect width="${barWidth}" height="${down}" fill="${red}" opacity="0.85"/><rect x="${barWidth}" width="4" height="${down}" fill="${shade(red, -0.35)}" opacity="0.85"/></g></g>`
          : ""
      return rise + fall
    })
    .join("")
  const months = code.weeks
    .map((week, i) => ({ i, date: new Date(week.week * 1000) }))
    .filter(({ date }, i, all) => i === 0 || date.getUTCMonth() !== all[i - 1].date.getUTCMonth())
    .map(
      ({ i, date }) =>
        `<text x="${round(CHART.left + i * slot)}" y="${CHART.baseline + CHART.down + 24}" font-size="10" font-family="${MONO}" fill="${theme.faint}">${date.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>`
    )
    .join("")
  const axis = `<line x1="${CHART.left}" y1="${CHART.baseline + 2}" x2="${CHART.right}" y2="${CHART.baseline + 2}" stroke="${theme.border}"/><text x="${CHART.right}" y="${CHART.baseline - CHART.up - 8}" text-anchor="end" font-size="10" font-family="${MONO}" fill="${theme.faint}">peak week +${escapeXml(abbreviate(maxAdded))}</text>`

  const labels = `<text x="60" y="54" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">LINES OF CODE</text><text x="${CHART.left}" y="76" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">PER WEEK · LOG SCALE</text><text x="${CARD_WIDTH - 52}" y="54" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">updated ${escapeXml(stats.updated)}</text>`
  return svgDocument({
    id: "code",
    width: CARD_WIDTH,
    height: HEIGHT,
    title: `Lines of code pushed by ${stats.name} in the past year`,
    theme,
    defs: card.defs,
    body: [card.rect, labels, totals, axis, columns, months].join("\n")
  })
}
