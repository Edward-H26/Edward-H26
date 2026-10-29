// A soft radial glow on a sprite, for the moon's halo and the sun's glare.
import * as THREE from "three"

export function glowSprite(color, size, { inner = 0.85, outer = 0 } = {}) {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, `rgba(255,255,255,${inner})`)
  gradient.addColorStop(0.35, `rgba(255,255,255,${inner * 0.35})`)
  gradient.addColorStop(1, `rgba(255,255,255,${outer})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  const texture = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
  sprite.scale.setScalar(size)
  return sprite
}
