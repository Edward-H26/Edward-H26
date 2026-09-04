// Featured paper: a glass icosahedron turning on a mirrored pedestal, inside a card whose text stays
// HTML. Loop: 8 s.
import * as THREE from "three"
import { gsap } from "gsap"
import { Reflector } from "three/addons/objects/Reflector.js"
import { rng, turns, wave } from "./lib/periodic.js"
import { gradientDome } from "./lib/sky.js"
import { PALETTE, createStage, dark, params } from "./lib/stage.js"
import { FEATURED_PAPER, PROFILE } from "../scripts/profile-data.mjs"

const page = { width: Number(params.get("width") ?? 1440), height: Number(params.get("height") ?? 288) }
const loop = Number(params.get("loop") ?? 8)
const scale = Number(params.get("scale") ?? 1)
const STAGE = 207

const root = document.documentElement.style
const set = (name, value) => root.setProperty(name, value)
set("--bg", PALETTE.bg)
set("--text", PALETTE.text)
set("--muted", PALETTE.muted)
set("--faint", PALETTE.faint)
set("--accent", PALETTE.accent)
set("--card", dark ? "linear-gradient(180deg, #162a4d, #0f1a2e)" : "linear-gradient(180deg, #eaf0fa, #f6f8fa)")
set("--card-side", dark ? "#04070d" : "#c3cddd")
set("--border", dark ? "rgba(255,255,255,0.12)" : "rgba(19,41,75,0.16)")
set("--gloss", dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)")
set("--shine", dark ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.5)")
set("--accent-top", dark ? "#ff9a76" : "#f06a4a")
set("--accent-bottom", dark ? "#f0663a" : "#d43f1e")
set("--accent-side", dark ? "#7f3d26" : "#742513")
set("--green-top", dark ? "#5fd070" : "#2f9b4a")
set("--green-bottom", dark ? "#2f9d43" : "#186b2e")
set("--green-side", dark ? "#1f5a28" : "#0d4019")
set("--blue-top", dark ? "#7bb8ff" : "#2f83ea")
set("--blue-bottom", dark ? "#3f8ff0" : "#0b57c2")
set("--blue-side", dark ? "#1f4f8c" : "#083b7a")
set("--tag", dark ? "#b9c8e2" : "#4c5b73")

// Text from the profile data; the title wraps at the same width as the old SVG card.
const wrap = (text, maxChars) => text.split(" ").reduce((lines, word) => {
  const last = lines[lines.length - 1]
  if (last && (last + " " + word).length <= maxChars) lines[lines.length - 1] = `${last} ${word}`
  else lines.push(word)
  return lines
}, [])
const title = document.getElementById("title")
wrap(FEATURED_PAPER.title, 46).forEach((line, i) => {
  if (i) title.append(document.createElement("br"))
  title.append(line)
})
const authors = document.getElementById("authors")
FEATURED_PAPER.authors.split(", ").forEach((author, i) => {
  if (i) authors.append(", ")
  if (author === PROFILE.name) {
    const owner = document.createElement("b")
    owner.textContent = author
    authors.append(owner)
  } else authors.append(author)
})
document.getElementById("venue").textContent = FEATURED_PAPER.venue
document.getElementById("arxiv").textContent = FEATURED_PAPER.arxiv
document.getElementById("status").textContent = FEATURED_PAPER.status

const stage = createStage({ width: Math.round(STAGE * scale), height: Math.round(STAGE * scale), page, loop, fov: 30, bloom: { strength: dark ? 0.8 : 0.45, radius: 0.6, threshold: 0.9 }, exposure: dark ? 1 : 1.15 })
const { scene, camera } = stage
camera.position.set(0, 0.6, 5.4)
camera.lookAt(0, 0.05, 0)
scene.add(gradientDome(dark ? { top: "#0b1730", mid: "#10224a", horizon: "#16305e" } : { top: "#d6e2f5", mid: "#e4edf9", horizon: "#f0f5fc" }, 60))

