// Cards rendered from live GitHub data by the Profile Assets workflow.
import { faceGradient, keycap, sphere, sphereGradient } from "./materials.mjs"
import { MONO, cardFrame, escapeXml, glowFilter, linearGradient, mix, round, shade, svgDocument } from "./svg.mjs"
import { WIDTH } from "./render-static.mjs"

const compact = (value) => (value >= 1000 ? `${round(value / 1000)}k` : String(value))

// "2022-08-25" -> "AUG 2022": the month the counting starts.
const sinceLabel = (date) => new Date(`${date}T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase()

// GitHub's own language colours repeat hues (TypeScript, Python, and R are all blue; HTML and
// Jupyter Notebook are both orange), so the cards take colours from one categorical palette
// (Tableau 10 without its grey, which stays free for "Other"). Both cards share one assignment,
// so a language keeps its colour from card to card.
const LANGUAGE_PALETTE = ["#4e79a7", "#f28e2b", "#edc948", "#59a14f", "#e15759", "#b07aa1", "#76b7b2", "#ff9da7", "#9c755f"]

// The donut names six languages at most; past that, the tail folds into "Other".
function donutLanguages(languages) {
  const shown = languages.length > 6 ? languages.slice(0, 5) : languages
  return { shown, rest: languages.slice(shown.length).reduce((acc, language) => acc + language.commits, 0) }
}

function languageColors(stats) {
  const names = new Set([...donutLanguages(stats.commitLanguages).shown, ...stats.languages].map((language) => language.name))
  return new Map([...names].map((name, i) => [name, LANGUAGE_PALETTE[i % LANGUAGE_PALETTE.length]]))
}

export function renderStats(stats, theme) {
  // The commits-by-repository bars were dropped on 2026-09-18, so the card ends under the streak block.
  const height = 324
  const dark = theme.name === "dark"
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "stats" })
  const ringLength = round(2 * Math.PI * 54)
  // A torus: a grooved track with an inner shadow, and a bevelled progress band on top.
  const ring = `<g transform="translate(120 122)"><circle r="54" fill="none" stroke="${dark ? "#070d1a" : "#c4cfe0"}" stroke-width="13"/><circle r="54" fill="none" stroke="url(#stats-groove)" stroke-width="11"/><circle r="54" fill="none" stroke="url(#stats-ring)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${ringLength}" stroke-dashoffset="${ringLength}" transform="rotate(-90)" filter="url(#mat-bevel-soft)"><animate attributeName="stroke-dashoffset" from="${ringLength}" to="${round(ringLength * 0.12)}" dur="1.8s" fill="freeze"/></circle><text y="-2" text-anchor="middle" font-size="26" font-weight="800" fill="${theme.text}">${escapeXml(compact(stats.total))}</text><text y="17" text-anchor="middle" font-size="9" font-weight="600" letter-spacing="0.6" fill="${theme.muted}">CONTRIBUTIONS</text></g>`
  const streak = `<g transform="translate(60 196)"><text font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">STREAK</text><path d="M18 26c-6 6-9 12-9 18a12 12 0 0 0 24 0c0-4-2-8-4-11-1 3-3 5-5 6 1-5-1-10-6-13z" fill="${theme.accent}" filter="url(#stats-glow)"><animate attributeName="opacity" values="1;0.55;1" dur="1.4s" repeatCount="indefinite"/></path><text x="36" y="50" font-size="30" font-weight="800" fill="${theme.text}">${stats.streak.current}<tspan font-size="14" font-weight="600" fill="${theme.muted}"> day${stats.streak.current === 1 ? "" : "s"} now</tspan></text><text x="0" y="80" font-size="13" fill="${theme.muted}">Longest streak: <tspan font-weight="700" fill="${theme.text}">${stats.streak.longest} days</tspan></text></g>`
  const tileItems = [
    ["Commits", stats.commits, theme.accent2],
    ["Pull requests", stats.pullRequests, theme.accent4],
    ["Issues", stats.issues, theme.accent3],
    ["Reviews", stats.reviews, theme.accent],
    ["Stars earned", stats.stars, theme.accent],
    ["Repositories", stats.repos, theme.accent2],
    ["Followers", stats.followers, theme.accent4],
    ["Forks", stats.forks, theme.accent3]
  ]
  const tiles = tileItems
    .map(([label, value, color], i) => {
      const x = 300 + (i % 4) * 118
      const y = 54 + Math.floor(i / 4) * 92
      const tint = mix(theme.card, color, dark ? 0.32 : 0.2)
      return `<g transform="translate(${x} ${y})" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${round(0.15 + i * 0.08)}s" dur="0.5s" fill="freeze"/>${keycap({ width: 106, height: 74, radius: 14, fill: `url(#stats-tile-${i})`, side: shade(tint, dark ? -0.55 : -0.32), depth: 5, shadow: false })}<rect width="106" height="74" rx="14" fill="none" stroke="${color}" stroke-opacity="0.4"/><text x="14" y="41" font-size="26" font-weight="800" fill="${dark ? "#000000" : "#ffffff"}" opacity="0.4">${escapeXml(compact(value))}</text><text x="14" y="40" font-size="26" font-weight="800" fill="${theme.text}">${escapeXml(compact(value))}</text><text x="14" y="60" font-size="12" fill="${theme.muted}">${escapeXml(label)}</text></g>`
    })
    .join("")
  const tileFaces = tileItems.map(([, , color], i) => faceGradient(`stats-tile-${i}`, mix(theme.card, color, dark ? 0.32 : 0.2), { top: 0.18, bottom: -0.1 })).join("")
  const languages = stats.languages
    .map((language, i) => {
      const y = 62 + i * 30
      const width = round(Math.max(6, (language.share / 100) * 280))
      return `<g transform="translate(800 ${y})">${sphere({ cx: 6, cy: -5, r: 5, fill: `url(#stats-lang-dot-${i})`, shadow: false })}<text x="18" font-size="13" font-weight="600" fill="${theme.text}">${escapeXml(language.name)}</text><text x="330" text-anchor="end" font-size="12" font-family="${MONO}" fill="${theme.muted}">${language.share}%</text><rect x="0" y="5" width="330" height="8" rx="4" fill="url(#stats-groove)"/><rect x="0" y="5" width="0" height="8" rx="4" fill="url(#stats-lang-${i})"><animate attributeName="width" from="0" to="${width}" begin="${round(0.3 + i * 0.12)}s" dur="0.9s" fill="freeze"/></rect></g>`
    })
    .join("")
  const colors = languageColors(stats)
  const languageDefs = stats.languages
    .map((language, i) => {
      const color = colors.get(language.name)
      return sphereGradient(`stats-lang-dot-${i}`, color) + linearGradient(`stats-lang-${i}`, [["0", shade(color, 0.5)], ["0.45", color], ["1", shade(color, -0.4)]], { x2: "0", y2: "1" })
    })
    .join("")
  const labels = `<text x="60" y="52" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">SINCE ${escapeXml(sinceLabel(stats.since))}</text><text x="800" y="44" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">TOP LANGUAGES</text>`
  const footer = `<text x="${WIDTH - 48}" y="${height - 26}" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">@${escapeXml(stats.login)} · updated ${escapeXml(stats.updated)}</text>`
  const defs = `${card.defs}${linearGradient("stats-ring", [["0", theme.accent2], ["1", theme.accent]])}${linearGradient("stats-groove", [["0", "#000000", dark ? 0.55 : 0.22], ["1", "#ffffff", dark ? 0.1 : 0.7]], { x2: "0", y2: "1" })}${glowFilter("stats-glow", 3)}${tileFaces}${languageDefs}`
  return svgDocument({ id: "stats", width: WIDTH, height, title: `GitHub activity of ${stats.name}`, theme, defs, body: [card.rect, labels, ring, streak, tiles, languages, footer].join("\n") })
}

// Lines of code pushed in the past year: weekly additions rise above the baseline and deletions
// hang below it, both as lit extruded bars. (The busiest-repositories bars were dropped on 2026-09-18.)
const lines = (value) => (value >= 1000000 ? `${round(value / 1000000)}M` : value >= 1000 ? `${round(value / 1000)}k` : String(value))

// The chart uses a log scale: one bulk data commit would otherwise flatten every other bar.
const logScale = (value, max) => (value > 0 ? Math.log10(1 + value) / Math.log10(1 + max) : 0)

function extruded(width, height, color, depth = 6) {
  return `<polygon points="0,0 ${width},0 ${width + depth},${-depth} ${depth},${-depth}" fill="${shade(color, 0.35)}"/><polygon points="${width},0 ${width + depth},${-depth} ${width + depth},${round(height - depth)} ${width},${height}" fill="${shade(color, -0.35)}"/><rect width="${width}" height="${height}" fill="${color}"/>`
}

export function renderCode(stats, theme) {
  const height = 324
  const dark = theme.name === "dark"
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "code" })
  const { code } = stats
  const green = theme.accent3
  const red = dark ? "#f85149" : "#cf222e"
  // Two stacked blocks: the whole history, then the trailing year the chart covers.
  const net = (sums) => `${sums.added - sums.deleted >= 0 ? "+" : "-"}${lines(Math.abs(sums.added - sums.deleted))}`
  const block = (y, label, sums, size) =>
    `<g transform="translate(60 ${y})"><text font-size="11" font-weight="700" letter-spacing="1.3" fill="${theme.accent}">${label}</text>` +
    `<text y="${size + 8}" font-size="${size}" font-weight="800" fill="${green}">+${escapeXml(lines(sums.added))}</text>` +
    `<text y="${size + 34}" font-size="${size - 8}" font-weight="800" fill="${red}">-${escapeXml(lines(sums.deleted))}</text>` +
    `<text x="${size * 3.4}" y="${size + 34}" font-size="${size - 8}" font-weight="800" fill="${theme.text}">${escapeXml(net(sums))}</text></g>`
  const totals = [
    block(78, "ALL TIME", code.allTime ?? code, 30),
    block(190, "PAST 12 MONTHS", code, 24),
    `<text x="60" y="272" font-size="12.5" fill="${theme.muted}">${escapeXml(lines(code.commits))} commits in the past year across ${code.byRepo.length} ${code.byRepo.length === 1 ? "repository" : "repositories"}</text>`
  ].join("")

  // Weekly chart: 52 columns between x = 330 and x = 1140, baseline at y = 214.
  const chart = { left: 330, right: 1140, baseline: 214, up: 118, down: 52 }
  const slot = (chart.right - chart.left) / 52
  const barWidth = round(slot * 0.62)
  const maxAdded = Math.max(1, ...code.weeks.map((week) => week.added))
  const maxDeleted = Math.max(1, ...code.weeks.map((week) => week.deleted))
  const columns = code.weeks
    .map((week, i) => {
      const x = round(chart.left + i * slot)
      const up = round(logScale(week.added, maxAdded) * chart.up)
      const down = round(logScale(week.deleted, maxDeleted) * chart.down)
      const begin = round(0.2 + i * 0.03)
      const rise = up > 0 ? `<g transform="translate(${x} ${chart.baseline}) scale(1 -1)"><g transform="scale(1 0.01)"><animateTransform attributeName="transform" type="scale" values="1 0.01;1 1" begin="${begin}s" dur="0.7s" fill="freeze"/>${extruded(barWidth, up, green, 4)}</g></g>` : ""
      const fall = down > 0 ? `<g transform="translate(${x} ${chart.baseline + 4})"><g transform="scale(1 0.01)"><animateTransform attributeName="transform" type="scale" values="1 0.01;1 1" begin="${begin}s" dur="0.7s" fill="freeze"/><rect width="${barWidth}" height="${down}" fill="${red}" opacity="0.85"/><rect x="${barWidth}" width="4" height="${down}" fill="${shade(red, -0.35)}" opacity="0.85"/></g></g>` : ""
      return rise + fall
    })
    .join("")
  const months = code.weeks
    .map((week, i) => ({ i, date: new Date(week.week * 1000) }))
    .filter(({ date }, i, all) => i === 0 || date.getUTCMonth() !== all[i - 1].date.getUTCMonth())
    .map(({ i, date }) => `<text x="${round(chart.left + i * slot)}" y="${chart.baseline + chart.down + 24}" font-size="10" font-family="${MONO}" fill="${theme.faint}">${date.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>`)
    .join("")
  const axis = `<line x1="${chart.left}" y1="${chart.baseline + 2}" x2="${chart.right}" y2="${chart.baseline + 2}" stroke="${theme.border}"/><text x="${chart.right}" y="${chart.baseline - chart.up - 8}" text-anchor="end" font-size="10" font-family="${MONO}" fill="${theme.faint}">peak week +${escapeXml(lines(maxAdded))}</text>`

  const labels = `<text x="60" y="54" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">LINES OF CODE</text><text x="${chart.left}" y="76" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">PER WEEK · LOG SCALE</text><text x="${WIDTH - 52}" y="54" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">updated ${escapeXml(stats.updated)}</text>`
  return svgDocument({ id: "code", width: WIDTH, height, title: `Lines of code pushed by ${stats.name} in the past year`, theme, defs: card.defs, body: [card.rect, labels, totals, axis, columns, months].join("\n") })
}

