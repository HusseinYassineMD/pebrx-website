type NodeRole = 'corner' | 'hub' | 'satellite';

interface Particle {
  x: number;
  y: number;
  restX: number;
  restY: number;
  vx: number;
  vy: number;
  pulse: number;
  spark: boolean;
  cluster: number;
  role: NodeRole;
  radius: number;
  parent: number;
  restDist: number;
}

interface NetworkLink {
  i: number;
  j: number;
  highlighted: boolean;
  restLimit: number;
  bend: number;
  dynamic: boolean;
  bridge?: boolean;
}

/** Stable PRNG so the reference hero pattern stays consistent across loads. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MouseState {
  x: number;
  y: number;
  active: boolean;
}

function addDendrites(
  particles: Particle[],
  hubIndex: number,
  cluster: number,
  count: number,
  spread: number,
  rand: () => number = Math.random,
): void {
  const hub = particles[hubIndex];
  for (let n = 0; n < count; n++) {
    const angle = rand() * Math.PI * 2;
    const dist = spread * (0.58 + rand() * 1.05);
    const x = hub.x + Math.cos(angle) * dist + (rand() - 0.5) * 22;
    const y = hub.y + Math.sin(angle) * dist + (rand() - 0.5) * 22;
    particles.push({
      x,
      y,
      restX: x,
      restY: y,
      vx: (rand() - 0.5) * 0.2,
      vy: (rand() - 0.5) * 0.17,
      pulse: rand() * Math.PI * 2,
      spark: rand() < 0.24,
      cluster,
      role: 'satellite',
      radius: 0.75,
      parent: hubIndex,
      restDist: Math.hypot(x - hub.x, y - hub.y),
    });
  }
}

/** Two horizontal bands of evenly spaced starburst hubs across wide heroes. */
function scatterNeurons(width: number, height: number): Particle[] {
  const rand = createRng(0x50425278);
  const particles: Particle[] = [];
  const pad = Math.max(36, Math.min(width, height) * 0.05);
  const dendriteSpread = Math.max(
    58,
    Math.min(width, height) * 0.105,
    width * 0.038,
  );
  const hubCount = Math.min(22, Math.max(17, Math.round(width / 150)));
  const gridRows = 2;
  const gridCols = Math.ceil(hubCount / gridRows);
  const cellW = (width - pad * 2) / gridCols;
  const cellH = (height - pad * 2) / gridRows;
  const centers: Array<{ x: number; y: number }> = [];

  for (let row = 0; row < gridRows && centers.length < hubCount; row++) {
    for (let col = 0; col < gridCols && centers.length < hubCount; col++) {
      centers.push({
        x: pad + cellW * (col + 0.5) + (rand() - 0.5) * cellW * 0.22,
        y: pad + cellH * (row + 0.5) + (rand() - 0.5) * cellH * 0.18,
      });
    }
  }

  centers.forEach((center, cluster) => {
    const hubIndex = particles.length;
    const x = center.x + (rand() - 0.5) * 8;
    const y = center.y + (rand() - 0.5) * 8;
    particles.push({
      x,
      y,
      restX: x,
      restY: y,
      vx: (rand() - 0.5) * 0.16,
      vy: (rand() - 0.5) * 0.14,
      pulse: rand() * Math.PI * 2,
      spark: rand() < 0.3,
      cluster,
      role: 'hub',
      radius: 2.2,
      parent: -1,
      restDist: 0,
    });
    addDendrites(
      particles,
      hubIndex,
      cluster,
      8 + Math.floor(rand() * 4),
      dendriteSpread * 0.88,
      rand,
    );
  });

  return particles;
}

function buildRestLinks(particles: Particle[]): NetworkLink[] {
  const links: NetworkLink[] = [];

  for (let i = 0; i < particles.length; i++) {
    const child = particles[i];
    if (child.parent < 0) continue;
    const parent = particles[child.parent];
    if (!parent) continue;

    links.push({
      i: child.parent,
      j: i,
      highlighted: parent.role === 'corner',
      restLimit: child.restDist + 28,
      bend: ((child.parent * 13 + i * 29) % 100) / 100 - 0.5,
      dynamic: false,
    });
  }

  return links;
}

