// @ts-check
// Number formatting for SVG attributes and card labels.

/**
 * Two decimals: enough for SVG coordinates and timings, without float noise in the markup.
 * @param {number} value
 */
export const round = (value) => Math.round(value * 100) / 100

/**
 * Thousands as "k" (1234 becomes "1.23k"); smaller numbers unchanged. For the stats tiles.
 * @param {number} value
 */
export const compact = (value) => (value >= 1000 ? `${round(value / 1000)}k` : String(value))

/**
 * Millions as "M" and thousands as "k"; for line counts, which can reach millions.
 * @param {number} value
 */
export const abbreviate = (value) => (value >= 1000000 ? `${round(value / 1000000)}M` : value >= 1000 ? `${round(value / 1000)}k` : String(value))
