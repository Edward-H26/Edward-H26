// Research focus: a planet carrying a knowledge network, with a satellite bead per research topic
// on a tilted orbit that passes behind it, and the eight topic names on keycap chips that flank the
// globe. Loop: 12 s.
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import { createNetwork } from "./lib/network.js"
import { turns, wave } from "./lib/periodic.js"
import { createPlanet, createSpaceDust } from "./lib/planet.js"
import { gradientDome, starField } from "./lib/sky.js"
import { PALETTE, createStage, dark, params } from "./lib/stage.js"
import { labelTexture } from "./lib/textures.js"
import { FOCUS } from "../scripts/profile-data.mjs"

const width = Number(params.get("width") ?? 1440)
const height = Number(params.get("height") ?? 672)
const loop = Number(params.get("loop") ?? 12)
const TOPICS = FOCUS.map((item) => item.label)

const root = document.documentElement.style
root.setProperty("--muted", PALETTE.muted)

const stage = createStage({ width, height, loop, fov: 28, bloom: dark ? { strength: 0.4, radius: 0.5, threshold: 1.35 } : { strength: 0.2, radius: 0.5, threshold: 1.2 }, exposure: dark ? 1 : 1.3 })
const { scene, camera } = stage
const eye = new THREE.Vector3(0, 1.2, 18.5)
camera.position.copy(eye)
camera.lookAt(0, 0.1, 0)

scene.add(gradientDome(dark ? { top: "#05070f", mid: "#0b1428", horizon: "#141c33" } : { top: "#9fc0ea", mid: "#c9dcf3", horizon: "#e6eef9" }))
if (dark) {
  scene.add(starField(1600, 300, { seed: 11, minElevation: -1.2 }))
  scene.add(createSpaceDust(260, 30))
} else {
  // A soft blue-grey halo behind the planet gives the white arcs and chips something to sit on.
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, "rgba(96,122,168,0.6)")
  gradient.addColorStop(0.5, "rgba(120,146,190,0.3)")
  gradient.addColorStop(1, "rgba(150,172,210,0)")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }))
  halo.scale.set(30, 30, 1)
  halo.position.z = -6
  scene.add(halo)
}

const RADIUS = 3.2
const planet = createPlanet({ radius: RADIUS, dark })
scene.add(planet)
const network = createNetwork({ radius: RADIUS * 1.02, accent: PALETTE.accent, glow: dark ? "#bfe0ff" : "#fff6dc" })
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

// Satellites: a lit bead per topic, each on its own inclined orbit (a different tilt, node and
// radius), so they swarm around the planet at different heights and pass behind it at different
// times. The orbits stay inside the gutter between the globe and the label columns.
const ORBITS = TOPICS.map((_, i) => ({
  radius: 4.15 + (i % 3) * 0.32,
  tilt: -0.55 + (i / (TOPICS.length - 1)) * 1.1,
  node: (i * 2.399) % (Math.PI * 2),
  phase: i / TOPICS.length,
  turns: 1
}))
const orbitGroup = new THREE.Group()
scene.add(orbitGroup)
const ringMaterial = new THREE.MeshBasicMaterial({ color: dark ? "#58a6ff" : "#7fa8dd", transparent: true, opacity: dark ? 0.18 : 0.3 })
for (const orbit of ORBITS) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(orbit.radius, 0.008, 6, 240), ringMaterial)
  ring.rotation.set(Math.PI / 2 + orbit.tilt, orbit.node, 0, "YXZ")
  orbitGroup.add(ring)
}
const beadGeometry = new THREE.SphereGeometry(0.1, 16, 16)
const satellites = ORBITS.map((orbit, i) => {
  const accent = i % 2 ? PALETTE.accent2 : PALETTE.accent
  const bead = new THREE.Mesh(beadGeometry, new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.5, roughness: 0.35 }))
  bead.userData.orbit = orbit
  orbitGroup.add(bead)
  return bead
})

