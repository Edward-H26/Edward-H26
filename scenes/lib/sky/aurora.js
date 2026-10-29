// An aurora: long ribbons that fold slowly, fine vertical rays, a bright green lower edge that
// feathers into violet at the top. Three curtains at different depths give it volume.
import * as THREE from "three"

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

function auroraCurtain({ seed, width, height, intensity }) {
  const geometry = new THREE.PlaneGeometry(width, height, 96, 12)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      phase: { value: 0 },
      seed: { value: seed },
      colorA: { value: new THREE.Color("#35f0a0") },
      colorB: { value: new THREE.Color("#2fd0d8") },
      colorC: { value: new THREE.Color("#a85cff") },
      intensity: { value: intensity }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      ${simplex}
      uniform float phase; uniform float seed; uniform vec3 colorA; uniform vec3 colorB; uniform vec3 colorC; uniform float intensity;
      varying vec2 vUv;
      #define TAU 6.28318530718
      void main() {
        float sx = sin(TAU * phase);
        float cx = cos(TAU * phase);
        // Ribbons: low-frequency noise stretched along x, folding as the loop turns.
        float fold = snoise(vec2(vUv.x * 2.6 + seed + 0.5 * sx, 0.3 * cx)) * 0.5;
        float ribbon = snoise(vec2(vUv.x * 5.0 + seed * 3.0 + 0.7 * cx, vUv.y * 0.6 + fold));
        float ribbon2 = snoise(vec2(vUv.x * 11.0 - seed - 0.9 * sx, vUv.y * 1.2 - 0.4 * cx));
        float bands = clamp(0.55 + 0.5 * ribbon + 0.25 * ribbon2, 0.0, 1.0);
        // Rays: fine vertical striations that drift sideways.
        float rays = 0.55 + 0.45 * pow(0.5 + 0.5 * sin(vUv.x * 520.0 + ribbon * 30.0 + sx * 3.0), 3.0);
        rays = mix(1.0, rays, smoothstep(0.05, 0.4, vUv.y));
        // Curtain: a crisp bright lower edge that thins upward.
        float base = 0.1 + 0.05 * ribbon;
        float curtain = smoothstep(base - 0.03, base + 0.06, vUv.y) * pow(clamp(1.0 - (vUv.y - base) / (1.0 - base), 0.0, 1.0), 1.7);
        float edge = smoothstep(0.0, 0.05, vUv.x) * (1.0 - smoothstep(0.95, 1.0, vUv.x));
        float a = pow(bands, 1.6) * curtain * edge * rays * intensity;
        vec3 col = mix(colorA, colorB, smoothstep(0.1, 0.45, vUv.y));
        col = mix(col, colorC, smoothstep(0.4, 0.95, vUv.y));
        gl_FragColor = vec4(col * a * 1.8, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  })
  return new THREE.Mesh(geometry, material)
}

// The two nearer curtains are listed in userData.curtains for the night sky to animate.
export function aurora() {
  const group = new THREE.Group()
  const back = auroraCurtain({ seed: 1.7, width: 980, height: 170, intensity: 0.8 })
  back.position.set(30, 92, -290)
  back.rotation.x = 0.22
  group.add(back)
  const front = auroraCurtain({ seed: 4.3, width: 820, height: 130, intensity: 1 })
  front.position.set(-20, 68, -230)
  front.rotation.x = 0.18
  group.add(front)
  const high = auroraCurtain({ seed: 7.9, width: 1100, height: 190, intensity: 0.45 })
  high.position.set(60, 150, -330)
  high.rotation.x = 0.3
  group.add(high)
  group.userData.curtains = [back, front]
  return group
}
