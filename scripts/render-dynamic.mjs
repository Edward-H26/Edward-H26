// Cards rendered from live GitHub data by the Profile Assets workflow.
import { faceGradient, keycap, sphere, sphereGradient } from "./materials.mjs"
import { MONO, cardFrame, escapeXml, glowFilter, linearGradient, mix, round, shade, svgDocument } from "./svg.mjs"
import { WIDTH } from "./render-static.mjs"

const compact = (value) => (value >= 1000 ? `${round(value / 1000)}k` : String(value))

export function renderStats(stats, theme) {
  const height = 452
  const dark = theme.name === "dark"
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "stats" })
  const ringLength = round(2 * Math.PI * 54)
  // A torus: a grooved track with an inner shadow, and a bevelled progress band on top.
  const ring = `<g transform="translate(120 122)"><circle r="54" fill="none" stroke="${dark ? "#070d1a" : "#c4cfe0"}" stroke-width="13"/><circle r="54" fill="none" stroke="url(#stats-groove)" stroke-width="11"/><circle r="54" fill="none" stroke="url(#stats-ring)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${ringLength}" stroke-dashoffset="${ringLength}" transform="rotate(-90)" filter="url(#mat-bevel-soft)"><animate attributeName="stroke-dashoffset" from="${ringLength}" to="${round(ringLength * 0.12)}" dur="1.8s" fill="freeze"/></circle><text y="-2" text-anchor="middle" font-size="26" font-weight="800" fill="${theme.text}">${escapeXml(compact(stats.total))}</text><text y="17" text-anchor="middle" font-size="9" font-weight="600" letter-spacing="0.6" fill="${theme.muted}">CONTRIBUTIONS</text></g>`
  const streak = `<g transform="translate(60 196)"><text font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">STREAK</text><path d="M18 26c-6 6-9 12-9 18a12 12 0 0 0 24 0c0-4-2-8-4-11-1 3-3 5-5 6 1-5-1-10-6-13z" fill="${theme.accent}" filter="url(#stats-glow)"><animate attributeName="opacity" values="1;0.55;1" dur="1.4s" repeatCount="indefinite"/></path><text x="36" y="50" font-size="30" font-weight="800" fill="${theme.text}">${stats.streak.current}<tspan font-size="14" font-weight="600" fill="${theme.muted}"> day${stats.streak.current === 1 ? "" : "s"} now</tspan></text><text x="0" y="80" font-size="13" fill="${theme.muted}">Longest streak, past year: <tspan font-weight="700" fill="${theme.text}">${stats.streak.longest} days</tspan></text></g>`
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
  const languageDefs = stats.languages.map((language, i) => sphereGradient(`stats-lang-dot-${i}`, language.color) + linearGradient(`stats-lang-${i}`, [["0", shade(language.color, 0.5)], ["0.45", language.color], ["1", shade(language.color, -0.4)]], { x2: "0", y2: "1" })).join("")
  const repos = stats.repositoriesByCommits.slice(0, 6)
  const maxCommits = Math.max(1, ...repos.map((repo) => repo.commits))
  // Extruded bars: a front face, a lit top, and a shaded side, growing from the left.
  const byRepo = repos
    .map((repo, i) => {
      const y = 290 + i * 22
      const width = round(Math.max(8, (repo.commits / maxCommits) * 540))
      const begin = round(0.4 + i * 0.1)
      const bar = `<g transform="scale(0.01 1)"><animateTransform attributeName="transform" type="scale" values="0.01 1;1 1" begin="${begin}s" dur="0.9s" fill="freeze"/><rect x="2" y="12" width="${width + 5}" height="5" fill="#000000" opacity="${dark ? 0.45 : 0.18}"/><polygon points="0,0 ${width},0 ${width + 7},-7 7,-7" fill="${shade(repo.color, 0.35)}"/><polygon points="${width},0 ${width + 7},-7 ${width + 7},5 ${width},12" fill="${shade(repo.color, -0.35)}"/><rect width="${width}" height="12" fill="${repo.color}"/></g>`
      return `<g transform="translate(300 ${y})"><text x="0" y="10" font-size="12" font-family="${MONO}" fill="${theme.text}">${escapeXml(repo.name.length > 26 ? `${repo.name.slice(0, 25)}…` : repo.name)}</text><g transform="translate(230 0)">${bar}</g><text x="${round(230 + width + 16)}" y="11" font-size="11" font-family="${MONO}" fill="${theme.muted}" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${round(begin + 0.7)}s" dur="0.4s" fill="freeze"/>${repo.commits}</text></g>`
    })
    .join("")
  const labels = `<text x="60" y="52" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">PAST 12 MONTHS</text><text x="800" y="44" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">TOP LANGUAGES</text><text x="300" y="266" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">COMMITS BY REPOSITORY</text>`
  const footer = `<text x="${WIDTH - 48}" y="${height - 26}" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">@${escapeXml(stats.login)} · updated ${escapeXml(stats.updated)}</text>`
  const defs = `${card.defs}${linearGradient("stats-ring", [["0", theme.accent2], ["1", theme.accent]])}${linearGradient("stats-groove", [["0", "#000000", dark ? 0.55 : 0.22], ["1", "#ffffff", dark ? 0.1 : 0.7]], { x2: "0", y2: "1" })}${glowFilter("stats-glow", 3)}${tileFaces}${languageDefs}`
  return svgDocument({ id: "stats", width: WIDTH, height, title: `GitHub activity of ${stats.name}`, theme, defs, body: [card.rect, labels, ring, streak, tiles, languages, byRepo, footer].join("\n") })
}

