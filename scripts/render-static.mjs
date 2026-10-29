// @ts-check
// Registry of the hand-designed cards committed under assets/: which renderer produces each file.
// Everything is plain SVG with SMIL animation, so GitHub's image proxy can serve it. The research
// planet is a three.js loop rendered by scenes/render.mjs into assets/scenes/ instead.
import { renderHero } from "./cards/hero.mjs"
import { renderLinkIcon } from "./cards/link-icon.mjs"
import { renderPaperButton } from "./cards/paper-button.mjs"
import { renderPaperThumbnail } from "./cards/paper-thumbnail.mjs"
import { renderSkillsMarquee } from "./cards/skills-marquee.mjs"
import { LINKS, PAPERS, PAPER_BUTTONS, paperButtonId } from "./data/index.mjs"
import { THEMES } from "./svg.mjs"

/**
 * Cards rendered once per theme, as assets/<name>-<theme>.svg.
 * @type {Record<string, (theme: import("./svg.mjs").Theme) => string>}
 */
export const STATIC_ASSETS = {
  hero: renderHero,
  "skills-marquee": renderSkillsMarquee,
  ...Object.fromEntries(LINKS.map((link) => [`link-${link.id}`, (theme) => renderLinkIcon(theme, link)])),
  ...Object.fromEntries(PAPER_BUTTONS.map((label) => [paperButtonId(label), (theme) => renderPaperButton(theme, label)]))
}

/**
 * Theme-independent files, written once as assets/<name>.svg.
 * @type {Record<string, () => string>}
 */
export const SINGLE_ASSETS = Object.fromEntries(
  PAPERS.filter((paper) => paper.thumbnail).map((paper) => [`papers/${paper.id}`, () => renderPaperThumbnail(/** @type {Parameters<typeof renderPaperThumbnail>[0]} */ (paper))])
)

/** Every static file keyed by its path under assets/, with its rendered SVG. */
export function renderStaticAssets() {
  /** @type {Record<string, string>} */
  const files = {}
  for (const [name, render] of Object.entries(STATIC_ASSETS)) {
    for (const theme of Object.values(THEMES)) files[`${name}-${theme.name}.svg`] = render(theme)
  }
  for (const [name, render] of Object.entries(SINGLE_ASSETS)) files[`${name}.svg`] = render()
  return files
}
