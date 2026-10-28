import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.header');
const arrivalHash = location.hash;
let anchorPending = Boolean(arrivalHash);
const cancelAnchor = () => { anchorPending = false; };
const arrivalInputs = ['wheel','touchstart','pointerdown','keydown'];
if (anchorPending) arrivalInputs.forEach(name=>window.addEventListener(name,cancelAnchor,{once:true,passive:true}));

function settleArrivalAnchor() {
  const finish = () => {
    arrivalInputs.forEach(name=>window.removeEventListener(name,cancelAnchor));
    anchorPending = false;
  };
  if (!anchorPending || location.hash !== arrivalHash) { finish(); return; }
  let target;
  try { target = document.getElementById(decodeURIComponent(arrivalHash.slice(1))); } catch {}
  if (!target) { finish(); return; }
  ScrollTrigger.refresh();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    // Fonts and pin spacers can move the destination after the browser's first
    // native hash jump. Correct it once, without interrupting user input.
    if(anchorPending && location.hash === arrivalHash)target.scrollIntoView({behavior:'instant',block:'start'});
    finish();
  }));
}
const nativeRoutes = 'onpageswap' in window && 'onpagereveal' in window && CSS.supports('view-transition-name', 'root');
root.dataset.routeTransitions = nativeRoutes ? 'native' : 'curtain';

// Real document navigation remains intact: crawlable URLs, normal history,
// native browser transitions where supported, a curtain as progressive fallback.
const curtain = document.createElement('div');
curtain.className = 'route-curtain';
curtain.setAttribute('aria-hidden', 'true');
curtain.innerHTML = '<span class="route-brand">NOXUM</span><span class="route-caption">Noxum Lab</span>';
document.body.append(curtain);
let routing = false;
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
  const target = new URL(link.href, location.href);
  if (target.origin !== location.origin || !/^https?:$/.test(target.protocol) || target.pathname === location.pathname || nativeRoutes || reduce.matches) return;
  event.preventDefault();
  if (routing) return;
  routing = true;
  root.classList.add('is-routing');
  curtain.querySelector('.route-caption').textContent = (link.querySelector('h3')?.textContent || link.textContent).replace(/↗/g, '').trim().slice(0, 90);
  gsap.timeline({onComplete: () => location.assign(target.href)})
    .fromTo(curtain, {yPercent:100}, {yPercent:0, duration:.55, ease:'power4.inOut'})
    .fromTo(curtain.children, {y:55, opacity:0}, {y:0, opacity:1, duration:.4, stagger:.06, ease:'power3.out'}, .14);
  // Never strand a user if a browser declines the navigation.
  window.setTimeout(() => {
    if (!routing) return;
    root.classList.remove('is-routing');
    gsap.set(curtain, {yPercent:-100});
    routing = false;
  }, 3000);
});
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    routing = false;
    root.classList.remove('is-routing');
    gsap.set(curtain, {yPercent:-100});
    ScrollTrigger.refresh();
  }
});

function wrapWords(element) {
  if (element.dataset.wordsReady) return element.querySelectorAll('.motion-word-inner');
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const textNode of textNodes) {
    if (!textNode.textContent.trim()) continue;
    const fragment = document.createDocumentFragment();
    for (const token of textNode.textContent.split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) { fragment.append(document.createTextNode(token)); continue; }
      const mask = document.createElement('span');
      mask.className = 'motion-word';
      const inner = document.createElement('span');
      inner.className = 'motion-word-inner';
      inner.textContent = token;
      mask.append(inner); fragment.append(mask);
    }
    textNode.replaceWith(fragment);
  }
  element.dataset.wordsReady = 'true';
  return element.querySelectorAll('.motion-word-inner');
}

const pointerCleanups = [];
function springButton(button) {
  const x = gsap.quickTo(button, 'x', {duration:.6, ease:'power3.out'});
  const y = gsap.quickTo(button, 'y', {duration:.6, ease:'power3.out'});
  const move = event => {
    if (event.pointerType !== 'mouse') return;
    const rect = button.getBoundingClientRect();
    x(((event.clientX - rect.left) / rect.width - .5) * 12);
    y(((event.clientY - rect.top) / rect.height - .5) * 10);
  };
  const leave = () => { x(0); y(0); };
  button.addEventListener('pointermove', move);
  button.addEventListener('pointerleave', leave);
  pointerCleanups.push(() => {button.removeEventListener('pointermove', move); button.removeEventListener('pointerleave', leave); x.tween.kill(); y.tween.kill(); gsap.set(button,{clearProps:'x,y'});});
}

function wipeImage(link) {
  if (!link.querySelector('img')) return;
  let mask = link.querySelector('.media-wipe');
  if (!mask) {
    mask = document.createElement('span');
    mask.className = 'media-wipe';
    mask.setAttribute('aria-hidden', 'true');
    link.append(mask);
  }
  gsap.fromTo(mask, {scaleX:1}, {scaleX:0, duration:1.1, ease:'power4.inOut', scrollTrigger:{trigger:link, start:'top 87%', once:true}});
}

