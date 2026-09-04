// Hand-designed, animated SVG cards for the profile README. Everything is plain SVG with SMIL
// animation, so GitHub's image proxy can serve it and no external service is involved.
import { edgesOf, faceNormal, fibonacciSphere, icosahedron, neighbourLinks, orient, project } from "./geometry.mjs"
import { FEATURED_PAPER, FOCUS, LINKS, PROFILE, SKILL_COLORS, SKILL_ROWS } from "./profile-data.mjs"
import { MONO, cardFrame, chip, escapeXml, glowFilter, linearGradient, rng, round, svgDocument } from "./svg.mjs"

export const WIDTH = 1200

function wrap(text, maxChars) {
  const lines = []
  let line = ""
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line)
      line = word
    } else line = (line + " " + word).trim()
  }
  if (line) lines.push(line)
  return lines
}

const track = (values) => values.join(";")

// ---------------------------------------------------------------------------------------------
// Hero: an island at dusk with a lighthouse, a windmill, a sailboat, and aurora or daylight sky.

function skyPalette(theme) {
  return theme.name === "dark"
    ? { top: "#070b18", mid: "#111d3a", horizon: "#3a2a4a", sea: "#0b1a33", seaDeep: "#050c1c", glitter: "#ffd9b0", star: "#dbe7ff" }
    : { top: "#cfe0fb", mid: "#e8f0fc", horizon: "#ffe4cf", sea: "#9cc4ee", seaDeep: "#5c92d1", glitter: "#ffffff", star: "#ffffff" }
}

function heroIsland(theme, x, y, scale) {
  const grassTop = "-150,10 -92,-42 -8,-62 88,-52 152,-14 146,30 66,66 -38,62 -120,42"
  const points = grassTop.split(" ").map((point) => point.split(",").map(Number))
  const bottom = points.map(([px, py]) => `${px},${py + 34}`).join(" ")
  const strata = [8, 16, 25].map((offset) => `<polyline points="${points.filter(([, py]) => py > -20).map(([px, py]) => `${px},${py + offset}`).join(" ")}" fill="none" stroke="#3a2412" stroke-opacity="0.35" stroke-width="1"/>`).join("")
  const windows = (wx, wy) => `<rect x="${wx}" y="${wy}" width="3" height="4" fill="${theme.name === "dark" ? "#ffd36b" : "#ffffff"}" opacity="0.9"><animate attributeName="opacity" values="0.9;0.5;0.9" dur="${round(2 + Math.abs(wx) / 40)}s" repeatCount="indefinite"/></rect>`
  const house = (hx, hy, color) =>
    `<g transform="translate(${hx} ${hy})"><polygon points="-10,0 10,0 10,-12 -10,-12" fill="${color}"/><polygon points="10,0 16,-4 16,-15 10,-12" fill="#c9b79a"/><polygon points="-12,-12 0,-22 12,-12" fill="#b8422a"/><polygon points="12,-12 18,-15 6,-25 0,-22" fill="#8f2f1d"/>${windows(-6, -9)}${windows(2, -9)}</g>`
  const tree = (tx, ty, size, phase) =>
    `<g transform="translate(${tx} ${ty})"><g><animateTransform attributeName="transform" type="rotate" values="-2 0 0;2 0 0;-2 0 0" dur="${round(3.5 + phase)}s" repeatCount="indefinite"/><line x1="0" y1="0" x2="0" y2="${-size}" stroke="#5b3a1a" stroke-width="2.2"/><circle cy="${-size - 3}" r="${size * 0.58}" fill="#2d8c4e"/><circle cx="-5" cy="${-size + 1}" r="${size * 0.42}" fill="#3ea862"/><circle cx="4" cy="${-size - 7}" r="${size * 0.36}" fill="#57c27a"/></g></g>`
  const lighthouse = `<g transform="translate(112 -20)"><polygon points="-7,0 7,0 5,-46 -5,-46" fill="#f4efe6"/><rect x="-6.6" y="-16" width="13.2" height="6" fill="#c9302c"/><rect x="-6" y="-32" width="12" height="6" fill="#c9302c"/><rect x="-6.5" y="-52" width="13" height="7" fill="#2a2f3a"/><rect x="-4.5" y="-51" width="9" height="5" fill="#fff2b0"><animate attributeName="opacity" values="1;0.55;1" dur="2s" repeatCount="indefinite"/></rect><polygon points="-8,-52 8,-52 0,-60" fill="#2a2f3a"/><g transform="translate(0 -48.5)"><path d="M0,0 L190,-24 L190,24 Z" fill="url(#hero-beam)" opacity="${theme.name === "dark" ? 0.55 : 0.32}"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="7s" repeatCount="indefinite"/></path><circle r="3" fill="#fff8d6" filter="url(#hero-glow)"/></g></g>`
  const windmill = `<g transform="translate(-88 -10)"><polygon points="-7,0 7,0 4,-34 -4,-34" fill="#e8dcc6"/><polygon points="-6,-34 6,-34 0,-42" fill="#8f2f1d"/><g transform="translate(0 -36)"><g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite"/>${[0, 90, 180, 270].map((deg) => `<g transform="rotate(${deg})"><rect x="-1.2" y="-24" width="2.4" height="24" fill="#f4efe6"/><rect x="1.2" y="-22" width="5" height="16" fill="#f4efe6" opacity="0.8"/></g>`).join("")}</g><circle r="2.2" fill="#2a2f3a"/></g></g>`
  const road = `<path d="M-118,20 C-80,-6 -30,-8 10,4 S 96,22 130,4" fill="none" stroke="#d9d0bd" stroke-width="7" stroke-linecap="round" opacity="0.95"/><path d="M-118,20 C-80,-6 -30,-8 10,4 S 96,22 130,4" fill="none" stroke="#a89f8c" stroke-width="1.6" stroke-dasharray="6 9" opacity="0.75"/>`
  return `<g transform="translate(${x} ${y}) scale(${scale})">
<ellipse cx="0" cy="52" rx="188" ry="22" fill="${theme.name === "dark" ? "#000814" : "#2b4f86"}" opacity="0.35"/>
<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="6s" repeatCount="indefinite"/>
<polygon points="${bottom}" fill="url(#hero-cliff)"/>
${strata}
<polygon points="${grassTop.split(" ").map((p) => { const [px, py] = p.split(",").map(Number); return `${px},${py + 6}` }).join(" ")}" fill="#c9b98f" opacity="0.9"/>
<polygon points="${grassTop}" fill="url(#hero-grass)"/>
<ellipse cx="-40" cy="20" rx="34" ry="12" fill="#2f8f50" opacity="0.35"/><ellipse cx="70" cy="30" rx="26" ry="9" fill="#2f8f50" opacity="0.3"/>
${road}
${house(-30, 6, "#efe4cf")}${house(24, -24, "#f7ecd8")}${house(70, 24, "#efe4cf")}
${tree(-60, -22, 20, 0)}${tree(40, 44, 16, 0.8)}${tree(-8, 42, 13, 1.6)}${tree(120, 22, 12, 0.4)}
${windmill}${lighthouse}
</g></g>`
}