// Lines of code pushed in the past year: weekly additions rise above the baseline and deletions
// hang below it, both as lit extruded bars; the busiest repositories follow as horizontal bars.
const lines = (value) => (value >= 1000000 ? `${round(value / 1000000)}M` : value >= 1000 ? `${round(value / 1000)}k` : String(value))

// Both charts use a log scale: one bulk data commit would otherwise flatten every other bar.
const logScale = (value, max) => (value > 0 ? Math.log10(1 + value) / Math.log10(1 + max) : 0)

function extruded(width, height, color, depth = 6) {
  return `<polygon points="0,0 ${width},0 ${width + depth},${-depth} ${depth},${-depth}" fill="${shade(color, 0.35)}"/><polygon points="${width},0 ${width + depth},${-depth} ${width + depth},${round(height - depth)} ${width},${height}" fill="${shade(color, -0.35)}"/><rect width="${width}" height="${height}" fill="${color}"/>`
}

export function renderCode(stats, theme) {
  const height = 460
  const dark = theme.name === "dark"
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "code" })
  const { code } = stats
  const green = theme.accent3
  const red = dark ? "#f85149" : "#cf222e"
  const totals = `<g transform="translate(60 92)"><text font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">ADDED</text><text y="34" font-size="30" font-weight="800" fill="${green}">+${escapeXml(lines(code.added))}</text><text y="74" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">DELETED</text><text y="108" font-size="30" font-weight="800" fill="${red}">-${escapeXml(lines(code.deleted))}</text><text y="148" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">NET</text><text y="182" font-size="30" font-weight="800" fill="${theme.text}">${code.added - code.deleted >= 0 ? "+" : "-"}${escapeXml(lines(Math.abs(code.added - code.deleted)))}</text><text y="212" font-size="13" fill="${theme.muted}">${escapeXml(lines(code.commits))} commits across ${code.byRepo.length} ${code.byRepo.length === 1 ? "repository" : "repositories"}</text></g>`

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

  // Busiest repositories: bar length follows the log of the lines touched, and the green and
  // red parts split it in the true proportion of additions to deletions.
  const repoMax = Math.max(1, ...code.byRepo.map((repo) => repo.added + repo.deleted))
  const repos = code.byRepo
    .map((repo, i) => {
      const y = 330 + i * 18
      const total = repo.added + repo.deleted
      const length = logScale(total, repoMax) * 420
      const added = round(Math.max((length * repo.added) / Math.max(total, 1), repo.added ? 3 : 0))
      const deleted = round(Math.max((length * repo.deleted) / Math.max(total, 1), repo.deleted ? 3 : 0))
      const begin = round(1.2 + i * 0.1)
      const name = repo.name.length > 26 ? `${repo.name.slice(0, 25)}…` : repo.name
      return `<g transform="translate(330 ${y})"><text x="-8" y="9" text-anchor="end" font-size="11.5" font-family="${MONO}" fill="${theme.text}">${escapeXml(name)}</text><g transform="scale(0.01 1)"><animateTransform attributeName="transform" type="scale" values="0.01 1;1 1" begin="${begin}s" dur="0.8s" fill="freeze"/><rect width="${added}" height="10" rx="2" fill="${green}"/><rect x="${added + 2}" width="${deleted}" height="10" rx="2" fill="${red}" opacity="0.85"/></g><text x="${added + deleted + 12}" y="9" font-size="10.5" font-family="${MONO}" fill="${theme.muted}" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${round(begin + 0.6)}s" dur="0.4s" fill="freeze"/>+${escapeXml(lines(repo.added))} / -${escapeXml(lines(repo.deleted))}</text></g>`
    })
    .join("")
  const empty = code.byRepo.length ? "" : `<text x="600" y="360" text-anchor="middle" font-size="14" fill="${theme.muted}">No code pushed to public repositories in the past year.</text>`
  const labels = `<text x="60" y="54" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">LINES OF CODE · PAST 12 MONTHS</text><text x="${chart.left}" y="76" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">PER WEEK · LOG SCALE</text><text x="${chart.left}" y="312" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">BUSIEST REPOSITORIES · LOG SCALE</text><text x="${WIDTH - 52}" y="54" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">updated ${escapeXml(stats.updated)}</text>`
  return svgDocument({ id: "code", width: WIDTH, height, title: `Lines of code pushed by ${stats.name} in the past year`, theme, defs: card.defs, body: [card.rect, labels, totals, axis, columns, months, repos, empty].join("\n") })
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

