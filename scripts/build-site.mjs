import './build-content.mjs';
import {build} from 'esbuild';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {cp, mkdir, readFile, writeFile, readdir, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const dist=path.resolve(root,'dist');
// Only remove this project's generated output, never an arbitrary input path.
if(path.dirname(dist)!==root || path.basename(dist)!=='dist') throw new Error('Unexpected output directory');
await rm(dist,{recursive:true,force:true});
await mkdir(path.join(dist,'assets/fonts'),{recursive:true});
for(const [family, files] of [
  ['@fontsource-variable/manrope',['manrope-latin-wght-normal.woff2','manrope-latin-ext-wght-normal.woff2']],
  ['@fontsource/anton',['anton-latin-400-normal.woff2','anton-latin-ext-400-normal.woff2']]
]) {
  for(const file of files) await cp(path.join(root,'node_modules',family,'files',file),path.join(dist,'assets/fonts',file));
  await cp(path.join(root,'node_modules',family,'LICENSE'),path.join(dist,'assets/fonts',family.includes('manrope')?'Manrope-LICENSE.txt':'Anton-LICENSE.txt'));
}
for(const file of ['index.html','404.html','robots.txt','sitemap.xml','servicios','proyectos','sobre-noxum-lab','contacto']) {
  await cp(path.join(root,file),path.join(dist,file),{recursive:true});
}
await cp(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true,
  filter:source=>!source.split(path.sep).includes('vendor') && !/\.bundle\.js(?:\.LEGAL\.txt)?$/.test(source) && !/noxum-(?:sculpture|poster)\.png$/.test(source)
});
const workerBuild=await build({
  absWorkingDir:root,entryPoints:{'sculpture-worker':'sculpture-worker.js'},outdir:path.join(dist,'assets'),
  entryNames:'[name]-[hash]',bundle:true,minify:true,format:'esm',platform:'browser',target:['es2020'],
  legalComments:'linked',sourcemap:false,metafile:true,tsconfigRaw:{}
});
const workerOutput=Object.keys(workerBuild.metafile.outputs).find(file=>file.endsWith('.js'));
const workerUrl='/'+path.relative(dist,path.resolve(root,workerOutput)).split(path.sep).join('/');
const result=await build({
  absWorkingDir:root,entryPoints:{'site-loader':'site-loader.js',app:'app.js',site:'site.css'},
  outdir:path.join(dist,'assets'),entryNames:'[name]-[hash]',chunkNames:'[name]-[hash]',
  bundle:true,splitting:true,minify:true,format:'esm',platform:'browser',target:['es2020'],
  external:['/assets/*'],define:{SCULPTURE_WORKER_URL:JSON.stringify(workerUrl)},
  legalComments:'linked',sourcemap:false,metafile:true,tsconfigRaw:{}
});
const outputFor=entry=>{
  const output=Object.entries(result.metafile.outputs).find(([,data])=>data.entryPoint===entry)?.[0];
  if(!output) throw new Error(`Missing build entry: ${entry}`);
  return '/'+path.relative(dist,path.resolve(root,output)).split(path.sep).join('/');
};
const assets={
  '/assets/site-loader.js':outputFor('site-loader.js'),
  '/app.js':outputFor('app.js'),
  '/styles.css':outputFor('site.css')
};
const images=new Map();
for(const name of ['project-salpi','project-nivel','project-salpi-catalog','noxum-poster']) {
  const input=path.join(root,'assets',name+'.png');
  const widths=name==='noxum-poster'?[480,720]:[640,1280];
  const variants=[];
  for(const width of widths) {
    const {data,info}=await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:82,effort:5}).toBuffer({resolveWithObject:true});
    const hash=createHash('sha256').update(data).digest('hex').slice(0,10);
    const url=`/assets/${name}-${info.width}-${hash}.webp`;
    await writeFile(path.join(dist,url.slice(1)),data);
    variants.push({url,width:info.width,bytes:data.length});
  }
  images.set(`/assets/${name}.png`,variants);
  if(name==='noxum-poster') images.set(`/assets/${name}.webp`,variants);
}
async function optimizeHtml(dir) {
  for(const item of await readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,item.name);
    if(item.isDirectory()){if(item.name!=='assets')await optimizeHtml(file);continue;}
    if(!item.name.endsWith('.html'))continue;
    let html=await readFile(file,'utf8');
    html=html.replace(/<link rel="stylesheet" href="\/?motion\.css">/g,'');
    html=html.replace(/\b(src|href)="([^"]+)"/g,(match,attr,url)=>{
      const replacement=assets[url.startsWith('/')?url:'/'+url];
      return replacement?`${attr}="${replacement}"`:match;
    });
    html=html.replace(/<img\b[^>]*>/g,tag=>tag.replace(/src="([^"]+)"/,(match,url)=>{
      const variants=images.get(url.startsWith('/')?url:'/'+url);
      if(!variants)return match;
      return `src="${variants.at(-1).url}" srcset="${variants.map(v=>`${v.url} ${v.width}w`).join(', ')}" sizes="${url.includes('noxum-poster')?'(max-width: 999px) 100vw, 52vw':'(max-width: 767px) 100vw, 90vw'}" decoding="async"`;
    }));
    await writeFile(file,html);
  }
}
await optimizeHtml(dist);
const scripts=Object.entries({...result.metafile.outputs,...workerBuild.metafile.outputs}).filter(([file])=>file.endsWith('.js')).map(([file,data])=>({file:path.basename(file),kib:Math.round(data.bytes/1024)}));
console.log('Web estática preparada en dist/. JavaScript separado por función:',scripts);
console.log('Vista inicial de la N:',images.get('/assets/noxum-poster.webp').map(v=>`${v.width}px: ${(v.bytes/1024).toFixed(1)} KiB`).join('; '));
