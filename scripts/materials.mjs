// Materials shared by the cards: everything that makes a flat shape read as a lit, solid object.
// One light sits at the top left of every card, so highlights, bevels, and shadows agree.
import { linearGradient, mix, round, shade } from "./svg.mjs"

// Shared gradients and filters; include once per document that uses these helpers.
export function materialDefs() {
  return [
    `<radialGradient id="mat-highlight"><stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="mat-shadow"><stop offset="0" stop-color="#000000" stop-opacity="0.55"/><stop offset="0.7" stop-color="#000000" stop-opacity="0.18"/><stop offset="1" stop-color="#000000" stop-opacity="0"/></radialGradient>`,
    `<linearGradient id="mat-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`,
    `<linearGradient id="mat-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.7"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.08"/><stop offset="1" stop-color="#000000" stop-opacity="0.25"/></linearGradient>`,
    bevelFilter("mat-bevel"),
    bevelFilter("mat-bevel-soft", { blur: 3.5, scale: 6, exponent: 14, constant: 0.55 }),
    `<filter id="mat-drop" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.35"/></filter>`,
    `<filter id="mat-drop-tight" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.4"/></filter>`
  ].join("")
}

// Specular lighting on the blurred alpha of the shape: the classic SVG bevel. The light comes from
// the top left (azimuth 225) and the result is added onto the original colours.
export function bevelFilter(id, { blur = 2, scale = 4, exponent = 24, constant = 0.7, light = "#ffffff" } = {}) {
  return `<filter id="${id}" x="-15%" y="-30%" width="130%" height="170%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="blur"/><feSpecularLighting in="blur" surfaceScale="${scale}" specularConstant="${constant}" specularExponent="${exponent}" lighting-color="${light}" result="spec"><feDistantLight azimuth="225" elevation="42"/></feSpecularLighting><feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/><feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/></filter>`
}

// A sphere lit from the top left: bright focus, body colour, dark limb.
export function sphereGradient(id, color, { fx = 0.32, fy = 0.28 } = {}) {
  return `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.6" fx="${fx}" fy="${fy}"><stop offset="0" stop-color="${shade(color, 0.65)}"/><stop offset="0.35" stop-color="${shade(color, 0.15)}"/><stop offset="0.75" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.65)}"/></radialGradient>`
}

// Vertical face gradient for keycaps, pills, and tiles.
export function faceGradient(id, color, { top = 0.22, bottom = -0.14 } = {}) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(color, top)}"/><stop offset="1" stop-color="${shade(color, bottom)}"/></linearGradient>`
}

export function sphere({ cx, cy, r, fill, shadow = true }) {
  const contact = shadow ? `<ellipse cx="${round(cx + r * 0.1)}" cy="${round(cy + r * 1.08)}" rx="${round(r * 1.05)}" ry="${round(r * 0.32)}" fill="url(#mat-shadow)"/>` : ""
  return `${contact}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/><ellipse cx="${round(cx - r * 0.36)}" cy="${round(cy - r * 0.44)}" rx="${round(r * 0.34)}" ry="${round(r * 0.2)}" fill="url(#mat-highlight)" transform="rotate(-25 ${round(cx - r * 0.36)} ${round(cy - r * 0.44)})"/>`
}

// An extruded button seen from the front: a shaded side below the face, a bevelled top face, and a
// gloss on the upper half. `fill` is any paint (usually a faceGradient url).
// Apple-style glass: a frosted translucent body, a rim lit from the top left, a specular streak
// along the top edge, a tinted glow behind the content, and a soft shadow. `key` prefixes ids.
export function glassDefs(key, { dark, tint }) {
  return [
    linearGradient(`${key}-fill`, dark ? [["0", "#ffffff", 0.3], ["0.5", "#ffffff", 0.12], ["1", "#ffffff", 0.06]] : [["0", "#ffffff", 0.98], ["0.55", "#ffffff", 0.78], ["1", mix("#ffffff", tint, 0.14), 0.62]], { x1: "0", y1: "0", x2: "1", y2: "1" }),
    linearGradient(`${key}-rim`, dark ? [["0", "#ffffff", 0.95], ["0.45", "#ffffff", 0.28], ["1", "#ffffff", 0.14]] : [["0", "#ffffff", 1], ["0.5", tint, 0.4], ["1", "#13294B", 0.4]], { x1: "0", y1: "0", x2: "1", y2: "1" }),
    `<radialGradient id="${key}-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${tint}" stop-opacity="${dark ? 0.6 : 0.4}"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient>`,
    linearGradient(`${key}-spec`, [["0", "#ffffff", dark ? 0.6 : 0.95], ["1", "#ffffff", 0]], { x2: "0", y2: "1" })
  ].join("")
}

export function glassBody(key, { x, y, width, height, radius, dark, glowAt = 0.12 }) {
  const clip = `<clipPath id="${key}-shape"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"/></clipPath>`
  return {
    defs: clip,
    svg: [
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${dark ? "#000000" : "#13294B"}" opacity="${dark ? 0.35 : 0.16}" filter="url(#mat-drop)"/>`,
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="url(#${key}-fill)"/>`,
      `<g clip-path="url(#${key}-shape)">`,
      `<ellipse cx="${round(x + width * glowAt)}" cy="${round(y + height * 0.55)}" rx="${round(height * 1.1)}" ry="${round(height * 0.8)}" fill="url(#${key}-glow)"/>`,
      `<rect x="${round(x + 2)}" y="${round(y + 1.5)}" width="${round(width - 4)}" height="${round(height * 0.46)}" rx="${round(Math.max(2, radius - 2))}" fill="url(#${key}-spec)" opacity="0.7"/>`,
      `<rect x="${round(x + radius * 0.6)}" y="${round(y + height - 2.2)}" width="${round(width - radius * 1.2)}" height="1" fill="#ffffff" opacity="${dark ? 0.35 : 0.8}"/>`,
      `</g>`,
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="none" stroke="url(#${key}-rim)" stroke-width="1.2"/>`
    ].join("")
  }
}

export function keycap({ x = 0, y = 0, width, height, radius = 12, fill, side, depth = 5, bevel = "url(#mat-bevel)", shadow = true, gloss = 0.45 }) {
  const cast = shadow ? `<rect x="${round(x + 2)}" y="${round(y + depth + 2)}" width="${round(width - 4)}" height="${round(height - 2)}" rx="${radius}" fill="#000000" opacity="0.001" filter="url(#mat-drop)"/>` : ""
  return [
    cast,
    `<rect x="${x}" y="${round(y + depth)}" width="${width}" height="${height}" rx="${radius}" fill="${side}"/>`,
    `<rect x="${x}" y="${round(y + depth)}" width="${width}" height="${height}" rx="${radius}" fill="url(#mat-rim)" opacity="0.6"/>`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"${bevel ? ` filter="${bevel}"` : ""}/>`,
    gloss ? `<rect x="${round(x + 1.5)}" y="${round(y + 1.5)}" width="${round(width - 3)}" height="${round(height / 2 - 2)}" rx="${round(Math.max(2, radius - 2))}" fill="url(#mat-gloss)" opacity="${gloss}"/>` : ""
  ].join("")
}