function startMotion() {
  root.classList.add('motion-enhanced');
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const context = gsap.context(() => {
      const incoming = document.querySelector('main h1');
      if (incoming) {
        const words = wrapWords(incoming);
        const intro = gsap.timeline({delay:.1});
        intro.fromTo(words, {yPercent:115, rotate:3}, {yPercent:0, rotate:0, duration:1.2, stagger:.065, ease:'power4.out'});
        for (const [selector, y, duration, position] of [
          ['.hero-copy .eyebrow, .detail-hero .detail-label',15,.7,.1],
          ['.hero-description, .detail-lead',28,.9,.35],
          ['.hero-copy .button, .detail-hero .button, .detail-hero .contact-address',30,.8,.5]
        ]) {
          const targets = document.querySelectorAll(selector);
          if(targets.length)intro.fromTo(targets,{y,opacity:0},{y:0,opacity:1,duration,stagger:.08},position);
        }
      }
      if (!nativeRoutes && document.referrer && new URL(document.referrer).origin === location.origin) {
        gsap.fromTo(curtain, {yPercent:0}, {yPercent:-100, duration:.7, ease:'power4.inOut', delay:.05});
      }

      document.querySelectorAll('.quick-start h2, .projects-heading h2, .project-heading h3, .intro-heading h2, .capability h3, .lab-heading h2, .process-intro h2, .contact h2, .detail-section>h2, .detail-cta h2').forEach(heading => {
        const words = wrapWords(heading);
        gsap.fromTo(words, {yPercent:108, rotate:2}, {yPercent:0, rotate:0, duration:1, ease:'power4.out', stagger:.045, scrollTrigger:{trigger:heading,start:'top 91%',once:true}});
      });

      const revealTargets = document.querySelectorAll('.quick-start p, .quick-start>.project-link, .projects-heading>p, .intro-heading>p, .capability-intro, .capability-services, .services-bottom, .lab-heading>p:last-child, .experiment, .process-intro>p, .process-steps article, .contact-bottom, .scope-grid article, .detail-note, .detail-proof>div, .detail-faq details, .related-services, .service-directory>a, .case-image figcaption, .about-statement');
      revealTargets.forEach((element,index) => gsap.fromTo(element,{y:45,opacity:0},{y:0,opacity:1,duration:.95,delay:index%2*.06,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 92%',once:true}}));
      document.querySelectorAll('.project-image, .detail-proof>a').forEach(wipeImage);
      document.querySelectorAll('.case-image').forEach(figure => {
        gsap.fromTo(figure.querySelector('img'), {y:45,opacity:0,scale:.96}, {y:0,opacity:1,scale:1,duration:1.2,ease:'power4.out',scrollTrigger:{trigger:figure,start:'top 94%',once:true}});
      });

      ScrollTrigger.create({start:40,end:'max',onUpdate:self=>header?.classList.toggle('is-scrolled',self.scroll()>40)});
      const desktop = gsap.matchMedia();
      desktop.add('(min-width: 1000px) and (pointer: fine)', () => {
        const cards = [...document.querySelectorAll('.projects>.project-case')];
        if (cards.length) {
          root.classList.add('project-stack-enabled');
          cards.slice(0,-1).forEach((card,i) => {
            ScrollTrigger.create({trigger:card,start:'top top',endTrigger:cards.at(-1),end:'top top',pin:true,pinSpacing:false,invalidateOnRefresh:true});
            gsap.to(card,{scale:.95,opacity:.35,transformOrigin:'50% 42%',ease:'none',scrollTrigger:{trigger:cards[i+1],start:'top bottom',end:'top top',scrub:true}});
          });
          cards.forEach(card => {
            gsap.fromTo(card.querySelector('.project-image img'),{yPercent:-3,scale:1.08},{yPercent:3,scale:1.08,ease:'none',scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:1}});
            gsap.fromTo(card.querySelector('.project-info'),{y:55,opacity:0},{y:0,opacity:1,duration:1,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 78%',once:true}});
          });
        }
        const hero = document.querySelector('.hero');
        if(hero){
          // The first scroll opens the poster into a close-up of its assembled N.
          const scene = gsap.timeline({scrollTrigger:{trigger:hero,start:'top top',end:'+=35%',scrub:.65,pin:true,anticipatePin:1,invalidateOnRefresh:true,refreshPriority:10}});
          scene.to('.hero-art',{scale:1.2,rotation:-5,yPercent:-2,ease:'none'},0)
            .to('.hero h1',{yPercent:-34,opacity:.12,ease:'none'},0)
            .to('.hero-footer, .hero>.sculpture-controls',{y:30,autoAlpha:0,ease:'none',duration:.35},0);
        }
        document.querySelectorAll('.button-lime, .contact-circle').forEach(springButton);
        return () => {
          root.classList.remove('project-stack-enabled');
          pointerCleanups.splice(0).forEach(cleanup=>cleanup());
        };
      });

      const toggles=[];
      document.querySelectorAll('.detail-faq details').forEach(detail=>{
        const handle=()=>{
          const content=[...detail.children].slice(1);
          if(detail.open && content.length)gsap.fromTo(content,{y:14,opacity:0},{y:0,opacity:1,duration:.45,ease:'power3.out',clearProps:'transform,opacity'});
          ScrollTrigger.refresh();
        };
        detail.addEventListener('toggle',handle);toggles.push(()=>detail.removeEventListener('toggle',handle));
      });
      document.querySelectorAll('img').forEach(img=>{
        if(!img.complete)img.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
      });
      root.dataset.motion = 'ready';
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      return () => {
        desktop.revert();
        toggles.forEach(cleanup=>cleanup());
      };
    });
    return () => context.revert();
  });
  reduce.addEventListener('change',()=>{
    if(reduce.matches){root.classList.remove('is-routing');routing=false;gsap.set(curtain,{yPercent:-100});}
  });
}

// Fonts are local. A slow font never holds navigation or content behind a loader.
Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,700))]).then(()=>{
  startMotion();
  if (reduce.matches) root.dataset.motion='reduced';
  if (arrivalHash) document.fonts.ready.then(()=>{
    if (document.readyState==='complete') settleArrivalAnchor();
    else window.addEventListener('load',settleArrivalAnchor,{once:true});
  });
});
