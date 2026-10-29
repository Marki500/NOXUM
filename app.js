/* No analytics, remote scripts, cookies or persistent browser storage. */
document.documentElement.classList.add('js');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('pointerdown', event => {
  if (menuButton.getAttribute('aria-expanded') === 'true' && !event.target.closest('.header')) closeMenu();
});
navigation.addEventListener('focusout', () => queueMicrotask(() => {
  if (!document.querySelector('.header').contains(document.activeElement)) closeMenu();
}));
window.matchMedia('(min-width: 768px)').addEventListener('change', closeMenu);

// The marker follows the section being read, including after an anchor jump.
const sectionLinks = [...navigation.querySelectorAll('a')];
const sectionBand = new Set();
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.isIntersecting ? sectionBand.add(entry.target) : sectionBand.delete(entry.target));
  const current = [...sectionBand].sort((a,b)=>b.getBoundingClientRect().top-a.getBoundingClientRect().top)[0];
  sectionLinks.forEach(link => {
    if (current && new URL(link.href).hash === '#'+current.id) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
}, {rootMargin:'-85px 0px -65% 0px',threshold:0});
document.querySelectorAll('main>section[id]').forEach(section=>sectionObserver.observe(section));

const heroArt = document.querySelector('.hero-art');

document.querySelectorAll('[data-type]').forEach(button => {
  button.addEventListener('click', () => {
    const stage = document.querySelector('.type-stage');
    stage.classList.remove('outline', 'italic');
    if (button.dataset.type !== 'bold') stage.classList.add(button.dataset.type);
    document.querySelectorAll('[data-type]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  });
});

const dialog = document.querySelector('#contact-dialog');
const formStatus = document.querySelector('#form-status');
const briefForm = document.querySelector('#brief-form');
const serviceSelect = briefForm.querySelector('[name="service"]');
if (document.body.dataset.service && [...serviceSelect.options].some(option => option.value === document.body.dataset.service)) {
  serviceSelect.value = document.body.dataset.service;
}
document.querySelectorAll('.contact-trigger').forEach(button => button.addEventListener('click', () => {
  closeMenu();
  dialog.showModal();
  document.body.classList.add('modal-open');
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
function projectBrief() {
  const data = new FormData(briefForm);
  return {
    service: data.get('service'),
    text: `Proyecto para Noxum Lab\n\nNombre: ${data.get('name').trim()}\nServicio: ${data.get('service')}\n\nIdea:\n${data.get('idea').trim()}`
  };
}
function validateBriefFields(report = true) {
  for (const field of briefForm.querySelectorAll('[name="name"], [name="idea"]')) {
    const minimum = field.name === 'idea' ? 10 : 1;
    field.setCustomValidity(field.value.length && field.value.trim().length < minimum
      ? (field.name === 'idea' ? 'Cuéntame un poco más: al menos 10 caracteres, sin contar espacios al principio o al final.' : 'Escribe tu nombre.')
      : '');
  }
  return report ? briefForm.reportValidity() : briefForm.checkValidity();
}
briefForm.addEventListener('input', () => { formStatus.textContent = ''; validateBriefFields(false); });
briefForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateBriefFields()) return;
  const brief = projectBrief();
  const recipient = document.querySelector('.footer-email').getAttribute('href');
  window.location.href = `${recipient}?subject=${encodeURIComponent(`Consulta: ${brief.service}`)}&body=${encodeURIComponent(brief.text)}`;
  formStatus.textContent = 'Se ha solicitado abrir tu aplicación de correo. Revisa y envía el mensaje desde allí. Si no se abre, puedes copiar el resumen.';
});
document.querySelector('#copy-brief').addEventListener('click', async () => {
  if (!validateBriefFields()) return;
  const {text} = projectBrief();
  try {
    await navigator.clipboard.writeText(text);
    formStatus.textContent = 'Resumen copiado. No se ha enviado ni guardado ningún dato.';
  } catch {
    formStatus.textContent = 'No se pudo acceder al portapapeles. Puedes seleccionar y copiar este resumen:';
    const output = document.createElement('textarea');
    output.readOnly = true;
    output.value = text;
    output.setAttribute('aria-label', 'Resumen del proyecto para copiar');
    formStatus.append(output);
    output.focus();
    output.select();
  }
});

// A lightweight animated particle surface; pauses off-screen and on hidden tabs.
const canvas = document.querySelector('#wave-canvas');
if (canvas) {
const ctx = canvas.getContext('2d');
const toggle = document.querySelector('#wave-toggle');
let width = 0, height = 0, phase = 0, frame = null, visible = false, userPaused = false;
let pointer = {x: .5, y: .5};
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (visible) drawWave();
}
function drawWave() {
  ctx.clearRect(0, 0, width, height);
  const count = width < 420 ? 37 : 48;
  for (let row = 0; row < 39; row++) {
    for (let col = 0; col < count; col++) {
      const u = col / (count - 1), v = row / 38;
      const distance = Math.hypot(u - pointer.x, v - pointer.y);
      const wave = Math.sin(u * 8 + phase) * Math.cos(v * 5 + phase * .6);
      const influence = Math.exp(-distance * 5) * Math.sin(phase * 1.5 + distance * 9);
      const x = u * width * 1.3 - width * .15 + Math.sin(v * 6 + phase * .3) * 16;
      const y = v * height * .9 + height * .1 + wave * height * .12 + influence * 20;
      const size = .6 + (v * 1.2);
      ctx.fillStyle = `rgba(37,74,47,${.17 + v * .26})`;
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
  }
}
let lastTime = 0;
let lastWaveFrame = 0;
function animateWave(now) {
  if (now-lastWaveFrame < 1000/30) { frame=requestAnimationFrame(animateWave); return; }
  lastWaveFrame=now;
  if (!lastTime) lastTime = now;
  const delta = Math.min(now - lastTime, 50);
  lastTime = now;
  phase += delta * .00035;
  drawWave();
  frame = requestAnimationFrame(animateWave);
}
function syncAnimation() {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null; lastTime = 0;
  const paused = reducedMotion.matches || userPaused;
  toggle.disabled = reducedMotion.matches;
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.innerHTML = reducedMotion.matches ? 'Movimiento reducido' : paused ? 'Activar movimiento <span aria-hidden="true">▷</span>' : 'Pausar movimiento <span aria-hidden="true">Ⅱ</span>';
  if (visible && !document.hidden && !paused) frame = requestAnimationFrame(animateWave);
  else if (visible && !document.hidden) drawWave();
}
toggle.addEventListener('click', () => { userPaused = !userPaused; syncAnimation(); });
canvas.addEventListener('pointermove', event => {
  if (reducedMotion.matches) return;
  const rect = canvas.getBoundingClientRect();
  pointer = {x:(event.clientX - rect.left)/rect.width, y:(event.clientY - rect.top)/rect.height};
});
new ResizeObserver(resizeCanvas).observe(canvas);
new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncAnimation(); }).observe(canvas);
document.addEventListener('visibilitychange', syncAnimation);
reducedMotion.addEventListener('change', () => {
  heroArt?.querySelector('img')?.style.removeProperty('transform');
  syncAnimation();
});
}
