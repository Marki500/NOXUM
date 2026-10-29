import {readFile, writeFile, mkdir, stat} from 'node:fs/promises';
import {site, services, projects, projectStories} from '../content/site.js';

const root = new URL('../', import.meta.url);
const e = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const absolute = path => new URL(path, site.url).href;
const urlForService = slug => `/servicios/${slug}/`;
const urlForProject = slug => `/proyectos/${slug}/`;
let home = await readFile(new URL('index.html', root), 'utf8');
const header = home.match(/<header class="header">[\s\S]*?<\/header>/)[0].replaceAll('href="#', 'href="/#');
const dialog = home.match(/<dialog id="contact-dialog"[\s\S]*?<\/dialog>/)[0];
const organization = {'@type':'Organization','@id':`${site.url}/#organization`,name:site.name,url:`${site.url}/`,email:site.email,description:site.description};

function seo({path, title, description, breadcrumbs = [], mainEntity, image = '/assets/noxum-social.png', type = 'WebPage'}) {
  const canonical = absolute(path);
  const graph = [organization, {'@type':'WebSite','@id':`${site.url}/#website`,url:`${site.url}/`,name:site.name,inLanguage:'es',publisher:{'@id':organization['@id']}},
    {'@type':type,'@id':canonical+'#page',url:canonical,name:title,description,inLanguage:'es',isPartOf:{'@id':`${site.url}/#website`},...(mainEntity ? {mainEntity} : {})}];
  if (breadcrumbs.length) graph.push({'@type':'BreadcrumbList',itemListElement:breadcrumbs.map((crumb,i)=>({'@type':'ListItem',position:i+1,name:crumb.name,item:absolute(crumb.path)}))});
  return `<title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${absolute(image)}">
  ${image === '/assets/noxum-social.png' ? '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' : ''}
  <meta property="og:image:alt" content="${e(image.includes('project-') ? title : 'Pieza metálica de Noxum Lab')}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(title)}">
  <meta name="twitter:description" content="${e(description)}">
  <meta name="twitter:image" content="${absolute(image)}">
  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c')}</script>`;
}

const directory = `<div class="footer-directory" aria-label="Servicios y contacto"><div><a class="wordmark" href="/" aria-label="Noxum Lab, inicio">noxum<span class="wordmark-lab">lab<span class="brand-square"></span></span></a><p>Desde un cambio puntual<br>hasta un proyecto completo.</p><a class="footer-email" href="mailto:${site.email}">${site.email} ↗</a></div><nav aria-label="Servicios">${services.map(s=>`<a href="${urlForService(s.slug)}">${e(s.name)}</a>`).join('')}</nav><nav aria-label="Sobre Noxum Lab"><a href="/servicios/">Todos los servicios</a><a href="/#proyectos">Proyectos</a><a href="/sobre-noxum-lab/">Sobre Noxum Lab</a><a href="/contacto/">Contacto</a></nav></div>`;
const footer = `<footer class="site-footer">${directory}<div class="footer-base"><p>Desarrollo independiente para clientes de toda España.</p><a href="#contenido">Volver arriba ↑</a></div></footer>`;
const route = crumbs => `<nav class="breadcrumbs" aria-label="Ruta de navegación"><ol>${crumbs.map((c,i)=>`<li>${i===crumbs.length-1 ? `<span aria-current="page">${e(c.name)}</span>` : `<a href="${c.path}">${e(c.name)}</a>`}</li>`).join('')}</ol></nav>`;
const cta = `<section class="detail-cta"><p>Un cambio pequeño también es un proyecto.</p><h2>Cuéntame qué necesitas.</h2><button class="button button-lime contact-trigger">Preparar consulta <span aria-hidden="true">↗</span></button><a href="mailto:${site.email}">${site.email}</a></section>`;
const serviceLinks = slugs => `<div class="related-services">${slugs.map(slug=>{const s=services.find(s=>s.slug===slug); return `<a href="${urlForService(slug)}">${e(s.name)} <span aria-hidden="true">↗</span></a>`;}).join('')}</div>`;
const scope = items => `<div class="scope-grid">${items.map(([title,text])=>`<article><h3>${e(title)}</h3><p>${e(text)}</p></article>`).join('')}</div>`;
function projectPreview(slug) {
  const p=projects.find(p=>p.slug===slug);
  return `<section class="detail-proof"><a href="${urlForProject(slug)}"><img src="/assets/${p.image}" width="${p.width}" height="${p.height}" loading="lazy" alt="Captura real de ${e(p.name)}${slug==='nivel' ? ', pantalla pública de acceso' : ', portada de la web'}"></a><div><p class="section-caption">Un proyecto que puedes ver</p><h2>${e(p.name)}</h2><p>${e(p.lead)}</p><a class="project-link" href="${urlForProject(slug)}">Conocer el proyecto <span aria-hidden="true">↗</span></a></div></section>`;
}
const generated = [];
async function writeChanged(path, value) {
  const url = new URL(path, root);
  let previous;
  try { previous=await readFile(url,'utf8'); } catch {}
  if(previous !== value) { await mkdir(new URL('./',url),{recursive:true}); await writeFile(url,value,'utf8'); }
}
async function page(config) {
  const html=`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#e9e8e2">
${seo(config)}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="/assets/fonts/anton-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/motion.css"><script type="module" src="/app.js"></script><script type="module" src="/assets/site-loader.js"></script></head>
<body class="detail-page"${config.form ? ` data-service="${e(config.form)}"` : ''}><a class="skip-link" href="#contenido">Ir al contenido</a>${header}<main id="contenido" class="detail-main">${route(config.breadcrumbs)}${config.content}${config.cta ?? cta}</main>${footer}${dialog}</body></html>`;
  const file = `${config.path.slice(1)}index.html`;
  await writeChanged(file,html);
  generated.push({path:config.path,file});
}