function heroSky(theme, random) {
  const sky = skyPalette(theme)
  const horizon = 236
  if (theme.name === "dark") {
    const stars = Array.from({ length: 90 }, () => {
      const x = round(random() * WIDTH)
      const y = round(random() * (horizon - 30))
      const r = round(0.5 + random() * 1.3)
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${sky.star}" opacity="0.4"><animate attributeName="opacity" values="0.25;1;0.25" dur="${round(2 + random() * 5)}s" begin="${round(random() * 5)}s" repeatCount="indefinite"/></circle>`
    }).join("")
    const shooting = [4, 13].map((delay, i) => `<line x1="0" y1="0" x2="-70" y2="26" stroke="url(#hero-shoot)" stroke-width="2" stroke-linecap="round" opacity="0"><animate attributeName="opacity" values="0;1;0" keyTimes="0;0.3;1" dur="1.2s" begin="${delay}s;${delay + 19}s;${delay + 38}s" /><animateTransform attributeName="transform" type="translate" values="${900 + i * 160} 40;${620 + i * 160} 150" dur="1.2s" begin="${delay}s;${delay + 19}s;${delay + 38}s"/></line>`).join("")
    const aurora = `<rect x="-60" y="26" width="${WIDTH + 120}" height="120" fill="url(#hero-aurora-0)" filter="url(#hero-aurora-warp)" opacity="0.5"><animateTransform attributeName="transform" type="translate" values="0 0;50 0;0 0" dur="26s" repeatCount="indefinite"/></rect>`
    const moon = `<g transform="translate(300 70)"><circle r="46" fill="#fff4d6" opacity="0.12" filter="url(#hero-blur)"/><circle r="22" fill="#fbefd0"/><circle cx="-6" cy="-5" r="4" fill="#e8dcb8"/><circle cx="7" cy="6" r="3" fill="#e8dcb8"/><circle cx="4" cy="-9" r="2" fill="#e8dcb8"/></g>`
    return `${stars}${aurora}${moon}${shooting}`
  }
  const clouds = [[180, 70, 1], [560, 44, 0.75], [860, 96, 0.9]]
    .map(([x, y, s], i) => `<g opacity="0.9"><animateTransform attributeName="transform" type="translate" values="${x} ${y};${x + 40 + i * 20} ${y};${x} ${y}" dur="${40 + i * 12}s" repeatCount="indefinite"/><g transform="scale(${s})"><ellipse rx="70" ry="18" fill="#ffffff"/><ellipse cx="-30" cy="-8" rx="30" ry="16" fill="#ffffff"/><ellipse cx="22" cy="-12" rx="38" ry="20" fill="#ffffff"/></g></g>`)
    .join("")
  const sun = `<g transform="translate(470 74)"><circle r="70" fill="#ffb347" opacity="0.18" filter="url(#hero-blur)"/><g opacity="0.35"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="60s" repeatCount="indefinite"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-2" y="-64" width="4" height="26" rx="2" fill="#ffb347" transform="rotate(${i * 30})"/>`).join("")}</g><circle r="26" fill="url(#hero-sun)"/></g>`
  return `${sun}${clouds}`
}

// Each tagline is typed by widening a clip rect, held, then erased before the next one starts.
// The text is stretched to the estimated width with textLength, so the clip and caret always match
// the glyphs whatever font the viewer has. WebKit ignores a clip rect of width 0, hence the floor.
const CLIP_FLOOR = 0.01

export function typingTracks(lines) {
  const cycle = lines.length * 5
  const clips = lines.map((line, i) => {
    const width = round(line.length * 21 * 0.55)
    const start = i / lines.length
    const keyTimes = [0, start, start + 0.3 / lines.length, start + 0.85 / lines.length, start + 0.98 / lines.length, 1].map((v) => round(Math.min(1, v)))
    return { width, values: `${CLIP_FLOOR};${CLIP_FLOOR};${width};${width};${CLIP_FLOOR};${CLIP_FLOOR}`, keyTimes: keyTimes.join(";") }
  })
  return { cycle, clips }
}

export function renderHero(theme) {
  const height = 380
  const random = rng(11)
  const typing = typingTracks(PROFILE.taglines)
  const caretTrack = []
  const caretTimesList = []
  typing.clips.forEach((clip, i) => {
    const start = i / typing.clips.length
    caretTrack.push(60, 60, 60 + clip.width, 60 + clip.width, 60)
    caretTimesList.push(...[start, start, start + 0.3 / typing.clips.length, start + 0.85 / typing.clips.length, start + 0.98 / typing.clips.length].map((v) => round(Math.min(1, v))))
  })
  caretTrack.push(60)
  caretTimesList.push(1)
  const caretTimes = caretTimesList.join(";")
  const sky = skyPalette(theme)
  const horizon = 236
  const glitter = Array.from({ length: 26 }, () => {
    const x = round(120 + random() * (WIDTH - 200))
    const y = round(horizon + 8 + random() * (height - horizon - 20))
    const w = round(10 + random() * 30)
    const dur = round(2.5 + random() * 4)
    return `<rect x="${x}" y="${y}" width="${w}" height="1.5" rx="0.75" fill="${sky.glitter}" opacity="0"><animate attributeName="opacity" values="0;${theme.name === "dark" ? 0.55 : 0.85};0" dur="${dur}s" begin="${round(random() * 4)}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;${round((random() - 0.5) * 60)} 0" dur="${dur}s" begin="${round(random() * 4)}s" repeatCount="indefinite"/></rect>`
  }).join("")
  const boat = `<g><animateMotion dur="38s" repeatCount="indefinite" path="M 600 ${height - 34} C 780 ${height - 40} 1000 ${height - 28} 1260 ${height - 36}"/><g><animateTransform attributeName="transform" type="rotate" values="-2;2;-2" dur="3s" repeatCount="indefinite"/><path d="M-18,0 L18,0 L12,8 L-12,8 Z" fill="${theme.name === "dark" ? "#1f2733" : "#3b4a5c"}"/><line x1="0" y1="0" x2="0" y2="-26" stroke="${theme.name === "dark" ? "#c8cdd6" : "#3b4a5c"}" stroke-width="1.4"/><path d="M1.5,-26 L16,-4 L1.5,-4 Z" fill="${theme.name === "dark" ? "#f1e9d6" : "#ffffff"}"/><path d="M-1.5,-22 L-11,-4 L-1.5,-4 Z" fill="${theme.name === "dark" ? "#dcd2bd" : "#f0f0f0"}"/></g><path d="M-30,10 Q-40,9 -52,11" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.5"/></g>`
  const birds = [0, 1, 2].map((i) => `<path fill="none" stroke="${theme.name === "dark" ? "#c8cdd6" : "#3b4a5c"}" stroke-width="1.3" stroke-linecap="round" opacity="0.7"><animate attributeName="d" values="M-7,1 q3.5,-5 7,0 q3.5,-5 7,0;M-7,-1 q3.5,3 7,0 q3.5,3 7,0;M-7,1 q3.5,-5 7,0 q3.5,-5 7,0" dur="${0.8 + i * 0.15}s" repeatCount="indefinite"/><animateMotion dur="${28 + i * 5}s" begin="${i * 4}s" repeatCount="indefinite" path="M -40 ${70 + i * 22} C 300 ${40 + i * 20} 700 ${96 + i * 10} 1260 ${56 + i * 26}"/></path>`).join("")
  const mountains = `<path d="M0,${horizon} L90,${horizon - 44} L170,${horizon - 18} L250,${horizon - 60} L340,${horizon - 22} L410,${horizon - 40} L470,${horizon - 8} L560,${horizon - 48} L640,${horizon - 14} L700,${horizon - 30} L760,${horizon - 6} L${WIDTH},${horizon} Z" fill="${theme.name === "dark" ? "#141d33" : "#b9cdea"}" opacity="0.9"/><path d="M700,${horizon} L790,${horizon - 30} L870,${horizon - 8} L960,${horizon - 52} L1050,${horizon - 16} L1130,${horizon - 34} L${WIDTH},${horizon - 12} L${WIDTH},${horizon} Z" fill="${theme.name === "dark" ? "#0f172b" : "#a8bfe0"}"/>`
  const body = [
    `<rect width="${WIDTH}" height="${horizon}" fill="url(#hero-sky)"/>`,
    heroSky(theme, random),
    mountains,
    `<rect y="${horizon}" width="${WIDTH}" height="${height - horizon}" fill="url(#hero-sea)"/>`,
    `<rect y="${horizon}" width="${WIDTH}" height="2" fill="${sky.horizon}" opacity="0.6"/>`,
    glitter,
    heroIsland(theme, 930, 214, 1.05),
    boat,
    birds,
    `<rect width="${WIDTH}" height="${height}" fill="url(#hero-vignette)"/>`,
    `<rect x="0" y="0" width="640" height="${height}" fill="url(#hero-text-shade)"/>`,
    `<text x="60" y="150" font-size="74" font-weight="800" letter-spacing="-2.5" fill="url(#hero-name)">${escapeXml(PROFILE.name)}</text>`,
    `<line x1="62" y1="168" x2="62" y2="168" stroke="url(#hero-line)" stroke-width="3" stroke-linecap="round"><animate attributeName="x2" from="62" to="360" dur="1.4s" begin="0.3s" fill="freeze"/></line>`,
    `<text x="60" y="206" font-size="26" font-weight="700" fill="${theme.accent}">${escapeXml(PROFILE.role)}</text>`,
    ...PROFILE.affiliations.map((line, i) => `<text x="60" y="${242 + i * 26}" font-size="17" font-weight="500" fill="${theme.name === "dark" ? "#c9d4e6" : theme.muted}">${escapeXml(line)}</text>`),
    `<text x="60" y="300" font-size="13" font-family="${MONO}" fill="${theme.name === "dark" ? "#8f9db5" : theme.faint}">$ echo ${escapeXml("$FOCUS")}</text>`,
    ...PROFILE.taglines.map((line, i) => `<text x="60" y="328" font-size="21" font-weight="600" fill="${theme.accent2}" textLength="${typing.clips[i].width}" lengthAdjust="spacing" clip-path="url(#hero-type-${i})">${escapeXml(line)}</text>`),
    `<rect y="312" width="3" height="22" fill="${theme.accent2}"><animate attributeName="x" values="${caretTrack.join(";")}" keyTimes="${caretTimes}" dur="${typing.cycle}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite"/></rect>`
  ].join("\n")
  const defs = [
    linearGradient("hero-sky", [["0", sky.top], ["0.7", sky.mid], ["1", sky.horizon]], { x2: "0", y2: "1" }),
    linearGradient("hero-sea", [["0", sky.sea], ["1", sky.seaDeep]], { x2: "0", y2: "1" }),
    linearGradient("hero-name", theme.name === "dark" ? [["0", "#ffffff"], ["1", "#c7d3ea"]] : [["0", "#13294B"], ["1", "#2b4f86"]], { x2: "0", y2: "1" }),
    linearGradient("hero-text-shade", theme.name === "dark" ? [["0", "#05080f", 0.55], ["1", "#05080f", 0]] : [["0", "#ffffff", 0.55], ["1", "#ffffff", 0]]),
    linearGradient("hero-line", [["0", theme.accent], ["1", theme.accent2, 0]]),
    linearGradient("hero-grass", [["0", "#5ccf78"], ["1", "#2f8f50"]], { x2: "0", y2: "1" }),
    linearGradient("hero-cliff", [["0", "#a8743f"], ["1", "#4a2c12"]], { x2: "0", y2: "1" }),
    linearGradient("hero-beam", [["0", "#fff3c4", 0.9], ["1", "#fff3c4", 0]]),
    ...(theme.name === "dark"
      ? [
          linearGradient("hero-shoot", [["0", "#ffffff", 0], ["1", "#ffffff", 0.9]]),
          linearGradient("hero-aurora-0", [["0", "#3fe0a6", 0], ["0.4", "#3fe0a6", 0.7], ["0.7", "#6aa8ff", 0.5], ["1", "#6aa8ff", 0]], { x2: "0", y2: "1" }),
          `<filter id="hero-aurora-warp" x="-10%" y="-40%" width="120%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.02" numOctaves="1" seed="7" result="noise"><animate attributeName="baseFrequency" values="0.004 0.02;0.006 0.026;0.004 0.02" dur="18s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="80" xChannelSelector="R" yChannelSelector="G"/></filter>`
        ]
      : [`<radialGradient id="hero-sun"><stop offset="0" stop-color="#fff6d8"/><stop offset="0.6" stop-color="#ffc659"/><stop offset="1" stop-color="#ff9a3c"/></radialGradient>`]),
    `<filter id="hero-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>`,
    glowFilter("hero-glow", 3),
    `<radialGradient id="hero-vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="${theme.bg}" stop-opacity="0"/><stop offset="1" stop-color="${theme.bg}" stop-opacity="${theme.name === "dark" ? 0.75 : 0.45}"/></radialGradient>`,
    ...typing.clips.map((clip, i) => `<clipPath id="hero-type-${i}"><rect x="60" y="306" height="30" width="${CLIP_FLOOR}"><animate attributeName="width" values="${clip.values}" keyTimes="${clip.keyTimes}" dur="${typing.cycle}s" repeatCount="indefinite"/></rect></clipPath>`)
  ].join("")
  return svgDocument({ id: "hero", width: WIDTH, height, title: `${PROFILE.name}, ${PROFILE.role}`, theme, defs, body })
}

