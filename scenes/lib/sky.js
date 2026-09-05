// Skies for the hero: a night dome with stars, aurora, moon and shooting stars, or the physical
// daytime sky from three.js with drifting clouds and a sun.
import * as THREE from "three"
import { gsap } from "gsap"
import { TAU, rng, wave } from "./periodic.js"
import { effectLayer } from "./stage.js"
import { cloudTexture, heightTexture, tileableNoise } from "./textures.js"

const simplex = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`

export function gradientDome({ top, mid, horizon, radius = 320 }) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, horizon: { value: new THREE.Color(horizon) } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 top; uniform vec3 mid; uniform vec3 horizon;
      varying vec3 vDir;
      void main() {
        float y = max(vDir.y, 0.0);
        vec3 col = mix(horizon, mid, smoothstep(0.0, 0.18, y));
        col = mix(col, top, smoothstep(0.18, 0.75, y));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  })
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), material)
  dome.renderOrder = -10
  return dome
}

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

// An aurora curtain: long ribbons that fold slowly, fine vertical rays, a bright green lower edge
// that feathers into violet at the top. Two curtains at different depths give it volume.
function auroraCurtain({ seed, width, height, intensity }) {
  const geometry = new THREE.PlaneGeometry(width, height, 96, 12)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { phase: { value: 0 }, seed: { value: seed }, colorA: { value: new THREE.Color("#35f0a0") }, colorB: { value: new THREE.Color("#2fd0d8") }, colorC: { value: new THREE.Color("#a85cff") }, intensity: { value: intensity } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      ${simplex}
      uniform float phase; uniform float seed; uniform vec3 colorA; uniform vec3 colorB; uniform vec3 colorC; uniform float intensity;
      varying vec2 vUv;
      #define TAU 6.28318530718
      void main() {
        float sx = sin(TAU * phase);
        float cx = cos(TAU * phase);
        // Ribbons: low-frequency noise stretched along x, folding as the loop turns.
        float fold = snoise(vec2(vUv.x * 2.6 + seed + 0.5 * sx, 0.3 * cx)) * 0.5;
        float ribbon = snoise(vec2(vUv.x * 5.0 + seed * 3.0 + 0.7 * cx, vUv.y * 0.6 + fold));
        float ribbon2 = snoise(vec2(vUv.x * 11.0 - seed - 0.9 * sx, vUv.y * 1.2 - 0.4 * cx));
        float bands = clamp(0.55 + 0.5 * ribbon + 0.25 * ribbon2, 0.0, 1.0);
        // Rays: fine vertical striations that drift sideways.
        float rays = 0.55 + 0.45 * pow(0.5 + 0.5 * sin(vUv.x * 520.0 + ribbon * 30.0 + sx * 3.0), 3.0);
        rays = mix(1.0, rays, smoothstep(0.05, 0.4, vUv.y));
        // Curtain: a crisp bright lower edge that thins upward.
        float base = 0.1 + 0.05 * ribbon;
        float curtain = smoothstep(base - 0.03, base + 0.06, vUv.y) * pow(clamp(1.0 - (vUv.y - base) / (1.0 - base), 0.0, 1.0), 1.7);
        float edge = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
        float a = pow(bands, 1.6) * curtain * edge * rays * intensity;
        vec3 col = mix(colorA, colorB, smoothstep(0.1, 0.45, vUv.y));
        col = mix(col, colorC, smoothstep(0.4, 0.95, vUv.y));
        gl_FragColor = vec4(col * a * 1.8, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  })
  return new THREE.Mesh(geometry, material)
}

function aurora() {
  const group = new THREE.Group()
  const back = auroraCurtain({ seed: 1.7, width: 520, height: 130, intensity: 0.75 })
  back.position.set(30, 84, -290)
  back.rotation.x = 0.22
  group.add(back)
  const front = auroraCurtain({ seed: 4.3, width: 420, height: 100, intensity: 0.95 })
  front.position.set(-20, 62, -230)
  front.rotation.x = 0.18
  group.add(front)
  group.userData.curtains = [back, front]
  return group
}

function glowSprite(color, size, { inner = 0.85, outer = 0 } = {}) {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, `rgba(255,255,255,${inner})`)
  gradient.addColorStop(0.35, `rgba(255,255,255,${inner * 0.35})`)
  gradient.addColorStop(1, `rgba(255,255,255,${outer})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  const texture = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
  sprite.scale.setScalar(size)
  return sprite
}

