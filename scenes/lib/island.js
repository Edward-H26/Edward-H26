// The hero island: a sculpted height field with grass, rock and sand, a road, houses with lit
// windows, a lighthouse with a sweeping beam, a windmill, trees, rocks, a moored sailboat and
// circling birds. Everything animated is a function of the loop phase.
import * as THREE from "three"
import { TAU, flicker, rng, turns, wave } from "./periodic.js"
import { heightTexture, normalTexture, tileableNoise } from "./textures.js"

const RADIUS = 9.5
const PLATEAU = 2.3
const noise = tileableNoise(256, { seed: 4, octaves: 5, period: 4 })

function sampleNoise(x, z, scale = 1 / 26) {
  const size = noise.size
  const u = ((((x * scale) % 1) + 1) % 1) * size
  const v = ((((z * scale) % 1) + 1) % 1) * size
  const x0 = Math.floor(u)
  const y0 = Math.floor(v)
  const tx = u - x0
  const ty = v - y0
  const at = (ix, iy) => noise.heights[((iy + size) % size) * size + ((ix + size) % size)]
  return (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty
}

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function islandHeight(x, z) {
  const angle = Math.atan2(z, x)
  const coast = 1 + 0.09 * Math.sin(angle * 3 + 0.6) + 0.05 * Math.sin(angle * 7 + 2.1) + 0.03 * Math.sin(angle * 11)
  const r = Math.hypot(x, z * 1.3) / (RADIUS * coast)
  const hills = (sampleNoise(x, z) - 0.5) * 1.3 + (sampleNoise(x + 40, z + 40, 1 / 9) - 0.5) * 0.35
  const top = PLATEAU + hills * smoothstep(1.0, 0.6, r)
  const cliff = Math.pow(smoothstep(0.8, 1.04, r), 1.4)
  const band = smoothstep(0.72, 0.9, r) * (1 - smoothstep(1.02, 1.12, r))
  const rockiness = ((sampleNoise(x + 90, z - 30, 1 / 5) - 0.5) * 0.7 + (sampleNoise(x - 60, z + 80, 1 / 1.6) - 0.5) * 0.35) * band
  return top - (PLATEAU + 4.5) * cliff + rockiness - Math.max(0, r - 1.04) * 5
}

function terrain(dark) {
  const span = RADIUS * 2 * 1.35
  const geometry = new THREE.PlaneGeometry(span, span, 200, 200)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i += 1) position.setY(i, islandHeight(position.getX(i), position.getZ(i)))
  geometry.computeVertexNormals()
  const normal = geometry.attributes.normal
  const colors = new Float32Array(position.count * 3)
  const grass = new THREE.Color(dark ? "#2f8a4c" : "#48b062")
  const grassLight = new THREE.Color(dark ? "#4aa864" : "#6fcf7e")
  const rock = new THREE.Color("#6b4a2b")
  const rockDark = new THREE.Color("#3f2a15")
  const sand = new THREE.Color("#d8c79d")
  const scratch = new THREE.Color()
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const slope = 1 - normal.getY(i)
    const mottle = sampleNoise(x * 3, z * 3, 1 / 7)
    scratch.copy(grass).lerp(grassLight, mottle)
    const rockMix = smoothstep(0.12, 0.35, slope) + smoothstep(1.4, 0.4, y)
    scratch.lerp(rock, Math.min(1, rockMix))
    const strata = 0.5 + 0.5 * Math.sin(y * 9 + sampleNoise(x, z, 1 / 3) * 4)
    scratch.lerp(rockDark, (smoothstep(0.5, 1.4, slope) * 0.5 + strata * 0.3) * Math.min(1, rockMix))
    scratch.lerp(sand, smoothstep(0.9, 0.25, y) * smoothstep(0.3, 0.05, slope) * (y > -0.3 ? 1 : 0))
    colors[i * 3] = scratch.r
    colors[i * 3 + 1] = scratch.g
    colors[i * 3 + 2] = scratch.b
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  // Fine grain comes from tileable noise: a speckle map multiplied into the vertex colours and a
  // normal map that turns the cliff faces craggy under the key light.
  const detail = heightTexture(tileableNoise(256, { seed: 12, octaves: 5, period: 8 }), { low: 0.1, high: 1.1 })
  detail.repeat.set(14, 14)
  const bumps = normalTexture(tileableNoise(256, { seed: 33, octaves: 5, period: 6 }), 3)
  bumps.repeat.set(9, 9)
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, map: detail, normalMap: bumps, normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.95, metalness: 0 }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// Foam where the cliffs meet the water: a ribbon along the coastline with drifting noise.
function foamRing() {
  const segments = 160
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
    for (const [offset, v] of [[-0.35, 0], [0.9, 1]]) {
      const r = low + offset
      vertices.push(Math.cos(angle) * r, 0.04, Math.sin(angle) * r)
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
        float n1 = texture2D(noise, vec2(vUv.x * 6.0 + phase, vUv.y * 0.5)).r;
        float n2 = texture2D(noise, vec2(vUv.x * 11.0 - phase * 2.0, vUv.y * 0.8 + 0.3)).r;
        float band = (1.0 - smoothstep(0.0, 1.0, vUv.y)) * smoothstep(0.0, 0.12, vUv.y);
        float a = smoothstep(0.35, 0.75, n1 * 0.6 + n2 * 0.5) * band * 0.85;
        gl_FragColor = vec4(vec3(0.95, 0.97, 1.0), a);
      }
    `
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.renderOrder = 2
  mesh.userData.update = (phase) => {
    material.uniforms.phase.value = phase
  }
  return mesh
}

function road() {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-8.6, 0, 1.6), new THREE.Vector3(-4.5, 0, 0.2), new THREE.Vector3(0.5, 0, 1.2), new THREE.Vector3(4.6, 0, -0.9), new THREE.Vector3(8.4, 0, 0.4)])
  const samples = 120
  const width = 0.42
  const vertices = []
  const indices = []
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples
    const p = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width)
    for (const s of [-1, 1]) {
      const x = p.x + side.x * s
      const z = p.z + side.z * s
      vertices.push(x, islandHeight(x, z) + 0.05, z)
    }
    if (i > 0) {
      const b = i * 2
      indices.push(b - 2, b - 1, b, b - 1, b + 1, b)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: "#d9d0bd", roughness: 1, side: THREE.DoubleSide }))
  mesh.receiveShadow = true
  return mesh
}

const shadowed = (mesh) => {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function house({ dark, seed }) {
  const group = new THREE.Group()
  const wall = new THREE.MeshStandardMaterial({ color: "#efe4cf", roughness: 0.85 })
  const body = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.05, 1.25), wall))
  body.position.y = 0.52
  group.add(body)
  const gable = new THREE.Shape([new THREE.Vector2(-0.95, 0), new THREE.Vector2(0.95, 0), new THREE.Vector2(0, 0.62)])
  const roof = shadowed(new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: 1.5, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: "#b8422a", roughness: 0.8 })))
  roof.position.set(0, 1.05, -0.75)
  group.add(roof)
  const glass = new THREE.MeshStandardMaterial({ color: dark ? "#ffd36b" : "#cfe6ff", emissive: dark ? "#ffb347" : "#000000", emissiveIntensity: dark ? 1.6 : 0, roughness: 0.3 })
  const windows = [-0.42, 0.42].map((x) => {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.32), glass)
    pane.position.set(x, 0.58, 0.63)
    group.add(pane)
    return pane
  })
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), new THREE.MeshStandardMaterial({ color: "#5b3a1a", roughness: 0.9 }))
  door.position.set(0, 0.25, 0.63)
  group.add(door)
  const chimney = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), new THREE.MeshStandardMaterial({ color: "#8a7a6a", roughness: 0.95 })))
  chimney.position.set(0.5, 1.45, -0.3)
  group.add(chimney)
  group.userData.update = (phase) => {
    if (dark) glass.emissiveIntensity = 1.1 + 0.9 * flicker(phase, seed)
  }
  group.userData.windows = windows
  return group
}

function lighthouse({ dark }) {
  const group = new THREE.Group()
  const bands = [["#f4efe6", 0.9], ["#c9302c", 0.55], ["#f4efe6", 0.9], ["#c9302c", 0.55], ["#f4efe6", 0.7]]
  let y = 0
  let radius = 0.6
  for (const [color, height] of bands) {
    const nextRadius = radius - 0.035
    const segment = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(nextRadius, radius, height, 28), new THREE.MeshStandardMaterial({ color, roughness: 0.7 })))
    segment.position.y = y + height / 2
    group.add(segment)
    y += height
    radius = nextRadius
  }
  const gallery = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.22, 28), new THREE.MeshStandardMaterial({ color: "#2a2f3a", roughness: 0.6, metalness: 0.3 })))
  gallery.position.y = y + 0.11
  group.add(gallery)
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 20), new THREE.MeshStandardMaterial({ color: "#fff2b0", emissive: "#ffe9a0", emissiveIntensity: dark ? 2.6 : 0.6, roughness: 0.2 }))
  lantern.position.y = y + 0.22 + 0.25
  group.add(lantern)
  const roof = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.5, 20), new THREE.MeshStandardMaterial({ color: "#2a2f3a", roughness: 0.6 })))
  roof.position.y = y + 0.22 + 0.5 + 0.25
  group.add(roof)
  const beamGeometry = new THREE.ConeGeometry(2.6, 22, 40, 1, true)
  beamGeometry.translate(0, -11, 0)
  beamGeometry.rotateX(-Math.PI / 2)
  // Pure one-plus-one blending: the beam only ever adds light, and its alpha never feeds the blend.
  const beam = new THREE.Mesh(
    beamGeometry,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: { strength: { value: dark ? 0.5 : 0.12 }, color: { value: new THREE.Color("#fff3c4") } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float strength; uniform vec3 color; varying vec2 vUv;
        void main() {
          float along = clamp(vUv.y, 0.0, 1.0);
          along = along * along;
          gl_FragColor = vec4(color * along * strength, 1.0);
        }
      `
    })
  )
  beam.position.y = lantern.position.y
  group.add(beam)
  if (dark) {
    const light = new THREE.PointLight("#ffd58a", 5, 11, 2)
    light.position.y = lantern.position.y
    group.add(light)
  }
  group.userData.update = (phase) => {
    beam.rotation.y = turns(phase, 2)
  }
  return group
}

