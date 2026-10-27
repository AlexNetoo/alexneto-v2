/** Runs `cb` once the landing loader has finished (straight away if there is no loader on the page). */
export function whenReady(cb: () => void): () => void {
  if (!document.querySelector('.pond.is-loading')) {
    cb();
    return () => {};
  }
  const h = () => cb();
  window.addEventListener('site:ready', h, { once: true });
  return () => window.removeEventListener('site:ready', h);
}
