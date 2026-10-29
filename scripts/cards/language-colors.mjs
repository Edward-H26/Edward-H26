// @ts-check
// Language colours shared by the stats card and the 3D chart's donut, so a language keeps its
// colour from card to card. GitHub's own language colours repeat hues (TypeScript, Python, and R
// are all blue; HTML and Jupyter Notebook are both orange), so the cards take colours from one
// categorical palette instead: Tableau 10 without its grey, which stays free for "Other".
const LANGUAGE_PALETTE = ["#4e79a7", "#f28e2b", "#edc948", "#59a14f", "#e15759", "#b07aa1", "#76b7b2", "#ff9da7", "#9c755f"]

/** The donut names this many languages at most; past that, the tail folds into "Other". */
export const MAX_DONUT_LANGUAGES = 6

/**
 * @template {{ name: string, commits: number }} T
 * @param {T[]} languages ranked by commits
 * @returns {{ shown: T[], rest: number }} the named languages and the commits folded into "Other"
 */
export function donutLanguages(languages) {
  const shown = languages.length > MAX_DONUT_LANGUAGES ? languages.slice(0, MAX_DONUT_LANGUAGES - 1) : languages
  return { shown, rest: languages.slice(shown.length).reduce((acc, language) => acc + language.commits, 0) }
}

/**
 * One palette colour per language shown on either card, donut languages first.
 * @param {{ commitLanguages: { name: string, commits: number }[], languages: { name: string }[] }} stats
 * @returns {Map<string, string>}
 */
export function languageColors(stats) {
  const names = new Set([...donutLanguages(stats.commitLanguages).shown, ...stats.languages].map((language) => language.name))
  return new Map([...names].map((name, i) => [name, LANGUAGE_PALETTE[i % LANGUAGE_PALETTE.length]]))
}