// ---------------------------------------------------------------------------------------------
// Research globe: a wireframe sphere of linked points rotating in 3D, with the research topics
// travelling around it.

export function renderResearchGlobe(theme) {
  const height = 560
  const cx = 600
  const cy = 262
  const size = 128
  const frames = 36
  const duration = 30
  const points = fibonacciSphere(40)
  const links = neighbourLinks(points, 2)
  const steps = Array.from({ length: frames + 1 }, (_, f) => (f / frames) * Math.PI * 2)
  const projected = steps.map((angle) => points.map((p) => project(orient(p, angle, 0.38), { cx, cy, size })))
  const depthOpacity = (z) => round(0.12 + ((z + 1) / 2) * 0.88)
  const linkColor = theme.accent2
  const wires = links
    .map(([i, j]) => {
      const a = projected.map((frame) => frame[i])
      const b = projected.map((frame) => frame[j])
      const anim = (name, values) => `<animate attributeName="${name}" values="${track(values)}" dur="${duration}s" repeatCount="indefinite"/>`
      return `<line stroke="${linkColor}" stroke-width="1" stroke-opacity="0.35">${anim("x1", a.map((p) => p.x))}${anim("y1", a.map((p) => p.y))}${anim("x2", b.map((p) => p.x))}${anim("y2", b.map((p) => p.y))}</line>`
    })
    .join("")
  const dots = points
    .map((_, i) => {
      const positions = projected.map((frame) => frame[i])
      return `<circle r="2.6" fill="${i % 7 === 0 ? theme.accent : linkColor}"><animate attributeName="cx" values="${track(positions.map((p) => p.x))}" dur="${duration}s" repeatCount="indefinite"/><animate attributeName="cy" values="${track(positions.map((p) => p.y))}" dur="${duration}s" repeatCount="indefinite"/><animate attributeName="opacity" values="${track(positions.map((p) => depthOpacity(p.z)))}" dur="${duration}s" repeatCount="indefinite"/></circle>`
    })
    .join("")
  const ring = { rx: 470, ry: 200, duration: 96 }
  const ringPath = `M ${-ring.rx} 0 A ${ring.rx} ${ring.ry} 0 1 1 ${ring.rx} 0 A ${ring.rx} ${ring.ry} 0 1 1 ${-ring.rx} 0`
  const topics = FOCUS.map((item, i) => {
    const label = chip(theme, { x: 0, y: 0, label: item.label, color: i % 2 ? theme.accent2 : theme.accent, size: 13 })
    const begin = round(-(i / FOCUS.length) * ring.duration)
    const color = i % 2 ? theme.accent2 : theme.accent
    const tail = [0.7, 1.4].map((lag, n) => `<circle r="${2.6 - n}" fill="${color}" opacity="${0.4 - n * 0.15}"><animateMotion dur="${ring.duration}s" begin="${round(begin - lag)}s" repeatCount="indefinite"><mpath xlink:href="#globe-ring"/></animateMotion></circle>`).join("")
    return `${tail}<g><animateMotion dur="${ring.duration}s" begin="${begin}s" repeatCount="indefinite"><mpath xlink:href="#globe-ring"/></animateMotion><circle r="5.5" fill="${color}" filter="url(#globe-glow)"/><g transform="translate(${round(-label.width / 2)} 11)">${label.svg}</g></g>`
  }).join("")
  const halo = `<circle cx="${cx}" cy="${cy}" r="${size + 30}" fill="url(#globe-halo)"/>`
  const equator = `<ellipse cx="${cx}" cy="${cy}" rx="${size}" ry="${round(size * 0.38)}" fill="none" stroke="${linkColor}" stroke-opacity="0.25" stroke-dasharray="3 6"/>`
  const pulses = [0, 2.5].map((delay) => `<circle cx="${cx}" cy="${cy}" r="${size}" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0"><animate attributeName="r" values="${size};${size + 90}" dur="5s" begin="${delay}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.35;0" dur="5s" begin="${delay}s" repeatCount="indefinite"/></circle>`).join("")
  const core = `<g transform="translate(${cx} ${cy})"><rect x="-64" y="-26" width="128" height="52" rx="26" fill="${theme.bg}" fill-opacity="0.82" stroke="${theme.border}"/><text y="-3" text-anchor="middle" font-size="16" font-weight="800" fill="${theme.text}">${escapeXml(PROFILE.name)}</text><text y="14" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="2" fill="${theme.accent}">RESEARCH</text></g>`
  const caption = `<text x="${cx}" y="${height - 16}" text-anchor="middle" font-size="14" fill="${theme.muted}">Generative models, world models, and agents that understand 3D space and people.</text>`
  const defs = [
    `<radialGradient id="globe-halo"><stop offset="0.55" stop-color="${theme.accent2}" stop-opacity="0.16"/><stop offset="1" stop-color="${theme.accent2}" stop-opacity="0"/></radialGradient>`,
    glowFilter("globe-glow", 4),
    `<path id="globe-ring" d="${ringPath}"/>`
  ].join("")
  return svgDocument({ id: "research-globe", width: WIDTH, height, title: "Research focus of Qiran Hu", theme, defs, body: [halo, `<g transform="translate(${cx} ${cy})"><use xlink:href="#globe-ring" fill="none" stroke="${theme.border}" stroke-dasharray="2 7"/>${topics}</g>`, pulses, equator, wires, dots, core, caption].join("\n") })
}

