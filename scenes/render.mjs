// Captures a scene frame by frame in headless Chromium (GPU through ANGLE) and encodes the frames
// as an animated WebP for the README.
//
//   node render.mjs hero                 dark and light loops into ../assets/scenes/
//   node render.mjs hero --theme dark    one theme
//   node render.mjs hero --still 2.5     a single PNG at t = 2.5 s, for checking a scene
//   node render.mjs planet --fps 24 --quality 80
//   node render.mjs hero --width 1200 --keep    scale the output and keep the PNG frames for re-encoding
import { spawnSync } from "node:child_process"
import { createServer } from "node:http"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const OUT = path.join(ROOT, "assets/scenes")

// Loop lengths are chosen so every integer-cycle animation in the scene repeats exactly.
// Scenes are authored at 1440 px wide; `output` is the width of the encoded loop.
export const SCENES = {
  hero: { width: 1440, height: 456, loop: 12, output: 1200 },
  planet: { width: 1440, height: 672, loop: 12, output: 1200 },
  paper: { width: 1440, height: 288, loop: 8, output: 1200 }
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css" }

function serve(root) {
  const server = createServer((request, response) => {
    const file = path.join(root, decodeURIComponent(new URL(request.url, "http://x").pathname))
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
      response.writeHead(404)
      response.end()
      return
    }
    response.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" })
    response.end(readFileSync(file))
  })
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })))
}

function option(args, name, fallback) {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : fallback
}

async function main(args) {
  const name = args[0]
  const scene = SCENES[name]
  if (!scene) throw new Error(`unknown scene ${name}; choose one of ${Object.keys(SCENES).join(", ")}`)
  const fps = Number(option(args, "fps", 15))
  const quality = Number(option(args, "quality", 70))
  const still = option(args, "still", null)
  const keep = args.includes("--keep")
  const outputWidth = Number(option(args, "width", still !== null ? scene.width : scene.output))
  const size = { width: outputWidth, height: Math.round((scene.height * outputWidth) / scene.width) }
  const themes = option(args, "theme", "both") === "both" ? ["dark", "light"] : [option(args, "theme")]
  const { server, port } = await serve(ROOT)
  const browser = await chromium.launch({ channel: "chromium", args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--use-gl=angle"] })
  try {
    for (const theme of themes) {
      const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 })
      page.on("pageerror", (error) => console.error(`[${name} ${theme}] page error:`, error.message))
      page.on("console", (message) => { if (message.type() === "error" || message.type() === "warning") console.error(`[${name} ${theme}]`, message.text()) })
      await page.goto(`http://127.0.0.1:${port}/scenes/${name}.html?theme=${theme}&width=${size.width}&height=${size.height}&loop=${scene.loop}&scale=${size.width / scene.width}`)
      await page.waitForFunction(() => window.__scene && window.__scene.ready, null, { timeout: 60000 })
      mkdirSync(OUT, { recursive: true })
      if (still !== null) {
        await page.evaluate((t) => window.__scene.render(t), Number(still))
        const file = path.join(OUT, `${name}-${theme}-still.png`)
        await page.screenshot({ path: file, type: "png" })
        console.log(`${file} (t = ${still}s)`)
        await page.close()
        continue
      }
      const frames = Math.round(scene.loop * fps)
      const dir = mkdtempSync(path.join(tmpdir(), `scene-${name}-`))
      const started = Date.now()
      let rendering = 0
      for (let i = 0; i < frames; i += 1) {
        const before = Date.now()
        await page.evaluate((t) => window.__scene.render(t), i / fps)
        rendering += Date.now() - before
        await page.screenshot({ path: path.join(dir, `${String(i).padStart(4, "0")}.png`), type: "png" })
      }
      await page.close()
      console.log(`rendering ${(rendering / frames).toFixed(0)} ms/frame, capture ${((Date.now() - started) / frames).toFixed(0)} ms/frame total`)
      const file = path.join(OUT, `${name}-${theme}.webp`)
      const encode = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(dir, "%04d.png"), "-c:v", "libwebp_anim", "-lossless", "0", "-quality", String(quality), "-compression_level", "6", "-loop", "0", file], { stdio: "inherit" })
      if (keep) console.log(`frames kept in ${dir}`)
      else rmSync(dir, { recursive: true, force: true })
      if (encode.status !== 0) throw new Error("ffmpeg failed")
      console.log(`${file}: ${frames} frames at ${fps} fps, ${(statSync(file).size / 1024).toFixed(0)} KB, captured in ${((Date.now() - started) / 1000).toFixed(1)}s`)
    }
  } finally {
    await browser.close()
    server.close()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2))
}
