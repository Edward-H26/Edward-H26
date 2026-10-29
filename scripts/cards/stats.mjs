// @ts-check
// The stats card: a contributions ring, the streak, eight keycap tiles, and the top languages by
// bytes, every number counted from the day the account was created.
import { mix, shade } from "../color.mjs"
import { faceGradient, keycap, sphere, sphereGradient } from "../materials.mjs"
import { compact, round } from "../numbers.mjs"
import { CARD_WIDTH, MONO, cardFrame, escapeXml, glowFilter, linearGradient, svgDocument } from "../svg.mjs"
import { languageColors } from "./language-colors.mjs"

// The commits-by-repository bars were dropped on 2026-09-18, so the card ends under the streak block.
const HEIGHT = 324
const RING_RADIUS = 54
const TILE = { width: 106, height: 74, columns: 4, pitchX: 118, pitchY: 92, left: 300, top: 54 }
const LANGUAGE_BAR = { left: 800, top: 62, pitch: 30, width: 330, maxFill: 280, minFill: 6 }

/**
 * "2022-08-25" -> "AUG 2022": the month the counting starts.
 * @param {string} date
 */
const sinceLabel = (date) => new Date(`${date}T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase()

/**
 * @param {import("../github/summary.mjs").Stats} stats
 * @param {import("../svg.mjs").Theme} theme
 */
export function renderStats(stats, theme) {
  const dark = theme.name === "dark"
  const card = cardFrame(theme, { x: 20, y: 14, width: CARD_WIDTH - 40, height: HEIGHT - 28, radius: 20, id: "stats" })
  const ringLength = round(2 * Math.PI * RING_RADIUS)
  // A torus: a grooved track with an inner shadow, and a bevelled progress band on top.
  const ring = `<g transform="translate(120 122)"><circle r="${RING_RADIUS}" fill="none" stroke="${dark ? "#070d1a" : "#c4cfe0"}" stroke-width="13"/><circle r="${RING_RADIUS}" fill="none" stroke="url(#stats-groove)" stroke-width="11"/><circle r="${RING_RADIUS}" fill="none" stroke="url(#stats-ring)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${ringLength}" stroke-dashoffset="${ringLength}" transform="rotate(-90)" filter="url(#mat-bevel-soft)"><animate attributeName="stroke-dashoffset" from="${ringLength}" to="${round(ringLength * 0.12)}" dur="1.8s" fill="freeze"/></circle><text y="-2" text-anchor="middle" font-size="26" font-weight="800" fill="${theme.text}">${escapeXml(compact(stats.total))}</text><text y="17" text-anchor="middle" font-size="9" font-weight="600" letter-spacing="0.6" fill="${theme.muted}">CONTRIBUTIONS</text></g>`
  const streak = `<g transform="translate(60 196)"><text font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">STREAK</text><path d="M18 26c-6 6-9 12-9 18a12 12 0 0 0 24 0c0-4-2-8-4-11-1 3-3 5-5 6 1-5-1-10-6-13z" fill="${theme.accent}" filter="url(#stats-glow)"><animate attributeName="opacity" values="1;0.55;1" dur="1.4s" repeatCount="indefinite"/></path><text x="36" y="50" font-size="30" font-weight="800" fill="${theme.text}">${stats.streak.current}<tspan font-size="14" font-weight="600" fill="${theme.muted}"> day${stats.streak.current === 1 ? "" : "s"} now</tspan></text><text x="0" y="80" font-size="13" fill="${theme.muted}">Longest streak: <tspan font-weight="700" fill="${theme.text}">${stats.streak.longest} days</tspan></text></g>`
  /** @type {[string, number, string][]} */
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
      const x = TILE.left + (i % TILE.columns) * TILE.pitchX
      const y = TILE.top + Math.floor(i / TILE.columns) * TILE.pitchY
      const tint = mix(theme.card, color, dark ? 0.32 : 0.2)
      return `<g transform="translate(${x} ${y})" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${round(0.15 + i * 0.08)}s" dur="0.5s" fill="freeze"/>${keycap({ width: TILE.width, height: TILE.height, radius: 14, fill: `url(#stats-tile-${i})`, side: shade(tint, dark ? -0.55 : -0.32), depth: 5, shadow: false })}<rect width="${TILE.width}" height="${TILE.height}" rx="14" fill="none" stroke="${color}" stroke-opacity="0.4"/><text x="14" y="41" font-size="26" font-weight="800" fill="${dark ? "#000000" : "#ffffff"}" opacity="0.4">${escapeXml(compact(value))}</text><text x="14" y="40" font-size="26" font-weight="800" fill="${theme.text}">${escapeXml(compact(value))}</text><text x="14" y="60" font-size="12" fill="${theme.muted}">${escapeXml(label)}</text></g>`
    })
    .join("")
  const tileFaces = tileItems.map(([, , color], i) => faceGradient(`stats-tile-${i}`, mix(theme.card, color, dark ? 0.32 : 0.2), { top: 0.18, bottom: -0.1 })).join("")
  const languages = stats.languages
    .map((language, i) => {
      const y = LANGUAGE_BAR.top + i * LANGUAGE_BAR.pitch
      const width = round(Math.max(LANGUAGE_BAR.minFill, (language.share / 100) * LANGUAGE_BAR.maxFill))
      return `<g transform="translate(${LANGUAGE_BAR.left} ${y})">${sphere({ cx: 6, cy: -5, r: 5, fill: `url(#stats-lang-dot-${i})`, shadow: false })}<text x="18" font-size="13" font-weight="600" fill="${theme.text}">${escapeXml(language.name)}</text><text x="${LANGUAGE_BAR.width}" text-anchor="end" font-size="12" font-family="${MONO}" fill="${theme.muted}">${language.share}%</text><rect x="0" y="5" width="${LANGUAGE_BAR.width}" height="8" rx="4" fill="url(#stats-groove)"/><rect x="0" y="5" width="0" height="8" rx="4" fill="url(#stats-lang-${i})"><animate attributeName="width" from="0" to="${width}" begin="${round(0.3 + i * 0.12)}s" dur="0.9s" fill="freeze"/></rect></g>`
    })
    .join("")
  const colors = languageColors(stats)
  const languageDefs = stats.languages
    .map((language, i) => {
      const color = /** @type {string} */ (colors.get(language.name))
      return (
        sphereGradient(`stats-lang-dot-${i}`, color) +
        linearGradient(
          `stats-lang-${i}`,
          [
            ["0", shade(color, 0.5)],
            ["0.45", color],
            ["1", shade(color, -0.4)]
          ],
          { x2: "0", y2: "1" }
        )
      )
    })
    .join("")
  const labels = `<text x="60" y="52" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">SINCE ${escapeXml(sinceLabel(stats.since))}</text><text x="${LANGUAGE_BAR.left}" y="44" font-size="12" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">TOP LANGUAGES</text>`
  const footer = `<text x="${CARD_WIDTH - 48}" y="${HEIGHT - 26}" text-anchor="end" font-size="11" font-family="${MONO}" fill="${theme.faint}">@${escapeXml(stats.login)} · updated ${escapeXml(stats.updated)}</text>`
  const defs = `${card.defs}${linearGradient("stats-ring", [
    ["0", theme.accent2],
    ["1", theme.accent]
  ])}${linearGradient(
    "stats-groove",
    [
      ["0", "#000000", dark ? 0.55 : 0.22],
      ["1", "#ffffff", dark ? 0.1 : 0.7]
    ],
    { x2: "0", y2: "1" }
  )}${glowFilter("stats-glow", 3)}${tileFaces}${languageDefs}`
  return svgDocument({
    id: "stats",
    width: CARD_WIDTH,
    height: HEIGHT,
    title: `GitHub activity of ${stats.name}`,
    theme,
    defs,
    body: [card.rect, labels, ring, streak, tiles, languages, footer].join("\n")
  })
}
