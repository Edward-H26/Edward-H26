// A planet with procedural continents, clouds, city lights and an atmosphere, all drawn from
// noise generated at build time.
import * as THREE from "three"
import { rng } from "./periodic.js"
import { normalTexture, tileableNoise } from "./textures.js"

function equirect(width, height, paint) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  const image = ctx.createImageData(width, height)
  paint(image.data)
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

// Samples a tileable noise field with wrap in x (longitude) only.
function sampler(noise) {
  return (u, v) => {
    const size = noise.size
    const x = ((u % 1) + 1) % 1 * size
    const y = Math.max(0, Math.min(size - 1.001, v * size))
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const tx = x - x0
    const ty = y - y0
    const at = (ix, iy) => noise.heights[iy * size + (ix % size)]
    return (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty
  }
}

export function createPlanet({ radius, dark }) {
  const width = 1024
  const height = 512
  const land = sampler(tileableNoise(512, { seed: 7, octaves: 6, period: 4 }))
  const detail = sampler(tileableNoise(512, { seed: 8, octaves: 5, period: 16 }))
  const cities = sampler(tileableNoise(512, { seed: 9, octaves: 4, period: 40 }))
  const deep = new THREE.Color(dark ? "#0a2a5e" : "#1656b0")
  const shallow = new THREE.Color(dark ? "#1f63bd" : "#3d8ce6")
  const lowland = new THREE.Color("#2f6b3f")
  const highland = new THREE.Color("#8d8b62")
  const ice = new THREE.Color("#e8f0f5")
  const scratch = new THREE.Color()
  const heights = new Float32Array(width * height)
  const map = equirect(width, height, (data) => {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const u = x / width
        const v = y / height
        const latitude = Math.abs(v - 0.5) * 2
        const h = land(u, v) * 0.75 + detail(u, v) * 0.25 + Math.pow(latitude, 6) * 0.35
        heights[y * width + x] = h
        const i = (y * width + x) * 4
        if (h < 0.52) scratch.copy(deep).lerp(shallow, Math.max(0, (h - 0.42) / 0.1))
        else scratch.copy(lowland).lerp(highland, Math.min(1, (h - 0.52) / 0.18 + detail(u * 3, v * 3) * 0.3))
        if (latitude > 0.86 || h > 0.78) scratch.lerp(ice, Math.min(1, Math.max((latitude - 0.86) / 0.06, (h - 0.78) / 0.05)))
        data[i] = scratch.r * 255
        data[i + 1] = scratch.g * 255
        data[i + 2] = scratch.b * 255
        data[i + 3] = 255
      }
    }
  })
  map.colorSpace = THREE.SRGBColorSpace
  const roughness = equirect(width, height, (data) => {
    for (let i = 0; i < width * height; i += 1) {
      const rough = heights[i] < 0.52 ? 70 : 230
      data[i * 4] = rough
      data[i * 4 + 1] = rough
      data[i * 4 + 2] = rough
      data[i * 4 + 3] = 255
    }
  })
  const lights = equirect(width, height, (data) => {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x
        const onLand = heights[i] >= 0.52 && heights[i] < 0.72
        const glow = onLand && cities(x / width, y / height) > 0.6 ? 255 : 0
        data[i * 4] = glow
        data[i * 4 + 1] = glow * 0.78
        data[i * 4 + 2] = glow * 0.45
        data[i * 4 + 3] = 255
      }
    }
  })
  const relief = normalTexture(tileableNoise(512, { seed: 8, octaves: 5, period: 16 }), 1.6)

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 128, 96),
    new THREE.MeshStandardMaterial({ map, roughnessMap: roughness, roughness: 1, metalness: 0.05, normalMap: relief, normalScale: new THREE.Vector2(0.35, 0.35), emissiveMap: lights, emissive: "#ffb347", emissiveIntensity: dark ? 0.9 : 0.25 })
  )
  planet.castShadow = true
  planet.receiveShadow = true

  const cloudNoise = tileableNoise(512, { seed: 15, octaves: 6, period: 6 })
  const cloudMap = equirect(512, 256, (data) => {
    const sample = sampler(cloudNoise)
    for (let y = 0; y < 256; y += 1) {
      for (let x = 0; x < 512; x += 1) {
        const n = sample(x / 512, y / 256)
        const alpha = Math.max(0, Math.min(1, (n - 0.5) * 3.2)) * 255
        const i = (y * 512 + x) * 4
        data[i] = 255
        data[i + 1] = 255
        data[i + 2] = 255
        data[i + 3] = alpha
      }
    }
  })
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.018, 96, 72), new THREE.MeshStandardMaterial({ map: cloudMap, transparent: true, depthWrite: false, roughness: 1, opacity: 0.9 }))
  clouds.castShadow = true

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.14, 96, 72),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { color: { value: new THREE.Color(dark ? "#4ea8ff" : "#63b2ff") }, strength: { value: dark ? 0.7 : 0.6 } },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 color; uniform float strength; varying vec3 vNormal;
        void main() {
          float rim = pow(clamp(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.6) * strength;
          gl_FragColor = vec4(color * rim, rim);
        }
      `
    })
  )
  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.004, 96, 72),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { color: { value: new THREE.Color("#8fc6ff") } },
      vertexShader: /* glsl */ `
        varying vec3 vNormal; varying vec3 vView;
        void main() { vNormal = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vView = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 color; varying vec3 vNormal; varying vec3 vView;
        void main() {
          float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.5) * 0.5;
          gl_FragColor = vec4(color * rim, rim);
        }
      `
    })
  )

  const group = new THREE.Group()
  group.add(planet, clouds, haze, atmosphere)
  group.userData = { planet, clouds }
  return group
}

// Faint dust and distant stars around the planet.
export function createSpaceDust(count, spread, seed = 3) {
  const random = rng(seed)
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (random() - 0.5) * spread
    positions[i * 3 + 1] = (random() - 0.5) * spread * 0.6
    positions[i * 3 + 2] = (random() - 0.5) * spread * 0.5 - 2
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: "#9fc4ff", size: 0.04, transparent: true, opacity: 0.55, depthWrite: false }))
}
