// CLI. `node scripts/render-assets.mjs` writes the static cards into assets/.
// `--dynamic` fetches GitHub data (GH_TOKEN) and writes the live cards into dist/;
// add `--fixture` to render dist/ from scripts/fixtures instead of the network,
// or `--save-fixture` (npm run fixture) to refresh that fixture from the network.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PROFILE } from "./profile-data.mjs"
import { fetchGithub, summarize } from "./github-stats.mjs"
import { renderActivity, renderConstellation, renderMilestones, renderStats } from "./render-dynamic.mjs"
import { SINGLE_ASSETS, STATIC_ASSETS } from "./render-static.mjs"
import { THEMES } from "./svg.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const FIXTURE = path.join(ROOT, "scripts/fixtures/github.json")

export function renderStaticAssets() {
  const files = {}
  for (const [name, render] of Object.entries(STATIC_ASSETS)) {
    for (const theme of Object.values(THEMES)) files[`${name}-${theme.name}.svg`] = render(theme)
  }
  for (const [name, render] of Object.entries(SINGLE_ASSETS)) files[`${name}.svg`] = render()
  return files
}

export function renderDynamicAssets(stats) {
  const files = {}
  for (const theme of Object.values(THEMES)) {
    files[`stats-${theme.name}.svg`] = renderStats(stats, theme)
    files[`milestones-${theme.name}.svg`] = renderMilestones(stats, theme)
    files[`constellation-${theme.name}.svg`] = renderConstellation(stats, theme)
    files[`activity-${theme.name}.svg`] = renderActivity(stats, theme)
  }
  return files
}

function writeAll(dir, files) {
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    writeFileSync(path.join(dir, name), content)
  }
  console.log(`${Object.keys(files).length} files written to ${path.relative(ROOT, dir)}/`)
}

async function main(args) {
  if (!args.includes("--dynamic")) {
    writeAll(path.join(ROOT, "assets"), renderStaticAssets())
    return
  }
  let data
  if (args.includes("--fixture")) data = JSON.parse(readFileSync(FIXTURE, "utf8"))
  else {
    const token = process.env.GH_TOKEN
    if (!token) throw new Error("GH_TOKEN is required for --dynamic (or pass --fixture)")
    data = await fetchGithub(PROFILE.handle, token)
    if (args.includes("--save-fixture")) {
      writeFileSync(FIXTURE, JSON.stringify(data, null, 2))
      console.log(`fixture saved to ${path.relative(ROOT, FIXTURE)}`)
    }
  }
  const stats = summarize(data, new Date(data.capturedAt))
  writeAll(path.join(ROOT, "dist"), renderDynamicAssets(stats))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2))
}
