// A sky dome shaded from the horizon colour through `mid` to the zenith colour.
import * as THREE from "three"

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
