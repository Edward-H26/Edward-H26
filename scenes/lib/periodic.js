// Motion helpers that are exactly periodic in the loop phase (0..1), so the last frame flows into
// the first without a seam.
export const TAU = Math.PI * 2

export const wave = (phase, cycles = 1, offset = 0) => Math.sin(TAU * (phase * cycles + offset))

export const turns = (phase, n = 1, offset = 0) => TAU * (phase * n + offset)

// A soft flicker built from three incommensurate-looking but integer-cycle sines.
export const flicker = (phase, seed = 0) => 0.75 + 0.25 * (0.5 * wave(phase, 7, seed) + 0.3 * wave(phase, 13, seed * 1.7) + 0.2 * wave(phase, 23, seed * 0.3))

// Deterministic pseudo-random numbers, so a scene renders the same way every time.
export function rng(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
