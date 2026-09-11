// The README blocks that mirror scripts/profile-data.mjs (links, featured paper, paper list) are
// generated between HTML comment markers, so the data file stays the single source of truth.
import { LINKS, PAPERS, PHONE, PROFILE, SKILL_CATEGORIES, paperButtonId } from "./profile-data.mjs"
import { escapeXml } from "./svg.mjs"

const picture = (name, alt, height) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg" /><source media="(prefers-color-scheme: light)" srcset="assets/${name}-light.svg" /><img height="${height}" alt="${escapeXml(alt)}" src="assets/${name}-dark.svg" /></picture>`

function links() {
  const icons = LINKS.map((link) => `  <a href="${escapeXml(link.url)}" title="${escapeXml(link.label)}">${picture(`link-${link.id}`, link.label, 44)}</a>`).join("&nbsp;&nbsp;\n")
  return `<p align="center">\n${icons}\n</p>\n\n<p align="center">\n  ${escapeXml(PHONE)}<br />\n  <img src="https://komarev.com/ghpvc/?username=${PROFILE.handle}&style=flat&color=E84A27&label=Profile+views" alt="Profile views" />\n</p>`
}

// The venue acronym in parentheses is bold, as on academic homepages.
const venue = (text) => escapeXml(text).replace(/\(([A-Za-z]+)\)/, "(<b>$1</b>)")
const authors = (paper) => paper.authors.map((author) => (author === PROFILE.name ? `<b>${escapeXml(author)}</b>` : escapeXml(author))).join(", ")

function paperCard(paper, width) {
  const primary = paper.links.find((link) => /^https:/.test(link.url))?.url
  const wrap = (inner) => (primary ? `<a href="${primary}">${inner}</a>` : inner)
  const details = `<b>${wrap(escapeXml(paper.title))}</b><br/>\n${authors(paper)}<br/>\n<i>${venue(paper.venue)}</i>`
  if (!paper.thumbnail) return `<p>${details}</p>`
  const buttons = paper.links.length ? `<br/><br/>\n${paper.links.map((link) => `<a href="${escapeXml(link.url)}">${picture(paperButtonId(link.label), link.label, 36)}</a>`).join("\n")}` : ""
  return `<table width="100%">
<tr>
<td width="${width}" valign="top">${wrap(`<img src="assets/papers/${paper.id}.svg" width="${width}" alt="${escapeXml(paper.thumbnail.alt)}"/>`)}</td>
<td valign="top">
${details}${buttons}
</td>
</tr>
</table>`
}

const skills = () =>
  Object.entries(SKILL_CATEGORIES)
    .map(([category, items]) => `**${category}:** ${items.join(", ")}`)
    .join("\n\n")

export const SECTIONS = {
  links,
  skills,
  "featured-paper": () => paperCard(PAPERS[0], 400),
  papers: () => PAPERS.map((paper) => paperCard(paper, 300)).join("\n\n")
}

export function renderReadme(markdown) {
  return Object.entries(SECTIONS).reduce((text, [name, render]) => {
    const pattern = new RegExp(`<!-- ${name}:start -->\\n[\\s\\S]*?<!-- ${name}:end -->`)
    if (!pattern.test(text)) throw new Error(`README is missing the ${name} markers`)
    return text.replace(pattern, () => `<!-- ${name}:start -->\n${render()}\n<!-- ${name}:end -->`)
  }, markdown)
}