// Every contribution since the account was created, drawn like yoshi389111/github-profile-3d-contrib
// (MIT), which can only show one year: an isometric bar per week with one row per calendar year,
// a radar of the all-time totals on a log scale, and the languages of the repositories committed to.
const SKYLINE = { width: 1280, height: 850, columns: 53, base: 3, tallest: 70 }
const COS30 = Math.cos(Math.PI / 6)

// Dark theme: GitHub's quartile level sets the lightness, and each week column starts the same
// ten-second hue cycle at its own phase, so the colours drift along the year.
const RAINBOW_LIGHTNESS = [0.2, 0.3, 0.35, 0.4, 0.5]
const FACE_SHADES = [["t", 1], ["l", 0.83], ["r", 0.7]]
// Light theme: the action's green palette, top, left, and right face for each level.
const GREEN_FACES = [
  ["#efefef", "#c8c8c8", "#a7a7a7"],
  ["#d8e887", "#b5c271", "#97a25f"],
  ["#8cc569", "#75a558", "#628a4a"],
  ["#47a042", "#3b8637", "#32702e"],
  ["#1d6a23", "#18591d", "#144a19"]
]
// Octicons star and repo-forked (MIT), 16 x 16.
const STAR_PATH = "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"
const FORK_PATH = "M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"

