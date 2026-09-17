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
  angleBias?: number,
  angleSpread = Math.PI * 2,
): void {
  const hub = particles[hubIndex];
  for (let n = 0; n < count; n++) {
    const angle =
      angleBias === undefined
        ? Math.random() * Math.PI * 2
        : angleBias + (Math.random() - 0.5) * angleSpread;
    const dist = spread * (0.52 + Math.random() * 0.95);
    const x = hub.x + Math.cos(angle) * dist + (Math.random() - 0.5) * 20;
    const y = hub.y + Math.sin(angle) * dist + (Math.random() - 0.5) * 20;
    particles.push({
      x,
      y,
      restX: x,
      restY: y,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.17,
      pulse: Math.random() * Math.PI * 2,
      spark: Math.random() < 0.28,
      cluster,
      role: 'satellite',
      radius: 0.75,
      parent: hubIndex,
      restDist: Math.hypot(x - hub.x, y - hub.y),
    });
  }
}

function evenHubCenters(
  width: number,
  height: number,
  count: number,
  pad: number,
): Array<{ x: number; y: number }> {
  const minSpacing = Math.max(92, Math.min(width, height) * 0.125);
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;
  let cols = Math.max(4, Math.round(usableW / minSpacing));
  let rows = Math.max(3, Math.round(usableH / minSpacing));

  while (cols * rows < count && cols * rows < 96) {
    if (usableW / cols >= usableH / rows) cols += 1;
    else rows += 1;
  }

  const cellW = usableW / cols;
  const cellH = usableH / rows;
  const cells: Array<{ x: number; y: number }> = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const stagger = row % 2 === 1 ? cellW * 0.5 : 0;
      const jitterX = (Math.random() - 0.5) * cellW * 0.18;
      const jitterY = (Math.random() - 0.5) * cellH * 0.18;
      cells.push({
        x: Math.max(pad, Math.min(width - pad, pad + cellW * (col + 0.5) + stagger + jitterX)),
        y: Math.max(pad, Math.min(height - pad, pad + cellH * (row + 0.5) + jitterY)),
      });
    }
  }

  if (cells.length <= count) return cells.slice(0, count);

  const picked: Array<{ x: number; y: number }> = [];
  const stride = cells.length / count;
  for (let i = 0; i < count; i++) {
    picked.push(cells[Math.min(cells.length - 1, Math.floor(i * stride + stride * 0.5))]);
  }
  return picked;
}

function isNearCorner(x: number, y: number, width: number, height: number, inset: number): boolean {
  const nearLeft = x < inset;
  const nearRight = x > width - inset;
  const nearTop = y < inset;
  const nearBottom = y > height - inset;
  return (nearLeft || nearRight) && (nearTop || nearBottom);
}

function scatterNeurons(width: number, height: number): Particle[] {
  const particles: Particle[] = [];
  const pad = Math.max(36, Math.min(width, height) * 0.05);
  const cornerInset = Math.max(pad * 1.4, Math.min(width, height) * 0.08);
  const dendriteSpread = Math.max(52, Math.min(width, height) * 0.095);
  const clusterCount = Math.min(22, Math.max(17, Math.round((width * height) / 42000)));
  const centers = evenHubCenters(width, height, clusterCount, pad);

  centers.forEach((center, cluster) => {
    const nearCorner = isNearCorner(center.x, center.y, width, height, cornerInset);
    const hubIndex = particles.length;
    const x = center.x + (Math.random() - 0.5) * 6;
    const y = center.y + (Math.random() - 0.5) * 6;
    particles.push({
      x,
      y,
      restX: x,
      restY: y,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.14,
      pulse: Math.random() * Math.PI * 2,
      spark: nearCorner || Math.random() < 0.28,
      cluster,
      role: nearCorner ? 'corner' : 'hub',
      radius: nearCorner ? 2.8 : 2.4,
      parent: -1,
      restDist: 0,
    });
    const dendriteCount = nearCorner ? 8 + Math.floor(Math.random() * 2) : 6 + Math.floor(Math.random() * 2);
    addDendrites(particles, hubIndex, cluster, dendriteCount, dendriteSpread);
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
      restLimit: child.restDist + 22,
      bend: ((child.parent * 13 + i * 29) % 100) / 100 - 0.5,
      dynamic: false,
    });
  }

  return links;
}

