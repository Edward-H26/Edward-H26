import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import { codeSummary, commitsByRepository, computeStreaks, summarize, topLanguages } from "./github-stats.mjs"
import { LINKS, PAPERS, PAPER_BUTTONS, PROFILE, SKILL_ROWS, paperButtonId } from "./profile-data.mjs"
import { renderDynamicAssets, renderStaticAssets } from "./render-assets.mjs"
import { renderReadme } from "./readme.mjs"
import { THEMES, escapeXml, rng } from "./svg.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fixture = JSON.parse(readFileSync(path.join(ROOT, "scripts/fixtures/github.json"), "utf8"))
const CAPTURED_AT = new Date(fixture.capturedAt)
// Hand-written event cases use a fixed clock so refreshing the fixture cannot change them.
const FIXED_NOW = new Date("2026-09-02T12:00:00Z")

// Minimal well-formedness check: every opened tag is closed in order and attribute quotes balance.
function assertWellFormed(svg, name) {
  const stripped = svg.replace(/<!--[\s\S]*?-->/g, "")
  const stack = []
  const tag = /<(\/?)([A-Za-z][\w:-]*)([^<>]*?)(\/?)>/g
  let match
  let count = 0
  while ((match = tag.exec(stripped))) {
    count += 1
    const [, closing, tagName, attributes, selfClosing] = match
    assert.equal((attributes.match(/"/g) ?? []).length % 2, 0, `${name}: unbalanced quotes in <${tagName}${attributes.slice(0, 40)}>`)
    if (closing) assert.equal(stack.pop(), tagName, `${name}: unexpected </${tagName}>`)
    else if (!selfClosing) stack.push(tagName)
  }
  assert.deepEqual(stack, [], `${name}: unclosed ${stack.join(", ")}`)
  assert.ok(count > 5)
  assert.ok(!/&(?!amp;|lt;|gt;|quot;|#\d+;)/.test(stripped), `${name}: raw ampersand`)
  assert.ok(!/[<>]/.test(stripped.replace(tag, "")), `${name}: stray angle bracket in text`)
}

function assertSelfContained(svg, name) {
  const urls = svg.match(/https?:\/\/[^\s"')]+/g) ?? []
  const namespaces = ["http://www.w3.org/2000/svg", "http://www.w3.org/1999/xlink"]
  assert.ok(urls.every((url) => namespaces.includes(url)), `${name} must not reference external resources`)
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'))
  assert.match(svg, /aria-labelledby="([a-z0-9-]+)-title"[\s\S]*<title id="\1-title">/)
  const markup = svg.replace(/data:[^"]+/g, "")
  assert.ok(!markup.includes("undefined") && !markup.includes("NaN"), `${name} leaked undefined or NaN`)
}

describe("static assets", () => {
  const files = renderStaticAssets()

  it("renders every card in both themes as self-contained, well-formed SVG", () => {
    // the hero and the skills marquee, plus one icon per link and one button per paper action
    assert.equal(Object.keys(files).length, (2 + LINKS.length + PAPER_BUTTONS.length) * 2 + PAPERS.filter((paper) => paper.thumbnail).length)
    for (const [name, svg] of Object.entries(files)) {
      assertWellFormed(svg, name)
      assertSelfContained(svg, name)
      assert.ok(svg.includes("<animate"), `${name} should be animated`)
    }
  })

  it("puts the profile content into the cards", () => {
    for (const [label] of SKILL_ROWS.flat()) assert.ok(files["skills-marquee-light.svg"].includes(escapeXml(label)))
    for (const link of LINKS) {
      const svg = files[`link-${link.id}-dark.svg`]
      assert.ok(svg.includes(escapeXml(link.label)), link.id)
      assert.ok(svg.includes('viewBox="0 0 64 64"'))
    }
  })




  it("links every icon to the address in the profile data and keeps the README blocks in sync", () => {
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8")
    for (const link of LINKS) {
      const anchor = new RegExp(`<a href="([^"]+)" title="[^"]*"><picture><source[^>]*srcset="assets/link-${link.id}-dark.svg"`)
      const match = readme.match(anchor)
      assert.ok(match, `README has no icon for ${link.id}`)
      assert.equal(match[1].replace(/&amp;/g, "&"), link.url)
    }
    assert.equal(renderReadme(readme), readme, "README blocks are stale (run: npm run render)")
  })

  it("lists every paper with its thumbnail, authors, and buttons in the README", () => {
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8")
    for (const paper of PAPERS) {
      if (paper.thumbnail) {
        assert.ok(readme.includes(`src="assets/papers/${paper.id}.svg"`), `${paper.id} thumbnail`)
        const thumbnail = files[`papers/${paper.id}.svg`]
        assert.ok(thumbnail.includes("data:image/webp;base64,") && thumbnail.includes(escapeXml(paper.thumbnail.badge)), `${paper.id} thumbnail content`)
        assert.ok(existsSync(path.join(ROOT, "assets/papers/figures", `${paper.id}.webp`)), `${paper.id} figure file`)
      } else assert.ok(!readme.includes(`assets/papers/${paper.id}`), `${paper.id} must stay text-only`)
      assert.ok(readme.includes(escapeXml(paper.title)), `${paper.id} title`)
      assert.ok(readme.includes(`<b>${PROFILE.name}</b>`))
      for (const link of paper.links) {
        const anchor = new RegExp(`<a href="${link.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"><picture><source[^>]*srcset="assets/${paperButtonId(link.label)}-dark.svg"`)
        assert.ok(anchor.test(readme), `${paper.id} has no ${link.label} button`)
      }
    }
    for (const label of PAPER_BUTTONS) assert.ok(files[`${paperButtonId(label)}-dark.svg`].includes(escapeXml(label)))
  })

  it("differs between dark and light and is deterministic", () => {
    assert.notEqual(files["skills-marquee-dark.svg"], files["skills-marquee-light.svg"])
    assert.ok(files["skills-marquee-dark.svg"].includes(THEMES.dark.bg) && files["skills-marquee-light.svg"].includes(THEMES.light.bg))
    assert.deepEqual(renderStaticAssets(), files)
  })

  it("references the rendered 3D loop in both themes, each committed and within budget", () => {
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8")
    for (const scene of ["planet"]) {
      for (const theme of ["dark", "light"]) {
        const file = `assets/scenes/${scene}-${theme}.webp`
        assert.ok(readme.includes(file), `README lacks ${file}`)
        assert.ok(existsSync(path.join(ROOT, file)), `${file} missing; run npm run scenes -- ${scene}`)
        assert.ok(statSync(path.join(ROOT, file)).size < 4.9 * 1024 * 1024, `${file} is over 4.9 MB`)
      }
    }
  })

  it("opens with the animated SVG hero in both themes", () => {
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8")
    for (const theme of ["dark", "light"]) assert.ok(readme.includes(`assets/hero-${theme}.svg`), `README lacks the ${theme} hero`)
    assert.ok(files["hero-dark.svg"].includes(PROFILE.taglines[0]), "hero is missing the taglines")
  })

  it("matches the committed files in assets/ (run: npm run render)", () => {
    for (const [name, svg] of Object.entries(files)) {
      assert.equal(readFileSync(path.join(ROOT, "assets", name), "utf8"), svg, `${name} is stale`)
    }
    const stale = readdirSync(path.join(ROOT, "assets")).filter((file) => /-(dark|light)\.svg$/.test(file) && !(file in files))
    assert.deepEqual(stale, [], "assets/ has generated files that no renderer produces")
  })
})

describe("github stats", () => {
  it("computes streaks like GitHub, including a still-alive streak with no contribution today", () => {
    const days = ["2026-08-28", "2026-08-29", "2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02"].map((date, i) => ({ date, count: [1, 0, 2, 3, 1, 0][i] }))
    assert.deepEqual(computeStreaks(days, "2026-09-02"), { current: 3, longest: 3 })
    assert.deepEqual(computeStreaks(days.map((d) => ({ ...d, count: 0 })), "2026-09-02"), { current: 0, longest: 0 })
    assert.deepEqual(computeStreaks([{ date: "2026-09-02", count: 4 }], "2026-09-02"), { current: 1, longest: 1 })
    assert.deepEqual(computeStreaks([], "2026-09-02"), { current: 0, longest: 0 })
  })

  it("ranks languages by bytes across non-fork repositories", () => {
    const nodes = [
      { isFork: false, languages: { edges: [{ size: 300, node: { name: "Python", color: "#3572A5" } }, { size: 100, node: { name: "R", color: 'url("x")' } }] } },
      { isFork: true, languages: { edges: [{ size: 9000, node: { name: "Go", color: "#00ADD8" } }] } },
      { isFork: false, languages: { edges: [{ size: 100, node: { name: "Python", color: "#3572A5" } }] } }
    ]
    assert.deepEqual(topLanguages(nodes), [
      { name: "Python", color: "#3572A5", share: 80 },
      { name: "R", color: "#8b949e", share: 20 }
    ])
    assert.deepEqual(topLanguages([]), [])
  })



  it("ranks repositories by commits", () => {
    const byCommits = commitsByRepository({ commitContributionsByRepository: [
      { repository: { name: "b", primaryLanguage: { name: "Python", color: "#3572A5" } }, contributions: { totalCount: 5 } },
      { repository: { name: "a", primaryLanguage: null }, contributions: { totalCount: 5 } },
      { repository: { name: "empty", primaryLanguage: null }, contributions: { totalCount: 0 } }
    ] })
    assert.deepEqual(byCommits, [{ name: "a", commits: 5, color: "#8b949e" }, { name: "b", commits: 5, color: "#3572A5" }])
    assert.deepEqual(commitsByRepository({}), [])
  })

  it("sums lines of code per week and per repository over the past year", () => {
    const now = new Date("2026-09-02T12:00:00Z")
    const sunday = Date.UTC(2026, 7, 30) / 1000
    const week = 7 * 86400
    const stats = {
      app: [{ w: sunday, a: 120, d: 30, c: 2 }, { w: sunday - week, a: 10, d: 5, c: 1 }, { w: sunday - 60 * week, a: 999, d: 999, c: 9 }],
      lib: [{ w: sunday - week, a: 40, d: 0, c: 1 }],
      quiet: []
    }
    const nodes = [{ name: "app", primaryLanguage: { color: "#3178c6" } }, { name: "lib", primaryLanguage: null }]
    const code = codeSummary(stats, nodes, now)
    assert.deepEqual({ added: code.added, deleted: code.deleted, commits: code.commits }, { added: 170, deleted: 35, commits: 4 })
    assert.equal(code.weeks.length, 52)
    assert.deepEqual(code.weeks.at(-1), { week: sunday, added: 120, deleted: 30, commits: 2 })
    assert.deepEqual(code.weeks.at(-2), { week: sunday - week, added: 50, deleted: 5, commits: 2 })
    assert.deepEqual(code.byRepo.map((repo) => `${repo.name}:${repo.added}:${repo.color}`), ["app:130:#3178c6", "lib:40:#8b949e"])
    assert.deepEqual(codeSummary({}, [], now).byRepo, [])
  })

  it("summarizes the recorded fixture into card numbers", () => {
    const stats = summarize(fixture, CAPTURED_AT)
    assert.equal(stats.login, PROFILE.handle)
    assert.ok(stats.total > 0 && stats.commits > 0 && stats.repos > 0)
    assert.ok(stats.repositoriesByCommits.length > 0 && stats.code.byRepo.length > 0)
    assert.ok(stats.languages.length >= 3 && stats.languages.length <= 6)
    assert.equal(stats.code.weeks.length, 52)
    assert.equal(stats.updated, fixture.capturedAt.slice(0, 10))
  })
})

describe("dynamic assets", () => {
  const stats = summarize(fixture, CAPTURED_AT)
  const files = renderDynamicAssets(stats)

  it("renders the two live cards for both themes", () => {
    assert.deepEqual(Object.keys(files).sort(), ["code-dark.svg", "code-light.svg", "stats-dark.svg", "stats-light.svg"])
    for (const [name, svg] of Object.entries(files)) {
      assertWellFormed(svg, name)
      assertSelfContained(svg, name)
    }
    assert.ok(files["stats-dark.svg"].includes(`@${PROFILE.handle}`))
    assert.ok(files["stats-dark.svg"].includes(stats.languages[0].name))
    assert.ok(files["stats-dark.svg"].includes(escapeXml(stats.repositoriesByCommits[0].name.slice(0, 20))))
    for (const repo of stats.code.byRepo) assert.ok(files["code-light.svg"].includes(escapeXml(repo.name.slice(0, 20))), repo.name)
  })

  it("escapes repository names in the code card and copes with no code at all", () => {
    const hostile = { ...stats, code: { ...stats.code, byRepo: [{ name: 'evil/<script>"x"', added: 5, deleted: 1, commits: 1, color: "#3572A5" }] } }
    const svg = renderDynamicAssets(hostile)["code-dark.svg"]
    assertWellFormed(svg, "hostile code card")
    assert.ok(svg.includes("evil/&lt;script&gt;&quot;x&quot;"))
    const idle = renderDynamicAssets({ ...stats, code: codeSummary({}, [], CAPTURED_AT) })["code-dark.svg"]
    assertWellFormed(idle, "idle code card")
    assert.ok(idle.includes("No code pushed"))
  })


  it("keeps bars inside their tracks and copes with an empty repository list", () => {
    const svg = renderDynamicAssets({ ...stats, languages: [{ name: "Python", color: "#3572A5", share: 100 }], repositoriesByCommits: [{ name: "only", commits: 7, color: "#3572A5" }] })["stats-light.svg"]
    assert.deepEqual([...svg.matchAll(/to="([\d.]+)" begin="0\.3s"/g)].map((m) => Number(m[1])), [280])
    assert.ok(svg.includes('<rect width="540" height="12" fill="#3572A5"/>'))
    const empty = renderDynamicAssets({ ...stats, repositoriesByCommits: [] })
    assertWellFormed(empty["stats-dark.svg"], "empty stats")
  })



})