function buildSoftBridgeLinks(particles: Particle[], width: number, height: number): NetworkLink[] {
  const links: NetworkLink[] = [];
  const seen = new Set<string>();
  const bridgeDist = Math.max(132, Math.min(width, height) * 0.198, width * 0.075);
  const bridgeDistSq = bridgeDist * bridgeDist;
  const hubs = particles
    .map((p, i) => ({ i, p }))
    .filter(({ p }) => p.role === 'hub');

  for (let a = 0; a < hubs.length; a++) {
    const near: Array<{ j: number; d2: number }> = [];
    for (let b = a + 1; b < hubs.length; b++) {
      const dx = hubs[a].p.x - hubs[b].p.x;
      const dy = hubs[a].p.y - hubs[b].p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > bridgeDistSq) continue;
      near.push({ j: b, d2 });
    }
    near.sort((x, y) => x.d2 - y.d2);
    for (let n = 0; n < Math.min(3, near.length); n++) {
      const i = hubs[a].i;
      const j = hubs[near[n].j].i;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        i: i < j ? i : j,
        j: i < j ? j : i,
        highlighted: false,
        restLimit: bridgeDist,
        bend: ((i * 17 + j * 31) % 100) / 100 - 0.5,
        dynamic: false,
        bridge: true,
      });
    }
  }

  return links;
}

function buildMouseLinks(
  particles: Particle[],
  mouseX: number,
  mouseY: number,
  influence: number,
  maxDist: number,
): NetworkLink[] {
  const links: NetworkLink[] = [];
  const seen = new Set<string>();
  const active: number[] = [];

  for (let i = 0; i < particles.length; i++) {
    if (Math.hypot(particles[i].x - mouseX, particles[i].y - mouseY) < influence) {
      active.push(i);
    }
  }

  for (let a = 0; a < active.length; a++) {
    for (let b = a + 1; b < active.length; b++) {
      const i = active[a];
      const j = active[b];
      const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
      if (dist > maxDist) continue;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        i: i < j ? i : j,
        j: i < j ? j : i,
        highlighted: false,
        restLimit: maxDist,
        bend: ((i * 23 + j * 19) % 100) / 100 - 0.5,
        dynamic: true,
      });
    }
  }

  return links;
}

