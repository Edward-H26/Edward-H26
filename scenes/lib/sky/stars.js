// A hemisphere of twinkling point stars, denser near the zenith.
import * as THREE from "three"
import { TAU, rng } from "../periodic.js"

export function starField(count, radius, { seed = 5, minElevation = 0.04 } = {}) {
  const random = rng(seed)
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const rates = new Float32Array(count)
  const offsets = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    const azimuth = random() * TAU
    const elevation = minElevation + Math.pow(random(), 0.7) * (Math.PI / 2 - minElevation)
    positions[i * 3] = radius * Math.cos(elevation) * Math.cos(azimuth)
    positions[i * 3 + 1] = radius * Math.sin(elevation)
    positions[i * 3 + 2] = radius * Math.cos(elevation) * Math.sin(azimuth)
    sizes[i] = 1.2 + Math.pow(random(), 3) * 3.4
    rates[i] = 5 + Math.floor(random() * 12)
    offsets[i] = random()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute("rate", new THREE.BufferAttribute(rates, 1))
  geometry.setAttribute("offset", new THREE.BufferAttribute(offsets, 1))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { phase: { value: 0 }, pixelRatio: { value: 2 } },
    vertexShader: /* glsl */ `
      attribute float size; attribute float rate; attribute float offset;
      uniform float phase; uniform float pixelRatio;
      varying float vAlpha;
      void main() {
        float twinkle = 0.55 + 0.45 * sin(6.28318 * (phase * rate + offset));
        vAlpha = twinkle;
        gl_PointSize = size * pixelRatio * (0.7 + 0.3 * twinkle);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.2, d) * vAlpha;
        gl_FragColor = vec4(vec3(0.86, 0.91, 1.0) * a, a);
      }
    `
  })
  return new THREE.Points(geometry, material)
}