function hslToRgb(hue, saturation, lightness) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = lightness - chroma / 2
  const sector = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]][Math.floor(hue / 60) % 6]
  return sector.map((channel) => (channel + m) * 255)
}

function rainbowStyle() {
  const hues = [0, 60, 120, 180, 240, 300, 360]
  return RAINBOW_LIGHTNESS.flatMap((lightness, level) =>
    FACE_SHADES.map(([face, factor]) => {
      const name = `rb${level}${face}`
      const frames = hues.map((hue, i) => `${round((i / 6) * 100)}%{fill:rgb(${hslToRgb(hue, 0.5, lightness).map((c) => Math.round(c * factor)).join(",")})}`).join("")
      return `.${name}{animation:${name} 10s linear infinite;animation-delay:var(--phase)}@keyframes ${name}{${frames}}`
    })
  ).join("")
}

// GitHub-style levels: 0 for an empty week, then the quartiles of the non-empty weeks.
function levels(counts) {
  const sorted = counts.filter((count) => count > 0).sort((a, b) => a - b)
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)]
  return (count) => (count === 0 ? 0 : count <= q1 ? 1 : count <= q2 ? 2 : count <= q3 ? 3 : 4)
}

// A box standing on the cell whose back corner is `p`; `week` and `year` are the screen vectors of
// one cell along each axis. Only the top and the two faces turned toward the viewer are drawn.
function boxFaces(p, height, week, year) {
  const corner = (dx, dy, lift) => `${round(p.x + dx)},${round(p.y + dy - lift)}`
  const front = [week.x + year.x, week.y + year.y]
  return {
    top: [corner(0, 0, height), corner(week.x, week.y, height), corner(...front, height), corner(year.x, year.y, height)].join(" "),
    left: [corner(year.x, year.y, height), corner(...front, height), corner(...front, 0), corner(year.x, year.y, 0)].join(" "),
    right: [corner(week.x, week.y, height), corner(...front, height), corner(...front, 0), corner(week.x, week.y, 0)].join(" ")
  }
}

