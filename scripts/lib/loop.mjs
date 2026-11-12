import { displayHost, initials } from './format.mjs';
import { escapeHtml, num } from './html.mjs';

/**
 * The "living loop" on the homepage: every member as a node on one closed path,
 * in ring order, starting at 12 o'clock and running clockwise.
 *
 *   1-24 members   circle, large nodes with initials
 *   25-90 members  circle, smaller nodes, no initials
 *   91+ members    a coil (a spiral of 2-8 turns) so nodes never overlap
 */

const CENTER = 200;
const SWATCH_COUNT = 4;

const SMALL_RING = { maxCount: 24, radius: 150, minNode: 14, maxNode: 26, fill: 0.38 };
const LARGE_RING = { maxCount: 90, radius: 160, minNode: 4, maxNode: 13, fill: 0.36 };
const COIL = { outer: 172, inner: 88, minSpacing: 11, minTurns: 2, maxTurns: 8, minNode: 2.5, maxNode: 6 };
const COIL_SAMPLES = 2400;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const polar = (radius, angle) => ({ x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) });
const TOP = -Math.PI / 2;

/** Node positions and sizes for `count` members. Pure, so it is easy to test. */
export function layoutLoop(count) {
  if (count === 0) return { shape: 'circle', radius: SMALL_RING.radius, nodeRadius: 0, showInitials: false, nodes: [] };
  if (count <= SMALL_RING.maxCount) return circleLayout(count, SMALL_RING, true);
  if (count <= LARGE_RING.maxCount) return circleLayout(count, LARGE_RING, false);
  return coilLayout(count);
}

function circleLayout(count, ring, showInitials) {
  const spacing = (2 * Math.PI * ring.radius) / count;
  return {
    shape: 'circle',
    radius: ring.radius,
    nodeRadius: clamp(spacing * ring.fill, ring.minNode, ring.maxNode),
    showInitials,
    nodes: Array.from({ length: count }, (_, i) => polar(ring.radius, TOP + (2 * Math.PI * i) / count)),
  };
}

function coilLayout(count) {
  const meanCircumference = Math.PI * (COIL.outer + COIL.inner);
  const turns = clamp(Math.ceil((count * COIL.minSpacing) / meanCircumference), COIL.minTurns, COIL.maxTurns);
  const samples = sampleSpiral(turns);
  const spacing = samples.at(-1).length / (count - 1);

  const nodes = [];
  let j = 0;
  for (let i = 0; i < count; i++) {
    const target = i * spacing;
    while (j < samples.length - 2 && samples[j + 1].length < target) j++;
    const a = samples[j];
    const b = samples[j + 1];
    const t = clamp((target - a.length) / (b.length - a.length), 0, 1);
    nodes.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }

  return {
    shape: 'coil',
    turns,
    nodeRadius: clamp(spacing * 0.36, COIL.minNode, COIL.maxNode),
    showInitials: false,
    nodes,
    path: samples.filter((_, k) => k % 8 === 0 || k === samples.length - 1),
  };
}

/** Points along an inward spiral with their cumulative arc length. */
function sampleSpiral(turns) {
  const points = [];
  let length = 0;
  for (let k = 0; k <= COIL_SAMPLES; k++) {
    const u = k / COIL_SAMPLES;
    const point = polar(COIL.outer - (COIL.outer - COIL.inner) * u, TOP + 2 * Math.PI * turns * u);
    if (k > 0) length += Math.hypot(point.x - points.at(-1).x, point.y - points.at(-1).y);
    points.push({ ...point, length });
  }
  return points;
}

/** Render the loop as an inline SVG string. The last member is "newest". */
export function renderLoop(members) {
  const layout = layoutLoop(members.length);
  const count = members.length;
  const summary =
    count === 0
      ? 'An empty loop, waiting for its first member.'
      : `${count} member ${count === 1 ? 'site' : 'sites'} linked in a loop.`;

  return [
    '<svg class="loop" viewBox="0 0 400 400" role="img" aria-labelledby="loop-title" data-loop>',
    `<title id="loop-title">${escapeHtml(summary)}</title>`,
    '<defs><marker id="loop-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
    '<path class="loop-arrowhead" d="M0 0L10 5L0 10Z"/></marker></defs>',
    renderTrack(layout),
    renderArrow(layout),
    ...members.map((member, index) => renderNode(member, index, layout, index === count - 1)),
    renderCenter(count),
    '</svg>',
  ].join('\n');
}

function renderTrack(layout) {
  if (layout.shape === 'circle') {
    return `<circle class="loop-track" cx="${CENTER}" cy="${CENTER}" r="${layout.radius}"/>`;
  }
  const d = layout.path.map((p, i) => `${i === 0 ? 'M' : 'L'}${num(p.x)} ${num(p.y)}`).join('');
  const first = layout.nodes[0];
  const last = layout.nodes.at(-1);
  return [
    `<path class="loop-track" d="${d}"/>`,
    `<line class="loop-track loop-track--wrap" x1="${num(last.x)}" y1="${num(last.y)}" x2="${num(first.x)}" y2="${num(first.y)}"/>`,
  ].join('\n');
}

/** A short arrow from the first node toward the second, showing direction of travel. */
function renderArrow(layout) {
  if (layout.shape !== 'circle' || !layout.showInitials || layout.nodes.length < 2) return '';
  const gap = (layout.nodeRadius + 6) / layout.radius;
  const step = (2 * Math.PI) / layout.nodes.length;
  const start = polar(layout.radius, TOP + gap);
  const end = polar(layout.radius, TOP + step - gap);
  return `<path class="loop-arrow" d="M${num(start.x)} ${num(start.y)}A${layout.radius} ${layout.radius} 0 0 1 ${num(end.x)} ${num(end.y)}" marker-end="url(#loop-arrow)"/>`;
}

function renderNode(member, index, layout, isNewest) {
  const { x, y } = layout.nodes[index];
  const r = layout.nodeRadius;
  const classes = ['loop-node', `swatch-${index % SWATCH_COUNT}`, isNewest ? 'is-newest' : ''].filter(Boolean).join(' ');
  const label = `${member.name} · ${displayHost(member.website)}`;
  const fontSize = r * 0.62;
  // Nodes are not links: the SVG is a single image to assistive technology, and
  // the member list below it has the real links.
  return [
    `<g class="${classes}">`,
    `<title>${escapeHtml(label)}</title>`,
    isNewest ? `<circle class="loop-halo" cx="${num(x)}" cy="${num(y)}" r="${num(r + Math.max(3, r * 0.2))}"/>` : '',
    `<circle class="loop-dot" cx="${num(x)}" cy="${num(y)}" r="${num(r)}"/>`,
    layout.showInitials
      ? `<text class="loop-initials" x="${num(x)}" y="${num(y + fontSize * 0.36)}" font-size="${num(fontSize)}" text-anchor="middle">${escapeHtml(initials(member.name))}</text>`
      : '',
    '</g>',
  ]
    .filter(Boolean)
    .join('');
}

function renderCenter(count) {
  const label = count === 0 ? 'be the first to join' : `${count === 1 ? 'site' : 'sites'} in the loop`;
  return [
    `<text class="loop-count" x="${CENTER}" y="${CENTER - 4}" text-anchor="middle">${count}</text>`,
    `<text class="loop-label" x="${CENTER}" y="${CENTER + 22}" text-anchor="middle">${label}</text>`,
  ].join('\n');
}
