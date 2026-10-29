// Shooting stars: a short streak that brightens and fades along a straight path.
import * as THREE from "three"
import { gsap } from "gsap"
import { effectLayer } from "../stage.js"

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

// Two shooting stars per loop, on a GSAP timeline the capture script scrubs through stage.render.
export function shootingStars({ scene, loop }) {
  const meteors = [shootingStar(), shootingStar()]
  for (const star of meteors) scene.add(effectLayer(star))
  const timeline = gsap.timeline({ repeat: -1 })
  ;[
    [2.4, new THREE.Vector3(120, 150, -240), new THREE.Vector3(60, 105, -230)],
    [8.1, new THREE.Vector3(-30, 160, -250), new THREE.Vector3(-95, 118, -240)]
  ].forEach(([start, from, to], i) => {
    const star = meteors[i]
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
  // An empty tween at `loop` pads the timeline, so it repeats with the scene instead of early.
  timeline.set({}, {}, loop)
}