function skyline(grid, theme) {
  const dark = theme.name === "dark"
  const rows = grid.length
  // Weeks run down to the right and years down to the left; the cell size fills the width. The
  // newest year is the back row, so its taller bars rise into open space instead of hiding behind
  // them the quieter early years.
  const cell = (SKYLINE.width - 110) / ((SKYLINE.columns + rows) * COS30)
  const week = { x: cell * COS30, y: cell / 2 }
  const year = { x: -cell * COS30, y: cell / 2 }
  const at = (column, row) => ({ x: 74 + rows * cell * COS30 + column * week.x + row * year.x, y: 136 + column * week.y + row * year.y })
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
      const grow = (face) => (entry.count > 0 ? `<animate attributeName="points" values="${flat[face]};${final[face]}" dur="2s" fill="freeze"/>` : "")
      const paint = (index) => (dark ? `class="rb${level(entry.count)}${FACE_SHADES[index][0]}"` : `fill="${GREEN_FACES[level(entry.count)][index]}"`)
      const polygons = ["top", "left", "right"].map((face, index) => `<polygon ${paint(index)} points="${final[face]}">${grow(face)}</polygon>`).join("")
      return dark ? `<g style="--phase:${round((-entry.column / SKYLINE.columns) * 10)}s">${polygons}</g>` : polygons
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

function radarChart(stats, palette) {
  const unit = 31.2
  const axes = [["Commit", stats.commits], ["Issue", stats.issues], ["PullReq", stats.pullRequests], ["Review", stats.reviews], ["Repo", stats.repositoriesCreated]]
  const point = (i, radius) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length
    return [round(Math.cos(angle) * radius), round(Math.sin(angle) * radius)]
  }
  const dashed = `fill="none" stroke="${palette.weak}" stroke-width="1" stroke-dasharray="4 4"`
  const rings = [1, 2, 3, 4, 5].map((k) => `<polygon points="${axes.map((_, i) => point(i, unit * k).join(",")).join(" ")}" ${dashed}/>`).join("")
  const spokes = axes.map((_, i) => `<line x1="0" y1="0" x2="${point(i, unit * 5)[0]}" y2="${point(i, unit * 5)[1]}" ${dashed}/>`).join("")
  const scale = ["1", "10", "100", "1K", "10K"].map((label, k) => `<text x="3" y="${round(-unit * (k + 1))}" font-size="13" fill="${palette.weak}">${label}</text>`).join("")
  // Zero sits just inside the "1" ring, as in the action; ten thousand and more stay on the rim.
  const reach = (value) => (value >= 1 ? Math.min(5, 1 + Math.log10(value)) : 0.8) * unit
  const shape = axes.map(([, value], i) => point(i, reach(value)).join(",")).join(" ")
  const labels = axes
    .map(([label, value], i) => {
      const [x, y] = point(i, unit * 5 + 26)
      const anchor = x > 4 ? "start" : x < -4 ? "end" : "middle"
      return `<text x="${x}" y="${round(y + 7)}" text-anchor="${anchor}" font-size="20" fill="${palette.text}">${label}<title>${value}</title></text>`
    })
    .join("")
  return `<g transform="translate(1010 262)">${rings}${spokes}${scale}<g><animateTransform attributeName="transform" type="scale" values="0;1" dur="2s" fill="freeze"/><polygon points="${shape}" fill="${palette.radar}" fill-opacity="0.5" stroke="${palette.radar}" stroke-width="4" stroke-linejoin="round"/></g>${labels}</g>`
}

