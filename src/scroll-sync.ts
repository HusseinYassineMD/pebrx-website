type ScrollListener = (scrolling: boolean) => void;

const listeners = new Set<ScrollListener>();
let scrolling = false;
let endTimer = 0;

export function onUserScroll(listener: ScrollListener): () => void {
  listeners.add(listener);
  listener(scrolling);
  return () => listeners.delete(listener);
}

export function isUserScrolling(): boolean {
  return scrolling;
}

function setScrolling(active: boolean): void {
  if (scrolling === active) return;
  scrolling = active;
  document.documentElement.classList.toggle('is-scrolling', active);
  listeners.forEach((listener) => listener(active));
}

export function initScrollSync(): void {
  window.addEventListener(
    'scroll',
    () => {
      setScrolling(true);
      globalThis.clearTimeout(endTimer);
      endTimer = globalThis.setTimeout(() => setScrolling(false), 140);
    },
    { passive: true },
  );
}
