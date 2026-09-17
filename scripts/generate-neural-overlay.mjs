/**
 * Generates a wide hero neural-network overlay SVG.
 * Dense local meshes with solid edges and subtle junction nodes (not star-like dots).
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
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function edgePath(a, b) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = len * 0.08 * (Math.random() > 0.5 ? 1 : -1);
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

const rand = mulberry32(42);

const clusterSeeds = [
  { cx: 320, cy: 380, count: 14, spread: 95 },
  { cx: 520, cy: 620, count: 13, spread: 88 },
  { cx: 800, cy: 310, count: 12, spread: 82 },
  { cx: 1080, cy: 500, count: 15, spread: 100 },
  { cx: 1280, cy: 680, count: 12, spread: 85 },
  { cx: 1580, cy: 330, count: 14, spread: 92 },
  { cx: 1880, cy: 530, count: 13, spread: 90 },
  { cx: 2120, cy: 440, count: 12, spread: 86 },
  { cx: 2380, cy: 720, count: 10, spread: 72 },
  { cx: 2640, cy: 310, count: 13, spread: 88 },
  { cx: 2880, cy: 530, count: 12, spread: 84 },
  { cx: 3120, cy: 360, count: 13, spread: 86 },
  { cx: 3380, cy: 590, count: 12, spread: 88 },
  { cx: 3580, cy: 460, count: 11, spread: 78 },
  { cx: 460, cy: 480, count: 8, spread: 55 },
  { cx: 1760, cy: 760, count: 9, spread: 62 },
  { cx: 2980, cy: 780, count: 9, spread: 60 },
];

const nodes = [];
let id = 0;

for (const seed of clusterSeeds) {
  for (let i = 0; i < seed.count; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * seed.spread;
    nodes.push({
      id: id++,
      x: seed.cx + Math.cos(angle) * r,
      y: seed.cy + Math.sin(angle) * r * 0.72,
      cluster: seed.cx,
    });
  }
}

const edgeSet = new Set();
const edges = [];

function addEdge(a, b, opacity, width = 1.15) {
  const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
  if (edgeSet.has(key)) return;
  edgeSet.add(key);
  edges.push({ a, b, opacity, width });
}

for (const node of nodes) {
  const neighbors = nodes
    .filter((n) => n.id !== node.id)
    .map((n) => ({ n, d: dist(node, n) }))
    .sort((x, y) => x.d - y.d);

  const local = neighbors.filter(({ d }) => d < 120);
  const connectCount = 3 + Math.floor(rand() * 2);
  for (let i = 0; i < Math.min(connectCount, local.length); i++) {
    const { n, d } = local[i];
    const sameCluster = n.cluster === node.cluster;
    const opacity = sameCluster ? 0.42 + rand() * 0.22 : 0.28 + rand() * 0.12;
    addEdge(node, n, opacity);
  }

  if (rand() > 0.55 && local.length > 3) {
    const mid = local[2 + Math.floor(rand() * Math.min(3, local.length - 3))];
    if (mid) addEdge(node, mid.n, 0.32 + rand() * 0.1, 0.95);
  }
}

for (let i = 0; i < clusterSeeds.length - 1; i++) {
  const a = clusterSeeds[i];
  const b = clusterSeeds[i + 1];
  if (Math.abs(a.cy - b.cy) > 220) continue;
  const nodeA = nodes
    .filter((n) => n.cluster === a.cx)
    .sort((p, q) => Math.abs(p.x - b.cx) - Math.abs(q.x - b.cx))[0];
  const nodeB = nodes
    .filter((n) => n.cluster === b.cx)
    .sort((p, q) => Math.abs(p.x - a.cx) - Math.abs(q.x - a.cx))[0];
  if (nodeA && nodeB && dist(nodeA, nodeB) < 420) {
    addEdge(nodeA, nodeB, 0.22 + rand() * 0.08, 0.85);
  }
}

const degree = new Map(nodes.map((n) => [n.id, 0]));
for (const { a, b } of edges) {
  degree.set(a.id, degree.get(a.id) + 1);
  degree.set(b.id, degree.get(b.id) + 1);
}

const haloNodes = nodes.filter((n) => degree.get(n.id) >= 4);

const pathLines = edges
  .map(
    ({ a, b, opacity, width }) =>
      `    <path d="${edgePath(a, b)}" stroke-width="${width.toFixed(2)}" stroke-opacity="${opacity.toFixed(2)}"/>`
  )
  .join('\n');

const halos = haloNodes
  .map((n) => {
    const r = 22 + rand() * 14;
    const op = 0.028 + rand() * 0.022;
    return `    <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r.toFixed(1)}" fill-opacity="${op.toFixed(3)}"/>`;
  })
  .join('\n');

const junctions = nodes
  .map((n) => {
    const deg = degree.get(n.id);
    const r = deg >= 4 ? 2.4 : deg >= 3 ? 2.0 : 1.6;
    const op = deg >= 4 ? 0.52 : deg >= 3 ? 0.44 : 0.36;
    return `    <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r.toFixed(1)}" fill-opacity="${op.toFixed(2)}"/>`;
  })
  .join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" aria-hidden="true">
  <defs>
    <filter id="mesh-soften" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g stroke="#c8f5f0" stroke-linecap="round" fill="none">
${pathLines}
  </g>
  <g fill="#4ecdc4">
${halos}
  </g>
  <g fill="#d4faf5" filter="url(#mesh-soften)">
${junctions}
  </g>
</svg>
`;

const targets = [
  join(__dirname, '../public/images/heroes/neural-overlay.svg'),
  join(__dirname, '../images/heroes/neural-overlay.svg'),
];

for (const target of targets) {
  writeFileSync(target, svg);
  console.log(`Wrote ${target} (${nodes.length} nodes, ${edges.length} edges)`);
}