function languageDonut(stats, palette) {
  const outer = 110
  const inner = 62
  const colors = languageColors(stats)
  const { shown, rest } = donutLanguages(stats.commitLanguages)
  const named = shown.map((language) => ({ ...language, color: colors.get(language.name) }))
  const slices = rest > 0 ? [...named, { name: "Other", color: palette.other, commits: rest }] : named
  const total = slices.reduce((acc, slice) => acc + slice.commits, 0)
  if (total === 0) return ""
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
          ? `<circle r="${(outer + inner) / 2}" fill="none" stroke="${slice.color}" stroke-width="${outer - inner}"/>`
          : `<path d="M${polar(outer, start)}A${outer},${outer} 0 ${large} 1 ${polar(outer, end)}L${polar(inner, end)}A${inner},${inner} 0 ${large} 0 ${polar(inner, start)}Z" fill="${slice.color}" stroke="${palette.bg}" stroke-width="2"/>`
      start = end
      return shape
    })
    .join("")
  const legend = slices
    .map((slice, i) => {
      const y = round(-outer * 0.62 + i * 34)
      return `<rect x="${outer + 40}" y="${y - 11}" width="22" height="22" rx="3" fill="${slice.color}"/><text x="${outer + 72}" y="${y + 7}" font-size="20" fill="${palette.text}">${escapeXml(slice.name)}<title>${slice.commits} commits</title></text>`
    })
    .join("")
  return `<g transform="translate(190 640)"><g><animate attributeName="opacity" values="0;1" dur="1.2s" fill="freeze"/>${arcs}</g>${legend}</g>`
}

