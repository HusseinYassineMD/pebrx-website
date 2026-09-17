/**
 * Neural hero overlay — matches the original mesh style (glow nodes + halos + curved edges),
 * with more clusters and nodes for a richer field.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WIDTH = 3840;
const HEIGHT = 960;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function edgePath(a, b) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = len * 0.09 * (a.id % 2 === 0 ? 1 : -1);
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

const rand = mulberry32(9162026);

/** Original cluster layout, expanded with gap-fillers for a fuller canvas. */
const clusterSeeds = [
  { cx: 337, cy: 389, count: 14, spread: 108 },
  { cx: 441, cy: 492, count: 10, spread: 72 },
  { cx: 503, cy: 625, count: 13, spread: 105 },
  { cx: 792, cy: 295, count: 12, spread: 98 },
  { cx: 680, cy: 430, count: 11, spread: 88 },
  { cx: 1051, cy: 493, count: 14, spread: 110 },
  { cx: 1180, cy: 580, count: 11, spread: 92 },
  { cx: 1271, cy: 684, count: 12, spread: 95 },
  { cx: 1455, cy: 352, count: 10, spread: 78 },
  { cx: 1593, cy: 319, count: 13, spread: 102 },
  { cx: 1751, cy: 779, count: 11, spread: 88 },
  { cx: 1827, cy: 549, count: 14, spread: 108 },
  { cx: 1980, cy: 660, count: 11, spread: 90 },
  { cx: 2101, cy: 435, count: 12, spread: 98 },
  { cx: 2359, cy: 726, count: 12, spread: 95 },
  { cx: 2629, cy: 304, count: 13, spread: 105 },
  { cx: 2510, cy: 480, count: 11, spread: 88 },
  { cx: 2846, cy: 525, count: 13, spread: 100 },
  { cx: 2972, cy: 780, count: 11, spread: 88 },
  { cx: 3103, cy: 376, count: 13, spread: 102 },
  { cx: 3341, cy: 611, count: 12, spread: 98 },
  { cx: 3563, cy: 461, count: 12, spread: 95 },
  { cx: 920, cy: 720, count: 10, spread: 82 },
  { cx: 1480, cy: 620, count: 10, spread: 85 },
  { cx: 2240, cy: 560, count: 10, spread: 84 },
  { cx: 2760, cy: 680, count: 10, spread: 82 },
];

const nodes = [];
let id = 0;

for (const seed of clusterSeeds) {
  for (let i = 0; i < seed.count; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * seed.spread;
    nodes.push({
      id: id++,
      x: Math.max(30, Math.min(WIDTH - 30, seed.cx + Math.cos(angle) * r)),
      y: Math.max(30, Math.min(HEIGHT - 30, seed.cy + Math.sin(angle) * r * 0.72)),
      cluster: seed.cx,
    });
  }
}

const edgeSet = new Set();
const edges = [];

function addEdge(a, b) {
  const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
  if (edgeSet.has(key)) return;
  edgeSet.add(key);
  const d = dist(a, b);
  const sameCluster = a.cluster === b.cluster;
  let opacity = sameCluster ? 0.44 + rand() * 0.2 : 0.28 + rand() * 0.12;
  if (d > 140) opacity *= 0.82;
  const width = d > 150 ? 0.9 : 1.1;
  const dashed = !sameCluster || d > 130 || rand() < 0.16;
  edges.push({ a, b, opacity, width, dashed });
}

for (const node of nodes) {
  const neighbors = nodes
    .filter((n) => n.id !== node.id)
    .map((n) => ({ n, d: dist(node, n) }))
    .sort((x, y) => x.d - y.d);

  const local = neighbors.filter(({ d }) => d < 128);
  const connectCount = 3 + Math.floor(rand() * 2);
  for (let i = 0; i < Math.min(connectCount, local.length); i++) {
    addEdge(node, local[i].n);
  }

  if (rand() > 0.62 && local.length > 4) {
    addEdge(node, local[3 + Math.floor(rand() * 2)].n);
  }
}

