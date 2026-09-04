// Research focus: a planet carrying a knowledge network, with the eight research topics as
// keycap satellites on a tilted orbit that passes behind it. Loop: 12 s.
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import { createNetwork } from "./lib/network.js"
import { turns, wave } from "./lib/periodic.js"
import { createPlanet, createSpaceDust } from "./lib/planet.js"
import { gradientDome, starField } from "./lib/sky.js"
import { PALETTE, createStage, dark, params } from "./lib/stage.js"
import { labelTexture } from "./lib/textures.js"
import { FOCUS, PROFILE } from "../scripts/profile-data.mjs"

const width = Number(params.get("width") ?? 1440)
const height = Number(params.get("height") ?? 672)
const loop = Number(params.get("loop") ?? 12)
const TOPICS = FOCUS.map((item) => item.label)
document.querySelector(".who").textContent = PROFILE.name

const root = document.documentElement.style
root.setProperty("--text", PALETTE.text)
root.setProperty("--muted", PALETTE.muted)
root.setProperty("--accent", PALETTE.accent)
root.setProperty("--plate", dark ? "linear-gradient(180deg, #24406f, #142a50)" : "linear-gradient(180deg, #ffffff, #e6eefb)")
root.setProperty("--plate-side", dark ? "#060b18" : "#b9c6dc")

const stage = createStage({ width, height, loop, fov: 28, bloom: dark ? { strength: 0.4, radius: 0.5, threshold: 1.35 } : { strength: 0.2, radius: 0.5, threshold: 1.2 }, exposure: dark ? 1 : 1.3 })
const { scene, camera } = stage
const eye = new THREE.Vector3(0, 1.2, 18.5)
camera.position.copy(eye)
camera.lookAt(0, 0.1, 0)

scene.add(gradientDome(dark ? { top: "#05070f", mid: "#0b1428", horizon: "#141c33" } : { top: "#ffffff", mid: "#f4f8ff", horizon: "#dfe9fa" }))
if (dark) {
  scene.add(starField(1600, 300, { seed: 11, minElevation: -1.2 }))
  scene.add(createSpaceDust(260, 30))
}

const RADIUS = 3.2
const planet = createPlanet({ radius: RADIUS, dark })
scene.add(planet)
const network = createNetwork({ radius: RADIUS * 1.02, accent: PALETTE.accent, glow: dark ? "#bfe0ff" : "#ffffff" })
planet.add(network)

const key = new THREE.DirectionalLight("#fff4e0", dark ? 2.2 : 2.4)
key.position.set(-7, 4.5, 7)
key.castShadow = true
key.shadow.mapSize.set(2048, 2048)
Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 })
key.shadow.camera.updateProjectionMatrix()
scene.add(key)
scene.add(new THREE.HemisphereLight(dark ? "#2a3f6b" : "#dbe8ff", dark ? "#04070f" : "#8fa8c9", dark ? 0.3 : 0.7))
const rim = new THREE.PointLight(dark ? "#3b8cff" : "#ffffff", dark ? 25 : 8, 40, 2)
rim.position.set(7, -2, -6)
scene.add(rim)

// Satellites: keycap chips on a tilted circular orbit, always facing the camera.
const orbit = { radius: 5.6, tilt: 0.3 }
const orbitGroup = new THREE.Group()
orbitGroup.rotation.x = orbit.tilt
scene.add(orbitGroup)
const ring = new THREE.Mesh(new THREE.TorusGeometry(orbit.radius, 0.012, 8, 240), new THREE.MeshBasicMaterial({ color: dark ? "#58a6ff" : "#7fa8dd", transparent: true, opacity: dark ? 0.45 : 0.6 }))
ring.rotation.x = Math.PI / 2
orbitGroup.add(ring)
const chips = TOPICS.map((topic, i) => {
  const color = new THREE.Color(i % 2 ? PALETTE.accent2 : PALETTE.accent)
  if (dark) color.multiplyScalar(0.72)
  const label = labelTexture(topic, { font: "800 44px ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" })
  const chipHeight = 0.46
  const chipWidth = chipHeight * label.aspect
  const chip = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(chipWidth, chipHeight, 0.16, 4, 0.11), new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.3 }))
  body.castShadow = true
  chip.add(body)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(chipWidth, chipHeight), new THREE.MeshBasicMaterial({ map: label.texture, transparent: true, toneMapped: false }))
  face.position.z = 0.085
  chip.add(face)
  chip.userData.phase = i / TOPICS.length
  orbitGroup.add(chip)
  return chip
})

stage.onFrame(({ phase }) => {
  planet.userData.planet.rotation.y = turns(phase, 1)
  network.rotation.y = turns(phase, 1)
  planet.userData.clouds.rotation.y = turns(phase, 1, 0.13) + 0.06 * wave(phase, 1)
  network.userData.update(phase)
  for (const chip of chips) {
    const angle = turns(phase, 1, chip.userData.phase)
    chip.position.set(Math.cos(angle) * orbit.radius, 0.18 * wave(phase, 2, chip.userData.phase), Math.sin(angle) * orbit.radius)
    chip.lookAt(camera.position)
  }
  camera.position.set(eye.x + 0.35 * wave(phase, 1), eye.y + 0.2 * wave(phase, 1, 0.25), eye.z)
  camera.lookAt(0, 0.1, 0)
})
stage.render(0)
stage.ready = true