// Mirror floor and pedestal.
const floor = new Reflector(new THREE.PlaneGeometry(8, 8), { clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: dark ? "#2b4f8f" : "#a9c4ec" })
floor.rotation.x = -Math.PI / 2
floor.position.y = -1.05
scene.add(floor)
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.24, 64), new THREE.MeshPhysicalMaterial({ color: dark ? "#1d3c72" : "#8fb0e0", metalness: 0.55, roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.2 }))
pedestal.position.y = -0.93
pedestal.receiveShadow = true
pedestal.castShadow = true
scene.add(pedestal)
const inlay = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 64), new THREE.MeshBasicMaterial({ color: dark ? "#7fb6ff" : "#ffffff", toneMapped: false, transparent: true, opacity: dark ? 0.35 : 0.8 }))
inlay.rotation.x = -Math.PI / 2
inlay.position.y = -0.805
scene.add(inlay)

// The crystal: refractive glass with iridescence, its edges traced, a glowing core inside.
const crystal = new THREE.Group()
const glass = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.95, 0),
  new THREE.MeshPhysicalMaterial({ color: "#a9cdff", transmission: 1, thickness: 2, roughness: 0.12, ior: 1.5, iridescence: 0.65, iridescenceIOR: 1.3, clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: "#5b97f0", attenuationDistance: 1.8, envMapIntensity: 1.3 })
)
glass.castShadow = true
crystal.add(glass)
crystal.add(new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: "#e4f0ff", transparent: true, opacity: 0.75 })))
const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), new THREE.MeshBasicMaterial({ color: "#cfe6ff", toneMapped: false }))
crystal.add(core)
crystal.add(new THREE.PointLight("#8fc0ff", 6, 6, 2))
scene.add(crystal)

const spot = new THREE.SpotLight("#ffffff", 70, 20, 0.6, 0.7, 1.5)
spot.position.set(1.6, 4.2, 2.6)
spot.castShadow = true
spot.shadow.mapSize.set(2048, 2048)
scene.add(spot)
const fill = new THREE.DirectionalLight("#9fc4ff", 0.8)
fill.position.set(-3, 1, -2)
scene.add(fill)

// Dust motes drifting in the light.
const random = rng(19)
const motes = Array.from({ length: 50 }, () => ({ x: (random() - 0.5) * 3.2, y: -0.9 + random() * 2.4, z: (random() - 0.5) * 2.4, offset: random(), speed: 1 + Math.floor(random() * 2) }))
const moteGeometry = new THREE.BufferGeometry()
moteGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(motes.length * 3), 3))
const dust = new THREE.Points(moteGeometry, new THREE.PointsMaterial({ color: "#dbe9ff", size: 0.03, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }))
scene.add(dust)

// HTML motion on GSAP timelines that repeat exactly once per loop.
const shimmer = document.querySelector(".shimmer")
gsap.timeline({ repeat: -1 }).fromTo(shimmer, { x: -360 }, { x: 1700, duration: 7, ease: "none" }, 0).set({}, {}, loop)
gsap.timeline({ repeat: -1 }).to("#chevron", { x: 5, duration: 0.8, ease: "power1.inOut", yoyo: true, repeat: 1 }, 0).set({}, {}, 1.6)
gsap.timeline({ repeat: -1 }).to("#dot", { opacity: 0.25, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0).set({}, {}, 1.6)

stage.onFrame(({ phase }) => {
  crystal.rotation.set(0.45 + 0.12 * wave(phase, 1), turns(phase, 1), 0)
  crystal.position.y = 0.22 + 0.12 * wave(phase, 2)
  core.scale.setScalar(0.9 + 0.15 * wave(phase, 4))
  const positions = moteGeometry.attributes.position
  motes.forEach((mote, i) => positions.setXYZ(i, mote.x + 0.12 * wave(phase, mote.speed, mote.offset), mote.y + 0.18 * wave(phase, 1, mote.offset + 0.3), mote.z))
  positions.needsUpdate = true
})
stage.render(0)
stage.ready = true