function buildSoftBridgeLinks(particles: Particle[], width: number, height: number): NetworkLink[] {
  const links: NetworkLink[] = [];
  const seen = new Set<string>();
  const bridgeDist = Math.max(92, Math.min(width, height) * 0.145);
  const bridgeDistSq = bridgeDist * bridgeDist;
  const nodes = particles
    .map((p, i) => ({ i, p }))
    .filter(({ p }) => p.role === 'hub' || p.role === 'satellite');

  for (let a = 0; a < nodes.length; a++) {
    const near: Array<{ j: number; d2: number }> = [];
    for (let b = a + 1; b < nodes.length; b++) {
      const dx = nodes[a].p.x - nodes[b].p.x;
      const dy = nodes[a].p.y - nodes[b].p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > bridgeDistSq) continue;
      if (nodes[a].p.cluster >= 0 && nodes[a].p.cluster === nodes[b].p.cluster) continue;
      near.push({ j: b, d2 });
    }
    near.sort((x, y) => x.d2 - y.d2);
    for (let n = 0; n < Math.min(2, near.length); n++) {
      const i = nodes[a].i;
      const j = nodes[near[n].j].i; // particle index via nodes array slot
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
  influenceSq: number,
  maxDistSq: number,
  maxLinks: number,
): NetworkLink[] {
  const links: NetworkLink[] = [];
  const active: number[] = [];
  const activeDist: number[] = [];

  for (let i = 0; i < particles.length; i++) {
    const dx = particles[i].x - mouseX;
    const dy = particles[i].y - mouseY;
    const d2 = dx * dx + dy * dy;
    if (d2 < influenceSq) {
      active.push(i);
      activeDist.push(d2);
    }
  }

  if (active.length > 16) {
    const order = active.map((idx, n) => ({ idx, d2: activeDist[n] }));
    order.sort((a, b) => a.d2 - b.d2);
    active.length = 0;
    for (let n = 0; n < 16; n++) active.push(order[n].idx);
  }

  for (let a = 0; a < active.length && links.length < maxLinks; a++) {
    for (let b = a + 1; b < active.length && links.length < maxLinks; b++) {
      const i = active[a];
      const j = active[b];
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      if (dx * dx + dy * dy > maxDistSq) continue;
      links.push({
        i: i < j ? i : j,
        j: i < j ? j : i,
        highlighted: false,
        restLimit: Math.sqrt(maxDistSq),
        bend: ((i * 23 + j * 19) % 100) / 100 - 0.5,
        dynamic: true,
      });
    }
  }

  return links;
}

function initCanvas(canvas: HTMLCanvasElement, host: HTMLElement): void {
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let particles: Particle[] = [];
  let restLinks: NetworkLink[] = [];
  let bridgeLinks: NetworkLink[] = [];
  let hostLeft = 0;
  let hostTop = 0;
  const mouseReachCm = 4;
  const cmToPx = 96 / 2.54;
  const pullRadius = mouseReachCm * cmToPx;
  const pullRadiusSq = pullRadius * pullRadius;
  const mouseLinkDistanceSq = (pullRadius * 0.72) ** 2;
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
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(cx, cy, bx, by);

    ctx.strokeStyle = `rgba(70, 190, 210, ${alpha * 0.38})`;
    ctx.lineWidth = widthPx + 2.2;
    ctx.stroke();

    ctx.strokeStyle = `rgba(130, 230, 240, ${alpha})`;
    ctx.lineWidth = widthPx;
    ctx.stroke();
  };

  const drawSpark = (mx: number, my: number, pulse: number, a: Particle, b: Particle): void => {
    if (!(a.spark || b.spark) || pulse <= 0.56) return;
    const sparkAlpha = (pulse - 0.56) * 1.4;
    ctx.fillStyle = `rgba(255, 150, 85, ${Math.min(0.72, sparkAlpha * 0.52)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 0.65, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawNode = (p: Particle, pullRadius: number): void => {
    let nodeAlpha = 0.58 + Math.sin(p.pulse) * 0.18;
    if (smoothMouse.active) {
      const mouseDist = Math.hypot(p.x - smoothMouse.x, p.y - smoothMouse.y);
      const near = Math.max(0, 1 - mouseDist / (pullRadius * 0.65));
      nodeAlpha += near * 0.22;
    }

    if (p.role === 'corner' || p.role === 'hub') {
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

      if (p.role === 'corner' && p.spark) {
        const pulse = 0.5 + Math.sin(frame * 0.05 + p.pulse) * 0.5;
        if (pulse > 0.55) {
          ctx.fillStyle = `rgba(255, 145, 80, ${(pulse - 0.55) * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    ctx.fillStyle = `rgba(210, 245, 255, ${Math.min(0.92, nodeAlpha)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (): void => {
    ctx.clearRect(0, 0, width, height);
    frame += 1;

    const targetX = mouse.active ? mouse.x : smoothMouse.x;
    const targetY = mouse.active ? mouse.y : smoothMouse.y;
    smoothMouse.x += (targetX - smoothMouse.x) * (mouse.active ? 0.55 : 0.22);
    smoothMouse.y += (targetY - smoothMouse.y) * (mouse.active ? 0.55 : 0.22);
    smoothMouse.active = mouse.active;

    for (const p of particles) {
      if (!reducedMotion) {
        const mdx = p.x - smoothMouse.x;
        const mdy = p.y - smoothMouse.y;
        const mouseDistSq = smoothMouse.active ? mdx * mdx + mdy * mdy : Infinity;
        const nearMouse = mouseDistSq < pullRadiusSq;
        const mouseDist = nearMouse ? Math.sqrt(mouseDistSq) : Infinity;

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
      ? buildMouseLinks(
          particles,
          smoothMouse.x,
          smoothMouse.y,
          pullRadiusSq,
          mouseLinkDistanceSq,
          14,
        )
      : [];

    const drawLinkSet = (links: NetworkLink[], baseAlpha: number, hoverBoost: number): void => {
      for (const link of links) {
        const a = particles[link.i];
        const b = particles[link.j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const stretch = dist / Math.max(link.restLimit, 1);
        const t = Math.max(0, 1 - dist / (link.restLimit + 8));
        let alpha =
          (link.highlighted ? baseAlpha + 0.16 + t * t * 0.34 : baseAlpha + t * t * 0.34) /
          Math.max(1, stretch * 0.85);
        let lineWidth = link.highlighted ? 0.5 + t * 0.32 : 0.44 + t * 0.28;

        if (smoothMouse.active) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const mouseDist = Math.hypot(mx - smoothMouse.x, my - smoothMouse.y);
          const near = Math.max(0, 1 - mouseDist / (pullRadius * 0.85));
          alpha += near * hoverBoost;
          lineWidth += near * (link.bridge ? 0.34 : 0.42);
        }

        drawFiber(a.x, a.y, b.x, b.y, Math.min(0.96, alpha), lineWidth, link.bend);

        if (!link.bridge) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const pulse = 0.5 + Math.sin(frame * 0.07 + a.pulse + b.pulse) * 0.5;
          drawSpark(mx, my, pulse, a, b);
        }
      }
    };

    drawLinkSet(restLinks, 0.48, 0.38);

    drawLinkSet(bridgeLinks, 0.22, 0.48);

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
        const alpha = (0.38 + t * t * 0.52) * near;
        if (alpha < 0.08) continue;

        drawFiber(a.x, a.y, b.x, b.y, Math.min(0.95, alpha), 0.46 + t * 0.32, link.bend);
      }

      const tetherDist = pullRadius * 0.92;
      const tetherDistSq = tetherDist * tetherDist;
      const tethered: Array<{ idx: number; d: number }> = [];
      for (let idx = 0; idx < particles.length; idx++) {
        const p = particles[idx];
        const dx = p.x - smoothMouse.x;
        const dy = p.y - smoothMouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > tetherDistSq) continue;
        const d = Math.sqrt(d2);
        if (tethered.length < 4) {
          tethered.push({ idx, d });
          if (tethered.length === 4) tethered.sort((a, b) => a.d - b.d);
          continue;
        }
        if (d >= tethered[3].d) continue;
        tethered[3] = { idx, d };
        tethered.sort((a, b) => a.d - b.d);
      }

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

      ctx.fillStyle = 'rgba(255, 160, 95, 0.55)';
      ctx.beginPath();
      ctx.arc(smoothMouse.x, smoothMouse.y, 1.1, 0, Math.PI * 2);
      ctx.fill();
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
