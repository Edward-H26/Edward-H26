// @ts-check
// Lines of code the user pushed: totals for the whole history and for the trailing year, the
// busiest repositories of that year, and one entry per week for the chart.
import { DEFAULT_LANGUAGE_COLOR, safeColor } from "./languages.mjs"

const WEEK_SECONDS = 7 * 86400
/** The chart shows this many weeks, ending with the current Sunday-to-Saturday week. */
const WEEKS_SHOWN = 52
const MAX_REPOSITORIES = 6

/**
 * @typedef {{ added: number, deleted: number, commits: number }} CodeTotals
 * @typedef {CodeTotals & { week: number }} CodeWeek week start as a Unix timestamp in seconds
 * @typedef {CodeTotals & { allTime: CodeTotals, byRepo: (CodeTotals & { name: string, color: string })[], weeks: CodeWeek[] }} CodeSummary
 */

/**
 * Lines the user pushed in the past year: totals, the busiest repositories, and one entry per
 * week (GitHub's weeks start on Sunday, UTC) with gaps filled in.
 * @param {Record<string, { w: number, a: number, d: number, c: number }[]>} [codeStats] weekly statistics per repository
 * @param {any[]} [nodes] repository nodes of the profile query, for the language colours
 * @param {Date} [now]
 * @returns {CodeSummary}
 */
export function codeSummary(codeStats = {}, nodes = [], now = new Date()) {
  const sunday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()) / 1000
  const since = sunday - (WEEKS_SHOWN - 1) * WEEK_SECONDS
  const colors = new Map(nodes.map((repo) => [repo.name, safeColor(repo.primaryLanguage?.color)]))
  /** @type {Map<number, CodeWeek>} */
  const weekly = new Map()
  /** @type {CodeSummary["byRepo"]} */
  const byRepo = []
  // The contributor endpoint returns every week since each repository was created, so the same
  // pass totals the whole history and the trailing year.
  const allTime = { added: 0, deleted: 0, commits: 0 }
  for (const [name, weeks] of Object.entries(codeStats)) {
    const repo = { name, added: 0, deleted: 0, commits: 0, color: colors.get(name) ?? DEFAULT_LANGUAGE_COLOR }
    for (const week of weeks) {
      allTime.added += week.a
      allTime.deleted += week.d
      allTime.commits += week.c
      if (week.w < since || week.w > sunday) continue
      repo.added += week.a
      repo.deleted += week.d
      repo.commits += week.c
      const slot = weekly.get(week.w) ?? { week: week.w, added: 0, deleted: 0, commits: 0 }
      slot.added += week.a
      slot.deleted += week.d
      slot.commits += week.c
      weekly.set(week.w, slot)
    }
    if (repo.added + repo.deleted > 0) byRepo.push(repo)
  }
  byRepo.sort((a, b) => b.added + b.deleted - (a.added + a.deleted) || a.name.localeCompare(b.name))
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => weekly.get(since + i * WEEK_SECONDS) ?? { week: since + i * WEEK_SECONDS, added: 0, deleted: 0, commits: 0 })
  /** @param {"added" | "deleted" | "commits"} key */
  const sum = (key) => weeks.reduce((acc, week) => acc + week[key], 0)
  return { added: sum("added"), deleted: sum("deleted"), commits: sum("commits"), allTime, byRepo: byRepo.slice(0, MAX_REPOSITORIES), weeks }
}
