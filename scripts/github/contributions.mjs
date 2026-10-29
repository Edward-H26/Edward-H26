// @ts-check
// Contribution calendars: the days of each yearly window, streaks, the per-year weekly grid of the
// 3D chart, and the all-time totals summed over the windows the API layer fetches.
import { languagesByCommits } from "./languages.mjs"

const DAY_MS = 86400000
// A year spans at most 53 Sunday-to-Saturday weeks, columns 0 to 52; a rare 54th folds into the last.
const LAST_COLUMN = 52

/** @typedef {{ date: string, count: number }} Day */
/** @typedef {{ year: number, weeks: { column: number, count: number }[] }} GridRow */

/**
 * @param {any} collection a contributionsCollection with its calendar
 * @returns {Day[]}
 */
export function calendarDays(collection) {
  return collection.contributionCalendar.weeks.flatMap((/** @type {any} */ week) => week.contributionDays).map((/** @type {any} */ day) => ({ date: day.date, count: day.contributionCount }))
}

/**
 * Streaks follow GitHub's convention: a current streak is still alive when today has no
 * contribution yet, as long as yesterday had one.
 * @param {Day[]} days
 * @param {string} today "YYYY-MM-DD"
 */
export function computeStreaks(days, today) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  let longest = 0
  let run = 0
  for (const day of sorted) {
    run = day.count > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  let current = 0
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const day = sorted[i]
    if (day.date > today) continue
    if (day.count > 0) current += 1
    else if (day.date === today && current === 0) continue
    else break
  }
  return { current, longest }
}

/**
 * One row per calendar year and one column per Sunday-to-Saturday week, as on GitHub's calendar.
 * Days before the account existed or after today get no cell, and a year's rare 54th week folds
 * into the 53rd so every row has the same length.
 * @param {Day[]} days
 * @param {string} since "YYYY-MM-DD" the account was created
 * @param {string} today "YYYY-MM-DD"
 * @returns {GridRow[]}
 */
export function weeklyGrid(days, since, today) {
  const counts = new Map(days.map((day) => [day.date, day.count]))
  /** @type {GridRow[]} */
  const rows = []
  for (let year = Number(since.slice(0, 4)); year <= Number(today.slice(0, 4)); year += 1) {
    const start = Date.UTC(year, 0, 1)
    const offset = new Date(start).getUTCDay()
    /** @type {Map<number, number>} */
    const weeks = new Map()
    for (let time = start; new Date(time).getUTCFullYear() === year; time += DAY_MS) {
      const date = new Date(time).toISOString().slice(0, 10)
      if (date < since || date > today) continue
      const column = Math.min(LAST_COLUMN, Math.floor(((time - start) / DAY_MS + offset) / 7))
      weeks.set(column, (weeks.get(column) ?? 0) + (counts.get(date) ?? 0))
    }
    rows.push({ year, weeks: [...weeks].map(([column, count]) => ({ column, count })) })
  }
  return rows
}

/**
 * Totals, days, and languages since the account was created, summed over the yearly windows.
 * A date seen in two windows keeps its larger count, so a padded calendar edge cannot erase a day.
 * @param {any[]} history one contributions window per year
 * @param {string} since "YYYY-MM-DD" the account was created
 * @param {string} today "YYYY-MM-DD"
 */
export function allTimeSummary(history, since, today) {
  /** @param {(year: any) => number} pick */
  const sum = (pick) => history.reduce((acc, year) => acc + pick(year), 0)
  /** @type {Map<string, number>} */
  const byDate = new Map()
  for (const day of history.flatMap((year) => calendarDays(year))) byDate.set(day.date, Math.max(byDate.get(day.date) ?? 0, day.count))
  const days = [...byDate].map(([date, count]) => ({ date, count })).filter((day) => day.date >= since && day.date <= today)
  return {
    totals: {
      contributions: sum((year) => year.contributionCalendar.totalContributions),
      commits: sum((year) => year.totalCommitContributions),
      issues: sum((year) => year.totalIssueContributions),
      pullRequests: sum((year) => year.totalPullRequestContributions),
      reviews: sum((year) => year.totalPullRequestReviewContributions),
      repositories: sum((year) => year.totalRepositoryContributions)
    },
    days,
    languages: languagesByCommits(history),
    grid: weeklyGrid(days, since, today)
  }
}
