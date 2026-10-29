// The night sky of the hero: a dark dome with stars, an aurora, a cratered moon with its halo,
// drifting clouds, moonlight with a cool fill, and two shooting stars per loop.
import * as THREE from "three"
import { rng, wave } from "../periodic.js"
import { effectLayer } from "../stage.js"
import { heightTexture, tileableNoise } from "../textures.js"
import { aurora } from "./aurora.js"
import { cloudLayer } from "./clouds.js"
import { gradientDome } from "./dome.js"
import { glowSprite } from "./glow-sprite.js"
import { shadowCastingLight } from "./lights.js"
import { shootingStars } from "./shooting-stars.js"
import { starField } from "./stars.js"

export function createNightSky({ scene, loop, moonDirection, focus = new THREE.Vector3() }) {
  const dome = gradientDome({ top: "#04060f", mid: "#0e1a36", horizon: "#3a2a4a" })
  scene.add(dome)
  const driftClouds = cloudLayer({ scene, random: rng(23), count: 4, color: "#7d8fb8", opacity: 0.45, sizes: [40, 70], heights: [26, 44] })
  const stars = effectLayer(starField(1400, 300))
  scene.add(stars)
  const curtain = aurora()
  for (const layer of curtain.userData.curtains) effectLayer(layer)
  scene.add(curtain)

  const moonDistance = 250
  const moonPosition = moonDirection.clone().normalize().multiplyScalar(moonDistance)
  const craters = heightTexture(tileableNoise(256, { seed: 9, octaves: 5, period: 5 }), { low: 0.35, high: 0.75 })
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(7, 48, 32),
    new THREE.MeshStandardMaterial({ color: "#e9dfc4", emissive: "#f3e8cc", emissiveIntensity: 1.5, emissiveMap: craters, bumpMap: craters, bumpScale: 1.4, roughness: 1 })
  )
  moon.position.copy(moonPosition)
  scene.add(moon)
  const halo = effectLayer(glowSprite("#dfe6ff", 46, { inner: 0.55 }))
  halo.position.copy(moonPosition)
  scene.add(halo)

  const moonlight = shadowCastingLight({ color: "#c9d8ff", intensity: 4, direction: moonDirection, distance: 80, far: 200, focus })
  scene.add(moonlight)
  scene.add(moonlight.target)
  scene.add(new THREE.HemisphereLight("#4a68a8", "#1a2436", 1.6))
  const fill = new THREE.DirectionalLight("#6f8fd6", 0.9)
  fill.position.set(focus.x - 30, focus.y + 20, focus.z + 60)
  fill.target.position.copy(focus)
  scene.add(fill)
  scene.add(fill.target)

  shootingStars({ scene, loop })

  return {
    dome,
    sunDir: moonDirection.clone().normalize(),
    sunColor: "#d6e2ff",
    update: (phase) => {
      stars.material.uniforms.phase.value = phase
      curtain.userData.curtains.forEach((layer, i) => {
        layer.material.uniforms.phase.value = phase
        layer.material.uniforms.intensity.value = [0.8, 1, 0.45][i] * (0.85 + 0.15 * wave(phase, 2, i * 0.3))
      })
      driftClouds(phase)
    }
  }
}
