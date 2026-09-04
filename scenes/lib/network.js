// Points spread evenly over a sphere and the nearest-neighbour links between them; the knowledge
// network on the planet and its pulses of light.
import * as THREE from "three"

export function fibonacciSphere(count) {
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2
    const radius = Math.sqrt(1 - y * y)
    const angle = golden * i
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
  })
}

export function neighbourLinks(points, perPoint = 2) {
  const seen = new Set()
  const links = []
  points.forEach((point, i) => {
    points
      .map((other, j) => ({ j, d: j === i ? Infinity : other.distanceTo(point) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, perPoint)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (!seen.has(key)) {
          seen.add(key)
          links.push([i, j])
        }
      })
  })
  return links
}

// Arcs lifted above the surface between linked points, with a pulse travelling along each one.
export function createNetwork({ radius, count = 40, accent, glow }) {
  const group = new THREE.Group()
  const points = fibonacciSphere(count).map((p) => p.multiplyScalar(radius))
  const nodeMaterial = new THREE.MeshStandardMaterial({ color: "#eaf5ff", emissive: glow, emissiveIntensity: 1.3, roughness: 0.4 })
  const accentMaterial = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.5, roughness: 0.4 })
  const nodeGeometry = new THREE.SphereGeometry(0.045, 12, 12)
  points.forEach((point, i) => {
    const node = new THREE.Mesh(nodeGeometry, i % 7 === 0 ? accentMaterial : nodeMaterial)
    node.position.copy(point)
    group.add(node)
  })
  const arcMaterial = new THREE.MeshStandardMaterial({ color: glow, emissive: glow, emissiveIntensity: 0.55, roughness: 0.5, transparent: true, opacity: 0.8 })
  const pulseGeometry = new THREE.SphereGeometry(0.035, 10, 10)
  const pulseMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff" })
  const pulses = neighbourLinks(points, 2).map(([i, j], index) => {
    const a = points[i]
    const b = points[j]
    const mid = a.clone().add(b).multiplyScalar(0.5)
    mid.setLength(radius + a.distanceTo(b) * 0.28)
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.012, 6, false), arcMaterial))
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial)
    group.add(pulse)
    return { curve, pulse, cycles: 2 + (index % 3), offset: (index * 0.37) % 1, reverse: index % 2 === 1 }
  })
  group.userData.update = (phase) => {
    for (const { curve, pulse, cycles, offset, reverse } of pulses) {
      const u = (phase * cycles + offset) % 1
      pulse.position.copy(curve.getPointAt(reverse ? 1 - u : u))
    }
  }
  return group
}
