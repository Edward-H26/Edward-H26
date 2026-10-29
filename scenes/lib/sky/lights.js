// The key light of a sky: the moon or the sun as a shadow-casting directional light.
import * as THREE from "three"

const SHADOW_MAP_SIZE = 4096
// Half-width of the orthographic shadow camera, enough to cover the island.
const SHADOW_EXTENT = 26

// A directional light `distance` away along `direction`, aimed at `focus`, with its shadow camera
// moved along so the island stays inside it.
export function shadowCastingLight({ color, intensity, direction, distance, far, focus }) {
  const light = new THREE.DirectionalLight(color, intensity)
  light.position.copy(direction.clone().normalize().multiplyScalar(distance))
  light.castShadow = true
  light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)
  Object.assign(light.shadow.camera, { left: -SHADOW_EXTENT, right: SHADOW_EXTENT, top: SHADOW_EXTENT, bottom: -SHADOW_EXTENT, near: 10, far })
  light.shadow.camera.updateProjectionMatrix()
  light.shadow.bias = -0.0004
  light.shadow.normalBias = 0.03
  light.position.add(focus)
  light.target.position.copy(focus)
  return light
}
