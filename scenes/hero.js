// Hero: the island at dusk (or in daylight), seen across a reflecting sea, with the profile text
// typed over it. Loop: 12 s.
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
root.setProperty("--muted", dark ? "#c9d4e6" : PALETTE.muted)
root.setProperty("--faint", PALETTE.faint)
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
const stage = createStage({ width, height, loop, fov: 40, bloom: dark ? { strength: 0.5, radius: 0.6, threshold: 1 } : { strength: 0.25, radius: 0.6, threshold: 1.1 }, exposure: dark ? 1 : 1.1 })
const { scene, camera } = stage
const eye = new THREE.Vector3(0, 4.2, 19)
const target = new THREE.Vector3(7, 2.1, -4)
camera.position.copy(eye)
camera.lookAt(target)

const lightDirection = dark ? new THREE.Vector3(-0.1, 0.21, -0.97) : new THREE.Vector3(-0.5, 0.62, -0.6)
const islandPosition = new THREE.Vector3(14, 0, -4)
const sky = hidden.has("sky") ? { sunColor: "#ffffff", update() {} } : dark ? createNightSky({ scene, loop, moonDirection: lightDirection, focus: islandPosition }) : createDaySky({ scene, sunDirection: lightDirection, focus: islandPosition })
const sea = createSea({
  color: dark ? "#1c3d6d" : "#4f9be0",
  deepColor: dark ? "#061225" : "#174d96",
  fogColor: dark ? "#2c2440" : "#cfdff2",
  sunDir: lightDirection,
  sunColor: sky.sunColor,
  sunPower: dark ? 420 : 520,
  sunStrength: dark ? 0.55 : 1.6
})
if (!hidden.has("sea")) scene.add(sea)
const island = createIsland({ dark, position: islandPosition })
if (!hidden.has("island")) scene.add(island)

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
document.querySelector(".aff-1").textContent = PROFILE.affiliations[0]
document.querySelector(".aff-2").textContent = PROFILE.affiliations[1]

stage.onFrame(({ phase, t }) => {
  sea.material.uniforms.phase.value = phase
  sky.update(phase)
  island.userData.update(phase)
  camera.position.set(eye.x + 0.5 * wave(phase, 1), eye.y + 0.12 * wave(phase, 1, 0.25), eye.z)
  camera.lookAt(target)
  typing(t % loop)
  caret.style.opacity = wave(phase, 13) > -0.2 ? "1" : "0"
})
stage.render(0)
stage.ready = true