for (const s of services) {
  await page({path:urlForService(s.slug),title:s.title,description:s.description,form:s.form,
    breadcrumbs:[{name:'Inicio',path:'/'},{name:'Servicios',path:'/servicios/'},{name:s.name,path:urlForService(s.slug)}],
    mainEntity:{'@type':'Service',name:s.name,serviceType:s.name,description:s.description,provider:{'@id':organization['@id']},areaServed:{'@type':'Country',name:'España'},url:absolute(urlForService(s.slug))},
    content:`<section class="detail-hero"><p class="detail-label">${e(s.name)}</p><h1>${e(s.heading)}</h1><p class="detail-lead">${e(s.lead)}</p><button class="button button-lime contact-trigger">Hablar de mi proyecto <span aria-hidden="true">↗</span></button></section>
    <section class="detail-section"><h2>Empezamos por tu necesidad.</h2><p class="section-intro">${e(s.context)}</p>${scope(s.includes)}</section>
    <section class="detail-note"><h2>¿Por dónde empezamos?</h2><p>${e(s.needs)}</p></section>
    ${s.project ? projectPreview(s.project) : ''}
    <section class="detail-section detail-faq"><h2>Antes de empezar.</h2>${s.faq.map(([q,a])=>`<details><summary>${e(q)}<span aria-hidden="true">+</span></summary><p>${e(a)}</p></details>`).join('')}</section>
    <section class="detail-section"><h2>También puedo ayudarte con…</h2>${serviceLinks(s.related)}</section>`});
}