// ---------------------------------------------------------------------------------------------
// Featured paper: a shaded icosahedron rotating in real 3D. Front faces are lit by a fixed light;
// back faces switch to zero opacity, so no sorting is needed.

export function shadedIcosahedron({ cx, cy, size, frames = 48, tilt = 0.45, duration = 16, color, edgeColor }) {
  const light = [-0.45, 0.55, 0.7]
  const steps = Array.from({ length: frames + 1 }, (_, f) => (f / frames) * Math.PI * 2)
  const oriented = steps.map((angle) => icosahedron.vertices.map((v) => orient(v, angle, tilt)))
  const screen = oriented.map((frame) => frame.map((v) => project(v, { cx, cy, size })))
  const faces = icosahedron.faces
    .map((face) => {
      const pointsTrack = screen.map((frame) => face.map((i) => `${frame[i].x},${frame[i].y}`).join(" "))
      const opacityTrack = oriented.map((frame) => {
        const normal = faceNormal(frame[face[0]], frame[face[1]], frame[face[2]])
        if (normal[2] <= 0.02) return 0
        const lambert = Math.max(0, normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2])
        return round(0.18 + lambert * 0.62)
      })
      return `<polygon fill="${color}" stroke="none"><animate attributeName="points" values="${track(pointsTrack)}" dur="${duration}s" repeatCount="indefinite"/><animate attributeName="fill-opacity" values="${track(opacityTrack)}" dur="${duration}s" repeatCount="indefinite"/></polygon>`
    })
    .join("")
  const edges = edgesOf(icosahedron.faces)
    .map(([i, j]) => {
      const anim = (name, pick) => `<animate attributeName="${name}" values="${track(screen.map(pick))}" dur="${duration}s" repeatCount="indefinite"/>`
      return `<line stroke="${edgeColor}" stroke-width="1.2" stroke-opacity="0.55" stroke-linecap="round">${anim("x1", (f) => f[i].x)}${anim("y1", (f) => f[i].y)}${anim("x2", (f) => f[j].x)}${anim("y2", (f) => f[j].y)}</line>`
    })
    .join("")
  return `<g>${faces}${edges}</g>`
}