export function renderContributions3d(stats, theme) {
  const dark = theme.name === "dark"
  const palette = dark
    ? { text: theme.text, weak: theme.faint, strong: "#ffc837", radar: "#ffc837", other: "#444c56", bg: theme.bg }
    : { text: theme.text, weak: theme.faint, strong: theme.text, radar: "#47a042", other: "#afb8c1", bg: theme.bg }
  const footer = [
    `<text x="384" y="830" text-anchor="end" font-size="32" font-weight="700" fill="${palette.strong}">${stats.total}</text>`,
    `<text x="394" y="830" font-size="24" fill="${palette.text}">contributions</text>`,
    `<g transform="translate(608 802) scale(2)" fill="${palette.text}"><path fill-rule="evenodd" d="${STAR_PATH}"/></g>`,
    `<text x="650" y="830" font-size="32" font-weight="700" fill="${palette.text}">${stats.stars}</text>`,
    `<g transform="translate(736 802) scale(2)" fill="${palette.text}"><path fill-rule="evenodd" d="${FORK_PATH}"/></g>`,
    `<text x="778" y="830" font-size="32" font-weight="700" fill="${palette.text}">${stats.forks}</text>`
  ].join("")
  const range = `<text x="1260" y="34" text-anchor="end" font-size="16" fill="${palette.weak}">${escapeXml(stats.since)} / ${escapeXml(stats.updated)}</text>`
  const title = `All GitHub contributions of ${stats.name} since ${stats.since}: ${stats.total} contributions, ${stats.commits} commits, ${stats.issues} issues, ${stats.pullRequests} pull requests, ${stats.reviews} reviews, ${stats.repositoriesCreated} repositories created`
  return svgDocument({
    id: "contrib-3d",
    width: SKYLINE.width,
    height: SKYLINE.height,
    title,
    theme,
    defs: dark ? `<style>${rainbowStyle()}</style>` : "",
    body: [skyline(stats.grid, theme), radarChart(stats, palette), languageDonut(stats, palette), footer, range].join("\n")
  })
}

