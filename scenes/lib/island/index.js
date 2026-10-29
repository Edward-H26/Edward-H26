// The hero island: a sculpted height field dressed with photoscanned trees, rocks, grass and
// flowers, a small village with a mill and a well, a pier with a moored sailing ship, a lighthouse,
// low mist and circling birds. Everything is added in one fixed order, so a render is reproducible.
import * as THREE from "three"
import { loadModel, loadTextureSet, place, scatter, texturesReady } from "../assets.js"
import { flicker, turns, wave } from "../periodic.js"
import { bird } from "./birds.js"
import { foamRing } from "./foam.js"
import { lighthouse } from "./lighthouse.js"
import { mist } from "./mist.js"
import { ROAD, road } from "./road.js"
import { islandHeight, terrain } from "./terrain.js"
import { spotsOnPlateau } from "./vegetation.js"

const UP = new THREE.Vector3(0, 1, 0)

// The scans and village models the island is dressed with, served from the website's assets.
const MODEL_FILES = {
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
}

async function loadModels() {
  const models = {}
  await Promise.all(
    Object.entries(MODEL_FILES).map(async ([key, file]) => {
      models[key] = await loadModel(file)
    })
  )
  return models
}

// Houses, the mill and the well, then the cart and a fence along the road's south side.
function addVillage({ group, models, footprints, updaters, onGround }) {
  const buildings = [
    [models.houseA, -4.8, 5, 0.35, 3.9],
    [models.houseB, 3.6, -5.4, -0.5, 3.8],
    [models.houseC, 8.4, -6.6, -0.4, 2.6],
    [models.mill, 1.2, 9, -0.6, 5.6],
    [models.well, 0.4, -1.4, 0.2, 1.4]
  ]
  for (const [model, x, z, rotation, height] of buildings) {
    onGround(place(model, { rotation, height }), x, z, 0.08)
    footprints.push([x, z, height * 0.9])
  }
  // The windmill's blades turn once per loop about their hub.
  const blades = group.getObjectByName("Mill_Blades")
  const bladesRest = blades.quaternion.clone()
  const spin = new THREE.Quaternion()
  updaters.push((phase) => blades.quaternion.copy(bladesRest).multiply(spin.setFromAxisAngle(UP, turns(phase, 1))))
  onGround(place(models.cart, { rotation: 0.9, height: 1.1 }), -2, 5.4, 0.02)
  footprints.push([-2, 5.4, 1.2])
  for (let t = 0.12; t < 0.5; t += 0.032) {
    const p = ROAD.getPointAt(t)
    const tangent = ROAD.getTangentAt(t)
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(1.25)
    onGround(place(models.fence, { rotation: -Math.atan2(tangent.z, tangent.x), height: 0.55 }), p.x + side.x, p.z + side.z, 0.03)
  }
}

function addLighthouse({ dark, stone, footprints, onGround }) {
  const lighthouseX = 12.4
  const lighthouseZ = -4.2
  onGround(lighthouse({ dark, stone }), lighthouseX, lighthouseZ, 0.25)
  footprints.push([lighthouseX, lighthouseZ, 2.2])
}

