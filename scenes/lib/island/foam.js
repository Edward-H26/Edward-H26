// Foam where the cliffs meet the water: a ribbon along the coastline with drifting noise.
import * as THREE from "three"
import { TAU } from "../periodic.js"
import { effectLayer } from "../stage.js"
import { heightTexture, tileableNoise } from "../textures.js"
import { RADIUS, islandHeight } from "./terrain.js"

export function foamRing() {
  const segments = 200
  const vertices = []
  const uvs = []
  const indices = []
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * TAU
    let low = RADIUS * 0.6
    let high = RADIUS * 1.5
    for (let step = 0; step < 24; step += 1) {
      const mid = (low + high) / 2
      if (islandHeight(Math.cos(angle) * mid, Math.sin(angle) * mid) > 0) low = mid
      else high = mid
    }
    for (const [offset, v] of [
      [-0.5, 0],
      [1.4, 1]
    ]) {
      const r = low + offset
      vertices.push(Math.cos(angle) * r, 0.05, Math.sin(angle) * r)
      uvs.push(i / segments, v)
    }
    if (i > 0) {
      const b = i * 2
      indices.push(b - 2, b, b - 1, b - 1, b, b + 1)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { phase: { value: 0 }, noise: { value: heightTexture(tileableNoise(256, { seed: 51, octaves: 4, period: 8 })) } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float phase; uniform sampler2D noise; varying vec2 vUv;
      void main() {
        float n1 = texture2D(noise, vec2(vUv.x * 8.0 + phase, vUv.y * 0.5)).r;
        float n2 = texture2D(noise, vec2(vUv.x * 15.0 - phase * 2.0, vUv.y * 0.8 + 0.3)).r;
        float band = (1.0 - smoothstep(0.0, 1.0, vUv.y)) * smoothstep(0.0, 0.12, vUv.y);
        float a = smoothstep(0.35, 0.75, n1 * 0.6 + n2 * 0.5) * band * 0.8;
        gl_FragColor = vec4(vec3(0.95, 0.97, 1.0), a);
      }
    `
  })
  const mesh = effectLayer(new THREE.Mesh(geometry, material))
  mesh.renderOrder = 2
  mesh.userData.update = (phase) => {
    material.uniforms.phase.value = phase
  }
  return mesh
}