function windmill() {
  const group = new THREE.Group()
  const tower = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.52, 2.6, 24), new THREE.MeshStandardMaterial({ color: "#e8dcc6", roughness: 0.85 })))
  tower.position.y = 1.3
  group.add(tower)
  const cap = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.55, 24), new THREE.MeshStandardMaterial({ color: "#8f2f1d", roughness: 0.8 })))
  cap.position.y = 2.6 + 0.27
  group.add(cap)
  const hub = new THREE.Group()
  hub.position.set(0, 2.45, 0.42)
  const bladeMaterial = new THREE.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.8, side: THREE.DoubleSide })
  for (let i = 0; i < 4; i += 1) {
    const arm = new THREE.Group()
    arm.rotation.z = (i * Math.PI) / 2
    const spar = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.1, 0.04), bladeMaterial))
    spar.position.y = 1.05
    arm.add(spar)
    const sail = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(0.46, 1.5), bladeMaterial))
    sail.position.set(0.27, 1.2, 0)
    arm.add(sail)
    hub.add(arm)
  }
  hub.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: "#2a2f3a" })))
  group.add(hub)
  group.userData.update = (phase) => {
    hub.rotation.z = turns(phase, 3)
  }
  return group
}

function tree({ seed, size }) {
  const group = new THREE.Group()
  const random = rng(seed)
  const trunk = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.06 * size, 0.11 * size, 1.1 * size, 10), new THREE.MeshStandardMaterial({ color: "#5b3a1a", roughness: 1 })))
  trunk.position.y = 0.55 * size
  group.add(trunk)
  const canopy = new THREE.Group()
  canopy.position.y = 1.1 * size
  const palette = ["#2f8f50", "#3ea862", "#57c27a"]
  for (let i = 0; i < 6; i += 1) {
    const puff = shadowed(new THREE.Mesh(new THREE.IcosahedronGeometry((0.3 + random() * 0.22) * size, 1), new THREE.MeshStandardMaterial({ color: palette[i % 3], roughness: 0.9, flatShading: true })))
    puff.position.set((random() - 0.5) * 0.6 * size, random() * 0.55 * size, (random() - 0.5) * 0.6 * size)
    canopy.add(puff)
  }
  group.add(canopy)
  const offset = random()
  group.userData.update = (phase) => {
    canopy.rotation.z = 0.045 * wave(phase, 3, offset)
    canopy.rotation.x = 0.03 * wave(phase, 4, offset + 0.3)
  }
  return group
}

