// Low mist hugging the water around the island: a noise-textured sheet that drifts and breathes.
import * as THREE from "three"
import { effectLayer } from "../stage.js"
import { heightTexture, tileableNoise } from "../textures.js"

export function mist({ dark }) {
  const geometry = new THREE.PlaneGeometry(90, 90, 1, 1)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      phase: { value: 0 },
      noise: { value: heightTexture(tileableNoise(256, { seed: 77, octaves: 5, period: 3 })) },
      color: { value: new THREE.Color(dark ? "#8ea3c9" : "#ffffff") },
      strength: { value: dark ? 0.22 : 0.3 }
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float phase; uniform sampler2D noise; uniform vec3 color; uniform float strength; varying vec2 vUv;
      #define TAU 6.28318530718
      void main() {
        vec2 drift = vec2(phase * 0.5, 0.06 * sin(TAU * phase));
        float n = texture2D(noise, vUv * 2.2 + drift).r * 0.6 + texture2D(noise, vUv * 5.0 - drift * 1.5).r * 0.4;
        float ring = smoothstep(0.08, 0.28, length(vUv - 0.5)) * (1.0 - smoothstep(0.32, 0.5, length(vUv - 0.5)));
        float a = smoothstep(0.42, 0.72, n) * ring * strength;
        gl_FragColor = vec4(color, a);
      }
    `
  })
  const mesh = effectLayer(new THREE.Mesh(geometry, material))
  mesh.position.y = 0.9
  mesh.renderOrder = 3
  mesh.userData.update = (phase) => {
    material.uniforms.phase.value = phase
  }
  return mesh
}
