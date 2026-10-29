// @ts-check
// The isometric skyline of the 3D contributions chart: one bar per week, one row per calendar
// year, drawn like yoshi389111/github-profile-3d-contrib (MIT), which can only show one year.
import { round } from "../../numbers.mjs"

/** The chart's canvas and the bar grid: 53 week columns, bars from `base` to `base + tallest`. */
export const SKYLINE = { width: 1280, height: 850, columns: 53, base: 3, tallest: 70 }
const COS30 = Math.cos(Math.PI / 6)
// Horizontal room left and right of the grid, and the y of the back corner of the grid.
const SIDE_MARGIN = 110
const GRID_LEFT = 74
const GRID_TOP = 136
const GROW_SECONDS = 2

// Dark theme: GitHub's quartile level sets the lightness, and each week column starts the same
// ten-second hue cycle at its own phase, so the colours drift along the year.
const RAINBOW_LIGHTNESS = [0.2, 0.3, 0.35, 0.4, 0.5]
const RAINBOW_SECONDS = 10
/** @type {[string, number][]} face suffix and brightness factor: top, left, right */
const FACE_SHADES = [
  ["t", 1],
  ["l", 0.83],
  ["r", 0.7]
]
// Light theme: the action's green palette, top, left, and right face for each level.
const GREEN_FACES = [
  ["#efefef", "#c8c8c8", "#a7a7a7"],
  ["#d8e887", "#b5c271", "#97a25f"],
  ["#8cc569", "#75a558", "#628a4a"],
  ["#47a042", "#3b8637", "#32702e"],
  ["#1d6a23", "#18591d", "#144a19"]
]

/**
 * @param {number} hue degrees
 * @param {number} saturation 0 to 1
 * @param {number} lightness 0 to 1
 * @returns {number[]} RGB channels, 0 to 255
 */
function hslToRgb(hue, saturation, lightness) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = lightness - chroma / 2
  const sector = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x]
  ][Math.floor(hue / 60) % 6]
  return sector.map((channel) => (channel + m) * 255)
}

/** CSS keyframes for the dark theme: one hue-cycling class per level and face, `rb<level><face>`. */
export function rainbowStyle() {
  const hues = [0, 60, 120, 180, 240, 300, 360]
  return RAINBOW_LIGHTNESS.flatMap((lightness, level) =>
    FACE_SHADES.map(([face, factor]) => {
      const name = `rb${level}${face}`
      const frames = hues
        .map(
          (hue, i) =>
            `${round((i / 6) * 100)}%{fill:rgb(${hslToRgb(hue, 0.5, lightness)
              .map((c) => Math.round(c * factor))
              .join(",")})}`
        )
        .join("")
      return `.${name}{animation:${name} ${RAINBOW_SECONDS}s linear infinite;animation-delay:var(--phase)}@keyframes ${name}{${frames}}`
    })
  ).join("")
}

/**
 * GitHub-style levels: 0 for an empty week, then the quartiles of the non-empty weeks.
 * @param {number[]} counts
 * @returns {(count: number) => number} level of a count, 0 to 4
 */
export function levels(counts) {
  const sorted = counts.filter((count) => count > 0).sort((a, b) => a - b)
  /** @param {number} q */
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)]
  return (count) => (count === 0 ? 0 : count <= q1 ? 1 : count <= q2 ? 2 : count <= q3 ? 3 : 4)
}

/**
 * A box standing on the cell whose back corner is `p`; `week` and `year` are the screen vectors of
 * one cell along each axis. Only the top and the two faces turned toward the viewer are drawn.
 * @param {{ x: number, y: number }} p
 * @param {number} height
 * @param {{ x: number, y: number }} week
 * @param {{ x: number, y: number }} year
 */
function boxFaces(p, height, week, year) {
  /** @param {number} dx @param {number} dy @param {number} lift */
  const corner = (dx, dy, lift) => `${round(p.x + dx)},${round(p.y + dy - lift)}`
  const front = [week.x + year.x, week.y + year.y]
  return {
    top: [corner(0, 0, height), corner(week.x, week.y, height), corner(front[0], front[1], height), corner(year.x, year.y, height)].join(" "),
    left: [corner(year.x, year.y, height), corner(front[0], front[1], height), corner(front[0], front[1], 0), corner(year.x, year.y, 0)].join(" "),
    right: [corner(week.x, week.y, height), corner(front[0], front[1], height), corner(front[0], front[1], 0), corner(week.x, week.y, 0)].join(" ")
  }
}

/**
 * The bars and the year labels. Weeks run down to the right and years down to the left; the cell
 * size fills the width. The newest year is the back row, so its taller bars rise into open space
 * instead of hiding the quieter early years behind them.
 * @param {import("../../github/contributions.mjs").GridRow[]} grid
 * @param {import("../../svg.mjs").Theme} theme
 */
export function skyline(grid, theme) {
  const dark = theme.name === "dark"
  const rows = grid.length
  const cell = (SKYLINE.width - SIDE_MARGIN) / ((SKYLINE.columns + rows) * COS30)
  const week = { x: cell * COS30, y: cell / 2 }
  const year = { x: -cell * COS30, y: cell / 2 }
  /** @param {number} column @param {number} row */
  const at = (column, row) => ({ x: GRID_LEFT + rows * cell * COS30 + column * week.x + row * year.x, y: GRID_TOP + column * week.y + row * year.y })
  /** @param {number} index */
  const rowOf = (index) => rows - 1 - index
  const cells = grid.flatMap((line, index) => line.weeks.map((entry) => ({ ...entry, row: rowOf(index) })))
  const level = levels(cells.map((entry) => entry.count))
  const peak = Math.max(1, ...cells.map((entry) => entry.count))
  // Back to front, so nearer bars cover the ones behind them.
  const bars = cells
    .sort((a, b) => a.column + a.row - (b.column + b.row) || a.row - b.row)
    .map((entry) => {
      // Square-root heights keep quiet weeks visible without letting the busiest week flatten the rest.
      const height = SKYLINE.base + Math.sqrt(entry.count / peak) * SKYLINE.tallest
      const final = boxFaces(at(entry.column, entry.row), height, week, year)
      const flat = boxFaces(at(entry.column, entry.row), SKYLINE.base, week, year)
      /** @param {"top" | "left" | "right"} face */
      const grow = (face) => (entry.count > 0 ? `<animate attributeName="points" values="${flat[face]};${final[face]}" dur="${GROW_SECONDS}s" fill="freeze"/>` : "")
      /** @param {number} index */
      const paint = (index) => (dark ? `class="rb${level(entry.count)}${FACE_SHADES[index][0]}"` : `fill="${GREEN_FACES[level(entry.count)][index]}"`)
      const polygons = /** @type {const} */ (["top", "left", "right"]).map((face, index) => `<polygon ${paint(index)} points="${final[face]}">${grow(face)}</polygon>`).join("")
      return dark ? `<g style="--phase:${round((-entry.column / SKYLINE.columns) * RAINBOW_SECONDS)}s">${polygons}</g>` : polygons
    })
    .join("")
  const labels = grid
    .map((line, index) => {
      const p = at(-0.45, rowOf(index) + 0.5)
      return `<text x="${round(p.x)}" y="${round(p.y + 4)}" text-anchor="end" font-size="13" fill="${theme.faint}">${line.year}</text>`
    })
    .join("")
  return `<g stroke="${theme.bg}" stroke-width="0.6" stroke-linejoin="round">${bars}</g>${labels}`
}
