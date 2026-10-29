// The island's height field: a plateau with hills, an irregular coastline, cliffs down to the
// water, and the terrain mesh whose grass and cliff textures blend by slope in the shader.
import * as THREE from "three"
import { tileableNoise } from "../textures.js"

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
export function coastRadius(x, z) {
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
  const material = new THREE.MeshStandardMaterial({
    color: "#b4f0a0",
    map: grass.map,
    normalMap: grass.normalMap,
    roughnessMap: grass.roughnessMap,
    aoMap: grass.aoMap,
    roughness: 1,
    metalness: 0,
    normalScale: new THREE.Vector2(0.9, 0.9)
  })
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

export function terrain(grass, rock) {
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
