// Hand-designed, animated SVG cards for the profile README. Everything is plain SVG with SMIL
// animation, so GitHub's image proxy can serve it and no external service is involved.
import { FEATURED_PAPER, FOCUS, PROFILE, SKILL_COLORS, SKILL_ROWS, TIMELINE } from "./profile-data.mjs"
import { MONO, cardFrame, chip, escapeXml, rng, round, svgDocument, textWidth } from "./svg.mjs"

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

function fadeCycle(index, count, seconds) {
  const window = 1 / count
  const fade = window * 0.15
  const keyTimes = `0;${round(fade)};${round(window - fade)};${round(window)};1`
  return {
    opacity: `<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="${keyTimes}" dur="${seconds}s" begin="${round(index * (seconds / count))}s" repeatCount="indefinite"/>`,
    slide: `<animateTransform attributeName="transform" type="translate" values="0 10;0 0;0 0;0 -10;0 -10" keyTimes="${keyTimes}" dur="${seconds}s" begin="${round(index * (seconds / count))}s" repeatCount="indefinite"/>`
  }
}

export function renderHero(theme) {
  const height = 340
  const random = rng(7)
  const particles = Array.from({ length: 40 }, () => {
    const x = round(random() * WIDTH)
    const y = round(60 + random() * (height - 60))
    const r = round(1 + random() * 2.2)
    const dur = round(7 + random() * 9)
    const delay = round(random() * 7)
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${theme.accent2}" opacity="0"><animate attributeName="opacity" values="0;0.9;0" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 -46" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></circle>`
  }).join("")
  const blobOpacity = theme.name === "dark" ? 0.2 : 0.14
  const blobs = [
    { cx: 170, cy: 80, r: 230, color: theme.accent2, dur: 19, dx: 50, dy: -20 },
    { cx: 1040, cy: 260, r: 270, color: theme.accent, dur: 23, dx: -60, dy: 30 },
    { cx: 690, cy: 30, r: 190, color: theme.accent4, dur: 27, dx: 30, dy: 40 }
  ]
    .map((b) => `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="${b.color}" opacity="${blobOpacity}" filter="url(#hero-blur)"><animateTransform attributeName="transform" type="translate" values="0 0;${b.dx} ${b.dy};0 0" dur="${b.dur}s" repeatCount="indefinite"/></circle>`)
    .join("")
  const ringColors = [theme.accent, theme.accent2, theme.accent3]
  const rings = [150, 108, 68]
    .map((r, i) => {
      const ry = round(r * 0.42)
      const tilt = -18 + i * 14
      return `<g transform="translate(985 170) rotate(${tilt})"><ellipse rx="${r}" ry="${ry}" fill="none" stroke="${theme.accent2}" stroke-opacity="${round(0.38 - i * 0.08)}" stroke-width="1.2"/><circle r="${5 - i}" fill="${ringColors[i]}"><animateMotion dur="${8 + i * 5}s" repeatCount="indefinite" path="M ${r} 0 A ${r} ${ry} 0 1 1 ${-r} 0 A ${r} ${ry} 0 1 1 ${r} 0"/></circle></g>`
    })
    .join("")
  const core = `<g transform="translate(985 170)"><circle r="34" fill="${theme.accent}" opacity="0.25"><animate attributeName="r" values="30;44;30" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.3;0.08;0.3" dur="4s" repeatCount="indefinite"/></circle><circle r="22" fill="url(#hero-core)"/></g>`
  const taglines = PROFILE.taglines
    .map((line, i) => {
      const cycle = fadeCycle(i, PROFILE.taglines.length, 13.5)
      return `<g opacity="0">${cycle.opacity}<text x="60" y="308" font-size="21" font-weight="600" fill="${theme.accent2}">${escapeXml(line)}${cycle.slide}</text></g>`
    })
    .join("")
  const body = [
    blobs,
    `<rect width="${WIDTH}" height="${height}" fill="url(#hero-grid)"/>`,
    particles,
    rings,
    core,
    `<text x="60" y="140" font-size="66" font-weight="800" letter-spacing="-1.5" fill="${theme.text}">${escapeXml(PROFILE.name)}</text>`,
    `<text x="60" y="190" font-size="26" font-weight="700" fill="${theme.accent}">${escapeXml(PROFILE.role)}</text>`,
    ...PROFILE.affiliations.map((line, i) => `<text x="60" y="${226 + i * 26}" font-size="17" fill="${theme.muted}">${escapeXml(line)}</text>`),
    `<text x="60" y="282" font-size="13" font-family="${MONO}" fill="${theme.faint}">$ echo ${escapeXml("$FOCUS")}</text>`,
    taglines
  ].join("\n")
  const defs = [
    `<filter id="hero-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="46"/></filter>`,
    `<radialGradient id="hero-core"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="${theme.accent}"/><stop offset="1" stop-color="${theme.glow}"/></radialGradient>`,
    `<pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${theme.grid}"/></pattern>`
  ].join("")
  return svgDocument({ id: "hero", width: WIDTH, height, title: `${PROFILE.name}, ${PROFILE.role}`, theme, defs, body })
}

// Nodes travel along two ellipses (animateMotion) instead of rotating a group, so the chips stay
// upright and the inner and outer rings never cross: the inner chips always sit inside the band
// the outer chips move in.
export function renderResearchOrbit(theme) {
  const height = 560
  const cx = 600
  const cy = 262
  const rings = {
    1: { rx: 200, ry: 110, duration: 48, color: theme.accent, sweep: 1 },
    2: { rx: 420, ry: 220, duration: 84, color: theme.accent2, sweep: 0 }
  }
  const ringPath = (ring) => `M ${-ring.rx} 0 A ${ring.rx} ${ring.ry} 0 1 ${ring.sweep} ${ring.rx} 0 A ${ring.rx} ${ring.ry} 0 1 ${ring.sweep} ${-ring.rx} 0`
  const groups = [1, 2].map((ringIndex) => {
    const ring = rings[ringIndex]
    const items = FOCUS.filter((item) => item.ring === ringIndex)
    const nodes = items
      .map((item, i) => {
        const label = chip(theme, { x: 0, y: 0, label: item.label, color: ring.color, size: 13 })
        const begin = round(-(i / items.length) * ring.duration)
        return `<g><animateMotion dur="${ring.duration}s" begin="${begin}s" repeatCount="indefinite"><mpath xlink:href="#orbit-ring-${ringIndex}"/></animateMotion><circle r="6" fill="${ring.color}"><animate attributeName="r" values="6;8;6" dur="2.4s" repeatCount="indefinite"/></circle><g transform="translate(${round(-label.width / 2)} 12)">${label.svg}</g></g>`
      })
      .join("")
    return `<g transform="translate(${cx} ${cy})"><use xlink:href="#orbit-ring-${ringIndex}" fill="none" stroke="${ring.color}" stroke-opacity="0.3" stroke-dasharray="2 6"/>${nodes}</g>`
  })
  const core = `<g transform="translate(${cx} ${cy})"><circle r="70" fill="${theme.accent}" opacity="0.18"><animate attributeName="r" values="62;84;62" dur="5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.22;0.06;0.22" dur="5s" repeatCount="indefinite"/></circle><circle r="52" fill="url(#orbit-core)" stroke="${theme.border}"/><text y="-4" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff">${escapeXml(PROFILE.name)}</text><text y="16" text-anchor="middle" font-size="11" font-weight="600" letter-spacing="1.5" fill="#ffffff">RESEARCH</text></g>`
  const caption = `<text x="${cx}" y="${height - 16}" text-anchor="middle" font-size="14" fill="${theme.muted}">Generative models, world models, and agents that understand 3D space and people.</text>`
  const defs = [
    `<radialGradient id="orbit-core"><stop offset="0" stop-color="#e2562b"/><stop offset="1" stop-color="#9a3115"/></radialGradient>`,
    ...[1, 2].map((ringIndex) => `<path id="orbit-ring-${ringIndex}" d="${ringPath(rings[ringIndex])}"/>`)
  ].join("")
  return svgDocument({ id: "research-orbit", width: WIDTH, height, title: "Research focus of Qiran Hu", theme, defs, body: [...groups, core, caption].join("\n") })
}

export function renderFeaturedPaper(theme) {
  const height = 230
  const card = cardFrame(theme, { x: 20, y: 14, width: WIDTH - 40, height: height - 28, radius: 20, id: "paper" })
  const titleLines = wrap(FEATURED_PAPER.title, 46)
  const badge = `<g transform="translate(52 48)"><rect width="150" height="112" rx="16" fill="${theme.accent}" opacity="0.14"/><rect width="150" height="112" rx="16" fill="none" stroke="${theme.accent}" stroke-opacity="0.6"><animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/></rect><text x="75" y="46" text-anchor="middle" font-size="30" font-weight="800" fill="${theme.accent}">ECCV</text><text x="75" y="76" text-anchor="middle" font-size="22" font-weight="700" fill="${theme.text}">2026</text><text x="75" y="98" text-anchor="middle" font-size="11" font-weight="600" letter-spacing="1.5" fill="${theme.muted}">FEATURED PAPER</text></g>`
  const status = `<g transform="translate(232 52)"><rect width="104" height="26" rx="13" fill="${theme.accent3}" fill-opacity="0.18" stroke="${theme.accent3}"/><circle cx="16" cy="13" r="4" fill="${theme.accent3}"><animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite"/></circle><text x="60" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="${theme.accent3}">${escapeXml(FEATURED_PAPER.status)}</text></g>`
  const arxiv = `<text x="352" y="70" font-size="13" font-family="${MONO}" fill="${theme.faint}">${escapeXml(FEATURED_PAPER.arxiv)}</text>`
  const title = titleLines.map((line, i) => `<text x="232" y="${112 + i * 32}" font-size="26" font-weight="700" fill="${theme.text}">${escapeXml(line)}</text>`).join("")
  const authorParts = FEATURED_PAPER.authors.split(", ").map((author) => (author === PROFILE.name ? `<tspan font-weight="700" fill="${theme.accent}">${escapeXml(author)}</tspan>` : escapeXml(author))).join(", ")
  const authors = `<text x="232" y="${112 + titleLines.length * 32 + 4}" font-size="15" fill="${theme.muted}">${authorParts}</text>`
  const venue = `<text x="232" y="${112 + titleLines.length * 32 + 28}" font-size="14" fill="${theme.faint}">${escapeXml(FEATURED_PAPER.venue)}</text>`
  const cta = `<g transform="translate(1030 172)"><rect width="126" height="34" rx="17" fill="${theme.accent2}" fill-opacity="0.16" stroke="${theme.accent2}"/><text x="56" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${theme.accent2}">Read on arXiv</text><path d="M104 12l6 5-6 5" fill="none" stroke="${theme.accent2}" stroke-width="2"><animateTransform attributeName="transform" type="translate" values="0 0;4 0;0 0" dur="1.4s" repeatCount="indefinite"/></path></g>`
  const shimmer = `<g clip-path="url(#paper-clip)"><rect x="-320" y="0" width="240" height="${height}" fill="url(#paper-shimmer)" transform="skewX(-20)"><animate attributeName="x" from="-320" to="${WIDTH + 200}" dur="6s" repeatCount="indefinite"/></rect></g>`
  const defs = [
    card.defs,
    `<clipPath id="paper-clip"><rect x="20" y="14" width="${WIDTH - 40}" height="${height - 28}" rx="20"/></clipPath>`,
    `<linearGradient id="paper-shimmer" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="${theme.name === "dark" ? 0.09 : 0.35}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`
  ].join("")
  return svgDocument({ id: "featured-paper", width: WIDTH, height, title: FEATURED_PAPER.title, theme, defs, body: [card.rect, shimmer, badge, status, arxiv, title, authors, venue, cta].join("\n") })
}

const TIMELINE_COLORS = { education: "accent2", teaching: "accent3", research: "accent", award: "accent4", paper: "accent" }

// Milestones are spaced evenly (several land in the same year) and long labels wrap.
export function renderTimeline(theme) {
  const height = 360
  const left = 80
  const right = WIDTH - 80
  const baseline = 182
  const lineLength = right - left
  const line = `<line x1="${left}" y1="${baseline}" x2="${right}" y2="${baseline}" stroke="${theme.border}" stroke-width="2"/><line x1="${left}" y1="${baseline}" x2="${right}" y2="${baseline}" stroke="url(#timeline-line)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${lineLength}" stroke-dashoffset="${lineLength}"><animate attributeName="stroke-dashoffset" from="${lineLength}" to="0" dur="2.6s" fill="freeze"/></line>`
  const nodes = TIMELINE.map((item, i) => {
    const x = round(left + (i / (TIMELINE.length - 1)) * lineLength)
    const color = theme[TIMELINE_COLORS[item.kind]]
    const above = i % 2 === 0
    const labelLines = wrap(item.label, 26)
    const detailLines = wrap(item.detail, 34)
    const blockHeight = labelLines.length * 19 + detailLines.length * 17
    const top = above ? baseline - 34 - blockHeight : baseline + 46
    const dateY = above ? baseline + 30 : baseline - 22
    const begin = round(0.4 + i * 0.4)
    const anchor = i === 0 ? "start" : i === TIMELINE.length - 1 ? "end" : "middle"
    const label = labelLines.map((line, n) => `<text x="${x}" y="${top + 15 + n * 19}" text-anchor="${anchor}" font-size="15" font-weight="700" fill="${theme.text}">${escapeXml(line)}</text>`).join("")
    const detail = detailLines.map((line, n) => `<text x="${x}" y="${top + 15 + labelLines.length * 19 + n * 17}" text-anchor="${anchor}" font-size="12.5" fill="${theme.muted}">${escapeXml(line)}</text>`).join("")
    return `<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${begin}s" dur="0.5s" fill="freeze"/><g transform="translate(${x} ${baseline})"><g transform="scale(0)"><animateTransform attributeName="transform" type="scale" values="0.2;1.18;1" begin="${begin}s" dur="0.6s" fill="freeze"/><circle r="14" fill="${color}" opacity="0.22"><animate attributeName="r" values="12;20;12" dur="3s" begin="${begin}s" repeatCount="indefinite"/></circle><circle r="8" fill="${color}" stroke="${theme.bg}" stroke-width="3"/></g><line x1="0" y1="${above ? -12 : 12}" x2="0" y2="${above ? -28 : 28}" stroke="${color}" stroke-opacity="0.6"/></g><text x="${x}" y="${dateY}" text-anchor="middle" font-size="12" font-family="${MONO}" fill="${theme.faint}">${escapeXml(item.date)}</text>${label}${detail}</g>`
  }).join("\n")
  const legend = Object.entries(TIMELINE_COLORS)
    .filter(([kind]) => kind !== "paper")
    .map(([kind, token], i) => `<g transform="translate(${80 + i * 120} ${height - 22})"><circle r="5" fill="${theme[token]}"/><text x="12" y="4" font-size="12" fill="${theme.muted}">${escapeXml(kind[0].toUpperCase() + kind.slice(1))}</text></g>`)
    .join("")
  const defs = `<linearGradient id="timeline-line" x1="0" x2="1"><stop offset="0" stop-color="${theme.accent2}"/><stop offset="0.6" stop-color="${theme.accent}"/><stop offset="1" stop-color="${theme.accent4}"/></linearGradient>`
  return svgDocument({ id: "timeline", width: WIDTH, height, title: "Journey of Qiran Hu", theme, defs, body: [line, nodes, legend].join("\n") })
}

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
  const defs = `<linearGradient id="marquee-left" x1="0" x2="1"><stop offset="0" stop-color="${theme.bg}"/><stop offset="1" stop-color="${theme.bg}" stop-opacity="0"/></linearGradient><linearGradient id="marquee-right" x1="0" x2="1"><stop offset="0" stop-color="${theme.bg}" stop-opacity="0"/><stop offset="1" stop-color="${theme.bg}"/></linearGradient>`
  return svgDocument({ id: "skills-marquee", width: WIDTH, height, title: "Tools and skills", theme, defs, body: [...rows, fades].join("\n") })
}

// Each wave is built from identical 300px cycles and shifted by exactly one cycle per loop, so
// the animation never jumps.
export function renderFooter(theme) {
  const height = 96
  const cycle = 300
  const wave = (amplitude, baseline, color, opacity, duration) => {
    let d = `M0 ${baseline}`
    for (let i = 0; i < 6; i += 1) d += ` q 75 ${-amplitude} 150 0 t 150 0`
    d += ` V ${height} H 0 Z`
    return `<path d="${d}" fill="${color}" opacity="${opacity}"><animateTransform attributeName="transform" type="translate" from="0 0" to="${-cycle} 0" dur="${duration}s" repeatCount="indefinite"/></path>`
  }
  const body = [wave(14, 54, theme.accent2, 0.35, 9), wave(18, 62, theme.accent4, 0.3, 13), wave(12, 70, theme.accent, 0.5, 7)].join("")
  return svgDocument({ id: "footer", width: WIDTH, height, title: "Footer", theme, body })
}

export const STATIC_ASSETS = {
  hero: renderHero,
  "research-orbit": renderResearchOrbit,
  "featured-paper": renderFeaturedPaper,
  timeline: renderTimeline,
  "skills-marquee": renderSkillsMarquee,
  footer: renderFooter
}
