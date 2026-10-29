// @ts-check
// Turns the recorded API response into the plain numbers the cards draw. Every contribution
// number counts from the day the account was created.
import { codeSummary } from "./code.mjs"
import { allTimeSummary, computeStreaks } from "./contributions.mjs"
import { commitsByRepository, topLanguages } from "./languages.mjs"

/**
 * @typedef {object} Stats
 * @property {string} name
 * @property {string} login
 * @property {string} updated "YYYY-MM-DD" the data was captured
 * @property {string} since "YYYY-MM-DD" the account was created
 * @property {number} followers
 * @property {number} repos
 * @property {number} stars
 * @property {number} forks
 * @property {number} commits
 * @property {number} pullRequests
 * @property {number} issues
 * @property {number} reviews
 * @property {number} repositoriesCreated
 * @property {number} total all contributions
 * @property {{ current: number, longest: number }} streak
 * @property {{ name: string, share: number }[]} languages by bytes, as percentages
 * @property {{ name: string, commits: number }[]} commitLanguages by commits over every year
 * @property {import("./contributions.mjs").GridRow[]} grid
 * @property {{ name: string, commits: number, color: string }[]} repositoriesByCommits
 * @property {import("./code.mjs").CodeSummary} code
 */

/**
 * @param {{ user: any, history: any[], codeStats: Record<string, { w: number, a: number, d: number, c: number }[]> }} data as `fetchGithub` returns it
 * @param {Date} [now] the capture time; `today` and the chart's weeks follow from it
 * @returns {Stats}
 */
export function summarize({ user, history, codeStats }, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const since = user.createdAt.slice(0, 10)
  const allTime = allTimeSummary(history, since, today)
  const nodes = user.repositories.nodes
  return {
    name: user.name ?? user.login,
    login: user.login,
    updated: today,
    since,
    followers: user.followers.totalCount,
    repos: user.repositories.totalCount,
    stars: nodes.reduce((/** @type {number} */ acc, /** @type {any} */ repo) => acc + repo.stargazerCount, 0),
    forks: nodes.reduce((/** @type {number} */ acc, /** @type {any} */ repo) => acc + repo.forkCount, 0),
    commits: allTime.totals.commits,
    pullRequests: allTime.totals.pullRequests,
    issues: allTime.totals.issues,
    reviews: allTime.totals.reviews,
    repositoriesCreated: allTime.totals.repositories,
    total: allTime.totals.contributions,
    streak: computeStreaks(allTime.days, today),
    languages: topLanguages(nodes),
    commitLanguages: allTime.languages,
    grid: allTime.grid,
    repositoriesByCommits: commitsByRepository(user.contributionsCollection),
    code: codeSummary(codeStats, nodes, now)
  }
}
