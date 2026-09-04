// Cards rendered from live GitHub data by the Profile Assets workflow.
import { faceGradient, keycap, sphere, sphereGradient } from "./materials.mjs"
import { MONO, cardFrame, escapeXml, glowFilter, linearGradient, mix, rng, round, shade, svgDocument, textWidth } from "./svg.mjs"
import { FEATURED_PAPER } from "./profile-data.mjs"
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

// Public repositories as a drifting constellation: bubble size follows stars and colour follows the
// primary language. A sunflower spiral seeds the positions and a few relaxation passes push
// overlapping bubbles (including their labels) apart and back inside the card.
export const MAX_BUBBLE_RADIUS = 40
const LABEL_FONT = 11.5
const DRIFT = 8

export function bubbleLabel(name) {
  return name.length > 24 ? `${name.slice(0, 23)}…` : name
}

// Half the width of a bubble including its monospace label, plus the drift amplitude.
export function bubbleHalfWidth(bubble) {
  return Math.max(bubble.r, (bubbleLabel(bubble.repo.name).length * LABEL_FONT * 0.62) / 2) + DRIFT
}

// Vertical extent: the bubble plus the label line under it, plus the drift amplitude.
export function bubbleHalfHeight(bubble) {
  return bubble.r + 14 + DRIFT
}

// Bubbles sit in a grid of cells sized for the widest label, with a deterministic jitter that
// never exceeds the slack in the cell, so no bubble can touch another whatever the names are.
const CELL_HEIGHT = 132

export function constellationHeight(count) {
  return 96 + Math.max(1, Math.ceil(count / 4)) * CELL_HEIGHT + 70
}

export function layoutBubbles(repos, { width = WIDTH, random }) {
  const columns = Math.min(4, Math.max(1, repos.length))
  const area = { left: 60, right: width - 60, top: 96 }
  const cellWidth = (area.right - area.left) / columns
  const cellHeight = CELL_HEIGHT
  return repos.map((repo, i) => {
    const r = round(Math.min(MAX_BUBBLE_RADIUS, 20 + Math.sqrt(repo.stars) * 9))
    const bubble = { repo, r }
    const slackX = Math.max(0, cellWidth / 2 - bubbleHalfWidth(bubble) - 4)
    const slackY = Math.max(0, cellHeight / 2 - bubbleHalfHeight(bubble) - 4)
    const column = i % columns
    const row = Math.floor(i / columns)
    const cx = area.left + cellWidth * (column + 0.5) + (random() - 0.5) * 2 * Math.min(slackX, 34)
    const cy = area.top + cellHeight * (row + 0.5) - 6 + (random() - 0.5) * 2 * Math.min(slackY, 18)
    return { ...bubble, cx: round(cx), cy: round(cy), dur: round(7 + random() * 6), dx: round((random() - 0.5) * 14), dy: round((random() - 0.5) * 12) }
  })
}

export function renderConstellation(stats, theme) {
  const repos = stats.repositories
  const height = constellationHeight(repos.length)
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "constellation" })
  const bubbles = layoutBubbles(repos, { random: rng(29) })
  const links = bubbles
    .flatMap((a, i) => bubbles.slice(i + 1).filter((b) => b.repo.language === a.repo.language).map((b) => [a, b]))
    .map(([a, b]) => `<line x1="${a.cx}" y1="${a.cy}" x2="${b.cx}" y2="${b.cy}" stroke="${a.repo.color}" stroke-opacity="0.18" stroke-dasharray="3 7"><animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2s" repeatCount="indefinite"/></line>`)
    .join("")
  const nodes = bubbles
    .map(({ repo, cx, cy, r, dur, dx, dy }, i) => {
      const name = bubbleLabel(repo.name)
      const shadowRx = round(r * 0.95)
      return `<g transform="translate(${cx} ${cy})" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${round(0.2 + i * 0.09)}s" dur="0.6s" fill="freeze"/><ellipse cy="${round(r * 1.02)}" rx="${shadowRx}" ry="${round(r * 0.26)}" fill="url(#mat-shadow)" opacity="0.9"><animate attributeName="rx" values="${shadowRx};${round(shadowRx * 0.82)};${shadowRx}" dur="${dur}s" repeatCount="indefinite"/></ellipse><g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0" dur="${dur}s" repeatCount="indefinite"/><circle r="${r + 8}" fill="${repo.color}" opacity="0.12"><animate attributeName="r" values="${r + 6};${r + 14};${r + 6}" dur="${dur}s" repeatCount="indefinite"/></circle>${sphere({ cx: 0, cy: 0, r, fill: `url(#sphere-${i})`, shadow: false })}<text y="4" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff">${escapeXml(repo.stars)}<tspan font-size="9" font-weight="600" fill="#ffffff" fill-opacity="0.8"> ★</tspan></text><text y="${r + 16}" text-anchor="middle" font-size="${LABEL_FONT}" font-family="${MONO}" fill="${theme.text}">${escapeXml(name)}</text></g></g>`
    })
    .join("\n")
  const languages = [...new Map(repos.map((repo) => [repo.language, repo.color])).entries()]
  let legendX = 60
  const legend = languages
    .map(([language, color]) => {
      const item = `<g transform="translate(${legendX} ${height - 34})"><circle r="5" fill="${color}"/><text x="11" y="4" font-size="12" fill="${theme.muted}">${escapeXml(language)}</text></g>`
      legendX += round(textWidth(language, 12) + 30)
      return item
    })
    .join("")
  const header = `<text x="60" y="54" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">PUBLIC REPOSITORIES · BUBBLE SIZE FOLLOWS STARS</text><text x="${WIDTH - 52}" y="54" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">updated ${escapeXml(stats.updated)}</text>`
  const spheres = bubbles.map(({ repo }, i) => sphereGradient(`sphere-${i}`, repo.color)).join("")
  return svgDocument({ id: "constellation", width: WIDTH, height, title: `Public repositories of ${stats.name}`, theme, defs: card.defs + spheres, body: [card.rect, header, links, nodes, legend].join("\n") })
}