// Achievements computed from live numbers, each shown as the tier reached.
export function milestones(stats) {
  const stars = tier(stats.stars, [10, 25, 50, 100, 250])
  const contributions = tier(stats.total, [100, 500, 1000, 2500, 5000])
  const streak = tier(stats.streak.longest, [7, 14, 21, 30, 60])
  const repos = tier(stats.repos, [5, 10, 20, 40])
  const followers = tier(stats.followers, [10, 25, 50, 100, 250])
  const pulls = tier(stats.pullRequests, [5, 10, 25, 50, 100])
  return [
    { id: "followers", icon: "followers", label: followers ? `${followers}+ followers` : "10+ followers", detail: "on GitHub", unlocked: Boolean(followers) },
    { id: "pulls", icon: "pulls", label: pulls ? `${pulls}+ pull requests` : "5+ pull requests", detail: "in the past year", unlocked: Boolean(pulls) },
    { id: "commits", icon: "commits", label: contributions ? `${contributions.toLocaleString("en-US")}+ contributions` : "100+ contributions", detail: "in the past year", unlocked: Boolean(contributions) },
    { id: "streak", icon: "streak", label: streak ? `${streak}-day streak` : "7-day streak", detail: "longest this year", unlocked: Boolean(streak) },
    { id: "repos", icon: "repos", label: repos ? `${repos}+ repositories` : "5+ repositories", detail: "public on GitHub", unlocked: Boolean(repos) },
    { id: "stars", icon: "stars", label: stars ? `${stars}+ stars` : "10+ stars", detail: "earned across repos", unlocked: Boolean(stars) },
    { id: "languages", icon: "languages", label: `${tier(stats.languages.length, [3, 5, 8]) ?? 3}+ languages`, detail: "in public code", unlocked: stats.languages.length >= 3 }
  ]
}

