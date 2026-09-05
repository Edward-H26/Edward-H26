// Procedural textures drawn on canvases at build time: tileable noise for water, clouds, moon and
// planet surfaces, and crisp text labels. No image files are involved.
import * as THREE from "three"
import { rng } from "./periodic.js"

// Tileable value noise with `octaves` layers; `period` lattice cells per tile.
export function tileableNoise(size = 256, { seed = 1, octaves = 4, period = 6, persistence = 0.5 } = {}) {
  const random = rng(seed)
  const heights = new Float32Array(size * size)
  let amplitude = 1
  let total = 0
  let cells = period
  for (let o = 0; o < octaves; o += 1) {
    const lattice = new Float32Array(cells * cells)
    for (let i = 0; i < lattice.length; i += 1) lattice[i] = random()
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const fx = (x / size) * cells
        const fy = (y / size) * cells
        const x0 = Math.floor(fx)
        const y0 = Math.floor(fy)
        const tx = fx - x0
        const ty = fy - y0
        const sx = tx * tx * (3 - 2 * tx)
        const sy = ty * ty * (3 - 2 * ty)
        const at = (ix, iy) => lattice[((iy + cells) % cells) * cells + ((ix + cells) % cells)]
        const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx
        const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx
        heights[y * size + x] += (top * (1 - sy) + bottom * sy) * amplitude
      }
    }
    total += amplitude
    amplitude *= persistence
    cells *= 2
  }
  for (let i = 0; i < heights.length; i += 1) heights[i] /= total
  return { heights, size }
}

function canvasTexture(size, paint) {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  const image = ctx.createImageData(size, size)
  paint(image.data)
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export function heightTexture({ heights, size }, { low = 0, high = 1 } = {}) {
  return canvasTexture(size, (data) => {
    for (let i = 0; i < size * size; i += 1) {
      const v = Math.max(0, Math.min(1, (heights[i] - low) / (high - low))) * 255
      data[i * 4] = v
      data[i * 4 + 1] = v
      data[i * 4 + 2] = v
      data[i * 4 + 3] = 255
    }
  })
}

// Tangent-space normal map from a tileable height field.
export function normalTexture({ heights, size }, strength = 2) {
  return canvasTexture(size, (data) => {
    const h = (x, y) => heights[((y + size) % size) * size + ((x + size) % size)]
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = (h(x + 1, y) - h(x - 1, y)) * strength
        const dy = (h(x, y + 1) - h(x, y - 1)) * strength
        const length = Math.hypot(dx, dy, 1)
        const i = (y * size + x) * 4
        data[i] = ((-dx / length) * 0.5 + 0.5) * 255
        data[i + 1] = ((-dy / length) * 0.5 + 0.5) * 255
        data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255
        data[i + 3] = 255
      }
    }
  })
}

// Soft cloud puff: a few overlapping radial blobs with a noisy edge.
export function cloudTexture(size = 512, seed = 3) {
  const random = rng(seed)
  const blobs = Array.from({ length: 11 }, () => [0.2 + random() * 0.6, 0.4 + random() * 0.28, 0.1 + random() * 0.15])
  const noise = tileableNoise(size, { seed, octaves: 5, period: 5 })
  return canvasTexture(size, (data) => {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const u = x / size
        const v = y / size
        let density = 0
        for (const [bx, by, r] of blobs) density += Math.max(0, 1 - Math.hypot(u - bx, (v - by) * 1.7) / r)
        const n = noise.heights[y * size + x]
        density = Math.min(1, density * 0.75) * (0.45 + 0.55 * n)
        const alpha = Math.max(0, Math.min(1, (density - 0.16) * 1.9))
        // Lit from above: brighter tops, a soft grey base.
        const shade = 0.72 + 0.28 * Math.min(1, Math.max(0, (0.72 - v) * 2.2 + n * 0.35))
        const i = (y * size + x) * 4
        data[i] = 255 * shade
        data[i + 1] = 255 * shade
        data[i + 2] = 255 * Math.min(1, shade + 0.03)
        data[i + 3] = alpha * 255
      }
    }
  })
}

// A label drawn at 2x for sharp text on a plane or sprite; returns the texture and its aspect.
export function labelTexture(text, { font = "700 40px ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif", color = "#ffffff", padding = 28 } = {}) {
  const probe = document.createElement("canvas").getContext("2d")
  probe.font = font
  const width = Math.ceil(probe.measureText(text).width + padding * 2)
  const height = 76
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  ctx.font = font
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.lineJoin = "round"
  ctx.lineWidth = 5
  ctx.strokeStyle = "rgba(0, 0, 0, 0.45)"
  ctx.strokeText(text, width / 2, height / 2 + 2)
  ctx.fillStyle = color
  ctx.fillText(text, width / 2, height / 2 + 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return { texture, aspect: width / height }
}
