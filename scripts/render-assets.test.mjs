import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import { allTimeSummary, codeSummary, commitsByRepository, computeStreaks, summarize, topLanguages, weeklyGrid } from "./github-stats.mjs"
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

  it("sums the yearly windows into all-time totals, days, and languages weighted by commits", () => {
    const year = (number, days, repos) => ({
      year: number,
      totalCommitContributions: 10 * number,
      totalIssueContributions: 2,
      totalPullRequestContributions: 1,
      totalPullRequestReviewContributions: 0,
      totalRepositoryContributions: 3,
      commitContributionsByRepository: repos.map(([name, count]) => ({ repository: { primaryLanguage: name ? { name } : null }, contributions: { totalCount: count } })),
      contributionCalendar: { totalContributions: days.reduce((acc, [, count]) => acc + count, 0), weeks: [{ contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount })) }] }
    })
    const history = [
      year(2025, [["2025-08-01", 4], ["2025-12-30", 1], ["2025-12-31", 2]], [["Python", 6], [null, 9]]),
      year(2026, [["2026-01-01", 3], ["2026-01-02", 0], ["2026-03-01", 5]], [["TypeScript", 4], ["Python", 1]])
    ]
    const summary = allTimeSummary(history, "2025-12-30", "2026-01-02")
    assert.deepEqual(summary.totals, { contributions: 15, commits: 40510, issues: 4, pullRequests: 2, reviews: 0, repositories: 6 })
    assert.deepEqual(summary.days.map((day) => day.date), ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"])
    assert.deepEqual(computeStreaks(summary.days, "2026-01-02"), { current: 3, longest: 3 })
    assert.deepEqual(summary.languages, [{ name: "Python", commits: 7 }, { name: "TypeScript", commits: 4 }])
  })

  it("puts each GitHub week of the account's lifetime in a column of its year's row", () => {
    const days = [{ date: "2025-12-30", count: 1 }, { date: "2025-12-31", count: 2 }, { date: "2026-01-01", count: 4 }, { date: "2026-01-04", count: 8 }, { date: "2026-01-07", count: 16 }]
    assert.deepEqual(weeklyGrid(days, "2025-12-30", "2026-01-06"), [
      { year: 2025, weeks: [{ column: 52, count: 3 }] },
      { year: 2026, weeks: [{ column: 0, count: 4 }, { column: 1, count: 8 }] }
    ])
    // 2028 starts on a Saturday and is a leap year, so its last day would open a 54th week.
    assert.deepEqual(weeklyGrid([{ date: "2028-12-31", count: 2 }], "2028-12-30", "2028-12-31"), [{ year: 2028, weeks: [{ column: 52, count: 2 }] }])
  })

  it("ranks languages by bytes across non-fork repositories", () => {
    const nodes = [
      { isFork: false, languages: { edges: [{ size: 300, node: { name: "Python", color: "#3572A5" } }, { size: 100, node: { name: "R", color: 'url("x")' } }] } },
      { isFork: true, languages: { edges: [{ size: 9000, node: { name: "Go", color: "#00ADD8" } }] } },
      { isFork: false, languages: { edges: [{ size: 100, node: { name: "Python", color: "#3572A5" } }] } }
    ]
    assert.deepEqual(topLanguages(nodes), [
      { name: "Python", share: 80 },
      { name: "R", share: 20 }
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

  it("renders the three live cards for both themes", () => {
    assert.deepEqual(Object.keys(files).sort(), ["code-dark.svg", "code-light.svg", "contrib-3d-dark.svg", "contrib-3d-light.svg", "stats-dark.svg", "stats-light.svg"])
    for (const [name, svg] of Object.entries(files)) {
      assertWellFormed(svg, name)
      assertSelfContained(svg, name)
    }
    assert.ok(files["stats-dark.svg"].includes(`@${PROFILE.handle}`))
    assert.ok(files["stats-dark.svg"].includes(stats.languages[0].name))
    // The repository bars were dropped from both cards on 2026-09-18.
    assert.ok(!files["stats-dark.svg"].includes("COMMITS BY REPOSITORY"))
    assert.ok(!files["code-light.svg"].includes("BUSIEST REPOSITORIES"))
  })

  it("counts the stats card and the 3D chart from the day the account was created", () => {
    assert.ok(files["stats-dark.svg"].includes(">SINCE AUG 2022<"))
    assert.ok(!files["stats-dark.svg"].includes("past year"))
    const cells = stats.grid.reduce((acc, row) => acc + row.weeks.length, 0)
    assert.equal(stats.grid[0].year, 2022)
    for (const name of ["contrib-3d-dark.svg", "contrib-3d-light.svg"]) {
      const svg = files[name]
      // Three faces per weekly bar, plus five radar rings and the radar shape.
      assert.equal((svg.match(/<polygon /g) ?? []).length, cells * 3 + 6, name)
      assert.ok(svg.includes(`>${stats.total}</text>`) && svg.includes(`>${stats.since} / ${stats.updated}<`), name)
      assert.ok(svg.includes(`>${escapeXml(stats.commitLanguages[0].name)}<title>`), name)
      for (const row of stats.grid) assert.ok(svg.includes(`>${row.year}</text>`), `${name} labels ${row.year}`)
    }
    assert.ok(files["contrib-3d-dark.svg"].includes("@keyframes rb4t") && files["contrib-3d-dark.svg"].includes('class="rb'))
    assert.ok(!files["contrib-3d-light.svg"].includes("<style>"))
  })

  it("gives every shown language its own colour, the same on both cards", () => {
    // GitHub's colours put TypeScript and Python about 34 RGB units apart; the palette keeps every pair above 60.
    const rgbDistance = (a, b) => Math.hypot(...[1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)))
    const assertDistinct = (colors, label) => colors.forEach((a, i) => colors.slice(i + 1).forEach((b) => assert.ok(rgbDistance(a, b) >= 60, `${label}: ${a} and ${b} look alike`)))
    for (const theme of ["dark", "light"]) {
      const legend = [...files[`contrib-3d-${theme}.svg`].matchAll(/width="22" height="22" rx="3" fill="(#[0-9a-f]{6})"\/><text [^>]*>([^<]+)<title>/g)].map(([, color, name]) => ({ color, name }))
      assert.equal(legend.length, Math.min(6, stats.commitLanguages.length))
      assertDistinct(legend.map((entry) => entry.color), `${theme} donut`)
      const card = files[`stats-${theme}.svg`]
      const barColors = stats.languages.map((_, i) => card.match(new RegExp(`id="stats-lang-${i}"[^>]*><stop[^>]*><stop offset="0.45" stop-color="(#[0-9a-f]{6})"`))[1])
      assertDistinct(barColors, `${theme} stats card`)
      for (const { color, name } of legend) {
        const i = stats.languages.findIndex((language) => language.name === name)
        if (i >= 0) assert.equal(barColors[i], color, `${name} changes colour between cards`)
      }
    }
  })

  it("draws the 3D chart for an account with no contributions yet", () => {
    const quiet = { ...stats, total: 0, commits: 0, issues: 0, pullRequests: 0, reviews: 0, repositoriesCreated: 0, commitLanguages: [], grid: [{ year: 2026, weeks: [{ column: 0, count: 0 }] }] }
    for (const theme of ["dark", "light"]) {
      const svg = renderDynamicAssets(quiet)[`contrib-3d-${theme}.svg`]
      assertWellFormed(svg, `quiet ${theme} 3D chart`)
      assertSelfContained(svg, `quiet ${theme} 3D chart`)
      assert.ok(!svg.includes("<path d=\"M"), "no language arcs without commits")
    }
  })

  it("keeps hostile repository names out of the code card and copes with no code at all", () => {
    const hostile = { ...stats, code: { ...stats.code, byRepo: [{ name: 'evil/<script>"x"', added: 5, deleted: 1, commits: 1, color: "#3572A5" }] } }
    const svg = renderDynamicAssets(hostile)["code-dark.svg"]
    assertWellFormed(svg, "hostile code card")
    assert.ok(!svg.includes("<script>"))
    const idle = renderDynamicAssets({ ...stats, code: codeSummary({}, [], CAPTURED_AT) })["code-dark.svg"]
    assertWellFormed(idle, "idle code card")
    assert.ok(idle.includes("0 commits in the past year"))
  })


  it("keeps bars inside their tracks and copes with an empty repository list", () => {
    const svg = renderDynamicAssets({ ...stats, languages: [{ name: "Python", color: "#3572A5", share: 100 }], repositoriesByCommits: [{ name: "only", commits: 7, color: "#3572A5" }] })["stats-light.svg"]
    assert.deepEqual([...svg.matchAll(/to="([\d.]+)" begin="0\.3s"/g)].map((m) => Number(m[1])), [280])
    const empty = renderDynamicAssets({ ...stats, repositoriesByCommits: [] })
    assertWellFormed(empty["stats-dark.svg"], "empty stats")
  })



})
