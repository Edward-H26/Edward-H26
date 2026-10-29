// @ts-check
// The README blocks that mirror scripts/data (links, featured papers, the paper list, skills, the
// views counter) are generated between HTML comment markers, so the data stays the single source
// of truth. Everything outside the markers is written by hand.
import { LINKS, PAPERS, PHONE, PROFILE, SKILL_CATEGORIES, UNDER_REVIEW, paperButtonId } from "./data/index.mjs"
import { escapeXml } from "./svg.mjs"

const FEATURED_THUMBNAIL_WIDTH = 400
const LIST_THUMBNAIL_WIDTH = 300
const LINK_ICON_HEIGHT = 44
const PAPER_BUTTON_HEIGHT = 36

/**
 * A theme-aware image: the dark and light files of a card, the dark one as the fallback.
 * @param {string} name file stem under assets/, without the theme suffix
 * @param {string} alt
 * @param {number} height
 */
const picture = (name, alt, height) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg" /><source media="(prefers-color-scheme: light)" srcset="assets/${name}-light.svg" /><img height="${height}" alt="${escapeXml(alt)}" src="assets/${name}-dark.svg" /></picture>`

function links() {
  const icons = LINKS.map((link) => `  <a href="${escapeXml(link.url)}" title="${escapeXml(link.label)}">${picture(`link-${link.id}`, link.label, LINK_ICON_HEIGHT)}</a>`).join("&nbsp;&nbsp;\n")
  return `<p align="center">\n${icons}\n</p>\n\n<p align="center">${escapeXml(PHONE)}</p>`
}

/**
 * The venue acronym in parentheses is bold, as on academic homepages.
 * @param {string} text
 */
const venue = (text) => escapeXml(text).replace(/\(([A-Za-z]+)\)/, "(<b>$1</b>)")

/** @param {import("./data/papers.mjs").Paper} paper */
const authors = (paper) => paper.authors.map((author) => (author === PROFILE.name ? `<b>${escapeXml(author)}</b>` : escapeXml(author))).join(", ")

/**
 * A paper entry: the thumbnail beside the title, authors, venue and link buttons, or text only for
 * a paper without a thumbnail. The first https link is the primary one the title and thumbnail open.
 * @param {import("./data/papers.mjs").Paper} paper
 * @param {number} width of the thumbnail column
 */
function paperCard(paper, width) {
  const primary = paper.links.find((link) => /^https:/.test(link.url))?.url
  /** @param {string} inner */
  const wrap = (inner) => (primary ? `<a href="${primary}">${inner}</a>` : inner)
  const details = `<b>${wrap(escapeXml(paper.title))}</b><br/>\n${authors(paper)}<br/>\n<i>${venue(paper.venue)}</i>`
  if (!paper.thumbnail) return `<p>${details}</p>`
  const buttons = paper.links.length
    ? `<br/><br/>\n${paper.links.map((link) => `<a href="${escapeXml(link.url)}">${picture(paperButtonId(link.label), link.label, PAPER_BUTTON_HEIGHT)}</a>`).join("\n")}`
    : ""
  return `<table width="100%">
<tr>
<td width="${width}" valign="top">${wrap(`<img src="assets/papers/${paper.id}.svg" width="${width}" alt="${escapeXml(paper.thumbnail.alt)}"/>`)}</td>
<td valign="top">
${details}${buttons}
</td>
</tr>
</table>`
}

const ACCEPTED_PAPERS = PAPERS.filter((paper) => paper.venue !== UNDER_REVIEW)

const skills = () =>
  Object.entries(SKILL_CATEGORIES)
    .map(([category, items]) => `**${category}:** ${items.join(", ")}`)
    .join("\n\n")

const views = () => `<p align="center">\n  <img src="https://komarev.com/ghpvc/?username=${PROFILE.handle}&style=flat&color=E84A27&label=Profile+views" alt="Profile views" />\n</p>`

/**
 * One renderer per marker pair `<!-- name:start -->` ... `<!-- name:end -->` in README.md.
 * @type {Record<string, () => string>}
 */
export const SECTIONS = {
  links,
  views,
  skills,
  "featured-paper": () => ACCEPTED_PAPERS.map((paper) => paperCard(paper, FEATURED_THUMBNAIL_WIDTH)).join("\n\n"),
  papers: () => PAPERS.map((paper) => paperCard(paper, LIST_THUMBNAIL_WIDTH)).join("\n\n")
}

/**
 * The README with every marked block regenerated; throws when a marker pair is missing, so a
 * block can never silently disappear.
 * @param {string} markdown
 */
export function renderReadme(markdown) {
  return Object.entries(SECTIONS).reduce((text, [name, render]) => {
    const pattern = new RegExp(`<!-- ${name}:start -->\\n[\\s\\S]*?<!-- ${name}:end -->`)
    if (!pattern.test(text)) throw new Error(`README is missing the ${name} markers`)
    return text.replace(pattern, () => `<!-- ${name}:start -->\n${render()}\n<!-- ${name}:end -->`)
  }, markdown)
}