export function renderFeaturedPaper(theme) {
  const height = 240
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "paper" })
  const titleLines = wrap(FEATURED_PAPER.title, 46)
  const stage = `<rect x="44" y="34" width="172" height="172" rx="18" fill="url(#paper-stage)" stroke="${theme.border}"/><ellipse cx="130" cy="188" rx="50" ry="8" fill="${theme.accent2}" opacity="0.2"><animate attributeName="rx" values="44;56;44" dur="16s" repeatCount="indefinite"/></ellipse>${shadedIcosahedron({ cx: 130, cy: 114, size: 54, color: theme.accent2, edgeColor: theme.name === "dark" ? "#dbe9ff" : "#0b3d91" })}<text x="130" y="202" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="1.8" fill="${theme.muted}">3D-AWARE</text>`
  const badges = `<g transform="translate(244 52)"><rect width="92" height="26" rx="13" fill="${theme.accent}" fill-opacity="0.16" stroke="${theme.accent}"/><text x="46" y="18" text-anchor="middle" font-size="13" font-weight="800" fill="${theme.accent}">ECCV 2026</text></g><g transform="translate(346 52)"><rect width="104" height="26" rx="13" fill="${theme.accent3}" fill-opacity="0.18" stroke="${theme.accent3}"/><circle cx="16" cy="13" r="4" fill="${theme.accent3}"><animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite"/></circle><text x="60" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="${theme.accent3}">${escapeXml(FEATURED_PAPER.status)}</text></g><text x="466" y="70" font-size="13" font-family="${MONO}" fill="${theme.faint}">${escapeXml(FEATURED_PAPER.arxiv)}</text>`
  const title = titleLines.map((line, i) => `<text x="244" y="${114 + i * 32}" font-size="26" font-weight="800" letter-spacing="-0.4" fill="${theme.text}">${escapeXml(line)}</text>`).join("")
  const authorParts = FEATURED_PAPER.authors.split(", ").map((author) => (author === PROFILE.name ? `<tspan font-weight="700" fill="${theme.accent}">${escapeXml(author)}</tspan>` : escapeXml(author))).join(", ")
  const authors = `<text x="244" y="${114 + titleLines.length * 32 + 4}" font-size="15" fill="${theme.muted}">${authorParts}</text>`
  const venue = `<text x="244" y="${114 + titleLines.length * 32 + 28}" font-size="14" fill="${theme.faint}">${escapeXml(FEATURED_PAPER.venue)}</text>`
  const cta = `<g transform="translate(1030 182)"><rect width="126" height="34" rx="17" fill="${theme.accent2}" fill-opacity="0.16" stroke="${theme.accent2}"/><text x="56" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${theme.accent2}">Read on arXiv</text><path d="M104 12l6 5-6 5" fill="none" stroke="${theme.accent2}" stroke-width="2"><animateTransform attributeName="transform" type="translate" values="0 0;4 0;0 0" dur="1.4s" repeatCount="indefinite"/></path></g>`
  const shimmer = `<g clip-path="url(#paper-clip)"><rect x="-320" y="0" width="240" height="${height}" fill="url(#paper-shimmer)" transform="skewX(-20)"><animate attributeName="x" from="-320" to="${WIDTH + 200}" dur="7s" repeatCount="indefinite"/></rect></g>`
  const defs = [
    card.defs,
    `<radialGradient id="paper-stage" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="${theme.accent2}" stop-opacity="0.18"/><stop offset="1" stop-color="${theme.accent2}" stop-opacity="0.03"/></radialGradient>`,
    `<clipPath id="paper-clip"><rect x="20" y="14" width="${WIDTH - 40}" height="${height - 28}" rx="20"/></clipPath>`,
    linearGradient("paper-shimmer", [["0", "#ffffff", 0], ["0.5", "#ffffff", theme.name === "dark" ? 0.08 : 0.35], ["1", "#ffffff", 0]])
  ].join("")
  return svgDocument({ id: "featured-paper", width: WIDTH, height, title: FEATURED_PAPER.title, theme, defs, body: [card.rect, shimmer, stage, badges, title, authors, venue, cta].join("\n") })
}

