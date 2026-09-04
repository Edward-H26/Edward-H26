// Sea surface: Gerstner waves displaced in the vertex shader, a planar reflection of the whole
// scene (Reflector renders it from a mirrored camera), Fresnel blending, and a sun or moon glitter
// path. Every time term is an integer number of cycles per loop, so the water never jumps.
import * as THREE from "three"
import { Reflector } from "three/addons/objects/Reflector.js"
import { normalTexture, tileableNoise } from "./textures.js"

const vertexShader = /* glsl */ `
  uniform mat4 textureMatrix;
  uniform float phase;
  uniform vec4 waves[4];
  uniform float cycles[4];
  varying vec4 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  #define TAU 6.28318530718
  void main() {
    vec3 p = position;
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);
    vec3 offset = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      vec2 d = normalize(waves[i].xy);
      float steep = waves[i].z;
      float k = TAU / waves[i].w;
      float a = steep / k;
      float f = k * dot(d, position.xz) - TAU * cycles[i] * phase;
      float s = sin(f);
      float c = cos(f);
      offset += vec3(d.x * a * c, a * s, d.y * a * c);
      tangent += vec3(-d.x * d.x * steep * s, d.x * steep * c, -d.x * d.y * steep * s);
      binormal += vec3(-d.x * d.y * steep * s, d.y * steep * c, -d.y * d.y * steep * s);
    }
    vec3 n = normalize(cross(binormal, tangent));
    p += offset;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldPos = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * n);
    vUv = textureMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D normalMap;
  uniform vec3 color;
  uniform vec3 deepColor;
  uniform vec3 fogColor;
  uniform vec3 sunDir;
  uniform vec3 sunColor;
  uniform float sunPower;
  uniform float sunStrength;
  uniform float fogNear;
  uniform float fogFar;
  uniform float reflectivity;
  uniform float phase;
  varying vec4 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  void main() {
    vec2 uv1 = vWorldPos.xz * 0.05 + vec2(phase, 0.0);
    vec2 uv2 = vWorldPos.xz * 0.12 + vec2(0.0, -2.0 * phase);
    vec2 uv3 = vWorldPos.xz * 0.021 + vec2(-phase, phase);
    vec3 t1 = texture2D(normalMap, uv1).xyz * 2.0 - 1.0;
    vec3 t2 = texture2D(normalMap, uv2).xyz * 2.0 - 1.0;
    vec3 t3 = texture2D(normalMap, uv3).xyz * 2.0 - 1.0;
    vec2 ripple = t1.xy * 0.5 + t2.xy * 0.25 + t3.xy * 0.45;
    vec3 n = normalize(vec3(vNormal.x + ripple.x * 0.16, vNormal.y, vNormal.z + ripple.y * 0.16));
    vec3 V = normalize(cameraPosition - vWorldPos);
    float NdV = max(dot(n, V), 0.0);
    float fresnel = 0.03 + 0.97 * pow(1.0 - NdV, 5.0);
    vec4 uv = vUv;
    uv.xy += ripple * 0.35 * uv.w;
    vec3 reflection = texture2DProj(tDiffuse, uv).rgb;
    vec3 H = normalize(sunDir + V);
    float spec = pow(max(dot(n, H), 0.0), sunPower) * sunStrength;
    vec3 body = mix(deepColor, color, 0.25 + 0.75 * NdV);
    vec3 col = mix(body, reflection, clamp(fresnel * reflectivity, 0.0, 1.0)) + sunColor * spec;
    float fog = smoothstep(fogNear, fogFar, length(cameraPosition - vWorldPos));
    col = mix(col, fogColor, fog);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function createSea({ size = 420, segments = 220, textureSize = 1536, color, deepColor, fogColor, sunDir, sunColor, sunPower = 380, sunStrength = 1.4, fogNear = 90, fogFar = 260, reflectivity = 1 }) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
  geometry.rotateX(-Math.PI / 2)
  const shader = {
    name: "SeaShader",
    uniforms: {
      tDiffuse: { value: null },
      textureMatrix: { value: null },
      color: { value: new THREE.Color(color) },
      normalMap: { value: normalTexture(tileableNoise(256, { seed: 21, octaves: 4, period: 6 }), 2.5) },
      deepColor: { value: new THREE.Color(deepColor) },
      fogColor: { value: new THREE.Color(fogColor) },
      sunDir: { value: sunDir.clone().normalize() },
      sunColor: { value: new THREE.Color(sunColor) },
      sunPower: { value: sunPower },
      sunStrength: { value: sunStrength },
      fogNear: { value: fogNear },
      fogFar: { value: fogFar },
      reflectivity: { value: reflectivity },
      phase: { value: 0 },
      // direction x, direction z, steepness, wavelength; steepness sums stay below one so crests never loop.
      waves: { value: [new THREE.Vector4(1, 0.35, 0.1, 7), new THREE.Vector4(-0.4, 1, 0.08, 4.2), new THREE.Vector4(0.7, -0.6, 0.06, 2.6), new THREE.Vector4(-1, -0.2, 0.05, 1.5)] },
      cycles: { value: [6, 8, 10, 13] }
    },
    vertexShader,
    fragmentShader
  }
  const sea = new Reflector(geometry, { clipBias: 0.003, textureWidth: textureSize, textureHeight: Math.round(textureSize / 2), color, multisample: 4, shader })
  sea.material.uniforms.color.value = new THREE.Color(color)
  return sea
}
