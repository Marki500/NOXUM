import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {site} from '../content/site.js';

const root=new URL('../dist/',import.meta.url);
const sitemap=await readFile(new URL('sitemap.xml',root),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
assert.ok(urls.length>=14,'Service and project pages must be included in the sitemap');
assert.equal(new Set(urls).size,urls.length,'Sitemap URLs must be unique');
const titles=new Set(),descriptions=new Set();
let internalLinks=0;
for(const url of urls){
  const route=new URL(url);
  assert.equal(route.origin,site.url);
  assert.ok(route.pathname.endsWith('/'),'Canonical page URLs must end in a slash');
  const html=await readFile(new URL(`${route.pathname.slice(1)}index.html`,root),'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`${url}: one main heading required`);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,`${url}: one canonical required`);
  assert.ok(html.includes(`rel="canonical" href="${url}"`),`${url}: incorrect canonical`);
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description=html.match(/name="description" content="([^"]+)"/)?.[1];
  assert.ok(title && description,`${url}: missing metadata`);
  assert.ok(!titles.has(title),`${url}: duplicate title`);titles.add(title);
  assert.ok(!descriptions.has(description),`${url}: duplicate description`);descriptions.add(description);
  assert.ok(!/name="robots" content="[^"]*noindex/.test(html),`${url}: public build must be indexable`);
  const json=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const schema=JSON.parse(json);
  assert.equal(schema['@context'],'https://schema.org');
  assert.ok(schema['@graph'].some(node=>node['@type']==='Organization'));
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const value=match[1].replaceAll('&amp;','&');
    if(/^(mailto:|data:|tel:)/.test(value))continue;
    const target=new URL(value,url);
    if(target.origin!==site.url)continue;
    const file=target.pathname.endsWith('/')?`${target.pathname.slice(1)}index.html`:target.pathname.slice(1);
    await stat(new URL(file,root)).catch(()=>{throw new Error(`${url}: missing internal target ${value}`);});
    if(target.hash){
      const destination=await readFile(new URL(file,root),'utf8');
      assert.ok(destination.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`),`${url}: missing anchor ${value}`);
    }
    internalLinks++;
  }
}
const robots=await readFile(new URL('robots.txt',root),'utf8');
assert.ok(robots.includes(`Sitemap: ${site.url}/sitemap.xml`));
assert.ok(robots.includes('User-agent: OAI-SearchBot\nAllow: /'));
assert.ok((await readFile(new URL('404.html',root),'utf8')).includes('content="noindex"'));
console.log(`Verificado: ${urls.length} páginas, ${internalLinks} enlaces y recursos internos, metadatos únicos, canonical, JSON-LD, robots y sitemap.`);