// ---------------------------------------------------------------------------------------------

export function renderSkillsMarquee(theme) {
  const height = 122
  const gap = 12
  const speed = 34
  const rows = SKILL_ROWS.map((row, rowIndex) => {
    let x = 0
    const chips = row.map(([label, category]) => {
      const item = chip(theme, { x, y: 0, label, color: theme[SKILL_COLORS[category]], size: 14 })
      x += item.width + gap
      return item.svg
    })
    const rowWidth = round(x)
    const y = 16 + rowIndex * 52
    const from = rowIndex === 0 ? 0 : -rowWidth
    const to = rowIndex === 0 ? -rowWidth : 0
    return `<g transform="translate(0 ${y})"><g><animateTransform attributeName="transform" type="translate" from="${from} 0" to="${to} 0" dur="${round(rowWidth / speed)}s" repeatCount="indefinite"/>${chips.join("")}<g transform="translate(${rowWidth} 0)">${chips.join("")}</g></g></g>`
  })
  const fades = `<rect width="140" height="${height}" fill="url(#marquee-left)"/><rect x="${WIDTH - 140}" width="140" height="${height}" fill="url(#marquee-right)"/>`
  const defs = linearGradient("marquee-left", [["0", theme.bg], ["1", theme.bg, 0]]) + linearGradient("marquee-right", [["0", theme.bg, 0], ["1", theme.bg]])
  return svgDocument({ id: "skills-marquee", width: WIDTH, height, title: "Tools and skills", theme, defs, body: [...rows, fades].join("\n") })
}