const EVENT_COLORS = { PushEvent: "accent2", PullRequestEvent: "accent4", IssuesEvent: "accent3", IssueCommentEvent: "accent3", CreateEvent: "accent", WatchEvent: "accent", ForkEvent: "accent2", ReleaseEvent: "accent4", PublicEvent: "accent" }

export function renderActivity(stats, theme) {
  const rowHeight = 44
  const rows = stats.activity.length ? stats.activity : [{ type: "PushEvent", text: "No public activity in the last 90 days", repo: "", when: "" }]
  const height = 78 + rows.length * rowHeight + 18
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "activity" })
  const list = rows
    .map((item, i) => {
      const y = 92 + i * rowHeight
      const color = theme[EVENT_COLORS[item.type] ?? "accent2"]
      const textX = 96
      const repoX = round(textX + textWidth(item.text, 15) + 10)
      return `<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${round(0.2 + i * 0.18)}s" dur="0.45s" fill="freeze"/><animateTransform attributeName="transform" type="translate" values="-16 0;0 0" begin="${round(0.2 + i * 0.18)}s" dur="0.45s" fill="freeze"/><circle cx="66" cy="${y - 5}" r="9" fill="${color}" opacity="0.25" filter="url(#activity-glow)"/>${sphere({ cx: 66, cy: y - 5, r: 6.5, fill: `url(#activity-dot-${EVENT_COLORS[item.type] ?? "accent2"})`, shadow: false })}<line x1="66" y1="${y + 9}" x2="66" y2="${y + rowHeight - 12}" stroke="${theme.border}" stroke-dasharray="2 4"/><text x="${textX}" y="${y}" font-size="15" fill="${theme.text}">${escapeXml(item.text)}</text><text x="${repoX}" y="${y}" font-size="14" font-family="${MONO}" font-weight="600" fill="${color}">${escapeXml(item.repo)}</text><text x="${WIDTH - 52}" y="${y}" text-anchor="end" font-size="12" font-family="${MONO}" fill="${theme.faint}">${escapeXml(item.when)}</text></g>`
    })
    .join("\n")
  const header = `<text x="60" y="54" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">RECENT PUBLIC ACTIVITY</text><text x="${WIDTH - 52}" y="54" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">updated ${escapeXml(stats.updated)}</text>`
  const dotDefs = [...new Set(Object.values(EVENT_COLORS))].map((token) => sphereGradient(`activity-dot-${token}`, theme[token])).join("")
  return svgDocument({ id: "activity", width: WIDTH, height, title: `Recent GitHub activity of ${stats.name}`, theme, defs: card.defs + glowFilter("activity-glow", 3) + dotDefs, body: [card.rect, header, list].join("\n") })
}

const MILESTONE_ICONS = {
  paper: `<path d="M-6,-8 H4 L8,-4 V8 H-6 Z M-3,-2 H5 M-3,2 H5 M-3,6 H2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`,
  grant: `<path d="M0,-8 L2.4,-2.4 L8,-1.5 L3.8,2.4 L5,8 L0,5.2 L-5,8 L-3.8,2.4 L-8,-1.5 L-2.4,-2.4 Z" fill="#fff"/>`,
  commits: `<circle r="3" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M-8,0 H-3 M3,0 H8" stroke="#fff" stroke-width="1.8"/>`,
  streak: `<path d="M1,-9 C-5,-3 -7,1 -7,4 a7,7 0 0 0 14,0 c0,-3 -1.5,-5 -3,-7 -0.5,2 -1.5,3 -3,4 0.8,-3 -0.5,-6 -1,-10 z" fill="#fff"/>`,
  repos: `<path d="M-7,-6 H-1 L1,-4 H7 V6 H-7 Z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`,
  stars: `<path d="M0,-8 L2.2,-2.6 L8,-2 L3.6,1.8 L4.9,7.6 L0,4.6 L-4.9,7.6 L-3.6,1.8 L-8,-2 L-2.2,-2.6 Z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>`,
  languages: `<path d="M-7,-3 L-2,2 L-7,7 M0,7 H7" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
}

const tier = (value, steps) => steps.filter((step) => value >= step).pop()

// Achievements computed from live numbers; static ones come from the profile data.
export function milestones(stats) {
  const stars = tier(stats.stars, [10, 25, 50, 100, 250])
  const contributions = tier(stats.total, [100, 500, 1000, 2500, 5000])
  const streak = tier(stats.streak.longest, [7, 14, 21, 30, 60])
  const repos = tier(stats.repos, [5, 10, 20, 40])
  return [
    { id: "paper", icon: "paper", label: "ECCV 2026", detail: FEATURED_PAPER.title.split(":")[0], unlocked: true },
    { id: "grant", icon: "grant", label: "NVIDIA grant", detail: "32k A100 GPU-hours", unlocked: true },
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