function medal(theme, item, x, y, index) {
  const color = item.unlocked ? (index % 2 ? theme.accent2 : theme.accent) : theme.faint
  const hex = "M0,-30 L26,-15 L26,15 L0,30 L-26,15 L-26,-15 Z"
  const begin = round(0.2 + index * 0.12)
  const shine = item.unlocked ? `<g clip-path="url(#medal-clip)"><rect x="-14" y="-34" width="28" height="68" fill="url(#medal-shine)" transform="skewX(-20)"><animate attributeName="x" values="-70;70" dur="${round(3.5 + index * 0.4)}s" begin="${round(index * 0.5)}s" repeatCount="indefinite"/></rect></g>` : ""
  const face = `<g transform="translate(0 6)"><path d="${hex}" fill="${shade(color, -0.45)}"/></g><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="${round(4 + index * 0.3)}s" repeatCount="indefinite"/><path d="${hex}" fill="url(#medal-${item.id})" stroke="${shade(color, 0.3)}" stroke-opacity="0.8" filter="url(#mat-bevel)"/><path d="M0,-22 L19,-11 L19,11 L0,22 L-19,11 L-19,-11 Z" fill="none" stroke="#fff" stroke-opacity="${item.unlocked ? 0.35 : 0.15}"/>${shine}${MILESTONE_ICONS[item.icon]}</g>`
  const label = `<text y="52" text-anchor="middle" font-size="13" font-weight="700" fill="${item.unlocked ? theme.text : theme.faint}">${escapeXml(item.label)}</text><text y="68" text-anchor="middle" font-size="11" fill="${theme.muted}">${escapeXml(item.unlocked ? item.detail : "locked")}</text>`
  return `<g transform="translate(${x} ${y})" opacity="0"><animate attributeName="opacity" from="0" to="${item.unlocked ? 1 : 0.55}" begin="${begin}s" dur="0.5s" fill="freeze"/><animateTransform attributeName="transform" type="translate" values="${x} ${y + 12};${x} ${y}" begin="${begin}s" dur="0.5s" fill="freeze"/>${face}${label}</g>`
}

export function renderMilestones(stats, theme) {
  const height = 200
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "milestones" })
  const items = milestones(stats)
  const step = (WIDTH - 120) / items.length
  const medals = items.map((item, i) => medal(theme, item, round(60 + step * (i + 0.5)), 96, i)).join("\n")
  const unlocked = items.filter((item) => item.unlocked).length
  const header = `<text x="60" y="54" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">MILESTONES · ${unlocked} OF ${items.length} UNLOCKED</text><text x="${WIDTH - 52}" y="54" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">updated ${escapeXml(stats.updated)}</text>`
  const defs = [
    card.defs,
    `<clipPath id="medal-clip"><path d="M0,-30 L26,-15 L26,15 L0,30 L-26,15 L-26,-15 Z"/></clipPath>`,
    linearGradient("medal-shine", [["0", "#ffffff", 0], ["0.5", "#ffffff", 0.45], ["1", "#ffffff", 0]]),
    ...items.map((item, i) => {
      const color = item.unlocked ? (i % 2 ? theme.accent2 : theme.accent) : theme.faint
      return `<radialGradient id="medal-${item.id}" cx="0.35" cy="0.3" r="0.85"><stop offset="0" stop-color="${shade(color, 0.45)}"/><stop offset="0.6" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.4)}"/></radialGradient>`
    })
  ].join("")
  return svgDocument({ id: "milestones", width: WIDTH, height, title: `Milestones of ${stats.name}`, theme, defs, body: [card.rect, header, medals].join("\n") })
}
