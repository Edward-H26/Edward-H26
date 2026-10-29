// @ts-check
// Round icon links rendered into assets/link-<id>-<theme>.svg, like the website's sidebar; the
// README wraps each in one <a>. `icon` names a glyph in scripts/cards/link-icon.mjs.

/** @typedef {{ id: string, label: string, url: string, icon: string }} Link */

/** @type {Link[]} */
export const LINKS = [
  { id: "scholar", label: "Google Scholar", url: "https://scholar.google.com/citations?user=4jv03f4AAAAJ&hl=en", icon: "scholar" },
  { id: "website", label: "Website", url: "https://edward-h26.github.io/", icon: "website" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/qiranhu/", icon: "linkedin" },
  { id: "email", label: "Email", url: "mailto:qh2332@columbia.edu", icon: "email" },
  { id: "x", label: "X", url: "https://x.com/QiranHu", icon: "x" }
]
