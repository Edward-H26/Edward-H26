import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import { computeStreaks, relativeTime, slimEvent, summarize, summarizeEvents, topLanguages } from "./github-stats.mjs"
import { FEATURED_PAPER, FOCUS, PROFILE, SKILL_ROWS, TIMELINE } from "./profile-data.mjs"
import { renderDynamicAssets, renderStaticAssets } from "./render-assets.mjs"
import { THEMES, escape } from "./svg.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fixture = JSON.parse(readFileSync(path.join(ROOT, "scripts/fixtures/github.json"), "utf8"))
const NOW = new Date("2026-09-02T12:00:00Z")

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
  assert.match(svg, /<title id="title">/)
  assert.ok(!svg.includes("undefined") && !svg.includes("NaN"), `${name} leaked undefined or NaN`)
}

describe("static assets", () => {
  const files = renderStaticAssets()

  it("renders every card in both themes as self-contained, well-formed SVG", () => {
    assert.equal(Object.keys(files).length, 12)
    for (const [name, svg] of Object.entries(files)) {
      assertWellFormed(svg, name)
      assertSelfContained(svg, name)
      assert.ok(svg.includes("<animate"), `${name} should be animated`)
    }
  })

  it("puts the profile content into the cards", () => {
    assert.ok(files["hero-dark.svg"].includes(escape(PROFILE.name)))
    for (const line of PROFILE.taglines) assert.ok(files["hero-dark.svg"].includes(escape(line)))
    for (const item of FOCUS) assert.ok(files["research-orbit-light.svg"].includes(escape(item.label)))
    assert.ok(files["featured-paper-dark.svg"].includes("ECCV"))
    assert.ok(files["featured-paper-dark.svg"].includes(escape(FEATURED_PAPER.arxiv)))
    const timelineText = [...files["timeline-dark.svg"].matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(" ").replace(/\s+/g, "")
    for (const item of TIMELINE) {
      assert.ok(timelineText.includes(escape(item.label).replace(/\s+/g, "")), item.label)
      assert.ok(timelineText.includes(escape(item.detail).replace(/\s+/g, "")), item.detail)
    }
    for (const [label] of SKILL_ROWS.flat()) assert.ok(files["skills-marquee-light.svg"].includes(escape(label)))
  })

  it("differs between dark and light and is deterministic", () => {
    assert.notEqual(files["hero-dark.svg"], files["hero-light.svg"])
    assert.ok(files["hero-dark.svg"].includes(THEMES.dark.bg) && files["hero-light.svg"].includes(THEMES.light.bg))
    assert.deepEqual(renderStaticAssets(), files)
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

  it("describes public events in plain words with relative times", () => {
    const events = [
      { type: "PushEvent", repo: { name: "Edward-H26/PersonalWebsite" }, created_at: "2026-09-02T11:30:00Z", payload: {} },
      { type: "WatchEvent", repo: { name: "Platane/snk" }, created_at: "2026-09-01T12:00:00Z", payload: { action: "started" } },
      { type: "UnknownEvent", repo: { name: "x/y" }, created_at: "2026-09-01T12:00:00Z", payload: {} },
      { type: "PullRequestEvent", repo: { name: "a/b" }, created_at: "2026-08-20T12:00:00Z", payload: { action: "closed", pull_request: { merged: true } } }
    ]
    assert.deepEqual(summarizeEvents(events, NOW), [
      { type: "PushEvent", text: "Pushed to", repo: "Edward-H26/PersonalWebsite", when: "30 min ago" },
      { type: "WatchEvent", text: "Starred", repo: "Platane/snk", when: "1 d ago" },
      { type: "PullRequestEvent", text: "Merged a pull request in", repo: "a/b", when: "13 d ago" }
    ])
    assert.equal(relativeTime("2026-03-02T12:00:00Z", NOW), "6 mo ago")
  })

  it("keeps only the event fields the cards use", () => {
    const slim = slimEvent({ type: "PushEvent", repo: { name: "a/b" }, created_at: "2026-09-02T00:00:00Z", payload: { size: 2, commits: [{ message: "secret", author: { email: "x@y" } }] } })
    assert.deepEqual(slim, { type: "PushEvent", repo: { name: "a/b" }, created_at: "2026-09-02T00:00:00Z", payload: { size: 2 } })
    assert.ok(!JSON.stringify(fixture.events).includes('"email"'))
    assert.ok(!JSON.stringify(fixture.events).includes('"message"'))
  })

  it("summarizes the recorded fixture into card numbers", () => {
    const stats = summarize(fixture, NOW)
    assert.equal(stats.login, PROFILE.handle)
    assert.ok(stats.total > 0 && stats.commits > 0 && stats.repos > 0)
    assert.equal(stats.weeks.length, 26)
    assert.ok(stats.languages.length >= 3 && stats.languages.length <= 6)
    assert.ok(stats.activity.length > 0)
    assert.equal(stats.updated, "2026-09-02")
  })
})

describe("dynamic assets", () => {
  const stats = summarize(fixture, NOW)
  const files = renderDynamicAssets(stats)

  it("renders stats and activity cards for both themes", () => {
    assert.deepEqual(Object.keys(files).sort(), ["activity-dark.svg", "activity-light.svg", "stats-dark.svg", "stats-light.svg"])
    for (const [name, svg] of Object.entries(files)) {
      assertWellFormed(svg, name)
      assertSelfContained(svg, name)
    }
    assert.ok(files["stats-dark.svg"].includes(`@${PROFILE.handle}`))
    assert.ok(files["stats-dark.svg"].includes(stats.languages[0].name))
    for (const item of stats.activity) assert.ok(files["activity-light.svg"].includes(escape(item.repo)))
  })

  it("escapes repository names and copes with an empty activity feed", () => {
    const hostile = { ...stats, activity: [{ type: "PushEvent", text: "Pushed 1 commit to", repo: 'evil/<script>"x"', when: "1 h ago" }] }
    const svg = renderDynamicAssets(hostile)["activity-dark.svg"]
    assertWellFormed(svg, "hostile activity")
    assert.ok(svg.includes("evil/&lt;script&gt;&quot;x&quot;"))
    const empty = renderDynamicAssets({ ...stats, activity: [] })["activity-dark.svg"]
    assertWellFormed(empty, "empty activity")
    assert.ok(empty.includes("No public activity"))
  })

  it("keeps the heatmap and language bars inside the card", () => {
    const svg = renderDynamicAssets({ ...stats, weeks: Array.from({ length: 26 }, () => [0, 1, 2, 3, 4, 5, 60]), languages: [{ name: "Python", color: "#3572A5", share: 100 }] })["stats-light.svg"]
    const widths = [...svg.matchAll(/to="([\d.]+)" begin="0\.3s"/g)].map((m) => Number(m[1]))
    assert.deepEqual(widths, [280])
    const cells = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="10" height="10"/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }))
    assert.equal(Math.max(...cells.map((c) => c.x)), 300 + 25 * 13)
    const cardBottom = Number(svg.match(/viewBox="0 0 1200 (\d+)"/)[1]) - 14
    assert.ok(Math.max(...cells.map((c) => c.y)) + 10 < cardBottom - 4, "heatmap must stay inside the card")
  })
})
