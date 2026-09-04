import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import { commitsByRepository, computeStreaks, publicRepositories, relativeTime, slimEvent, summarize, summarizeEvents, topLanguages } from "./github-stats.mjs"
import { FEATURED_PAPER, FOCUS, LINKS, PROFILE, SKILL_ROWS } from "./profile-data.mjs"
import { renderDynamicAssets, renderStaticAssets } from "./render-assets.mjs"
import { MAX_BUBBLE_RADIUS, bubbleHalfHeight, bubbleHalfWidth, layoutBubbles, milestones } from "./render-dynamic.mjs"
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
  assert.match(svg, /aria-labelledby="([a-z-]+)-title"[\s\S]*<title id="\1-title">/)
  assert.ok(!svg.includes("undefined") && !svg.includes("NaN"), `${name} leaked undefined or NaN`)
}

describe("static assets", () => {
  const files = renderStaticAssets()

  it("renders every card in both themes as self-contained, well-formed SVG", () => {
    assert.equal(Object.keys(files).length, (5 + LINKS.length) * 2)
    for (const [name, svg] of Object.entries(files)) {
      assertWellFormed(svg, name)
      assertSelfContained(svg, name)
      assert.ok(svg.includes("<animate"), `${name} should be animated`)
    }
  })

  it("puts the profile content into the cards", () => {
    assert.ok(files["hero-dark.svg"].includes(escapeXml(PROFILE.name)))
    for (const line of PROFILE.taglines) assert.ok(files["hero-dark.svg"].includes(escapeXml(line)))
    for (const item of FOCUS) assert.ok(files["research-globe-light.svg"].includes(escapeXml(item.label)))
    assert.ok(files["featured-paper-dark.svg"].includes("ECCV"))
    assert.ok(files["featured-paper-dark.svg"].includes(escapeXml(FEATURED_PAPER.arxiv)))
    for (const [label] of SKILL_ROWS.flat()) assert.ok(files["skills-marquee-light.svg"].includes(escapeXml(label)))
    for (const link of LINKS) {
      const svg = files[`link-${link.id}-dark.svg`]
      assert.ok(svg.includes(escapeXml(link.label)), link.id)
      assert.ok(svg.includes(`viewBox="0 0 ${link.width} 60"`))
    }
  })

  it("projects the featured paper icosahedron as closed loops with lit front faces only", () => {
    const svg = files["featured-paper-dark.svg"]
    const faces = svg.match(/<polygon fill="[^"]+" stroke="none">/g) ?? []
    assert.equal(faces.length, 20)
    const edges = svg.match(/<line stroke="[^"]+" stroke-width="1.2" stroke-opacity="0.55" stroke-linecap="round">/g) ?? []
    assert.equal(edges.length, 30)
    const points = svg.match(/<animate attributeName="points" values="([^"]+)"/)[1].split(";")
    assert.equal(points.length, 49)
    assert.equal(points[0], points[points.length - 1])
    const opacityTracks = [...svg.matchAll(/<animate attributeName="fill-opacity" values="([^"]+)"/g)].map((m) => m[1].split(";").map(Number))
    assert.equal(opacityTracks.length, 20)
    for (let frame = 0; frame < 49; frame += 1) {
      const visible = opacityTracks.filter((values) => values[frame] > 0).length
      assert.ok(visible >= 8 && visible <= 12, `frame ${frame} shows ${visible} faces`)
    }
    assert.ok(opacityTracks.flat().every((value) => value >= 0 && value <= 0.8))
  })

  it("rotates the research globe as closed loops with every topic on the ring", () => {
    const svg = files["research-globe-dark.svg"]
    const dots = svg.match(/<circle r="2.6" fill="[^"]+"><animate attributeName="cx"/g) ?? []
    assert.equal(dots.length, 40)
    const wires = svg.match(/<line stroke="[^"]+" stroke-width="1" stroke-opacity="0.35">/g) ?? []
    assert.ok(wires.length >= 36)
    const cx = svg.match(/<animate attributeName="cx" values="([^"]+)"/)[1].split(";")
    assert.equal(cx.length, 37)
    assert.equal(cx[0], cx[cx.length - 1])
    assert.equal((svg.match(/<mpath xlink:href="#globe-ring"\/>/g) ?? []).length, FOCUS.length * 3)
  })

  it("types each hero tagline with its own clip and a caret that follows the text", () => {
    const svg = files["hero-dark.svg"]
    const clips = svg.match(/<clipPath id="hero-type-\d+">/g) ?? []
    assert.equal(clips.length, PROFILE.taglines.length)
    const caret = svg.match(/<animate attributeName="x" values="([^"]+)" keyTimes="([^"]+)"/)
    assert.equal(caret[1].split(";").length, caret[2].split(";").length)
    assert.ok(caret[2].split(";").map(Number).every((v, i, all) => i === 0 || v >= all[i - 1]))
    // WebKit ignores a clip rect of width 0, which would show every tagline at once.
    for (const match of svg.matchAll(/<clipPath id="hero-type-\d+"><rect[^>]*width="([^"]+)"><animate attributeName="width" values="([^"]+)"/g)) {
      assert.notEqual(Number(match[1]), 0)
      assert.ok(match[2].split(";").every((value) => Number(value) > 0))
    }
    assert.equal((svg.match(/lengthAdjust="spacing"/g) ?? []).length, PROFILE.taglines.length)
  })

  it("links every button to the address in the profile data", () => {
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8")
    for (const link of LINKS) {
      const anchor = new RegExp(`<a href="([^"]+)"><picture><source[^>]*srcset="assets/link-${link.id}-dark.svg"`)
      const match = readme.match(anchor)
      assert.ok(match, `README has no button for ${link.id}`)
      assert.equal(match[1].replace(/&amp;/g, "&"), link.url)
    }
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
    assert.deepEqual(summarizeEvents(events, FIXED_NOW), [
      { type: "PushEvent", text: "Pushed to", repo: "Edward-H26/PersonalWebsite", when: "30 min ago" },
      { type: "WatchEvent", text: "Starred", repo: "Platane/snk", when: "1 d ago" },
      { type: "PullRequestEvent", text: "Merged a pull request in", repo: "a/b", when: "13 d ago" }
    ])
    assert.equal(relativeTime("2026-03-02T12:00:00Z", FIXED_NOW), "6 mo ago")
  })

  it("keeps only the event fields the cards use", () => {
    const slim = slimEvent({ type: "PushEvent", repo: { name: "a/b" }, created_at: "2026-09-02T00:00:00Z", payload: { size: 2, commits: [{ message: "secret", author: { email: "x@y" } }] } })
    assert.deepEqual(slim, { type: "PushEvent", repo: { name: "a/b" }, created_at: "2026-09-02T00:00:00Z", payload: { size: 2 } })
    assert.ok(!JSON.stringify(fixture.events).includes('"email"'))
    assert.ok(!JSON.stringify(fixture.events).includes('"message"'))
  })

  it("ranks repositories by commits and by stars", () => {
    const byCommits = commitsByRepository({ commitContributionsByRepository: [
      { repository: { name: "b", primaryLanguage: { name: "Python", color: "#3572A5" } }, contributions: { totalCount: 5 } },
      { repository: { name: "a", primaryLanguage: null }, contributions: { totalCount: 5 } },
      { repository: { name: "empty", primaryLanguage: null }, contributions: { totalCount: 0 } }
    ] })
    assert.deepEqual(byCommits, [{ name: "a", commits: 5, color: "#8b949e" }, { name: "b", commits: 5, color: "#3572A5" }])
    assert.deepEqual(commitsByRepository({}), [])
    const repos = publicRepositories([
      { name: "fork", isFork: true, stargazerCount: 99, forkCount: 0 },
      { name: "z", isFork: false, stargazerCount: 2, forkCount: 1, primaryLanguage: { name: "Go", color: "bad" } },
      { name: "a", isFork: false, stargazerCount: 2, forkCount: 1, primaryLanguage: { name: "TypeScript", color: "#3178c6" } }
    ])
    assert.deepEqual(repos.map((repo) => `${repo.name}:${repo.language}:${repo.color}`), ["a:TypeScript:#3178c6", "z:Go:#8b949e"])
  })

  it("summarizes the recorded fixture into card numbers", () => {
    const stats = summarize(fixture, CAPTURED_AT)
    assert.equal(stats.login, PROFILE.handle)
    assert.ok(stats.total > 0 && stats.commits > 0 && stats.repos > 0)
    assert.ok(stats.repositoriesByCommits.length > 0 && stats.repositories.length > 0)
    assert.ok(stats.languages.length >= 3 && stats.languages.length <= 6)
    assert.ok(stats.activity.length > 0)
    assert.equal(stats.updated, fixture.capturedAt.slice(0, 10))
  })
})

