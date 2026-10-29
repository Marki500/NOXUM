// Content is usable before optional animation libraries are downloaded.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 1000px) and (pointer: fine)');
const limited = navigator.connection?.saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
const idle = callback => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(callback, {timeout: 1200});
    else setTimeout(callback, 0);
  }));
};

if (desktop.matches && !reduced.matches && !limited) {
  idle(() => import('./motion.js').catch(() => {}));
}

const host = document.querySelector('.hero-art');
const launch = document.querySelector('#sculpture-launch');
if (host && launch) {
  let loading = false;
  launch.hidden = true;
  async function startSculpture() {
    if (loading || host.classList.contains('is-3d')) return;
    loading = true;
    launch.disabled = true;
    launch.textContent = 'Preparando 3D…';
    try {
      const {initializeSculpture} = await import('./sculpture.js');
      await initializeSculpture();
      if (!host.classList.contains('is-3d')) throw new Error('WebGL no disponible');
      launch.hidden = true;
      loading = false;
    } catch {
      launch.hidden = false;
      launch.textContent = 'Reintentar 3D';
      launch.disabled = false;
      loading = false;
    }
  }
  launch.addEventListener('click', startSculpture);
  // Automatic on mobile too; only explicit user preferences opt out.
  if (!reduced.matches && !navigator.connection?.saveData) {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      idle(() => { if (!document.hidden) startSculpture(); });
    });
    observer.observe(host);
  } else launch.hidden = false;
}
