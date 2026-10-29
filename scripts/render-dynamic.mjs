// @ts-check
// Registry of the cards rendered from live GitHub data by the Profile Assets workflow, written to
// dist/ and published on the output branch, which the README loads them from.
import { renderCode } from "./cards/code.mjs"
import { renderContributions3d } from "./cards/contributions-3d.mjs"
import { renderStats } from "./cards/stats.mjs"
import { THEMES } from "./svg.mjs"

/**
 * Live cards rendered once per theme, as dist/<name>-<theme>.svg.
 * @type {Record<string, (stats: import("./github/summary.mjs").Stats, theme: import("./svg.mjs").Theme) => string>}
 */
export const DYNAMIC_ASSETS = { stats: renderStats, code: renderCode, "contrib-3d": renderContributions3d }

/**
 * Every live file keyed by its name under dist/, with its rendered SVG.
 * @param {import("./github/summary.mjs").Stats} stats
 */
export function renderDynamicAssets(stats) {
  /** @type {Record<string, string>} */
  const files = {}
  for (const theme of Object.values(THEMES)) {
    for (const [name, render] of Object.entries(DYNAMIC_ASSETS)) files[`${name}-${theme.name}.svg`] = render(stats, theme)
  }
  return files
}
