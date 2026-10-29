// @ts-check
// CLI. `node scripts/render-assets.mjs` writes the static cards into assets/ and regenerates the
// README blocks. `--dynamic` fetches GitHub data (GH_TOKEN) and writes the live cards into dist/;
// add `--fixture` to render dist/ from scripts/fixtures instead of the network, or
// `--save-fixture` (npm run fixture) to refresh that fixture from the network.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { PROFILE } from "./data/index.mjs"
import { fetchGithub, summarize } from "./github/index.mjs"
import { ASSETS_DIR, DIST_DIR, FIXTURE_PATH, README_PATH, ROOT } from "./paths.mjs"
import { renderReadme } from "./readme.mjs"
import { renderDynamicAssets } from "./render-dynamic.mjs"
import { renderStaticAssets } from "./render-static.mjs"

/**
 * @param {string} dir
 * @param {Record<string, string>} files relative path to content
 */
function writeAll(dir, files) {
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    writeFileSync(path.join(dir, name), content)
  }
  console.log(`${Object.keys(files).length} files written to ${path.relative(ROOT, dir)}/`)
}

function renderStatic() {
  writeAll(ASSETS_DIR, renderStaticAssets())
  writeFileSync(README_PATH, renderReadme(readFileSync(README_PATH, "utf8")))
  console.log("README blocks regenerated")
}

/** @param {string[]} args */
async function loadGithubData(args) {
  if (args.includes("--fixture")) return JSON.parse(readFileSync(FIXTURE_PATH, "utf8"))
  const token = process.env.GH_TOKEN
  if (!token) throw new Error("GH_TOKEN is required for --dynamic (or pass --fixture)")
  const data = await fetchGithub(PROFILE.handle, token)
  if (args.includes("--save-fixture")) {
    writeFileSync(FIXTURE_PATH, JSON.stringify(data, null, 2))
    console.log(`fixture saved to ${path.relative(ROOT, FIXTURE_PATH)}`)
  }
  return data
}

/** @param {string[]} args */
async function renderDynamic(args) {
  const data = await loadGithubData(args)
  writeAll(DIST_DIR, renderDynamicAssets(summarize(data, new Date(data.capturedAt))))
}

const args = process.argv.slice(2)
if (args.includes("--dynamic")) await renderDynamic(args)
else renderStatic()