// Topic names: keycap chips in two columns flanking the globe, pinned to the camera so each one
// holds the same slot in the frame, at the same size and always face-on, however the camera swings.
// Long names break over two lines, so no chip has to reach the frame edge to fit.
const LABEL_FONT = "800 52px ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
const LABEL_DEPTH = 18.5
const EDGE_MARGIN = 0.34
const ROW_PITCH = 2
const ROW_CENTRE = 0.3
const CHIP_HEIGHT = 1.4

const probe = document.createElement("canvas").getContext("2d")
probe.font = LABEL_FONT
const textWidth = (text) => probe.measureText(text).width

// Splits a topic at the space or hyphen that leaves the two lines closest in width.
function twoLines(text) {
  const parts = text.split(/(?<=[- ])/)
  if (parts.length < 2) return [text]
  let best = null
  for (let i = 1; i < parts.length; i += 1) {
    const lines = [parts.slice(0, i).join("").trimEnd(), parts.slice(i).join("")]
    const width = Math.max(textWidth(lines[0]), textWidth(lines[1]))
    if (!best || width < best.width) best = { width, lines }
  }
  return best.lines
}

const labels = TOPICS.map((topic) => labelTexture(twoLines(topic), { font: LABEL_FONT, padding: 30, padY: 17, leading: 1.04 }))
const frameHalfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * LABEL_DEPTH
const frameHalfWidth = frameHalfHeight * camera.aspect
// The inner edges line up in a column whose widest chip stops EDGE_MARGIN short of the frame.
const columnInner = frameHalfWidth - EDGE_MARGIN - CHIP_HEIGHT * Math.max(...labels.map((label) => label.aspect))
const chips = labels.map((label, i) => {
  const color = new THREE.Color(i % 2 ? PALETTE.accent2 : PALETTE.accent).multiplyScalar(dark ? 0.13 : 0.15)
  const chipWidth = CHIP_HEIGHT * label.aspect
  const chip = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(chipWidth, CHIP_HEIGHT, 0.44, 4, 0.22), new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, metalness: 0.05, clearcoat: 0.1, clearcoatRoughness: 0.7, specularIntensity: 0.25 }))
  chip.add(body)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(chipWidth, CHIP_HEIGHT), new THREE.MeshBasicMaterial({ map: label.texture, transparent: true, toneMapped: false }))
  face.position.z = 0.225
  chip.add(face)
  chip.userData.slot = new THREE.Vector3((i < 4 ? -1 : 1) * (columnInner + chipWidth / 2), ROW_CENTRE + (1.5 - (i % 4)) * ROW_PITCH, -LABEL_DEPTH)
  scene.add(chip)
  return chip
})
const AXIAL_TILT = 0.41
planet.rotation.z = AXIAL_TILT

const orbitPoint = new THREE.Vector3()
const orbitRotation = new THREE.Euler()
stage.onFrame(({ phase }) => {
  planet.userData.planet.rotation.y = turns(phase, 1)
  network.rotation.y = turns(phase, 1)
  planet.userData.clouds.rotation.y = turns(phase, 1, 0.13) + 0.06 * wave(phase, 1)
  network.userData.update(phase)
  for (const bead of satellites) {
    const orbit = bead.userData.orbit
    const angle = turns(phase, orbit.turns, orbit.phase)
    orbitPoint.set(Math.cos(angle) * orbit.radius, 0, Math.sin(angle) * orbit.radius)
    orbitPoint.applyEuler(orbitRotation.set(orbit.tilt, orbit.node, 0, "YXZ"))
    bead.position.copy(orbitPoint)
  }
  // The camera swings around the planet a little, so the globe visibly turns in depth as well.
  const swing = 0.35 * wave(phase, 1)
  camera.position.set(Math.sin(swing) * eye.z, eye.y + 0.4 * wave(phase, 1, 0.25), Math.cos(swing) * eye.z)
  camera.lookAt(0, 0.1, 0)
  // Chips ride in front of the camera, so the swing moves the globe behind them, never the names:
  // each one holds the same pixels of the frame for the whole loop.
  for (const chip of chips) {
    chip.position.copy(chip.userData.slot).applyQuaternion(camera.quaternion).add(camera.position)
    chip.quaternion.copy(camera.quaternion)
  }
})
stage.render(0)
stage.ready = true
