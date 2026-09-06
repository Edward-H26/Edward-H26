// Hero: the island at dusk (or in golden-hour daylight), seen across a reflecting sea, with the
// profile text typed over it. Loop: 12 s.
import * as THREE from "three"
import { createIsland, islandHeight } from "./lib/island.js"
import { wave } from "./lib/periodic.js"
import { createSea } from "./lib/sea.js"
import { createDaySky, createNightSky } from "./lib/sky.js"
import { PALETTE, createStage, dark, params } from "./lib/stage.js"
import { PROFILE } from "../scripts/profile-data.mjs"

const width = Number(params.get("width") ?? 1440)
const height = Number(params.get("height") ?? 456)
const loop = Number(params.get("loop") ?? 12)

const root = document.documentElement.style
root.setProperty("--text", PALETTE.text)
root.setProperty("--accent", PALETTE.accent)
root.setProperty("--accent2", PALETTE.accent2)
root.setProperty("--name", dark ? "linear-gradient(180deg, #ffffff, #c7d3ea)" : "linear-gradient(180deg, #13294B, #2b4f86)")
root.setProperty("--extrude", dark ? "#7d8fb3" : "#9fb2d3")
root.setProperty("--extrude-2", dark ? "#66779a" : "#8a9dc0")
root.setProperty("--extrude-3", dark ? "#4f5f80" : "#7488ad")
root.setProperty("--extrude-4", dark ? "#3a4761" : "#5f7399")
root.setProperty("--shade", dark ? "linear-gradient(90deg, rgba(5,8,15,0.62) 0%, rgba(5,8,15,0.4) 32%, rgba(5,8,15,0) 56%)" : "linear-gradient(90deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.42) 32%, rgba(255,255,255,0) 56%)")
root.setProperty("--vignette", dark ? "rgba(13,17,23,0.75)" : "rgba(255,255,255,0.22)")

// ?hide=sea,sky,island renders a still without those parts, for debugging.
const hidden = new Set((params.get("hide") ?? "").split(","))
const stage = createStage({
  width,
  height,
  loop,
  fov: 50,
  bloom: dark ? { strength: 0.5, radius: 0.6, threshold: 1 } : { strength: 0.22, radius: 0.6, threshold: 1.1 },
  ao: { radius: 0.6, scale: 1, intensity: dark ? 0.5 : 0.6 },
  exposure: dark ? 1.2 : 1
})
const { scene, camera } = stage

const islandPosition = new THREE.Vector3(23, 0, -7)
const lightDirection = dark ? new THREE.Vector3(-0.1, 0.21, -0.97) : new THREE.Vector3(-0.55, 0.7, -0.45)
const sky = hidden.has("sky") ? { sunColor: "#ffffff", update() {} } : dark ? createNightSky({ scene, loop, moonDirection: lightDirection, focus: islandPosition }) : createDaySky({ scene, sunDirection: lightDirection, focus: islandPosition })
if (sky.dome) stage.useSkyEnvironment(sky.dome)
if (params.get("fog") !== "0") scene.fog = new THREE.Fog(dark ? "#2c2440" : "#dcebfa", 150, 420)
const sea = createSea({
  color: dark ? "#1c3d6d" : "#2f7fcf",
  deepColor: dark ? "#061225" : "#0e3a78",
  shallowColor: dark ? "#1f5a7a" : "#2fa9c9",
  fogColor: dark ? "#2c2440" : "#dcebfa",
  sunDir: lightDirection,
  sunColor: sky.sunColor,
  sunPower: dark ? 420 : 380,
  sunStrength: dark ? 0.55 : 0.9,
  reflectivity: dark ? 0.55 : 0.75,
  fogNear: 150,
  fogFar: 420,
  island: new THREE.Vector4(islandPosition.x, islandPosition.z, 16, 13)
})
if (!hidden.has("sea")) scene.add(sea)
const island = hidden.has("island") ? { userData: { update() {} } } : await createIsland({ dark, position: islandPosition })
if (!hidden.has("island")) scene.add(island)

// First-person walk at 1.7 m eye height, one closed circuit per cycle: east along the cobbled
// road through the village to the lighthouse, then back west along the harbour side. Each
// waypoint pairs where the feet are with what the eyes are on (x, z, height above ground), and
// both curves are sampled at the same curve parameter, so the head turns towards the houses,
// the well, the lighthouse lamp, the harbour and the mill as they come by.
const waypoints = [
  { at: [-11.2, 2.8], look: [-4, 1, 1.4] },
  { at: [-8.5, 1.2], look: [-4, 4.6, 1.5] },
  { at: [-4.5, 0.8], look: [1.5, -2.2, 1] },
  { at: [-0.5, 1], look: [8, 0.5, 2.2] },
  { at: [3.8, 0.4], look: [12.4, -4.2, 4.5] },
  { at: [7.6, -1.2], look: [12.4, -4.2, 6.5] },
  { at: [11, 0], look: [16, 1, 0.5] },
  { at: [11.2, 4.4], look: [6, 9, 0.8] },
  { at: [9.2, 7.8], look: [-4, 13, 0.4] },
  { at: [3.6, 8.4], look: [-2, 5.4, 1.2] },
  { at: [-1.5, 9.4], look: [-5, 5, 1.8] },
  { at: [-6.4, 8], look: [-10.2, -3.6, 4] },
  { at: [-11.2, 6], look: [-14, 0, 1.2] }
]
const onIsland = (x, z, lift) => new THREE.Vector3(islandPosition.x + x, Math.max(islandHeight(x, z), 0) + lift, islandPosition.z + z)
const walk = new THREE.CatmullRomCurve3(waypoints.map(({ at: [x, z] }) => onIsland(x, z, 1.7)), true, "catmullrom", 0.5)
const look = new THREE.CatmullRomCurve3(waypoints.map(({ look: [x, z, lift] }) => onIsland(x, z, lift)), true, "catmullrom", 0.5)
const eye = new THREE.Vector3()
const target = new THREE.Vector3()

// Typing: each tagline is typed, held, erased, inside its slot of the loop.
const taglines = PROFILE.taglines
const typed = document.getElementById("typed")
const caret = document.getElementById("caret")
const slot = loop / taglines.length
function typing(t) {
  const index = Math.min(taglines.length - 1, Math.floor(t / slot))
  const local = t - index * slot
  const line = taglines[index]
  const typeFor = 1.3
  const holdUntil = slot - 0.7
  const eraseFor = 0.5
  let visible
  if (local < typeFor) visible = Math.ceil((local / typeFor) * line.length)
  else if (local < holdUntil) visible = line.length
  else if (local < holdUntil + eraseFor) visible = Math.floor((1 - (local - holdUntil) / eraseFor) * line.length)
  else visible = 0
  typed.textContent = line.slice(0, visible)
}
document.querySelector(".name").textContent = PROFILE.name
document.querySelector(".name").dataset.text = PROFILE.name
document.querySelector(".role").textContent = PROFILE.role

stage.onFrame(({ phase, t }) => {
  sea.material.uniforms.phase.value = phase
  sky.update(phase)
  island.userData.update(phase)
  walk.getPointAt(phase, eye)
  look.getPoint(walk.getUtoTmapping(phase), target)
  eye.y += 0.04 * wave(phase, loop * 2)
  camera.position.copy(eye)
  camera.lookAt(target)
  typing(t % loop)
  caret.style.opacity = wave(phase, 13) > -0.2 ? "1" : "0"
})
stage.render(0)
stage.ready = true