describe("dynamic assets", () => {
  const stats = summarize(fixture, CAPTURED_AT)
  const files = renderDynamicAssets(stats)

  it("renders the four live cards for both themes", () => {
    assert.deepEqual(Object.keys(files).sort(), ["activity-dark.svg", "activity-light.svg", "constellation-dark.svg", "constellation-light.svg", "milestones-dark.svg", "milestones-light.svg", "stats-dark.svg", "stats-light.svg"])
    for (const [name, svg] of Object.entries(files)) {
      assertWellFormed(svg, name)
      assertSelfContained(svg, name)
    }
    assert.ok(files["stats-dark.svg"].includes(`@${PROFILE.handle}`))
    assert.ok(files["stats-dark.svg"].includes(stats.languages[0].name))
    assert.ok(files["stats-dark.svg"].includes(escapeXml(stats.repositoriesByCommits[0].name.slice(0, 20))))
    for (const repo of stats.repositories) assert.ok(files["constellation-light.svg"].includes(escapeXml(repo.name.slice(0, 20))), repo.name)
    for (const item of stats.activity) assert.ok(files["activity-light.svg"].includes(escapeXml(item.repo)))
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

  it("keeps bars inside their tracks and copes with an empty repository list", () => {
    const svg = renderDynamicAssets({ ...stats, languages: [{ name: "Python", color: "#3572A5", share: 100 }], repositoriesByCommits: [{ name: "only", commits: 7, color: "#3572A5" }] })["stats-light.svg"]
    assert.deepEqual([...svg.matchAll(/to="([\d.]+)" begin="0\.3s"/g)].map((m) => Number(m[1])), [280])
    assert.ok(svg.includes('<rect width="540" height="12" fill="#3572A5"/>'))
    const empty = renderDynamicAssets({ ...stats, repositories: [], repositoriesByCommits: [] })
    assertWellFormed(empty["constellation-dark.svg"], "empty constellation")
    assertWellFormed(empty["stats-dark.svg"], "empty stats")
  })

  it("unlocks milestones from live numbers and keeps the static ones", () => {
    const items = milestones(stats)
    assert.equal(items.length, 7)
    assert.ok(items.every((item) => item.label && item.detail))
    const quiet = milestones({ ...stats, stars: 3, total: 40, streak: { current: 0, longest: 2 }, repos: 2, languages: [{ name: "Python" }] })
    assert.deepEqual(quiet.map((item) => item.unlocked), [true, true, false, false, false, false, false])
    const busy = milestones({ ...stats, stars: 300, total: 6000, streak: { current: 1, longest: 99 }, repos: 45, languages: stats.languages })
    assert.deepEqual(busy.slice(2, 6).map((item) => item.label), ["5,000+ contributions", "60-day streak", "40+ repositories", "250+ stars"])
    const svg = renderDynamicAssets({ ...stats, stars: 3, total: 40, streak: { current: 0, longest: 2 }, repos: 2, languages: [{ name: "Python", color: "#3572A5", share: 100 }] })["milestones-dark.svg"]
    assertWellFormed(svg, "milestones")
    assert.ok(svg.includes("2 OF 7 UNLOCKED"))
    assert.ok(svg.includes(">locked<"))
  })

  it("keeps every constellation bubble inside the card", () => {
    const svg = renderDynamicAssets(stats)["constellation-dark.svg"]
    const height = Number(svg.match(/viewBox="0 0 1200 (\d+)"/)[1])
    for (const match of svg.matchAll(/<g transform="translate\((-?[\d.]+) (-?[\d.]+)\)" opacity="0">[\s\S]*?<circle r="([\d.]+)" fill="[^"]+" fill-opacity/g)) {
      const [, x, y, r] = match.map(Number)
      assert.ok(x - r > 24 && x + r < 1176, `bubble at ${x} overflows horizontally`)
      assert.ok(y - r > 60 && y + r + 20 < height - 40, `bubble at ${y} overflows vertically`)
    }
  })

  it("keeps constellation bubbles and their labels apart, even with a very popular repository", () => {
    const popular = { name: "a-repository-with-a-long-name", stars: 500, forks: 40, language: "Python", color: "#3572A5" }
    for (const repos of [stats.repositories, [popular, ...stats.repositories]]) {
      const bubbles = layoutBubbles(repos, { random: rng(29) })
      for (let i = 0; i < bubbles.length; i += 1) {
        assert.ok(bubbles[i].r <= MAX_BUBBLE_RADIUS)
        assert.ok(bubbles[i].cx - bubbleHalfWidth(bubbles[i]) >= 40 && bubbles[i].cx + bubbleHalfWidth(bubbles[i]) <= 1160, `${bubbles[i].repo.name} leaves the card`)
        for (let j = i + 1; j < bubbles.length; j += 1) {
          const a = bubbles[i]
          const b = bubbles[j]
          const boxesApart = Math.abs(b.cx - a.cx) >= bubbleHalfWidth(a) + bubbleHalfWidth(b) - 1 || Math.abs(b.cy - a.cy) >= bubbleHalfHeight(a) + bubbleHalfHeight(b) - 1
          assert.ok(boxesApart, `${a.repo.name} and ${b.repo.name} overlap`)
        }
      }
    }
    assert.deepEqual(layoutBubbles([], { random: rng(1) }), [])
  })
})
