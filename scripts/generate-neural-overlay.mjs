/**
 * Wide hero neural-network overlay — dense contiguous meshes, lines only (no star-like nodes).
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

function edgePath(a, b, bendScale = 0.06) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = len * bendScale * (a.id % 2 === 0 ? 1 : -1);
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

const rand = mulberry32(20260317);

const clusterSeeds = [
  { cx: 280, cy: 400, count: 22, spread: 130 },
  { cx: 620, cy: 560, count: 22, spread: 125 },
  { cx: 960, cy: 320, count: 20, spread: 118 },
  { cx: 1320, cy: 520, count: 24, spread: 135 },
  { cx: 1680, cy: 360, count: 22, spread: 128 },
  { cx: 2040, cy: 620, count: 20, spread: 120 },
  { cx: 2400, cy: 340, count: 22, spread: 125 },
  { cx: 2760, cy: 540, count: 22, spread: 128 },
  { cx: 3120, cy: 380, count: 22, spread: 122 },
  { cx: 3480, cy: 580, count: 20, spread: 118 },
];

const nodes = [];
let id = 0;

for (const seed of clusterSeeds) {
  for (let i = 0; i < seed.count; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * seed.spread;
    nodes.push({
      id: id++,
      x: Math.max(40, Math.min(WIDTH - 40, seed.cx + Math.cos(angle) * r)),
      y: Math.max(40, Math.min(HEIGHT - 40, seed.cy + Math.sin(angle) * r * 0.68)),
      cluster: seed.cx,
    });
  }
}

const edgeSet = new Set();
const edges = [];

function addEdge(a, b, opacity, width = 2.4) {
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

  const local = neighbors.filter(({ d }) => d < 155);
  const connectCount = 5 + Math.floor(rand() * 2);
  for (let i = 0; i < Math.min(connectCount, local.length); i++) {
    const { n } = local[i];
    const sameCluster = n.cluster === node.cluster;
    const opacity = sameCluster ? 0.58 + rand() * 0.28 : 0.34 + rand() * 0.14;
    addEdge(node, n, opacity);
  }
}

for (let i = 0; i < clusterSeeds.length - 1; i++) {
  const a = clusterSeeds[i];
  const b = clusterSeeds[i + 1];
  const nodeA = nodes
    .filter((n) => n.cluster === a.cx)
    .sort((p, q) => Math.abs(p.x - b.cx) - Math.abs(q.x - b.cx))[0];
  const nodeB = nodes
    .filter((n) => n.cluster === b.cx)
    .sort((p, q) => Math.abs(p.x - a.cx) - Math.abs(q.x - a.cx))[0];
  if (nodeA && nodeB) {
    addEdge(nodeA, nodeB, 0.38 + rand() * 0.12, 2.0);
    const nodeA2 = nodes
      .filter((n) => n.cluster === a.cx && n.id !== nodeA.id)
      .sort((p, q) => dist(p, nodeB) - dist(q, nodeB))[0];
    const nodeB2 = nodes
      .filter((n) => n.cluster === b.cx && n.id !== nodeB.id)
      .sort((p, q) => dist(q, nodeA) - dist(p, nodeA))[0];
    if (nodeA2 && nodeB2 && dist(nodeA2, nodeB2) < 520) {
      addEdge(nodeA2, nodeB2, 0.28 + rand() * 0.1, 1.8);
    }
  }
}

const pathLines = edges
  .map(
    ({ a, b, opacity, width }) =>
      `    <path d="${edgePath(a, b)}" stroke-width="${width.toFixed(2)}" stroke-opacity="${opacity.toFixed(2)}"/>`
  )
  .join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" aria-hidden="true">
  <g stroke="#e2fffa" stroke-linecap="round" stroke-linejoin="round" fill="none">
${pathLines}
  </g>
</svg>
`;

const targets = [
  join(__dirname, '../public/images/heroes/neural-overlay.svg'),
  join(__dirname, '../images/heroes/neural-overlay.svg'),
];

for (const target of targets) {
  writeFileSync(target, svg);
  console.log(`Wrote ${target} (${nodes.length} nodes, ${edges.length} edges, lines-only)`);
}
