// The lighthouse: a stone base, red and white bands, the gallery with its railing, a glowing
// lantern room, and a beam that turns twice per loop.
import * as THREE from "three"
import { TAU, turns } from "../periodic.js"
import { effectLayer } from "../stage.js"

const shadowed = (mesh) => {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function lighthouse({ dark, stone }) {
  const group = new THREE.Group()
  const base = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 1.6, 40), new THREE.MeshStandardMaterial({ ...stone, roughness: 1 })))
  base.position.y = 0.8
  group.add(base)
  const bands = [
    ["#f4efe6", 1.5],
    ["#c9302c", 0.9],
    ["#f4efe6", 1.5],
    ["#c9302c", 0.9],
    ["#f4efe6", 1.1]
  ]
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
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.9, 32),
    new THREE.MeshPhysicalMaterial({ color: "#fff2b0", emissive: "#ffe9a0", emissiveIntensity: dark ? 3 : 0.5, roughness: 0.15, transmission: 0.35, thickness: 0.3 })
  )
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
      uniforms: { strength: { value: dark ? 0.15 : 0 }, color: { value: new THREE.Color("#fff3c4") } },
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
