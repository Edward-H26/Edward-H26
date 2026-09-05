// The hero island: a sculpted height field dressed with photoscanned trees, rocks, grass and
// flowers, a small village with a mill and a well, a pier with a moored sailing ship, a lighthouse,
// low mist and circling birds. Grass and cliff textures blend by slope in the terrain shader.
import * as THREE from "three"
import { loadModel, loadTextureSet, place, scatter, texturesReady } from "./assets.js"
import { TAU, flicker, rng, turns, wave } from "./periodic.js"
import { effectLayer } from "./stage.js"
import { heightTexture, tileableNoise } from "./textures.js"

export const RADIUS = 15
const PLATEAU = 3.4
const noise = tileableNoise(256, { seed: 4, octaves: 5, period: 4 })

function sampleNoise(x, z, scale = 1 / 40) {
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

// Normalised distance from the island centre, with an irregular coastline.
function coastRadius(x, z) {
  const angle = Math.atan2(z, x)
  const coast = 1 + 0.09 * Math.sin(angle * 3 + 0.6) + 0.05 * Math.sin(angle * 7 + 2.1) + 0.03 * Math.sin(angle * 11)
  return Math.hypot(x, z * 1.3) / (RADIUS * coast)
}

export function islandHeight(x, z) {
  const r = coastRadius(x, z)
  const hills = (sampleNoise(x, z) - 0.5) * 1.8 + (sampleNoise(x + 40, z + 40, 1 / 14) - 0.5) * 0.5
  const top = PLATEAU + hills * smoothstep(1.0, 0.6, r)
  const cliff = Math.pow(smoothstep(0.8, 1.04, r), 1.4)
  const band = smoothstep(0.72, 0.9, r) * (1 - smoothstep(1.02, 1.12, r))
  const rockiness = ((sampleNoise(x + 90, z - 30, 1 / 8) - 0.5) * 1.1 + (sampleNoise(x - 60, z + 80, 1 / 2.5) - 0.5) * 0.5) * band
  return top - (PLATEAU + 6.5) * cliff + rockiness - Math.max(0, r - 1.04) * 8
}

// Grass on the plateau, cliff rock on the slopes and below the shoreline; the two PBR sets blend
// in the shader by the per-vertex `rock` weight, the rock sampled triplanar so cliffs never streak.
function terrainMaterial(grass, rock) {
  const material = new THREE.MeshStandardMaterial({ color: "#b4f0a0", map: grass.map, normalMap: grass.normalMap, roughnessMap: grass.roughnessMap, aoMap: grass.aoMap, roughness: 1, metalness: 0, normalScale: new THREE.Vector2(0.9, 0.9) })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.rockMap = { value: rock.map }
    shader.uniforms.rockNormal = { value: rock.normalMap }
    shader.uniforms.rockArm = { value: rock.aoMap }
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float rock;\nvarying float vRock;\nvarying vec3 vTerrainPos;\nvarying vec3 vTerrainNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRock = rock;\nvTerrainPos = (modelMatrix * vec4(position, 1.0)).xyz;\nvTerrainNormal = normalize(mat3(modelMatrix) * normal);")
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform sampler2D rockMap; uniform sampler2D rockNormal; uniform sampler2D rockArm;
        varying float vRock; varying vec3 vTerrainPos; varying vec3 vTerrainNormal;
        vec4 triplanar(sampler2D tex, float scale) {
          vec3 w = pow(abs(vTerrainNormal), vec3(4.0));
          w /= (w.x + w.y + w.z);
          vec3 p = vTerrainPos * scale;
          return texture2D(tex, p.zy) * w.x + texture2D(tex, p.xz) * w.y + texture2D(tex, p.xy) * w.z;
        }`
      )
      .replace("#include <map_fragment>", "diffuseColor *= mix(texture2D(map, vMapUv), triplanar(rockMap, 0.3), vRock);")
      .replace(
        "#include <normal_fragment_maps>",
        `vec3 grassN = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
        vec3 rockN = triplanar(rockNormal, 0.3).xyz * 2.0 - 1.0;
        vec3 mapN = normalize(mix(grassN, rockN, vRock));
        mapN.xy *= normalScale;
        normal = normalize(tbn * mapN);`
      )
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = roughness * mix(texture2D(roughnessMap, vRoughnessMapUv).g, triplanar(rockArm, 0.3).g, vRock);")
      .replace(
        "#include <aomap_fragment>",
        `float ambientOcclusion = mix(texture2D(aoMap, vAoMapUv).r, triplanar(rockArm, 0.3).r, vRock);
        reflectedLight.indirectDiffuse *= ambientOcclusion;
        reflectedLight.indirectSpecular *= ambientOcclusion;`
      )
  }
  return material
}

function terrain(grass, rock) {
  const span = RADIUS * 2 * 1.35
  const geometry = new THREE.PlaneGeometry(span, span, 240, 240)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i += 1) position.setY(i, islandHeight(position.getX(i), position.getZ(i)))
  geometry.computeVertexNormals()
  const normal = geometry.attributes.normal
  const rockWeight = new Float32Array(position.count)
  for (let i = 0; i < position.count; i += 1) {
    const slope = 1 - normal.getY(i)
    const y = position.getY(i)
    const mottle = sampleNoise(position.getX(i) * 2, position.getZ(i) * 2, 1 / 9)
    rockWeight[i] = Math.min(1, smoothstep(0.1, 0.32, slope + mottle * 0.08) + smoothstep(2.4, 0.9, y))
  }
  geometry.setAttribute("rock", new THREE.BufferAttribute(rockWeight, 1))
  const mesh = new THREE.Mesh(geometry, terrainMaterial(grass, rock))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

const ROAD = new THREE.CatmullRomCurve3([new THREE.Vector3(-13.5, 0, 2.6), new THREE.Vector3(-7, 0, 0.4), new THREE.Vector3(0.8, 0, 2), new THREE.Vector3(7.4, 0, -1.4), new THREE.Vector3(13.2, 0, 0.6)])

function roadDistance(x, z) {
  let best = Infinity
  for (let i = 0; i <= 80; i += 1) {
    const p = ROAD.getPointAt(i / 80)
    best = Math.min(best, Math.hypot(p.x - x, p.z - z))
  }
  return best
}

function road(textures) {
  const samples = 160
  const width = 0.75
  const vertices = []
  const uvs = []
  const indices = []
  const length = ROAD.getLength()
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples
    const p = ROAD.getPointAt(t)
    const tangent = ROAD.getTangentAt(t)
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width)
    for (const s of [-1, 1]) {
      const x = p.x + side.x * s
      const z = p.z + side.z * s
      vertices.push(x, islandHeight(x, z) + 0.05, z)
      uvs.push((t * length) / 1.5, s > 0 ? 1 : 0)
    }
    if (i > 0) {
      const b = i * 2
      indices.push(b - 2, b - 1, b, b - 1, b + 1, b)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  for (const texture of Object.values(textures)) texture.repeat.set(1, 1)
  textures.aoMap.channel = 0
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ ...textures, roughness: 1, metalness: 0, side: THREE.DoubleSide }))
  mesh.receiveShadow = true
  return mesh
}

// Foam where the cliffs meet the water: a ribbon along the coastline with drifting noise.
function foamRing() {
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
    for (const [offset, v] of [[-0.5, 0], [1.4, 1]]) {
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

const shadowed = (mesh) => {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function lighthouse({ dark, stone }) {
  const group = new THREE.Group()
  const base = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 1.6, 40), new THREE.MeshStandardMaterial({ ...stone, roughness: 1 })))
  base.position.y = 0.8
  group.add(base)
  const bands = [["#f4efe6", 1.5], ["#c9302c", 0.9], ["#f4efe6", 1.5], ["#c9302c", 0.9], ["#f4efe6", 1.1]]
  let y = 1.6
  let radius = 0.92
  for (const [color, height] of bands) {
    const nextRadius = radius - 0.05
    const segment = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(nextRadius, radius, height, 40), new THREE.MeshStandardMaterial({ color, roughness: 0.55 })))
    segment.position.y = y + height / 2
    group.add(segment)
    y += height
    radius = nextRadius
  }
  const gallery = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(1, 0.85, 0.3, 40), new THREE.MeshStandardMaterial({ color: "#2a2f3a", roughness: 0.5, metalness: 0.4 })))
  gallery.position.y = y + 0.15
  group.add(gallery)
  const rail = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.03, 8, 48), new THREE.MeshStandardMaterial({ color: "#2a2f3a", roughness: 0.4, metalness: 0.6 }))
  rail.rotation.x = Math.PI / 2
  rail.position.y = y + 1.05
  group.add(rail)
  for (let i = 0; i < 12; i += 1) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6), rail.material)
    post.position.set(Math.cos((i / 12) * TAU) * 0.98, y + 0.68, Math.sin((i / 12) * TAU) * 0.98)
    group.add(post)
  }
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 32), new THREE.MeshPhysicalMaterial({ color: "#fff2b0", emissive: "#ffe9a0", emissiveIntensity: dark ? 3 : 0.5, roughness: 0.15, transmission: 0.35, thickness: 0.3 }))
  lantern.position.y = y + 0.3 + 0.45
  group.add(lantern)
  const roof = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.8, 32), new THREE.MeshStandardMaterial({ color: "#2a2f3a", roughness: 0.5 })))
  roof.position.y = y + 0.3 + 0.9 + 0.4
  group.add(roof)
  const beamGeometry = new THREE.ConeGeometry(3.2, 36, 48, 1, true)
  beamGeometry.translate(0, -18, 0)
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
      uniforms: { strength: { value: dark ? 0.3 : 0.08 }, color: { value: new THREE.Color("#fff3c4") } },
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
  group.add(effectLayer(beam))
  if (dark) {
    const light = new THREE.PointLight("#ffd58a", 12, 18, 2)
    light.position.y = lantern.position.y
    group.add(light)
  }
  group.userData.update = (phase) => {
    beam.rotation.y = turns(phase, 2)
  }
  return group
}

function bird() {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: "#2b3442", roughness: 1, side: THREE.DoubleSide })
  const wings = [-1, 1].map((side) => {
    const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), material)
    wing.position.x = side * 0.35
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

// Low mist hugging the water around the island: a noise-textured sheet that drifts and breathes.
function mist({ dark }) {
  const geometry = new THREE.PlaneGeometry(90, 90, 1, 1)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { phase: { value: 0 }, noise: { value: heightTexture(tileableNoise(256, { seed: 77, octaves: 5, period: 3 })) }, color: { value: new THREE.Color(dark ? "#8ea3c9" : "#ffffff") }, strength: { value: dark ? 0.22 : 0.3 } },
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

function spotsOnPlateau({ count, seed, minRadius = 0, maxRadius = 0.8, roadClearance = 1.2, avoid = [], scale = [0.7, 1.1] }) {
  const random = rng(seed)
  const spots = []
  let attempts = 0
  while (spots.length < count && attempts < count * 40) {
    attempts += 1
    const x = (random() - 0.5) * RADIUS * 2.2
    const z = (random() - 0.5) * RADIUS * 1.7
    const r = coastRadius(x, z)
    if (r < minRadius || r > maxRadius) continue
    if (roadDistance(x, z) < roadClearance) continue
    if (avoid.some(([ax, az, radius]) => Math.hypot(ax - x, az - z) < radius)) continue
    spots.push({ x, y: islandHeight(x, z) - 0.02, z, rotation: random() * TAU, scale: scale[0] + random() * (scale[1] - scale[0]) })
  }
  return spots
}

export async function createIsland({ dark, position }) {
  const group = new THREE.Group()
  group.position.copy(position)
  const updaters = []
  const models = {}
  await Promise.all(
    Object.entries({
      treeLarge: "hq/island_tree_01_web.glb",
      tree: "hq/island_tree_02_web.glb",
      treeSmall: "hq/tree_small_02_web.glb",
      cypress: "fantasy_village/cypress_tree.glb",
      boulder: "hq/boulder_01_web.glb",
      boulderFlat: "hq/namaqualand_boulder_02_web.glb",
      mossRocks: "hq/rock_moss_set_01_web.glb",
      grass: "hq/grass_medium_02_web.glb",
      flowers: "hq/flower_gazania_web.glb",
      fern: "hq/fern_02_web.glb",
      houseA: "medieval_village_pack/fantasy_house_02.glb",
      houseB: "medieval_village_pack/fantasy_house_03.glb",
      houseC: "medieval_village_pack/fantasy_house_01.glb",
      mill: "medieval_village_pack/mill.glb",
      well: "medieval_village_pack/well.glb",
      fence: "medieval_village_pack/fence.glb",
      cart: "medieval_village_pack/cart.glb",
      pier: "hq/modular_wooden_pier_web.glb",
      ship: "hq/ship_pinnace_web.glb",
      lantern: "hq/wooden_lantern_01_web.glb",
      barrels: "hq/wooden_barrels_01_web.glb",
      crate: "hq/wooden_crate_01_web.glb",
      buoy: "hq/lateral_sea_marker_web.glb"
    }).map(async ([key, file]) => {
      models[key] = await loadModel(file)
    })
  )
  const grassTextures = loadTextureSet("sparse_grass", 14)
  const cliffTextures = loadTextureSet("cliff_side", 1)
  const cobbles = loadTextureSet("cobblestone_pavement", 1)
  const stone = loadTextureSet("cliff_side", 1)
  await texturesReady()
  grassTextures.aoMap.channel = 0
  stone.aoMap.channel = 0
  for (const texture of Object.values(stone)) texture.repeat.set(2, 1)

  group.add(terrain(grassTextures, cliffTextures))
  group.add(road(cobbles))
  const foam = foamRing()
  group.add(foam)
  updaters.push(foam.userData.update)

  const onGround = (object, x, z, sink = 0) => {
    object.position.y += islandHeight(x, z) - sink
    object.position.x = x
    object.position.z = z
    group.add(object)
    return object
  }
  const buildings = [
    [models.houseA, -4.8, 3.6, 0.35, 3.9],
    [models.houseB, 3.2, -4.2, -0.5, 3.8],
    [models.houseC, 7.6, 2.9, 1.1, 2.6],
    [models.mill, -9.8, -2.6, 0.7, 5.6],
    [models.well, 0.4, -1.4, 0.2, 1.4]
  ]
  const footprints = []
  for (const [model, x, z, rotation, height] of buildings) {
    onGround(place(model, { rotation, height }), x, z, 0.08)
    footprints.push([x, z, height * 0.9])
  }
  onGround(place(models.cart, { rotation: 0.9, height: 1.1 }), -2.4, 4.6, 0.02)
  footprints.push([-2.4, 4.6, 1.2])
  // Fence along the road's south side.
  for (let t = 0.12; t < 0.5; t += 0.032) {
    const p = ROAD.getPointAt(t)
    const tangent = ROAD.getTangentAt(t)
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(1.25)
    onGround(place(models.fence, { rotation: -Math.atan2(tangent.z, tangent.x), height: 0.55 }), p.x + side.x, p.z + side.z, 0.03)
  }

  const lighthouseX = 11.6
  const lighthouseZ = -3
  onGround(lighthouse({ dark, stone }), lighthouseX, lighthouseZ, 0.25)
  footprints.push([lighthouseX, lighthouseZ, 2.2])

  const trees = [
    [models.treeLarge, -8.6, 4.6, 0.4, 5.2],
    [models.tree, -1.6, -5.2, 1.8, 4.2],
    [models.tree, 5.8, 5.1, 2.6, 4.4],
    [models.treeSmall, 9.6, -1.2, 0.2, 3.9],
    [models.treeSmall, -12.6, 0.6, 1.1, 3.6],
    [models.tree, 12.6, 2.4, 0.9, 3.5],
    [models.cypress, -6.8, -4.9, 0, 6.8],
    [models.cypress, 1.2, 5.6, 0.5, 6.2],
    [models.treeLarge, 6.4, -7.2, 2.2, 4.6]
  ]
  const swaying = []
  for (const [model, x, z, rotation, height] of trees) {
    const tree = onGround(place(model, { rotation, height }), x, z, 0.12)
    footprints.push([x, z, height * 0.35])
    swaying.push({ tree, offset: (x + z) * 0.11 })
  }
  updaters.push((phase) => {
    for (const { tree, offset } of swaying) {
      tree.rotation.z = 0.018 * wave(phase, 3, offset)
      tree.rotation.x = 0.012 * wave(phase, 4, offset + 0.3)
    }
  })

  const rocks = [
    [models.boulder, 13.6, -6.2, 0.4, 1.3],
    [models.boulderFlat, -13.2, -3.6, 1.2, 0.9],
    [models.boulder, 3.6, 8.2, 2.1, 1.1],
    [models.mossRocks, -4.2, -8.4, 0.3, 1.1],
    [models.boulderFlat, 10.2, 6.8, 2.9, 0.8]
  ]
  for (const [model, x, z, rotation, height] of rocks) {
    onGround(place(model, { rotation, height }), x, z, 0.2)
    footprints.push([x, z, height * 1.2])
  }

  // Vegetation: instanced grass clumps, flowers and ferns kept off the road and the buildings.
  group.add(scatter(models.grass, spotsOnPlateau({ count: 420, seed: 101, maxRadius: 0.86, avoid: footprints, scale: [0.9, 1.5] })))
  group.add(scatter(models.flowers, spotsOnPlateau({ count: 70, seed: 102, maxRadius: 0.82, avoid: footprints, scale: [0.7, 1.1] })))
  group.add(scatter(models.fern, spotsOnPlateau({ count: 28, seed: 103, maxRadius: 0.84, roadClearance: 1.8, avoid: footprints, scale: [0.6, 0.9] })))

  // Harbour on the near shore: pier, moored ship, lantern, barrels and a buoy.
  const pier = place(models.pier, { rotation: 0.35, scale: 0.4 })
  pier.position.set(-4.2, -0.35, 12.8)
  group.add(pier)
  const ship = place(models.ship, { rotation: -0.55, scale: 0.13 })
  ship.position.set(-9.5, -0.22, 19.5)
  group.add(ship)
  const buoy = place(models.buoy, { scale: 0.3 })
  buoy.position.set(6.5, -0.35, 17)
  group.add(buoy)
  const pierEnd = new THREE.Vector3(-4.2 - Math.sin(0.35) * 3.6, 1.0, 12.8 + Math.cos(0.35) * 3.6)
  const barrels = place(models.barrels, { rotation: 0.35, scale: 0.55 })
  barrels.position.set(pierEnd.x - 0.6, 1.02, pierEnd.z - 0.9)
  group.add(barrels)
  const crate = place(models.crate, { rotation: 0.7, scale: 0.9 })
  crate.position.set(pierEnd.x + 0.7, 1.02, pierEnd.z - 0.4)
  group.add(crate)
  const lanternPosts = [[pierEnd.x, 1.02, pierEnd.z + 1.2], [-3.4, null, 1.9], [4.9, null, -0.9]]
  for (const [x, y, z] of lanternPosts) {
    const lamp = place(models.lantern, { scale: 1.6 })
    if (y === null) onGround(lamp, x, z, 0.02)
    else {
      lamp.position.set(x, y, z)
      group.add(lamp)
    }
    if (dark) {
      const glow = new THREE.PointLight("#ffb054", 5, 10, 2)
      glow.position.set(0, 0.55, 0)
      lamp.add(glow)
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), new THREE.MeshBasicMaterial({ color: "#ffd48a", toneMapped: false }))
      bulb.position.set(0, 0.4, 0)
      lamp.add(bulb)
      lamp.userData.glow = glow
    }
  }
  if (dark) {
    for (const [x, z] of [[-4.8, 3.6], [3.2, -4.2], [7.6, 2.9]]) {
      const warm = new THREE.PointLight("#ffb347", 14, 10, 2)
      warm.position.set(x, islandHeight(x, z) + 1.6, z)
      group.add(warm)
    }
  }
  updaters.push((phase) => {
    ship.position.y = -0.22 + 0.08 * wave(phase, 5, 0.2)
    ship.rotation.z = 0.02 * wave(phase, 5, 0.45)
    ship.rotation.x = 0.012 * wave(phase, 7, 0.1)
    buoy.position.y = -0.35 + 0.12 * wave(phase, 6, 0.6)
    buoy.rotation.z = 0.08 * wave(phase, 6, 0.85)
    for (const lamp of group.children) if (lamp.userData.glow) lamp.userData.glow.intensity = 4 + 1.4 * flicker(phase, lamp.position.x)
  })

  const fog = mist({ dark })
  group.add(fog)
  updaters.push(fog.userData.update)

  const birds = Array.from({ length: 4 }, (_, i) => {
    const b = bird()
    group.add(b)
    return { object: b, offset: i / 4, height: 11 + i * 1.1, radius: 9 + i * 1.6 }
  })
  updaters.push((phase) => {
    for (const { object, offset, height, radius } of birds) {
      const angle = turns(phase, 1, offset)
      object.position.set(Math.cos(angle) * radius, height + 0.6 * wave(phase, 3, offset), Math.sin(angle) * radius * 0.7)
      object.rotation.y = -angle
      object.userData.flap(phase, offset)
    }
  })

  group.userData.update = (phase) => {
    for (const update of updaters) update(phase)
  }
  return group
}
