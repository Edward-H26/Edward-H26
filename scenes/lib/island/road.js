// The cobbled road across the plateau: its path, the distance of a point from it (to keep
// vegetation off it), and the mesh draped over the terrain.
import * as THREE from "three"
import { islandHeight } from "./terrain.js"

export const ROAD = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-13.5, 0, 2.6),
  new THREE.Vector3(-7, 0, 0.4),
  new THREE.Vector3(0.8, 0, 2),
  new THREE.Vector3(7.4, 0, -1.4),
  new THREE.Vector3(13.2, 0, 0.6)
])

// Distance from the nearest of 80 samples along the road.
export function roadDistance(x, z) {
  let best = Infinity
  for (let i = 0; i <= 80; i += 1) {
    const p = ROAD.getPointAt(i / 80)
    best = Math.min(best, Math.hypot(p.x - x, p.z - z))
  }
  return best
}

export function road(textures) {
  const samples = 160
  const width = 0.75
  const vertices = []
  const uvs = []
  const indices = []
  const length = ROAD.getLength()
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples
    const p = ROAD.getPointAt(t)
    const tangent = ROAD.getTangentAt(t)
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width)
    for (const s of [-1, 1]) {
      const x = p.x + side.x * s
      const z = p.z + side.z * s
      vertices.push(x, islandHeight(x, z) + 0.05, z)
      uvs.push((t * length) / 1.5, s > 0 ? 1 : 0)
    }
    if (i > 0) {
      const b = i * 2
      indices.push(b - 2, b - 1, b, b - 1, b + 1, b)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  for (const texture of Object.values(textures)) texture.repeat.set(1, 1)
  textures.aoMap.channel = 0
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ ...textures, roughness: 1, metalness: 0, side: THREE.DoubleSide }))
  mesh.receiveShadow = true
  return mesh
}