for (let i = 0; i < clusterSeeds.length - 1; i++) {
  const a = clusterSeeds[i];
  const b = clusterSeeds[i + 1];
  if (Math.abs(a.cy - b.cy) > 260) continue;
  const nodeA = nodes
    .filter((n) => n.cluster === a.cx)
    .sort((p, q) => Math.abs(p.x - b.cx) - Math.abs(q.x - b.cx))[0];
  const nodeB = nodes
    .filter((n) => n.cluster === b.cx)
    .sort((p, q) => Math.abs(p.x - a.cx) - Math.abs(q.x - a.cx))[0];
  if (nodeA && nodeB && dist(nodeA, nodeB) < 400) addEdge(nodeA, nodeB);
}

const degree = new Map(nodes.map((n) => [n.id, 0]));
for (const { a, b } of edges) {
  degree.set(a.id, degree.get(a.id) + 1);
  degree.set(b.id, degree.get(b.id) + 1);
}

const pathLines = edges
  .map(({ a, b, opacity, width, dashed }) => {
    const dash = dashed ? ' stroke-dasharray="4 7"' : '';
    return `    <path d="${edgePath(a, b)}" stroke-width="${width.toFixed(1)}" stroke-opacity="${opacity.toFixed(2)}"${dash}/>`;
  })
  .join('\n');

const haloNodes = [];
for (const seed of clusterSeeds) {
  const clusterNodes = nodes
    .filter((n) => n.cluster === seed.cx)
    .sort((a, b) => degree.get(b.id) - degree.get(a.id));
  const hubCount = 2 + Math.floor(rand() * 2);
  for (const hub of clusterNodes.slice(0, hubCount)) {
    if (degree.get(hub.id) >= 3) haloNodes.push(hub);
  }
}
const halos = haloNodes
  .map((n) => {
    const r = 36 + rand() * 6;
    const op = 0.038 + rand() * 0.032;
    return `    <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r.toFixed(1)}" fill-opacity="${op.toFixed(3)}"/>`;
  })
  .join('\n');

const glowNodes = nodes
  .map((n) => {
    const deg = degree.get(n.id);
    const r = deg >= 5 ? 4.2 + rand() * 1.0 : deg >= 4 ? 3.2 + rand() * 1.3 : deg >= 3 ? 2.4 + rand() * 0.8 : 2.0 + rand() * 0.6;
    const op = deg >= 4 ? 0.62 + rand() * 0.22 : 0.45 + rand() * 0.18;
    return `    <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r.toFixed(1)}" fill-opacity="${op.toFixed(2)}"/>`;
  })
  .join('\n');

const haloIds = new Set(haloNodes.map((n) => n.id));
const whiteNodes = nodes
  .filter((n) => haloIds.has(n.id) && rand() > 0.42)
  .map((n) => {
    const r = rand() > 0.5 ? 1.8 : 1.6;
    const op = 0.58 + rand() * 0.38;
    return `    <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r.toFixed(1)}" fill-opacity="${op.toFixed(2)}"/>`;
  })
  .join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" aria-hidden="true">
  <defs>
    <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g stroke="#c8f5f0" stroke-linecap="round" fill="none">
${pathLines}
  </g>
  <g fill="#4ecdc4">
${halos}
  </g>
  <g fill="#e8fffb" filter="url(#node-glow)">
${glowNodes}
  </g>
  <g fill="#ffffff">
${whiteNodes}
  </g>
</svg>
`;

const targets = [
  join(__dirname, '../public/images/heroes/neural-overlay.svg'),
  join(__dirname, '../images/heroes/neural-overlay.svg'),
];

for (const target of targets) {
  writeFileSync(target, svg);
  console.log(
    `Wrote ${target} — ${nodes.length} nodes, ${edges.length} edges, ${haloNodes.length} halos (original style, denser)`
  );
}