const LINK_ICONS = {
  spark: `<path d="M0,-9 L2.4,-2.4 L9,0 L2.4,2.4 L0,9 L-2.4,2.4 L-9,0 L-2.4,-2.4 Z" fill="currentColor"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite"/></path>`,
  globe: `<circle r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse rx="3.5" ry="8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M-8,0 H8 M-6.5,-4.5 H6.5 M-6.5,4.5 H6.5" stroke="currentColor" stroke-width="1.2"/>`,
  cap: `<path d="M-9,-2 L0,-6.5 L9,-2 L0,2.5 Z" fill="currentColor"/><path d="M-5,0 V4 Q0,7.5 5,4 V0" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8,-1.5 V4" stroke="currentColor" stroke-width="1.6"/>`,
  in: `<rect x="-8" y="-8" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M-4.5,-1 V5 M-4.5,-4.2 V-4 M0,5 V-1 M0,1.5 Q1.5,-1.5 4.5,0.5 V5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  x: `<path d="M-7,-8 L7,8 M7,-8 L-7,8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`
}

// One small clickable card per link; the README wraps each image in an anchor.
export function renderLinkButton(theme, link) {
  const height = 60
  const width = link.width
  const accent = link.id === "collab" ? theme.accent : theme.accent2
  const ink = link.id === "collab" ? theme.accent : theme.text
  const shimmer = `<g clip-path="url(#link-${link.id}-clip)"><rect x="-120" y="0" width="90" height="${height}" fill="url(#link-${link.id}-shine)" transform="skewX(-22)"><animate attributeName="x" from="-120" to="${width + 100}" dur="${round(4 + width / 120)}s" repeatCount="indefinite"/></rect></g>`
  const body = [
    `<rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="16" fill="url(#link-${link.id}-glass)" stroke="url(#link-${link.id}-border)" stroke-width="1.5"/>`,
    `<rect x="3" y="3" width="${width - 6}" height="${height / 2 - 4}" rx="14" fill="#ffffff" opacity="${theme.name === "dark" ? 0.05 : 0.5}"/>`,
    shimmer,
    `<circle cx="30" cy="${height / 2}" r="15" fill="${accent}" fill-opacity="0.14"/>`,
    `<g transform="translate(30 ${height / 2})" style="color:${accent}">${LINK_ICONS[link.icon]}</g>`,
    `<text x="54" y="${height / 2 + 5.5}" font-size="15" font-weight="700" fill="${ink}">${escapeXml(link.label)}</text>`,
    `<path d="M${width - 30},${height / 2 - 5} l5,5 -5,5" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0 0;3 0;0 0" dur="1.6s" repeatCount="indefinite"/></path>`
  ].join("")
  const defs = [
    linearGradient(`link-${link.id}-glass`, [["0", theme.cardTop], ["1", theme.card]], { x2: "0", y2: "1" }),
    linearGradient(`link-${link.id}-border`, [["0", accent, 0.9], ["0.5", theme.border], ["1", accent, 0.9]]),
    `<clipPath id="link-${link.id}-clip"><rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="16"/></clipPath>`,
    linearGradient(`link-${link.id}-shine`, [["0", "#ffffff", 0], ["0.5", "#ffffff", theme.name === "dark" ? 0.12 : 0.5], ["1", "#ffffff", 0]])
  ].join("")
  return svgDocument({ id: `link-${link.id}`, width, height, title: link.label, theme, defs, body })
}

