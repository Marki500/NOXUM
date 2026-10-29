import * as THREE from 'three';
import { createMonogramGeometry, createMonogramParts } from './monogram-geometry.js';
import { ASSEMBLY_DURATION, assemblyState, flightEase } from './assembly-timeline.js';

const host = document.querySelector('.hero-art');
const canvas = document.querySelector('#sculpture-canvas');
const controls = document.querySelector('.sculpture-controls');
const pauseButton = document.querySelector('#sculpture-pause');
const resetButton = document.querySelector('#sculpture-reset');
const assembleButton = document.querySelector('#sculpture-assemble');
const instruction = document.querySelector('#sculpture-instruction');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

// Compatibility path for browsers without transferable OffscreenCanvas.
export async function initializeSculpture() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    // Keep the original artwork if WebGL is unavailable.
    canvas.hidden = true;
    return;
  }
  const compact = matchMedia('(max-width: 999px)').matches;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.25);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x101211, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 40);
  camera.position.set(0, 0, 8.5);

  // Local studio environment: light panels become real reflections on the metal.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#252321');
  function panel(width, height, color, intensity, position) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(intensity), side:THREE.DoubleSide});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    studio.add(mesh);
  }
  panel(3, 9, '#f4f6ed', 5, [-4, 2, 4]);
  panel(2, 8, '#ecf0e6', 3, [5, 1, 2]);
  panel(7, 2, '#ffffff', 4, [0, 6, 1]);
  panel(1.5, 7, '#ff7955', 3, [-3, -1, -3]);
  panel(3, 4, '#f05b3c', 2, [4, -2, -2]);
  panel(5, 1, '#e5ebdc', 2, [0, -5, 3]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0, .1, 100, {size:64});
  scene.environment = environment.texture;
  pmrem.dispose();
  studio.traverse(object => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });

  const geometry = createMonogramGeometry();
  const material = new THREE.MeshPhysicalMaterial({
    color: '#7c827b', metalness: 1, roughness: .23,
    clearcoat: .65, clearcoatRoughness: .17, envMapIntensity: 1.15,
    side: THREE.DoubleSide
  });
  const flatColor = new THREE.Color('#ff6444');
  const metalColor = new THREE.Color('#7c827b');
  const flatMaterial = new THREE.MeshBasicMaterial({color:flatColor, side:THREE.DoubleSide, toneMapped:false});
  const sculpture = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(sculpture);
  const partSpecs = [
    {path:[[-7, -1.8, 0], [-2.7, 3.2, 0], [-1.3, .9, 0], [0, 0, 0]], spin:-2.2},
    {path:[[2.2, 7, 0], [-3.4, 4.3, 0], [.8, 1.2, 0], [0, 0, 0]], spin:2.8},
    {path:[[7, -2.4, 0], [3.7, -3.2, 0], [1.3, -.9, 0], [0, 0, 0]], spin:2.1}
  ];
  const parts = createMonogramParts(geometry).map((part, i) => {
    const mesh = new THREE.Mesh(part.geometry, flatMaterial);
    mesh.position.copy(part.pivot);
    mesh.scale.z = .012;
    mesh.renderOrder = 2;
    group.add(mesh);
    const trails = [.04, .085].map((lag, index) => {
      const trailMaterial = new THREE.MeshBasicMaterial({color:flatColor, side:THREE.DoubleSide, toneMapped:false, transparent:true, opacity:0, depthWrite:false});
      const trail = new THREE.Mesh(part.geometry, trailMaterial);
      trail.scale.z = .01;
      trail.renderOrder = 1;
      group.add(trail);
      return {mesh:trail, lag, opacity:index === 0 ? .13 : .045};
    });
    return {...part, ...partSpecs[i], mesh, trails, curve:new THREE.CubicBezierCurve3(...partSpecs[i].path.map(p => new THREE.Vector3(...p)))};
  });
  scene.add(group);
  const ambient = new THREE.HemisphereLight(0xe5ecd9, 0x192112, .5);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xf2f5ea, 3);
  key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7955, 2);
  rim.position.set(3, -1, -3); scene.add(rim);
  const sweep = new THREE.SpotLight(0xffe3d1, 0, 25, .18, .75, 1.5);
  sweep.position.set(-4, 2.8, 5);
  scene.add(sweep, sweep.target);

  let width = 1, height = 1, animationFrame = null, previousTime = 0;
  let lastRendered = 0;
  const frameInterval = 1000 / 30;
  let visible = false, paused = false, dragging = false, rotation = 0;
  let targetX = .16, targetY = -.32, currentX = targetX, currentY = targetY;
  let hoverX = 0, hoverY = 0, lastPointer = null;
  const baseZ = -.08;
  let assemblyTime = motionPreference.matches ? ASSEMBLY_DURATION : 0;
  const assemblyDuration = ASSEMBLY_DURATION;
  let lastPhase = null;
  const pathPoint = new THREE.Vector3();

  function assemble() {
    const state = assemblyState(assemblyTime);
    if (state.phase !== lastPhase) {
      const flying = state.phase === 'flight';
      sculpture.visible = !flying;
      sculpture.material = state.phase === 'flat' ? flatMaterial : material;
      host.setAttribute('aria-busy', String(!state.complete));
      host.classList.toggle('is-assembling', !state.complete);
      instruction.textContent = state.complete ? 'Arrastra para girar' : state.phase === 'reveal' ? 'Revelando el metal…' : 'Ensamblando la N…';
      parts.forEach(part => { part.mesh.visible = flying; });
      lastPhase = state.phase;
    }
    parts.forEach((part, index) => {
      const progress = state.flights[index];
      const eased = flightEase(progress);
      if (state.phase === 'flight') {
        part.curve.getPoint(eased, pathPoint);
        part.mesh.position.copy(part.pivot).add(pathPoint);
        part.mesh.rotation.set(0, 0, part.spin * (1 - eased));
      }
      part.trails.forEach(trail => {
        trail.mesh.visible = state.phase === 'flight' && progress > .08 && progress < .98;
        if (!trail.mesh.visible) return;
        const trailProgress = flightEase(progress - trail.lag);
        part.curve.getPoint(trailProgress, pathPoint);
        trail.mesh.position.copy(part.pivot).add(pathPoint);
        trail.mesh.rotation.set(0, 0, part.spin * (1 - trailProgress));
        trail.mesh.material.opacity = trail.opacity * Math.sin(progress * Math.PI);
      });
    });
    // The flat mark is complete before the lighting and extrusion start.
    sculpture.scale.z = THREE.MathUtils.lerp(.012, 1, state.depth);
    material.color.copy(flatColor).lerp(metalColor, state.light);
    material.emissive.copy(flatColor);
    material.emissiveIntensity = .85 * (1 - state.light);
    material.metalness = state.light;
    material.roughness = THREE.MathUtils.lerp(1, .23, state.light);
    material.clearcoat = .65;
    material.envMapIntensity = 1.15 * state.light;
    ambient.intensity = .5 * state.light;
    key.intensity = 3 * state.light;
    rim.intensity = 2 * state.light;
    sweep.intensity = state.sweep > 0 && state.sweep < 1 ? 95 * Math.sin(state.sweep * Math.PI) : 0;
    sweep.position.x = THREE.MathUtils.lerp(-3.6, 3.6, state.sweep);
    sweep.target.position.set(sweep.position.x - .4, 0, 0);
    group.scale.set(1 + state.impact, 1 - state.impact * .65, 1);
    group.rotation.set((currentX + hoverY) * state.depth, (currentY + Math.sin(rotation) * .22 + hoverX) * state.depth, baseZ * state.depth);
  }

  function render() {
    assemble();
    renderer.render(scene, camera);
  }
  function resize() {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    // Bound the drawing buffer independently of the CSS display size.
    const scale = Math.min(1, 1000 / (Math.max(width, height) * pixelRatio));
    renderer.setSize(Math.round(width * scale), Math.round(height * scale), false);
    camera.aspect = width / height;
    // Fit the bounding sphere in both portrait and landscape without clipping.
    const radius = geometry.boundingSphere.radius;
    const verticalFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontalFov = Math.atan(Math.tan(verticalFov) * camera.aspect);
    camera.position.z = radius / Math.sin(Math.min(verticalFov, horizontalFov)) * 1.12;
    camera.updateProjectionMatrix();
    render();
  }
  function stop() {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null; previousTime = 0;
  }
  function tick(time) {
    animationFrame = null;
    if (!visible || document.hidden) return;
    if (time - lastRendered < frameInterval) {
      animationFrame = requestAnimationFrame(tick);
      return;
    }
    lastRendered = time;
    const elapsed = previousTime ? Math.max(0, (time - previousTime) / 1000) : 0;
    const delta = Math.min(elapsed, .05);
    previousTime = time;
    if (!paused && !motionPreference.matches) {
      if (assemblyTime < assemblyDuration) assemblyTime = Math.min(assemblyDuration, assemblyTime + elapsed);
      else if (!dragging) rotation += delta * .38;
    }
    const ease = 1 - Math.exp(-delta * 8);
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;
    render();
    // A paused or reduced-motion sculpture needs no background render loop.
    if (!paused || dragging || Math.abs(targetX-currentX) + Math.abs(targetY-currentY) > .001) animationFrame = requestAnimationFrame(tick);
  }
  function sync() {
    stop();
    if (motionPreference.matches) assemblyTime = assemblyDuration;
    assembleButton.hidden = motionPreference.matches;
    if (motionPreference.matches) pauseButton.removeAttribute('aria-pressed');
    else pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = motionPreference.matches ? 'Girar un paso' : paused ? 'Reanudar' : 'Pausar animación';
    if (visible && !document.hidden && !motionPreference.matches && !paused) animationFrame = requestAnimationFrame(tick);
    else if (visible && !document.hidden) render();
  }
  function updateStatic() {
    if (motionPreference.matches || paused) { currentX = targetX; currentY = targetY; render(); }
  }
  canvas.addEventListener('pointerdown', event => {
    if (assemblyTime < assemblyDuration) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    lastPointer = {x:event.clientX, y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (dragging && lastPointer) {
      targetY += (event.clientX - lastPointer.x) * .009;
      targetX = THREE.MathUtils.clamp(targetX + (event.clientY - lastPointer.y) * .009, -1.5, 1.5);
      lastPointer = {x:event.clientX, y:event.clientY};
      hoverX = hoverY = 0;
      updateStatic();
    } else if (event.pointerType === 'mouse' && !motionPreference.matches && assemblyTime >= assemblyDuration) {
      const rect = canvas.getBoundingClientRect();
      hoverX = ((event.clientX - rect.left) / width - .5) * .18;
      hoverY = ((event.clientY - rect.top) / height - .5) * .12;
    }
  });
  function release() { dragging = false; lastPointer = null; canvas.classList.remove('is-dragging'); }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('pointerleave', () => { if (!dragging) hoverX = hoverY = 0; });
  canvas.addEventListener('keydown', event => {
    if (assemblyTime < assemblyDuration) return;
    const actions = {ArrowLeft:()=>targetY-=.15, ArrowRight:()=>targetY+=.15, ArrowUp:()=>targetX-=.15, ArrowDown:()=>targetX+=.15};
    if (!actions[event.key]) return;
    event.preventDefault(); actions[event.key]();
    targetX = THREE.MathUtils.clamp(targetX, -1.5, 1.5);
    updateStatic();
  });
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    if (motionPreference.matches) {
      // Under reduced motion, rotate only on explicit input.
      paused = true;
      targetY += Math.PI / 6; updateStatic();
      pauseButton.textContent = 'Girar un paso';
    } else sync();
  });
  resetButton.addEventListener('click', () => {
    targetX = .16; targetY = -.32; rotation = 0; hoverX = hoverY = 0;
    updateStatic();
  });
  assembleButton.addEventListener('click', () => {
    assemblyTime = 0;
    rotation = 0; targetX = .16; targetY = -.32; hoverX = hoverY = 0;
    currentX = targetX; currentY = targetY;
    paused = false;
    sync();
  });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
  visibilityObserver.observe(host);
  document.addEventListener('visibilitychange', sync);
  motionPreference.addEventListener('change', sync);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); stop(); host.classList.remove('is-3d'); controls.hidden = true;
  });
  canvas.addEventListener('webglcontextrestored', () => { host.classList.add('is-3d'); controls.hidden = false; resize(); sync(); });
  window.addEventListener('pageshow', event => {
    if(event.persisted){resize();sync();}
  });
  window.addEventListener('pagehide', event => {
    if(event.persisted){stop();return;}
    stop(); resizeObserver.disconnect(); visibilityObserver.disconnect();
    geometry.dispose(); parts.forEach(part => {
      part.geometry.dispose(); part.trails.forEach(trail => trail.mesh.material.dispose());
    });
    flatMaterial.dispose(); material.dispose(); environment.dispose(); renderer.dispose();
  }, {once:true});
  // Compile both flat and metal materials before starting the flight.
  await renderer.compileAsync(scene, camera);
  resize();
  host.classList.add('is-3d');
  controls.hidden = false;
  sync();
}
