// Shared stage for every pre-rendered scene: renderer, camera, post-processing, and a clock the
// capture script drives by hand. render(t) is a pure function of t, so frames are reproducible and
// every animation loops after `loop` seconds.
import * as THREE from "three"
import { gsap } from "gsap"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"

export const params = new URLSearchParams(location.search)
export const theme = params.get("theme") === "light" ? "light" : "dark"
export const dark = theme === "dark"
export const PALETTE = dark
  ? { bg: "#0d1117", text: "#e6edf3", muted: "#9fb0cc", faint: "#8f9db5", accent: "#ff7a4d", accent2: "#58a6ff", accent3: "#3fb950" }
  : { bg: "#ffffff", text: "#13294B", muted: "#4c5b73", faint: "#6b7893", accent: "#E84A27", accent2: "#0969da", accent3: "#1a7f37" }

const SUPERSAMPLE = 2
// Transparent effects (clouds, mist, beams, glows) live on this layer, which the ambient
// occlusion pass does not see; otherwise their quads would cast false contact shadows.
export const EFFECT_LAYER = 1
export const effectLayer = (object) => {
  object.layers.set(EFFECT_LAYER)
  return object
}

export function createStage({ width, height, loop, page = { width, height }, fov = 35, near = 0.1, far = 600, bloom = { strength: 0.55, radius: 0.6, threshold: 0.92 }, ao = null, exposure = 1, alpha = false }) {
  // GSAP normally advances on requestAnimationFrame; the capture script sets the time instead.
  gsap.ticker.remove(gsap.updateRoot)
  document.documentElement.style.setProperty("--w", `${page.width}px`)
  document.documentElement.style.setProperty("--h", `${page.height}px`)
  document.documentElement.style.setProperty("--cw", `${width}px`)
  document.documentElement.style.setProperty("--ch", `${height}px`)
  // The HTML overlay is authored for the design width; `scale` shrinks it with the output.
  document.documentElement.style.setProperty("--scale", params.get("scale") ?? "1")
  const canvas = document.getElementById("stage")
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: true, powerPreference: "high-performance" })
  if (alpha) renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(SUPERSAMPLE)
  renderer.setSize(width, height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = exposure
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(fov, width / height, near, far)
  camera.layers.enable(EFFECT_LAYER)
  const aoCamera = camera.clone()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  const target = new THREE.WebGLRenderTarget(width * SUPERSAMPLE, height * SUPERSAMPLE, { type: THREE.HalfFloatType })
  const composer = new EffectComposer(renderer, target)
  composer.setPixelRatio(SUPERSAMPLE)
  composer.setSize(width, height)
  composer.addPass(new RenderPass(scene, camera))
  if (ao) {
    // Screen-space ambient occlusion: contact shadows where objects meet the ground.
    const gtao = new GTAOPass(scene, aoCamera, width * SUPERSAMPLE, height * SUPERSAMPLE)
    gtao.output = GTAOPass.OUTPUT.Default
    gtao.updateGtaoMaterial({ radius: ao.radius ?? 0.5, distanceExponent: 1, thickness: 1, scale: ao.scale ?? 1, samples: 16, distanceFallOff: 1, screenSpaceRadius: false })
    gtao.blendIntensity = ao.intensity ?? 0.85
    composer.addPass(gtao)
  }
  if (bloom) composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), bloom.strength, bloom.radius, bloom.threshold))
  composer.addPass(new OutputPass())

  const updaters = []
  const stage = {
    renderer,
    scene,
    camera,
    composer,
    loop,
    width,
    height,
    ready: false,
    onFrame: (fn) => updaters.push(fn),
    // Reflections and ambient light come from the scene's own sky instead of the studio room.
    useSkyEnvironment(sky) {
      const backdrop = new THREE.Scene()
      backdrop.add(sky.clone())
      scene.environment = pmrem.fromScene(backdrop, 0.02).texture
      scene.environmentIntensity = 1.2
      return scene.environment
    },
    render(t) {
      const phase = (((t % loop) + loop) % loop) / loop
      gsap.updateRoot(t)
      for (const fn of updaters) fn({ t, phase, loop })
      camera.updateMatrixWorld()
      aoCamera.copy(camera)
      aoCamera.layers.set(0)
      composer.render()
    }
  }
  window.__scene = stage
  return stage
}
