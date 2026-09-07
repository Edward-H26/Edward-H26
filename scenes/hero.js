// Hero: the island at dusk (or in golden-hour daylight), seen across a reflecting sea, with the
// profile text typed over it. Loop: 12 s.
import * as THREE from "three"
import { createIsland } from "./lib/island.js"
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
  fov: 32,
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

// A fixed vantage over the whole island from the harbour side, high enough to see the village and
// the lighthouse, with the island set to the right of the profile text. Only the sea, clouds,
// aurora, beam, mill blades, birds and ship move, which keeps the loop small and smooth.
const forward = new THREE.Vector3(0.45, 0, -0.89)
const right = new THREE.Vector3(-forward.z, 0, forward.x)
camera.position.copy(islandPosition).addScaledVector(forward, -42).add(new THREE.Vector3(0, 13, 0))
camera.lookAt(new THREE.Vector3(islandPosition.x, 4.5, islandPosition.z).addScaledVector(right, -9))

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
  typing(t % loop)
  caret.style.opacity = wave(phase, 13) > -0.2 ? "1" : "0"
})
stage.render(0)
stage.ready = true
