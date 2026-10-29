import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
const html=await readFile(path.join(dist,'index.html'),'utf8');
const entries=[...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(match=>match[1]);
let initialBytes=0;
for(const entry of entries){
  assert.match(entry,/^\/assets\/(app|site-loader)-[A-Z0-9]+\.js$/,'Only lightweight entries may block startup');
  initialBytes+=(await stat(path.join(dist,entry.slice(1)))).size;
}
assert.ok(initialBytes<12*1024,'Initial main-thread scripts must stay below 12 KiB');
assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1,'One bundled stylesheet');
assert.match(html,/<img[^>]+noxum-poster[^>]+srcset=[^>]+fetchpriority="high"/,'The hero must paint before WebGL starts');
const files=await readdir(path.join(dist,'assets'));
assert.ok(files.some(file=>/^sculpture-worker-.*\.js$/.test(file)),'3D must have a dedicated worker build');
for(const file of files.filter(file=>file.endsWith('.js'))){
  const code=await readFile(path.join(dist,'assets',file),'utf8');
  // Verify split imports and the worker URL point to real output files.
  const references=[...code.matchAll(/(?:import\(|from\s*)["'](\.\/[^"']+\.js)["']/g)].map(match=>match[1]);
  references.push(...[...code.matchAll(/["'](\/assets\/sculpture-worker-[^"']+\.js)["']/g)].map(match=>match[1]));
  for(const target of references)await stat(target.startsWith('/')?path.join(dist,target.slice(1)):path.join(dist,'assets',target));
}
console.log(`Rendimiento: ${(initialBytes/1024).toFixed(1)} KiB iniciales de JS, 3D en worker, imports y vista inicial verificados.`);
