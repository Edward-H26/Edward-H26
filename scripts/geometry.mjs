// Small 3D helpers for the cards that rotate real geometry: projected frame lists feed SMIL
// value tracks, so the browser does no math at all.
import { round } from "./svg.mjs"

export function fibonacciSphere(count) {
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2
    const radius = Math.sqrt(1 - y * y)
    const angle = golden * i
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius]
  })
}

// Rotate about Y by `angle`, then tilt about X by `tilt`; z grows toward the viewer.
export function orient([x, y, z], angle, tilt) {
  const rx = x * Math.cos(angle) + z * Math.sin(angle)
  const rz = -x * Math.sin(angle) + z * Math.cos(angle)
  const ry = y * Math.cos(tilt) - rz * Math.sin(tilt)
  const depth = y * Math.sin(tilt) + rz * Math.cos(tilt)
  return [rx, ry, depth]
}

export function project([x, y, z], { cx, cy, size }) {
  return { x: round(cx + x * size), y: round(cy - y * size), z }
}

const PHI = (1 + Math.sqrt(5)) / 2
const ICOSAHEDRON_VERTICES = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
].map((v) => v.map((c) => c / Math.hypot(1, PHI)))
const ICOSAHEDRON_FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
]

export const icosahedron = { vertices: ICOSAHEDRON_VERTICES, faces: ICOSAHEDRON_FACES }

export function faceNormal(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const length = Math.hypot(...n) || 1
  const normal = n.map((component) => component / length)
  const centroid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]
  // Faces are listed in mixed winding order; make every normal point outward.
  return normal[0] * centroid[0] + normal[1] * centroid[1] + normal[2] * centroid[2] < 0 ? normal.map((c) => -c) : normal
}

export function edgesOf(faces) {
  const seen = new Set()
  const edges = []
  for (const face of faces) {
    for (let i = 0; i < 3; i += 1) {
      const a = face[i]
      const b = face[(i + 1) % 3]
      const key = a < b ? `${a}-${b}` : `${b}-${a}`
      if (!seen.has(key)) {
        seen.add(key)
        edges.push(a < b ? [a, b] : [b, a])
      }
    }
  }
  return edges
}

// Nearest-neighbour links on the sphere, deduplicated.
export function neighbourLinks(points, perPoint = 2) {
  const seen = new Set()
  const links = []
  points.forEach((point, i) => {
    const ranked = points
      .map((other, j) => ({ j, d: j === i ? Infinity : Math.hypot(other[0] - point[0], other[1] - point[1], other[2] - point[2]) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, perPoint)
    for (const { j } of ranked) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!seen.has(key)) {
        seen.add(key)
        links.push(i < j ? [i, j] : [j, i])
      }
    }
  })
  return links
}