for (const p of projects) {
  const story=projectStories[p.slug];
  const next=projects[(projects.indexOf(p)+1)%projects.length];
  await page({path:urlForProject(p.slug),title:p.title,description:p.description,image:`/assets/${p.image}`,form:p.slug==='nivel' ? 'Software a medida' : 'Diseño y desarrollo web',
    breadcrumbs:[{name:'Inicio',path:'/'},{name:'Proyectos',path:'/#proyectos'},{name:p.name,path:urlForProject(p.slug)}],
    mainEntity:{'@type':'CreativeWork',name:p.name,description:p.description,url:p.url,creator:{'@id':organization['@id']}},
    cta:`<section class="detail-cta"><h2>${e(story.cta)}</h2><button class="button button-lime contact-trigger">Hablemos <span aria-hidden="true">↗</span></button><a href="mailto:${site.email}">${site.email}</a></section>`,
    content:`<section class="detail-hero"><p class="detail-label">${e(p.category)}</p><h1>${e(p.name)}</h1><p class="detail-lead">${e(p.lead)}</p><a class="button button-lime" href="${p.url}" target="_blank" rel="noopener noreferrer">Visitar ${e(p.name)} <span aria-hidden="true">↗</span></a></section>
    <dl class="case-summary">${story.summary.map(([label,value])=>`<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>
    <figure class="case-image"><img src="/assets/${p.image}" width="${p.width}" height="${p.height}" fetchpriority="high" alt="Captura real de ${e(p.name)}${p.slug==='nivel' ? ', pantalla pública de acceso' : ', portada de la web'}"><figcaption>${p.slug==='nivel' ? 'Pantalla pública de acceso a Nivel.' : 'Portada pública de Finques Salpí.'}</figcaption></figure>
    <section class="detail-section case-story"><h2>${e(story.heading)}</h2><div class="case-story-copy"><div><h3>La necesidad</h3><p>${e(story.need)}</p></div><div><h3>La solución</h3><p>${e(story.solution)}</p></div></div>
    ${story.flow ? `<ol class="case-flow" aria-label="Recorrido de la información">${story.flow.map(([label,text],i)=>`<li><h3>${e(label)}</h3><p>${e(text)}</p>${i<story.flow.length-1 ? '<span aria-hidden="true">→</span>' : ''}</li>`).join('')}</ol>` : `<div class="case-areas">${story.areas.map(([label,text])=>`<article><h3>${e(label)}</h3><p>${e(text)}</p></article>`).join('')}</div>`}</section>
    <section class="detail-section case-detail"><h2>${e(story.detailHeading)}</h2><p class="section-intro">${e(story.detailText)}</p>${story.image ? `<figure class="case-image case-secondary-image"><img src="/assets/${story.image}" width="${story.imageWidth}" height="${story.imageHeight}" loading="lazy" alt="${e(story.imageAlt)}"><figcaption>${e(story.imageCaption)}</figcaption></figure><a class="project-link" href="${story.detailUrl}" target="_blank" rel="noopener noreferrer">${e(story.detailLink)} <span aria-hidden="true">↗</span></a>` : ''}</section>
    <section class="detail-section"><h2>Servicios relacionados.</h2>${serviceLinks(p.services)}</section>
    <nav class="case-next" aria-label="Otro proyecto"><a href="${urlForProject(next.slug)}"><span>Otro proyecto</span><strong>${e(next.name)}</strong><span aria-hidden="true">↗</span></a></nav>`});
}

const groups=[...new Set(services.map(s=>s.group))];
await page({path:'/servicios/',title:'Servicios de desarrollo web, software e IA | Noxum Lab',description:'Explora los servicios de Noxum Lab: arreglos puntuales, desarrollo web, ecommerce, software personalizado, SaaS, automatización y asistentes de IA.',
  breadcrumbs:[{name:'Inicio',path:'/'},{name:'Servicios',path:'/servicios/'}],
  content:`<section class="detail-hero"><p class="detail-label">Desarrollo para clientes de toda España</p><h1>Pequeños cambios.<br>Grandes proyectos.</h1><p class="detail-lead">Un arreglo, una web o una aplicación completa. Cuéntame qué necesitas y valoramos el alcance, la viabilidad y los siguientes pasos.</p></section>
  ${groups.map(group=>`<section class="detail-section service-directory"><h2>${e(group)}</h2>${services.filter(s=>s.group===group).map(s=>`<a href="${urlForService(s.slug)}"><div><h3>${e(s.name)}</h3><p>${e(s.lead)}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</section>`).join('')}`});

await page({path:'/sobre-noxum-lab/',type:'AboutPage',title:'Sobre Noxum Lab | Desarrollo independiente',description:'Noxum Lab es un proyecto independiente de desarrollo web y software. Trato directo y encargos de distintos tamaños para clientes de toda España.',
  breadcrumbs:[{name:'Inicio',path:'/'},{name:'Sobre Noxum Lab',path:'/sobre-noxum-lab/'}],
  content:`<section class="detail-hero about-intro"><p class="detail-label">Sobre Noxum Lab</p><h1>El lab<br>soy yo.</h1><p class="detail-lead">Soy desarrollador web. Noxum Lab es el nombre bajo el que construyo webs, aplicaciones y herramientas para otros negocios.</p><div class="about-work" aria-label="Proyectos de Noxum Lab">${projects.map(p=>`<a href="${urlForProject(p.slug)}"><img src="/assets/${p.image}" width="${p.width}" height="${p.height}" alt="${e(p.name)}${p.slug==='nivel' ? ', pantalla pública de acceso' : ', web inmobiliaria'}"><span>${e(p.name)} <span aria-hidden="true">↗</span></span></a>`).join('')}</div></section>
  <section class="detail-section"><p class="about-statement">Puedes traer una idea, una web que necesita cambios o un problema que llevas tiempo resolviendo a mano.</p><p class="section-intro">No hace falta que sea un proyecto grande. Primero revisamos qué necesitas y si puedo ayudarte. Después acordamos el trabajo, el presupuesto y los plazos.</p>${scope([['Hablas conmigo','La persona que estudia tu proyecto es también quien lo desarrolla.'],['Sabes qué entra','Antes de empezar dejamos claro qué voy a entregar y qué queda fuera del alcance.'],['Ves los avances','Puedes revisar el trabajo mientras lo construyo y comentar los cambios.'],['La entrega se acuerda','Definimos cómo ponerlo en marcha, cómo usarlo y qué soporte necesitas después.']])}</section>
  <section class="detail-section"><h2>Desde donde estés.</h2><p class="section-intro">Trabajo con clientes de toda España. Podemos estudiar tu proyecto y revisar los avances a distancia.</p></section>`});

await page({path:'/contacto/',type:'ContactPage',title:'Contacto | Cuéntame tu proyecto | Noxum Lab',description:'Contacta con Noxum Lab para un cambio puntual, una web, una automatización o software a medida. Explica tu necesidad y valoramos el siguiente paso.',
  breadcrumbs:[{name:'Inicio',path:'/'},{name:'Contacto',path:'/contacto/'}],
  content:`<section class="detail-hero"><p class="detail-label">Un cambio puntual o un proyecto completo</p><h1>¿Qué necesitas resolver?</h1><p class="detail-lead">No hace falta tener un documento cerrado. Una explicación del problema y del resultado que buscas es un buen comienzo.</p><a class="contact-address" href="mailto:${site.email}">${site.email} ↗</a></section>
  <section class="detail-section"><h2>Para situar el proyecto.</h2>${scope([['Qué quieres hacer','Una web nueva, un error, una función, una aplicación o una tarea que quieres automatizar.'],['Lo que ya existe','Comparte el enlace público o explica qué herramientas usas. No envíes contraseñas ni accesos en la primera consulta.'],['Plazos y prioridades','Si tienes una fecha o varias necesidades, explica qué es lo más importante.'],['Un presupuesto orientativo','Si ya tienes un límite, indicarlo ayuda a valorar un alcance posible.']])}<p class="section-intro">El formulario prepara un mensaje en tu aplicación de correo. Revisa el contenido y envíalo desde allí; también puedes copiar el resumen.</p></section>`});

const homeSeo=seo({path:'/',title:'Desarrollo web y software a medida | Noxum Lab',description:site.description});
home=home.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/,`<!-- seo:start -->\n  ${homeSeo}\n  <!-- seo:end -->`);
home=home.replace(/<footer[\s\S]*?<\/footer>/,footer);
for(const p of projects){
  const expression=new RegExp(`<a class="project-link" href="${p.url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"[^>]*>[\\s\\S]*?<\\/a>`);
  home=home.replace(expression,`<a class="project-link" href="${urlForProject(p.slug)}">Conocer el proyecto <span aria-hidden="true">↗</span></a>`);
}
await writeChanged('index.html',home);
generated.unshift({path:'/',file:'index.html'});

await writeChanged('robots.txt',`User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
const sitemapItems=await Promise.all(generated.map(async p=>`  <url><loc>${absolute(p.path)}</loc><lastmod>${(await stat(new URL(p.file,root))).mtime.toISOString()}</lastmod></url>`));
await writeChanged('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapItems.join('\n')}\n</urlset>\n`);
await writeChanged('404.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Página no encontrada | Noxum Lab</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/motion.css"></head><body class="detail-page"><header class="header"><a class="wordmark" href="/">noxum<span class="wordmark-lab">lab</span></a></header><main class="detail-main"><section class="detail-hero"><p class="detail-label">Página no encontrada</p><h1>Por aquí no era.</h1><p class="detail-lead">Esta dirección no corresponde a una página de Noxum Lab.</p><a class="button button-lime" href="/">Volver al inicio ↗</a></section></main></body></html>`);
console.log(`Contenido preparado: ${generated.length} páginas, sitemap y robots.txt.`);