function rock(seed) {
  const random = rng(seed)
  const mesh = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + random() * 0.35, 0), new THREE.MeshStandardMaterial({ color: "#7a7f88", roughness: 0.95, flatShading: true })))
  mesh.rotation.set(random() * 3, random() * 3, random() * 3)
  mesh.scale.y = 0.7
  return mesh
}

function boat(dark) {
  const group = new THREE.Group()
  const hullShape = new THREE.Shape([new THREE.Vector2(-1.1, 0.35), new THREE.Vector2(1.2, 0.35), new THREE.Vector2(0.85, -0.2), new THREE.Vector2(-0.8, -0.2)])
  const hull = shadowed(new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 0.7, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.05 }), new THREE.MeshStandardMaterial({ color: dark ? "#2b3442" : "#3b4a5c", roughness: 0.6 })))
  hull.position.z = -0.35
  group.add(hull)
  const mast = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.4, 8), new THREE.MeshStandardMaterial({ color: "#c8b28a", roughness: 0.8 })))
  mast.position.set(0.1, 1.5, 0)
  group.add(mast)
  const sailShape = new THREE.Shape([new THREE.Vector2(0.14, 0.2), new THREE.Vector2(1.15, 0.2), new THREE.Vector2(0.14, 1.85)])
  const sail = shadowed(new THREE.Mesh(new THREE.ShapeGeometry(sailShape), new THREE.MeshStandardMaterial({ color: "#f1e9d6", roughness: 0.9, side: THREE.DoubleSide })))
  sail.position.set(0.1, 0.45, 0.02)
  group.add(sail)
  const jibShape = new THREE.Shape([new THREE.Vector2(-0.12, 0.35), new THREE.Vector2(-0.9, 0.35), new THREE.Vector2(-0.12, 1.6)])
  const jib = shadowed(new THREE.Mesh(new THREE.ShapeGeometry(jibShape), new THREE.MeshStandardMaterial({ color: "#dcd2bd", roughness: 0.9, side: THREE.DoubleSide })))
  jib.position.set(0.1, 0.45, -0.02)
  group.add(jib)
  group.userData.update = (phase) => {
    group.position.y = 0.1 + 0.09 * wave(phase, 6, 0.1)
    group.rotation.z = 0.045 * wave(phase, 6, 0.35)
    group.rotation.x = 0.03 * wave(phase, 8, 0.2)
  }
  return group
}

