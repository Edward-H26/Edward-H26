// Cards rendered from live GitHub data by the Profile Assets workflow.
import { MONO, cardFrame, escapeXml, round, svgDocument, textWidth } from "./svg.mjs"
import { WIDTH } from "./render-static.mjs"

const compact = (value) => (value >= 1000 ? `${round(value / 1000)}k` : String(value))

function heatmap(theme, weeks, x, y) {
  const peak = Math.max(1, ...weeks.flat())
  const cells = []
  weeks.forEach((week, w) => {
    week.forEach((count, d) => {
      const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / peak) * 4))
      const opacity = [0.12, 0.35, 0.55, 0.78, 1][level]
      const fill = level === 0 ? theme.faint : theme.accent3
      cells.push(`<rect x="${x + w * 13}" y="${y + d * 13}" width="10" height="10" rx="2" fill="${fill}" fill-opacity="${opacity}" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${round(0.2 + w * 0.04)}s" dur="0.4s" fill="freeze"/></rect>`)
    })
  })
  return cells.join("")
}

export function renderStats(stats, theme) {
  const height = 372
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "stats" })
  const ringLength = round(2 * Math.PI * 54)
  const ring = `<g transform="translate(120 122)"><circle r="54" fill="none" stroke="${theme.border}" stroke-width="8"/><circle r="54" fill="none" stroke="url(#stats-ring)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${ringLength}" stroke-dashoffset="${ringLength}" transform="rotate(-90)"><animate attributeName="stroke-dashoffset" from="${ringLength}" to="${round(ringLength * 0.12)}" dur="1.8s" fill="freeze"/></circle><text y="-2" text-anchor="middle" font-size="26" font-weight="800" fill="${theme.text}">${escapeXml(compact(stats.total))}</text><text y="17" text-anchor="middle" font-size="9" font-weight="600" letter-spacing="0.6" fill="${theme.muted}">CONTRIBUTIONS</text></g>`
  const streak = `<g transform="translate(60 196)"><text font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">STREAK</text><path d="M18 26c-6 6-9 12-9 18a12 12 0 0 0 24 0c0-4-2-8-4-11-1 3-3 5-5 6 1-5-1-10-6-13z" fill="${theme.accent}"><animate attributeName="opacity" values="1;0.55;1" dur="1.4s" repeatCount="indefinite"/></path><text x="36" y="50" font-size="30" font-weight="800" fill="${theme.text}">${stats.streak.current}<tspan font-size="14" font-weight="600" fill="${theme.muted}"> day${stats.streak.current === 1 ? "" : "s"} now</tspan></text><text x="0" y="80" font-size="13" fill="${theme.muted}">Longest streak, past year: <tspan font-weight="700" fill="${theme.text}">${stats.streak.longest} days</tspan></text></g>`
  const tiles = [
    ["Commits", stats.commits, theme.accent2],
    ["Pull requests", stats.pullRequests, theme.accent4],
    ["Issues", stats.issues, theme.accent3],
    ["Reviews", stats.reviews, theme.accent],
    ["Stars earned", stats.stars, theme.accent],
    ["Repositories", stats.repos, theme.accent2],
    ["Followers", stats.followers, theme.accent4],
    ["Forks", stats.forks, theme.accent3]
  ]
    .map(([label, value, color], i) => {
      const x = 300 + (i % 4) * 118
      const y = 54 + Math.floor(i / 4) * 92
      return `<g transform="translate(${x} ${y})" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${round(0.15 + i * 0.08)}s" dur="0.5s" fill="freeze"/><rect width="106" height="78" rx="14" fill="${color}" fill-opacity="0.09" stroke="${color}" stroke-opacity="0.35"/><text x="14" y="40" font-size="26" font-weight="800" fill="${theme.text}">${escapeXml(compact(value))}</text><text x="14" y="62" font-size="12" fill="${theme.muted}">${escapeXml(label)}</text></g>`
    })
    .join("")
  const languages = stats.languages
    .map((language, i) => {
      const y = 62 + i * 30
      const width = round(Math.max(6, (language.share / 100) * 280))
      return `<g transform="translate(800 ${y})"><circle cx="6" cy="-5" r="5" fill="${language.color}"/><text x="18" font-size="13" font-weight="600" fill="${theme.text}">${escapeXml(language.name)}</text><text x="330" text-anchor="end" font-size="12" font-family="${MONO}" fill="${theme.muted}">${language.share}%</text><rect x="0" y="6" width="330" height="6" rx="3" fill="${theme.border}"/><rect x="0" y="6" width="0" height="6" rx="3" fill="${language.color}"><animate attributeName="width" from="0" to="${width}" begin="${round(0.3 + i * 0.12)}s" dur="0.9s" fill="freeze"/></rect></g>`
    })
    .join("")
  const labels = `<text x="60" y="52" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">PAST 12 MONTHS</text><text x="800" y="44" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">TOP LANGUAGES</text><text x="300" y="254" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">LAST 26 WEEKS</text>`
  const footer = `<text x="${WIDTH - 48}" y="${height - 28}" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">@${escapeXml(stats.login)} · updated ${escapeXml(stats.updated)}</text>`
  const defs = `${card.defs}<linearGradient id="stats-ring" x1="0" x2="1"><stop offset="0" stop-color="${theme.accent2}"/><stop offset="1" stop-color="${theme.accent}"/></linearGradient>`
  return svgDocument({ id: "stats", width: WIDTH, height, title: `GitHub activity of ${stats.name}`, theme, defs, body: [card.rect, labels, ring, streak, tiles, languages, heatmap(theme, stats.weeks, 300, 262), footer].join("\n") })
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
      return `<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${round(0.2 + i * 0.18)}s" dur="0.45s" fill="freeze"/><animateTransform attributeName="transform" type="translate" values="-16 0;0 0" begin="${round(0.2 + i * 0.18)}s" dur="0.45s" fill="freeze"/><circle cx="66" cy="${y - 5}" r="6" fill="${color}"/><line x1="66" y1="${y + 9}" x2="66" y2="${y + rowHeight - 12}" stroke="${theme.border}" stroke-dasharray="2 4"/><text x="${textX}" y="${y}" font-size="15" fill="${theme.text}">${escapeXml(item.text)}</text><text x="${repoX}" y="${y}" font-size="14" font-family="${MONO}" font-weight="600" fill="${color}">${escapeXml(item.repo)}</text><text x="${WIDTH - 52}" y="${y}" text-anchor="end" font-size="12" font-family="${MONO}" fill="${theme.faint}">${escapeXml(item.when)}</text></g>`
    })
    .join("\n")
  const header = `<text x="60" y="54" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">RECENT PUBLIC ACTIVITY</text><text x="${WIDTH - 52}" y="54" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">updated ${escapeXml(stats.updated)}</text>`
  return svgDocument({ id: "activity", width: WIDTH, height, title: `Recent GitHub activity of ${stats.name}`, theme, defs: card.defs, body: [card.rect, header, list].join("\n") })
}
