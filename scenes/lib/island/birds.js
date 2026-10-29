// A bird: two wing planes on pivots that flap in the loop phase.
import * as THREE from "three"
import { wave } from "../periodic.js"

export function bird() {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: "#2b3442", roughness: 1, side: THREE.DoubleSide })
  const wings = [-1, 1].map((side) => {
    const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), material)
    wing.position.x = side * 0.35
    const pivot = new THREE.Group()
    pivot.add(wing)
    group.add(pivot)
    return { pivot, side }
  })
  group.userData.flap = (phase, offset) => {
    for (const { pivot, side } of wings) pivot.rotation.z = side * 0.6 * wave(phase, 36, offset)
  }
  return group
}
