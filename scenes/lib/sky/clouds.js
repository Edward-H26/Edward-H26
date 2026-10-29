// Drifting cloud sprites in the distance; returns the updater that moves them with the phase.
import * as THREE from "three"
import { wave } from "../periodic.js"
import { effectLayer } from "../stage.js"
import { cloudTexture } from "../textures.js"

export function cloudLayer({ scene, random, count, color, opacity, sizes, heights }) {
  const clouds = Array.from({ length: count }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(512, 30 + i), color, transparent: true, depthWrite: false, opacity, fog: false }))
    const width = sizes[0] + random() * (sizes[1] - sizes[0])
    sprite.scale.set(width, width * 0.42, 1)
    sprite.userData = { x: -150 + (i / count) * 300 + random() * 40, y: heights[0] + random() * (heights[1] - heights[0]), z: -150 - random() * 60, offset: random(), drift: 4 + random() * 5 }
    sprite.position.set(sprite.userData.x, sprite.userData.y, sprite.userData.z)
    scene.add(effectLayer(sprite))
    return sprite
  })
  return (phase) => {
    for (const cloud of clouds) cloud.position.x = cloud.userData.x + cloud.userData.drift * wave(phase, 1, cloud.userData.offset)
  }
}