// Nine trees, each swaying gently at its own phase.
function addTrees({ models, footprints, updaters, onGround }) {
  const trees = [
    [models.treeLarge, -8.6, 4.6, 0.4, 5.2],
    [models.tree, -1.6, -5.2, 1.8, 4.2],
    [models.tree, 5.8, 5.1, 2.6, 4.4],
    [models.treeSmall, 9.4, -2.7, 0.2, 3.9],
    [models.treeSmall, -12.6, 0.6, 1.1, 3.6],
    [models.tree, 12.6, 2.4, 0.9, 3.5],
    [models.cypress, -6.8, -4.9, 0, 6.8],
    [models.cypress, 5.4, -9.6, 0.5, 6.2],
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
}

function addRocks({ models, footprints, onGround }) {
  const rocks = [
    [models.boulder, 13.6, -6.2, 0.4, 1.3],
    [models.boulderFlat, -13.2, -3.6, 1.2, 0.9],
    [models.boulder, -1, -9.8, 2.1, 1.1],
    [models.mossRocks, -4.2, -8.4, 0.3, 1.1],
    [models.boulderFlat, 8.6, -9, 2.9, 0.8]
  ]
  for (const [model, x, z, rotation, height] of rocks) {
    onGround(place(model, { rotation, height }), x, z, 0.2)
    footprints.push([x, z, height * 1.2])
  }
}

// Instanced grass clumps, flowers and ferns kept off the road and the buildings.
function addVegetation({ group, models, footprints }) {
  group.add(scatter(models.grass, spotsOnPlateau({ count: 420, seed: 101, maxRadius: 0.86, avoid: footprints, scale: [0.9, 1.5] })))
  group.add(scatter(models.flowers, spotsOnPlateau({ count: 70, seed: 102, maxRadius: 0.82, avoid: footprints, scale: [0.7, 1.1] })))
  group.add(scatter(models.fern, spotsOnPlateau({ count: 28, seed: 103, maxRadius: 0.84, roadClearance: 1.8, avoid: footprints, scale: [0.6, 0.9] })))
}

// Harbour on the near shore: pier, moored ship, lanterns, barrels, a crate and a buoy. At night the
// lanterns carry a flickering glow and three warm lights sit among the houses.
function addHarbour({ group, models, dark, updaters, onGround }) {
  const pier = place(models.pier, { rotation: 0.35, scale: 0.4 })
  pier.position.set(-4.2, -0.35, 12.8)
  group.add(pier)
  const ship = place(models.ship, { rotation: -0.55, scale: 0.13 })
  ship.position.set(-7.2, -0.22, 15.4)
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
  // One lantern at the end of the pier (at its deck height) and two on the ground along the road.
  const lanternPosts = [
    [pierEnd.x, 1.02, pierEnd.z + 1.2],
    [-3.4, null, 1.9],
    [4.9, null, -0.9]
  ]
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
    for (const [x, z] of [
      [-4.8, 3.6],
      [3.2, -4.2],
      [7.6, 2.9]
    ]) {
      const warm = new THREE.PointLight("#ffb347", 7, 10, 2)
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
}

function addMist({ group, dark, updaters }) {
  const fog = mist({ dark })
  group.add(fog)
  updaters.push(fog.userData.update)
}

// Four birds circling the island at different heights and radii.
function addBirds({ group, updaters }) {
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
}

export async function createIsland({ dark, position }) {
  const group = new THREE.Group()
  group.position.copy(position)
  const models = await loadModels()
  const grassTextures = loadTextureSet("sparse_grass", 14)
  const cliffTextures = loadTextureSet("cliff_side", 1)
  const cobbles = loadTextureSet("cobblestone_pavement", 1)
  const stone = loadTextureSet("cliff_side", 1)
  await texturesReady()
  grassTextures.aoMap.channel = 0
  stone.aoMap.channel = 0
  for (const texture of Object.values(stone)) texture.repeat.set(2, 1)

  const updaters = []
  group.add(terrain(grassTextures, cliffTextures))
  group.add(road(cobbles))
  const foam = foamRing()
  group.add(foam)
  updaters.push(foam.userData.update)

  const island = {
    group,
    models,
    stone,
    dark,
    updaters,
    // [x, z, radius] of everything placed so far, which the vegetation keeps clear of.
    footprints: [],
    // Puts an object on the terrain at (x, z), sunk by `sink` so its base does not float.
    onGround(object, x, z, sink = 0) {
      object.position.y += islandHeight(x, z) - sink
      object.position.x = x
      object.position.z = z
      group.add(object)
      return object
    }
  }
  addVillage(island)
  addLighthouse(island)
  addTrees(island)
  addRocks(island)
  addVegetation(island)
  addHarbour(island)
  addMist(island)
  addBirds(island)

  group.userData.update = (phase) => {
    for (const update of updaters) update(phase)
  }
  return group
}
