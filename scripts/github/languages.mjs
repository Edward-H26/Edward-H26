// @ts-check
// Languages and repositories: ranked by bytes across the public repositories (the stats card bars),
// by commits over every year (the 3D chart donut), and repositories by commits.

/** GitHub's grey for repositories without a language colour, and for any colour that is not plain hex. */
export const DEFAULT_LANGUAGE_COLOR = "#8b949e"
/** How many languages the stats card lists. */
const MAX_LANGUAGES = 6

/**
 * @param {string | null | undefined} color
 * @param {string} [fallback]
 */
export const safeColor = (color, fallback = DEFAULT_LANGUAGE_COLOR) => (/^#[0-9a-f]{6}$/i.test(color ?? "") ? /** @type {string} */ (color) : fallback)

/**
 * Languages by bytes across non-fork repositories, as a percentage share of the total.
 * @param {any[]} nodes repository nodes of the profile query
 * @param {number} [limit]
 * @returns {{ name: string, share: number }[]}
 */
export function topLanguages(nodes, limit = MAX_LANGUAGES) {
  /** @type {Map<string, { name: string, size: number }>} */
  const totals = new Map()
  for (const repo of nodes) {
    if (repo.isFork) continue
    for (const edge of repo.languages?.edges ?? []) {
      const entry = totals.get(edge.node.name) ?? { name: edge.node.name, size: 0 }
      entry.size += edge.size
      totals.set(edge.node.name, entry)
    }
  }
  const ranked = [...totals.values()].sort((a, b) => b.size - a.size)
  const sum = ranked.reduce((acc, entry) => acc + entry.size, 0) || 1
  return ranked.slice(0, limit).map((entry) => ({ name: entry.name, share: Math.round((entry.size / sum) * 1000) / 10 }))
}

/**
 * Commits per language over every year: each repository counts toward its primary language.
 * @param {any[]} history one contributions window per year
 * @returns {{ name: string, commits: number }[]}
 */
export function languagesByCommits(history) {
  /** @type {Map<string, { name: string, commits: number }>} */
  const totals = new Map()
  for (const year of history) {
    for (const entry of year.commitContributionsByRepository ?? []) {
      const language = entry.repository.primaryLanguage
      if (!language || entry.contributions.totalCount === 0) continue
      const slot = totals.get(language.name) ?? { name: language.name, commits: 0 }
      slot.commits += entry.contributions.totalCount
      totals.set(language.name, slot)
    }
  }
  return [...totals.values()].sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name))
}

/**
 * Repositories committed to in the current window, busiest first, with their language colour.
 * @param {any} contributions a contributionsCollection
 * @returns {{ name: string, commits: number, color: string }[]}
 */
export function commitsByRepository(contributions) {
  return (contributions.commitContributionsByRepository ?? [])
    .map((/** @type {any} */ entry) => ({ name: entry.repository.name, commits: entry.contributions.totalCount, color: safeColor(entry.repository.primaryLanguage?.color) }))
    .filter((/** @type {{ commits: number }} */ entry) => entry.commits > 0)
    .sort((/** @type {{ name: string, commits: number }} */ a, /** @type {{ name: string, commits: number }} */ b) => b.commits - a.commits || a.name.localeCompare(b.name))
}
