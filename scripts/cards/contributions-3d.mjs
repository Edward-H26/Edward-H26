// @ts-check
// The 3D contributions chart: every contribution since the account was created, drawn like
// yoshi389111/github-profile-3d-contrib (MIT), which can only show one year. An isometric skyline
// with one row per calendar year, a radar of the all-time totals, the languages committed in, and
// a footer with the totals, stars and forks.
import { escapeXml, svgDocument } from "../svg.mjs"
import { languageDonut } from "./contributions-3d/donut.mjs"
import { radarChart } from "./contributions-3d/radar.mjs"
import { SKYLINE, rainbowStyle, skyline } from "./contributions-3d/skyline.mjs"

// Octicons star and repo-forked (MIT), 16 x 16.
const STAR_PATH =
  "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"
const FORK_PATH =
  "M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"

/**
 * @param {import("../github/summary.mjs").Stats} stats
 * @param {import("../svg.mjs").Theme} theme
 */
export function renderContributions3d(stats, theme) {
  const dark = theme.name === "dark"
  /** @type {import("./contributions-3d/radar.mjs").ChartPalette} */
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
