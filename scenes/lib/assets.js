// Loads the baked Poly Haven scans and the village models the personal website already ships,
// served by render.mjs under /assets3d/ (from the sibling checkout, or the live site as fallback).
import * as THREE from "three"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

const draco = new DRACOLoader()
draco.setDecoderPath("/scenes/node_modules/three/examples/jsm/libs/draco/gltf/")
const loader = new GLTFLoader()
loader.setDRACOLoader(draco)
const cache = new Map()

export async function loadModel(file) {
  if (!cache.has(file)) {
    cache.set(
      file,
      loader.loadAsync(`/assets3d/models/${file}`).then((gltf) => {
        gltf.scene.traverse((object) => {
          if (!object.isMesh) return
          object.castShadow = true
          object.receiveShadow = true
          if (object.material.map) object.material.map.anisotropy = 8
        })
        return gltf.scene
      })
    )
  }
  return cache.get(file)
}

// A fresh copy placed on the ground: `footprint` is the model's height at y = 0 in metres; `size`
// scales it to the wanted height.
export function place(model, { x = 0, y = 0, z = 0, rotation = 0, height, scale } = {}) {
  const copy = model.clone(true)
  const box = new THREE.Box3().setFromObject(copy)
  const factor = scale ?? (height ? height / (box.max.y - box.min.y) : 1)
  copy.scale.setScalar(factor)
  copy.position.set(x, y - box.min.y * factor, z)
  copy.rotation.y = rotation
  return copy
}

// One InstancedMesh per mesh of a scan, so hundreds of grass clumps cost a handful of draw calls.
// `spots` are { x, y, z, rotation, scale } in the parent's space.
export function scatter(model, spots) {
  const group = new THREE.Group()
  const matrix = new THREE.Matrix4()
  const dummy = new THREE.Object3D()
  model.updateMatrixWorld(true)
  model.traverse((mesh) => {
    if (!mesh.isMesh) return
    const instanced = new THREE.InstancedMesh(mesh.geometry, mesh.material, spots.length)
    instanced.castShadow = true
    instanced.receiveShadow = true
    spots.forEach((spot, i) => {
      dummy.position.set(spot.x, spot.y, spot.z)
      dummy.rotation.set(0, spot.rotation ?? 0, 0)
      dummy.scale.setScalar(spot.scale ?? 1)
      dummy.updateMatrix()
      matrix.multiplyMatrices(dummy.matrix, mesh.matrixWorld)
      instanced.setMatrixAt(i, matrix)
    })
    group.add(instanced)
  })
  return group
}

// A PBR texture set from the website's textures folder: colour, normal, and the packed
// ambient-occlusion, roughness, metalness map.
export function loadTextureSet(name, repeat = 4) {
  const textures = new THREE.TextureLoader()
  const make = (suffix, colorSpace) => {
    const texture = textures.load(`/assets3d/textures/hq/${name}/${name}_${suffix}_2k.jpg`)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat, repeat)
    texture.anisotropy = 8
    if (colorSpace) texture.colorSpace = colorSpace
    return texture
  }
  return { map: make("diff", THREE.SRGBColorSpace), normalMap: make("nor_gl"), aoMap: make("arm"), roughnessMap: make("arm"), metalnessMap: make("arm") }
}

// Resolves once every texture the loader has queued has arrived.
export function texturesReady() {
  return new Promise((resolve) => {
    if (THREE.DefaultLoadingManager.isLoading === false) resolve()
    THREE.DefaultLoadingManager.onLoad = () => resolve()
  })
}