const MILESTONE_ICONS = {
  followers: `<circle cx="-3" cy="-3" r="3.2" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M-9,7 Q-9,1 -3,1 Q3,1 3,7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="5" cy="-4" r="2.4" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M5,0 Q9.5,0 9.5,5" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>`,
  pulls: `<circle cx="-5" cy="-6" r="2.4" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="-5" cy="6" r="2.4" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="5" cy="6" r="2.4" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M-5,-3.6 V3.6 M5,3.6 V-2 Q5,-6 1,-6 H-1" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  commits: `<circle r="3" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M-8,0 H-3 M3,0 H8" stroke="#fff" stroke-width="1.8"/>`,
  streak: `<path d="M1,-9 C-5,-3 -7,1 -7,4 a7,7 0 0 0 14,0 c0,-3 -1.5,-5 -3,-7 -0.5,2 -1.5,3 -3,4 0.8,-3 -0.5,-6 -1,-10 z" fill="#fff"/>`,
  repos: `<path d="M-7,-6 H-1 L1,-4 H7 V6 H-7 Z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`,
  stars: `<path d="M0,-8 L2.2,-2.6 L8,-2 L3.6,1.8 L4.9,7.6 L0,4.6 L-4.9,7.6 L-3.6,1.8 L-8,-2 L-2.2,-2.6 Z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>`,
  languages: `<path d="M-7,-3 L-2,2 L-7,7 M0,7 H7" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
}

const tier = (value, steps) => steps.filter((step) => value >= step).pop()

function medal(theme, item, x, y, index) {
  const color = item.unlocked ? (index % 2 ? theme.accent2 : theme.accent) : theme.faint
  const hex = "M0,-30 L26,-15 L26,15 L0,30 L-26,15 L-26,-15 Z"
  const begin = round(0.2 + index * 0.12)
  const shine = item.unlocked ? `<g clip-path="url(#medal-clip)"><rect x="-14" y="-34" width="28" height="68" fill="url(#medal-shine)" transform="skewX(-20)"><animate attributeName="x" values="-70;70" dur="${round(3.5 + index * 0.4)}s" begin="${round(index * 0.5)}s" repeatCount="indefinite"/></rect></g>` : ""
  const face = `<g transform="translate(0 6)"><path d="${hex}" fill="${shade(color, -0.45)}"/></g><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="${round(4 + index * 0.3)}s" repeatCount="indefinite"/><path d="${hex}" fill="url(#medal-${item.id})" stroke="${shade(color, 0.3)}" stroke-opacity="0.8" filter="url(#mat-bevel)"/><path d="M0,-22 L19,-11 L19,11 L0,22 L-19,11 L-19,-11 Z" fill="none" stroke="#fff" stroke-opacity="${item.unlocked ? 0.35 : 0.15}"/>${shine}${MILESTONE_ICONS[item.icon]}</g>`
  const label = `<text y="52" text-anchor="middle" font-size="13" font-weight="700" fill="${item.unlocked ? theme.text : theme.faint}">${escapeXml(item.label)}</text><text y="68" text-anchor="middle" font-size="11" fill="${theme.muted}">${escapeXml(item.unlocked ? item.detail : "locked")}</text>`
  return `<g transform="translate(${x} ${y})" opacity="0"><animate attributeName="opacity" from="0" to="${item.unlocked ? 1 : 0.55}" begin="${begin}s" dur="0.5s" fill="freeze"/><animateTransform attributeName="transform" type="translate" values="${x} ${y + 12};${x} ${y}" begin="${begin}s" dur="0.5s" fill="freeze"/>${face}${label}</g>`
}