function shootingStar() {
  const geometry = new THREE.PlaneGeometry(9, 0.22)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { opacity: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float opacity; varying vec2 vUv;
      void main() {
        float a = pow(vUv.x, 3.0) * (1.0 - smoothstep(0.3, 0.5, abs(vUv.y - 0.5))) * opacity;
        gl_FragColor = vec4(vec3(1.0) * a, a);
      }
    `
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.visible = false
  return mesh
}

function cloudLayer({ scene, random, count, color, opacity, sizes, heights }) {
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
  const moon = new THREE.Mesh(new THREE.SphereGeometry(7, 48, 32), new THREE.MeshStandardMaterial({ color: "#e9dfc4", emissive: "#f3e8cc", emissiveIntensity: 1.5, emissiveMap: craters, bumpMap: craters, bumpScale: 1.4, roughness: 1 }))
  moon.position.copy(moonPosition)
  scene.add(moon)
  const halo = effectLayer(glowSprite("#dfe6ff", 46, { inner: 0.55 }))
  halo.position.copy(moonPosition)
  scene.add(halo)

  const moonlight = new THREE.DirectionalLight("#c9d8ff", 4)
  moonlight.position.copy(moonDirection.clone().normalize().multiplyScalar(80))
  moonlight.castShadow = true
  moonlight.shadow.mapSize.set(4096, 4096)
  Object.assign(moonlight.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 10, far: 200 })
  moonlight.shadow.camera.updateProjectionMatrix()
  moonlight.shadow.bias = -0.0004
  moonlight.shadow.normalBias = 0.03
  moonlight.position.add(focus)
  moonlight.target.position.copy(focus)
  scene.add(moonlight)
  scene.add(moonlight.target)
  scene.add(new THREE.HemisphereLight("#4a68a8", "#1a2436", 1.6))
  const fill = new THREE.DirectionalLight("#6f8fd6", 0.9)
  fill.position.set(focus.x - 30, focus.y + 20, focus.z + 60)
  fill.target.position.copy(focus)
  scene.add(fill)
  scene.add(fill.target)

  // Two shooting stars per loop, on a timeline the capture script scrubs.
  const stars2 = [shootingStar(), shootingStar()]
  for (const star of stars2) scene.add(effectLayer(star))
  const timeline = gsap.timeline({ repeat: -1 })
  ;[[2.4, new THREE.Vector3(120, 150, -240), new THREE.Vector3(60, 105, -230)], [8.1, new THREE.Vector3(-30, 160, -250), new THREE.Vector3(-95, 118, -240)]].forEach(([start, from, to], i) => {
    const star = stars2[i]
    star.lookAt(0, 0, 0)
    const angle = Math.atan2(to.y - from.y, to.x - from.x)
    star.rotation.z = angle
    star.position.copy(from)
    timeline.set(star, { visible: true }, start)
    timeline.fromTo(star.position, { x: from.x, y: from.y, z: from.z }, { x: to.x, y: to.y, z: to.z, duration: 0.9, ease: "power2.in" }, start)
    timeline.fromTo(star.material.uniforms.opacity, { value: 0 }, { value: 1, duration: 0.3, ease: "power1.out" }, start)
    timeline.to(star.material.uniforms.opacity, { value: 0, duration: 0.45, ease: "power1.in" }, start + 0.45)
    timeline.set(star, { visible: false }, start + 0.95)
  })
  timeline.set({}, {}, loop)

  return {
    dome,
    sunDir: moonDirection.clone().normalize(),
    sunColor: "#d6e2ff",
    update: (phase) => {
      stars.material.uniforms.phase.value = phase
      curtain.userData.curtains.forEach((layer, i) => {
        layer.material.uniforms.phase.value = phase
        layer.material.uniforms.intensity.value = (i ? 0.95 : 0.75) * (0.85 + 0.15 * wave(phase, 2, i * 0.3))
      })
      driftClouds(phase)
    }
  }
}

// A clear afternoon: deep blue zenith, pale horizon, a high warm sun with crisp shadows.
export function createDaySky({ scene, sunDirection, focus = new THREE.Vector3() }) {
  const dome = gradientDome({ top: "#2a6fd6", mid: "#7fb6f2", horizon: "#dcebfa" })
  scene.add(dome)
  const glare = effectLayer(glowSprite("#fff6dc", 60, { inner: 0.8 }))
  glare.position.copy(sunDirection.clone().normalize().multiplyScalar(280))
  scene.add(glare)

  const sun = new THREE.DirectionalLight("#fff1dc", 3.4)
  sun.position.copy(sunDirection.clone().normalize().multiplyScalar(90))
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 10, far: 220 })
  sun.shadow.camera.updateProjectionMatrix()
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.03
  sun.position.add(focus)
  sun.target.position.copy(focus)
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
