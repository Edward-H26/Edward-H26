// @ts-check
// Hex colour arithmetic for lit and shaded faces. Every input and output is a "#rrggbb" string.

/** @param {string} hex */
const channelsOf = (hex) => /** @type {RegExpMatchArray} */ (hex.replace("#", "").match(/.{2}/g)).map((c) => parseInt(c, 16))

/** @param {number[]} channels */
const hexOf = (channels) => `#${channels.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`

/**
 * Mix a hex colour toward white (amount > 0) or black (amount < 0); |amount| = 1 reaches it fully.
 * @param {string} hex
 * @param {number} amount
 */
export function shade(hex, amount) {
  const target = amount > 0 ? 255 : 0
  return hexOf(channelsOf(hex).map((c) => c + (target - c) * Math.abs(amount)))
}

/**
 * Blend two hex colours; t = 0 gives `a`, t = 1 gives `b`.
 * @param {string} a
 * @param {string} b
 * @param {number} t
 */
export function mix(a, b, t) {
  const from = channelsOf(a)
  const to = channelsOf(b)
  return hexOf(from.map((c, i) => c + (to[i] - c) * t))
}
