// Skies for the hero: a night dome with stars, aurora, moon and shooting stars, or the physical
// daytime sky from three.js with drifting clouds and a sun.
import * as THREE from "three"
import { gsap } from "gsap"
import { TAU, rng, wave } from "./periodic.js"
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

function aurora() {
  const geometry = new THREE.PlaneGeometry(440, 96, 96, 12)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { phase: { value: 0 }, colorA: { value: new THREE.Color("#2fe39a") }, colorB: { value: new THREE.Color("#3ab8ff") }, colorC: { value: new THREE.Color("#8f6bff") }, intensity: { value: 0.9 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      ${simplex}
      uniform float phase; uniform vec3 colorA; uniform vec3 colorB; uniform vec3 colorC; uniform float intensity;
      varying vec2 vUv;
      #define TAU 6.28318530718
      void main() {
        float sx = sin(TAU * phase);
        float cx = cos(TAU * phase);
        float n1 = snoise(vec2(vUv.x * 7.0 + 0.9 * sx, vUv.y * 0.9 + 0.4 * cx));
        float n2 = snoise(vec2(vUv.x * 18.0 - 1.1 * cx, vUv.y * 1.8 + 0.5 * sin(TAU * 2.0 * phase)));
        float bands = clamp(0.45 + 0.55 * n1 + 0.25 * n2, 0.0, 1.0);
        float curtain = smoothstep(0.02, 0.16, vUv.y) * (1.0 - smoothstep(0.3, 0.95, vUv.y));
        float edge = smoothstep(0.0, 0.14, vUv.x) * (1.0 - smoothstep(0.86, 1.0, vUv.x));
        float rays = 0.7 + 0.3 * sin(vUv.x * 220.0 + n1 * 14.0 + n2 * 6.0);
        float a = pow(bands, 1.8) * curtain * edge * rays * intensity;
        vec3 col = mix(colorA, colorB, clamp(vUv.y * 1.8, 0.0, 1.0));
        col = mix(col, colorC, smoothstep(0.55, 1.0, vUv.y));
        gl_FragColor = vec4(col * a * 1.6, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, 66, -240)
  mesh.rotation.x = 0.2
  return mesh
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

export function createNightSky({ scene, loop, moonDirection, focus = new THREE.Vector3() }) {
  const dome = gradientDome({ top: "#04060f", mid: "#0e1a36", horizon: "#3a2a4a" })
  scene.add(dome)
  const stars = starField(1400, 300)
  scene.add(stars)
  const curtain = aurora()
  scene.add(curtain)

  const moonDistance = 250
  const moonPosition = moonDirection.clone().normalize().multiplyScalar(moonDistance)
  const craters = heightTexture(tileableNoise(256, { seed: 9, octaves: 5, period: 5 }), { low: 0.35, high: 0.75 })
  const moon = new THREE.Mesh(new THREE.SphereGeometry(7, 48, 32), new THREE.MeshStandardMaterial({ color: "#e9dfc4", emissive: "#f3e8cc", emissiveIntensity: 1.5, emissiveMap: craters, bumpMap: craters, bumpScale: 1.4, roughness: 1 }))
  moon.position.copy(moonPosition)
  scene.add(moon)
  const halo = glowSprite("#dfe6ff", 46, { inner: 0.55 })
  halo.position.copy(moonPosition)
  scene.add(halo)

  const moonlight = new THREE.DirectionalLight("#c9d8ff", 0.9)
  moonlight.position.copy(moonDirection.clone().normalize().multiplyScalar(80))
  moonlight.castShadow = true
  moonlight.shadow.mapSize.set(2048, 2048)
  Object.assign(moonlight.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 10, far: 200 })
  moonlight.shadow.camera.updateProjectionMatrix()
  moonlight.shadow.bias = -0.0004
  moonlight.shadow.normalBias = 0.03
  moonlight.position.add(focus)
  moonlight.target.position.copy(focus)
  scene.add(moonlight)
  scene.add(moonlight.target)
  scene.add(new THREE.HemisphereLight("#22365f", "#0a1220", 0.35))

  // Two shooting stars per loop, on a timeline the capture script scrubs.
  const stars2 = [shootingStar(), shootingStar()]
  for (const star of stars2) scene.add(star)
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
    sunDir: moonDirection.clone().normalize(),
    sunColor: "#d6e2ff",
    update: (phase) => {
      stars.material.uniforms.phase.value = phase
      curtain.material.uniforms.phase.value = phase
      curtain.material.uniforms.intensity.value = 0.85 + 0.15 * wave(phase, 2)
    }
  }
}

export function createDaySky({ scene, sunDirection, focus = new THREE.Vector3() }) {
  scene.add(gradientDome({ top: "#3d8ce6", mid: "#9ccaf7", horizon: "#eaf3fc" }))
  const glare = glowSprite("#fff1c0", 30, { inner: 0.7 })
  glare.position.copy(sunDirection.clone().normalize().multiplyScalar(280))
  scene.add(glare)

  const sun = new THREE.DirectionalLight("#fff0d2", 2.4)
  sun.position.copy(sunDirection.clone().normalize().multiplyScalar(90))
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 10, far: 220 })
  sun.shadow.camera.updateProjectionMatrix()
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.03
  sun.position.add(focus)
  sun.target.position.copy(focus)
  scene.add(sun)
  scene.add(sun.target)
  scene.add(new THREE.HemisphereLight("#bcd6ff", "#5d7a4c", 0.6))

  const random = rng(17)
  const clouds = Array.from({ length: 4 }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(256, 30 + i), transparent: true, depthWrite: false, opacity: 0.8 }))
    const width = 18 + random() * 14
    sprite.scale.set(width, width * 0.42, 1)
    sprite.userData = { x: -120 + i * 85 + random() * 30, y: 44 + random() * 26, z: -230 - random() * 40, offset: random(), drift: 4 + random() * 4 }
    sprite.position.set(sprite.userData.x, sprite.userData.y, sprite.userData.z)
    scene.add(sprite)
    return sprite
  })

  return {
    sunDir: sunDirection.clone().normalize(),
    sunColor: "#fff2cf",
    update: (phase) => {
      for (const cloud of clouds) cloud.position.x = cloud.userData.x + cloud.userData.drift * wave(phase, 1, cloud.userData.offset)
    }
  }
}
