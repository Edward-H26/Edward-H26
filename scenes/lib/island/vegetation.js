// Where vegetation may grow: random spots on the plateau that stay off the road, outside the
// footprints of buildings, trees and rocks, and within the coastline band asked for.
import { TAU, rng } from "../periodic.js"
import { roadDistance } from "./road.js"
import { RADIUS, coastRadius, islandHeight } from "./terrain.js"

export function spotsOnPlateau({ count, seed, minRadius = 0, maxRadius = 0.8, roadClearance = 1.2, avoid = [], scale = [0.7, 1.1] }) {
  const random = rng(seed)
  const spots = []
  let attempts = 0
  while (spots.length < count && attempts < count * 40) {
    attempts += 1
    const x = (random() - 0.5) * RADIUS * 2.2
    const z = (random() - 0.5) * RADIUS * 1.7
    const r = coastRadius(x, z)
    if (r < minRadius || r > maxRadius) continue
    if (roadDistance(x, z) < roadClearance) continue
    if (avoid.some(([ax, az, radius]) => Math.hypot(ax - x, az - z) < radius)) continue
    spots.push({ x, y: islandHeight(x, z) - 0.02, z, rotation: random() * TAU, scale: scale[0] + random() * (scale[1] - scale[0]) })
  }
  return spots
}
