// A clear afternoon: deep blue zenith, pale horizon, a high warm sun with crisp shadows and a few
// drifting clouds.
import * as THREE from "three"
import { rng } from "../periodic.js"
import { effectLayer } from "../stage.js"
import { cloudLayer } from "./clouds.js"
import { gradientDome } from "./dome.js"
import { glowSprite } from "./glow-sprite.js"
import { shadowCastingLight } from "./lights.js"

export function createDaySky({ scene, sunDirection, focus = new THREE.Vector3() }) {
  const dome = gradientDome({ top: "#2a6fd6", mid: "#7fb6f2", horizon: "#dcebfa" })
  scene.add(dome)
  const glare = effectLayer(glowSprite("#fff6dc", 60, { inner: 0.8 }))
  glare.position.copy(sunDirection.clone().normalize().multiplyScalar(280))
  scene.add(glare)

  const sun = shadowCastingLight({ color: "#fff1dc", intensity: 3.4, direction: sunDirection, distance: 90, far: 220, focus })
  scene.add(sun)
  scene.add(sun.target)
  scene.add(new THREE.HemisphereLight("#bcd8ff", "#7a6a48", 1.3))
  const driftClouds = cloudLayer({ scene, random: rng(17), count: 6, color: "#ffffff", opacity: 0.95, sizes: [36, 70], heights: [28, 56] })

  return {
    dome,
    sunDir: sunDirection.clone().normalize(),
    sunColor: "#ffe2b8",
    update: driftClouds
  }
}