function initCanvas(canvas: HTMLCanvasElement, host: HTMLElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let particles: Particle[] = [];
  let restLinks: NetworkLink[] = [];
  let bridgeLinks: NetworkLink[] = [];
  let hostLeft = 0;
  let hostTop = 0;
  const mouseReachCm = 3;
  const cmToPx = 96 / 2.54;
  let frame = 0;

  const mouse: MouseState = { x: 0, y: 0, active: false };
  const smoothMouse: MouseState = { x: 0, y: 0, active: false };

  const syncHostRect = (): void => {
    const rect = host.getBoundingClientRect();
    hostLeft = rect.left;
    hostTop = rect.top;
  };

  host.addEventListener(
    'pointermove',
    (e) => {
      mouse.x = e.clientX - hostLeft;
      mouse.y = e.clientY - hostTop;
      mouse.active = true;
    },
    { capture: true, passive: true },
  );
  host.addEventListener('pointerleave', () => {
    mouse.active = false;
  }, true);

  const resize = (): void => {
    syncHostRect();
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = scatterNeurons(width, height);
    restLinks = buildRestLinks(particles);
    bridgeLinks = buildSoftBridgeLinks(particles, width, height);
    mouse.x = width / 2;
    mouse.y = height / 2;
    smoothMouse.x = width / 2;
    smoothMouse.y = height / 2;
  };

  const drawFiber = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    alpha: number,
    widthPx: number,
    bend: number,
  ): void => {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const curve = len * 0.28 * bend;
    const cx = mx + nx * curve;
    const cy = my + ny * curve;

    ctx.lineCap = 'round';

    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = `rgba(190, 245, 250, ${alpha * 0.42})`;
    ctx.strokeStyle = `rgba(175, 235, 245, ${alpha * 0.18})`;
    ctx.lineWidth = widthPx + 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(cx, cy, bx, by);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(210, 250, 255, ${alpha * 0.3})`;
    ctx.strokeStyle = `rgba(205, 245, 252, ${alpha * 0.52})`;
    ctx.lineWidth = Math.max(0.35, widthPx * 0.82);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(cx, cy, bx, by);
    ctx.stroke();
    ctx.restore();
  };

  const drawSpark = (mx: number, my: number, pulse: number, a: Particle, b: Particle): void => {
    if (!(a.spark || b.spark) || pulse <= 0.56) return;
    const sparkAlpha = (pulse - 0.56) * 1.4;
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(255, 130, 70, 0.65)';
    ctx.fillStyle = `rgba(255, 150, 85, ${Math.min(0.72, sparkAlpha * 0.52)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawNode = (p: Particle, pullRadius: number): void => {
    let nodeAlpha = 0.58 + Math.sin(p.pulse) * 0.18;
    if (smoothMouse.active) {
      const mouseDist = Math.hypot(p.x - smoothMouse.x, p.y - smoothMouse.y);
      const near = Math.max(0, 1 - mouseDist / (pullRadius * 0.65));
      nodeAlpha += near * 0.22;
    }

    if (p.role === 'corner' || p.role === 'hub') {
      ctx.save();
      ctx.shadowBlur = p.role === 'corner' ? 14 : 9;
      ctx.shadowColor = 'rgba(78, 205, 196, 0.55)';
      ctx.fillStyle = `rgba(78, 205, 196, ${0.14 * nodeAlpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle =
        p.role === 'corner'
          ? `rgba(130, 230, 235, ${Math.min(0.95, nodeAlpha + 0.2)})`
          : `rgba(110, 215, 225, ${Math.min(0.9, nodeAlpha + 0.12)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, nodeAlpha * 0.7)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (p.role === 'corner' && p.spark) {
        const pulse = 0.5 + Math.sin(frame * 0.05 + p.pulse) * 0.5;
        if (pulse > 0.55) {
          ctx.save();
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255, 130, 70, 0.55)';
          ctx.fillStyle = `rgba(255, 145, 80, ${(pulse - 0.55) * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      return;
    }

    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = `rgba(210, 250, 255, ${Math.min(0.45, nodeAlpha * 0.35)})`;
    ctx.fillStyle = `rgba(225, 250, 255, ${Math.min(0.72, nodeAlpha * 0.78)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const draw = (): void => {
    ctx.clearRect(0, 0, width, height);
    frame += 1;

    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.22;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.22;
    smoothMouse.active = mouse.active;

    const pullRadius = mouseReachCm * cmToPx;
    const mouseLinkDistance = pullRadius * 0.72;

    for (const p of particles) {
      if (!reducedMotion) {
        const mouseDist = smoothMouse.active
          ? Math.hypot(p.x - smoothMouse.x, p.y - smoothMouse.y)
          : Infinity;
        const nearMouse = mouseDist < pullRadius;

        if (smoothMouse.active && nearMouse) {
          const dx = smoothMouse.x - p.x;
          const dy = smoothMouse.y - p.y;
          const strength =
            p.role === 'corner' ? 0.045 : p.role === 'hub' ? 0.085 : 0.12;
          const t = 1 - mouseDist / pullRadius;
          p.vx += (dx / mouseDist) * t * t * strength;
          p.vy += (dy / mouseDist) * t * t * strength;
        }

        const spring = smoothMouse.active
          ? nearMouse
            ? 0.004
            : 0.022
          : 0.038;
        p.vx += (p.restX - p.x) * spring;
        p.vy += (p.restY - p.y) * spring;

        p.vx += (Math.random() - 0.5) * 0.012;
        p.vy += (Math.random() - 0.5) * 0.012;

        p.vx *= smoothMouse.active ? 0.988 : 0.985;
        p.vy *= smoothMouse.active ? 0.988 : 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.022;

        const bound = 4;
        if (p.x <= bound || p.x >= width - bound) p.vx *= -0.82;
        if (p.y <= bound || p.y >= height - bound) p.vy *= -0.82;
        p.x = Math.max(bound, Math.min(width - bound, p.x));
        p.y = Math.max(bound, Math.min(height - bound, p.y));
      }
    }

    const mouseLinks = smoothMouse.active
      ? buildMouseLinks(particles, smoothMouse.x, smoothMouse.y, pullRadius, mouseLinkDistance)
      : [];

    const drawLinkSet = (links: NetworkLink[], baseAlpha: number, hoverBoost: number): void => {
      for (const link of links) {
        const a = particles[link.i];
        const b = particles[link.j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const stretch = dist / Math.max(link.restLimit, 1);
        const t = Math.max(0, 1 - dist / (link.restLimit + 8));
        let alpha = (baseAlpha + t * t * 0.34) / Math.max(1, stretch * 0.85);
        let lineWidth = link.bridge ? 0.38 + t * 0.2 : 0.44 + t * 0.28;

        if (smoothMouse.active) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const mouseDist = Math.hypot(mx - smoothMouse.x, my - smoothMouse.y);
          const near = Math.max(0, 1 - mouseDist / (pullRadius * 0.85));
          alpha += near * hoverBoost;
          lineWidth += near * (link.bridge ? 0.22 : 0.18);
        }

        drawFiber(a.x, a.y, b.x, b.y, Math.min(0.92, alpha), lineWidth, link.bend);

        if (!link.bridge) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const pulse = 0.5 + Math.sin(frame * 0.07 + a.pulse + b.pulse) * 0.5;
          drawSpark(mx, my, pulse, a, b);
        }
      }
    };

    drawLinkSet(restLinks, 0.38, 0.14);
    drawLinkSet(bridgeLinks, 0.16, 0.22);

    if (smoothMouse.active) {
      for (const link of mouseLinks) {
        const a = particles[link.i];
        const b = particles[link.j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const t = Math.max(0, 1 - dist / link.restLimit);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const mouseDist = Math.hypot(mx - smoothMouse.x, my - smoothMouse.y);
        const near = Math.max(0, 1 - mouseDist / pullRadius);
        const alpha = (0.32 + t * t * 0.42) * near;
        if (alpha < 0.08) continue;

        drawFiber(a.x, a.y, b.x, b.y, alpha, 0.4 + t * 0.22, link.bend);
      }

      const tetherDist = pullRadius * 0.92;
      const tethered = particles
        .map((p, idx) => ({ idx, d: Math.hypot(p.x - smoothMouse.x, p.y - smoothMouse.y) }))
        .filter(({ d }) => d <= tetherDist)
        .sort((a, b) => a.d - b.d)
        .slice(0, 4);

      for (const { idx, d } of tethered) {
        const p = particles[idx];
        const t = 1 - d / tetherDist;
        drawFiber(
          smoothMouse.x,
          smoothMouse.y,
          p.x,
          p.y,
          0.45 + t * t * 0.35,
          0.4 + t * 0.18,
          ((idx * 7) % 100) / 100 - 0.5,
        );
      }

      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(255, 140, 75, 0.55)';
      ctx.fillStyle = 'rgba(255, 160, 95, 0.55)';
      ctx.beginPath();
      ctx.arc(smoothMouse.x, smoothMouse.y, 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const p of particles) {
      drawNode(p, pullRadius);
    }

    if (!reducedMotion) {
      requestAnimationFrame(draw);
    }
  };

  resize();
  draw();
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', syncHostRect, { passive: true });
}

export function initNeuralHero(): void {
  const hosts = document.querySelectorAll<HTMLElement>('.hero-landing-photo, .page-hero-banner');

  hosts.forEach((host) => {
    if (host.querySelector('.neural-canvas')) return;

    host.querySelector('.hero-neural, .page-hero-neural')?.remove();

    const isHome = host.classList.contains('hero-landing-photo');
    const canvas = document.createElement('canvas');
    canvas.className = isHome ? 'hero-neural neural-canvas' : 'page-hero-neural neural-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    const overlay = host.querySelector('.hero-photo-overlay, .page-hero-overlay');
    if (overlay) {
      host.insertBefore(canvas, overlay);
    } else {
      host.appendChild(canvas);
    }

    initCanvas(canvas, host);
  });
}