// Sea footer: layered waves built from identical 300px cycles (so the loop never jumps) and a
// sailboat crossing slowly.
export function renderFooter(theme) {
  const height = 110
  const cycle = 300
  const wave = (amplitude, baseline, color, opacity, duration) => {
    let d = `M0 ${baseline}`
    for (let i = 0; i < 6; i += 1) d += ` q 75 ${-amplitude} 150 0 t 150 0`
    d += ` V ${height} H 0 Z`
    return `<path d="${d}" fill="${color}" opacity="${opacity}"><animateTransform attributeName="transform" type="translate" from="0 0" to="${-cycle} 0" dur="${duration}s" repeatCount="indefinite"/></path>`
  }
  const boat = `<g><animateMotion dur="40s" repeatCount="indefinite" path="M -40 62 C 300 58 700 66 1240 60"/><g transform="scale(0.8)"><path d="M-16,0 L16,0 L11,7 L-11,7 Z" fill="${theme.name === "dark" ? "#dbe4f2" : "#2b4f86"}"/><line x1="0" y1="0" x2="0" y2="-24" stroke="${theme.name === "dark" ? "#dbe4f2" : "#2b4f86"}" stroke-width="1.4"/><path d="M0,-24 L14,-4 L0,-4 Z" fill="${theme.name === "dark" ? "#dbe4f2" : "#2b4f86"}"/><animateTransform attributeName="transform" type="rotate" values="-3;3;-3" dur="3s" repeatCount="indefinite" additive="sum"/></g></g>`
  const body = [wave(14, 64, theme.accent2, 0.3, 9), boat, wave(18, 74, theme.accent2, 0.35, 13), wave(12, 84, theme.accent, 0.45, 7)].join("")
  return svgDocument({ id: "footer", width: WIDTH, height, title: "Footer", theme, body })
}

export const STATIC_ASSETS = {
  hero: renderHero,
  "research-globe": renderResearchGlobe,
  "featured-paper": renderFeaturedPaper,
  "skills-marquee": renderSkillsMarquee,
  footer: renderFooter,
  ...Object.fromEntries(LINKS.map((link) => [`link-${link.id}`, (theme) => renderLinkButton(theme, link)]))
}
