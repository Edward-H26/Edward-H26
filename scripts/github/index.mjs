// @ts-check
// Public surface of the GitHub data layer: fetch the live data, or summarize a recorded response.
// The summarizers are pure, so the tests and the `--fixture` render never touch the network.

export { fetchGithub } from "./api.mjs"
export { codeSummary } from "./code.mjs"
export { allTimeSummary, calendarDays, computeStreaks, weeklyGrid } from "./contributions.mjs"
export { commitsByRepository, languagesByCommits, topLanguages } from "./languages.mjs"
export { summarize } from "./summary.mjs"