function bird() {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: "#2b3442", roughness: 1, side: THREE.DoubleSide })
  const wings = [-1, 1].map((side) => {
    const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.16), material)
    wing.position.x = side * 0.27
    const pivot = new THREE.Group()
    pivot.add(wing)
    group.add(pivot)
    return { pivot, side }
  })
  group.userData.flap = (phase, offset) => {
    for (const { pivot, side } of wings) pivot.rotation.z = side * 0.6 * wave(phase, 36, offset)
  }
  return group
}

export function createIsland({ dark, position }) {
  const group = new THREE.Group()
  group.position.copy(position)
  const updaters = []
  const add = (object, x, z, lift = 0, rotationY = 0) => {
    object.position.set(x, islandHeight(x, z) + lift, z)
    object.rotation.y = rotationY
    group.add(object)
    if (object.userData.update) updaters.push(object.userData.update)
    return object
  }
  group.add(terrain(dark))
  group.add(road())
  const foam = foamRing()
  group.add(foam)
  updaters.push(foam.userData.update)
  add(house({ dark, seed: 1 }), -3.2, 2.2, -0.05, 0.25)
  add(house({ dark, seed: 2 }), 1.8, -2.6, -0.05, -0.4)
  add(house({ dark, seed: 3 }), 4.9, 1.9, -0.05, 0.9)
  add(lighthouse({ dark }), 7.2, -1.8, -0.1)
  add(windmill(), -6.4, -1.4, -0.05, 0.6)
  ;[[-5.6, 2.9, 1.1], [-1.2, -3.1, 0.9], [-0.6, 3.4, 0.8], [3.2, 3.6, 0.7], [6.3, 2.6, 0.6], [-7.6, 0.4, 0.7], [2.9, -0.4, 0.55], [-3.8, -2.4, 0.8]].forEach(([x, z, size], i) => add(tree({ seed: 20 + i, size }), x, z, -0.05))
  ;[[-8.6, -1.6], [8.7, 1.6], [0.4, 4.3], [-2.4, 4.4], [6.4, -3.4]].forEach(([x, z], i) => add(rock(40 + i), x, z, -0.1))

  const moored = boat(dark)
  moored.position.set(-9.5, 0.1, 9.2)
  moored.rotation.y = 0.9
  group.add(moored)
  updaters.push(moored.userData.update)

  const birds = Array.from({ length: 3 }, (_, i) => {
    const b = bird()
    group.add(b)
    return { object: b, offset: i / 3, height: 7 + i * 0.8, radius: 5.5 + i * 1.2 }
  })
  updaters.push((phase) => {
    for (const { object, offset, height, radius } of birds) {
      const angle = turns(phase, 1, offset)
      object.position.set(Math.cos(angle) * radius, height + 0.4 * wave(phase, 3, offset), Math.sin(angle) * radius * 0.7)
      object.rotation.y = -angle
      object.userData.flap(phase, offset)
    }
  })

  group.userData.update = (phase) => {
    for (const update of updaters) update(phase)
  }
  return group
}
