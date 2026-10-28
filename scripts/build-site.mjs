import './build-content.mjs';
import {build} from 'esbuild';
import {cp, mkdir, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(path.join(root,'assets/fonts'),{recursive:true});
for(const file of ['manrope-latin-wght-normal.woff2','manrope-latin-ext-wght-normal.woff2']) {
  await cp(path.join(root,'node_modules/@fontsource-variable/manrope/files',file),path.join(root,'assets/fonts',file));
}
await cp(path.join(root,'node_modules/@fontsource-variable/manrope/LICENSE'),path.join(root,'assets/fonts/Manrope-LICENSE.txt'));
for(const file of ['anton-latin-400-normal.woff2','anton-latin-ext-400-normal.woff2']) {
  await cp(path.join(root,'node_modules/@fontsource/anton/files',file),path.join(root,'assets/fonts',file));
}
await cp(path.join(root,'node_modules/@fontsource/anton/LICENSE'),path.join(root,'assets/fonts/Anton-LICENSE.txt'));
await build({absWorkingDir:root,entryPoints:[path.join(root,'motion.js')],outfile:path.join(root,'assets/motion.bundle.js'),bundle:true,minify:true,format:'esm',platform:'browser',target:['es2020'],legalComments:'linked',sourcemap:false,tsconfigRaw:{}});
await build({
  absWorkingDir:root, entryPoints:[path.join(root,'sculpture.js')], outfile:path.join(root,'assets/sculpture.bundle.js'),
  bundle:true,minify:true,format:'esm',platform:'browser',target:['es2020'],legalComments:'linked',sourcemap:false,tsconfigRaw:{}
});
const dist=path.join(root,'dist');
await mkdir(dist,{recursive:true});
for(const file of ['index.html','404.html','styles.css','motion.css','app.js','robots.txt','sitemap.xml','servicios','proyectos','sobre-noxum-lab','contacto']) {
  await cp(path.join(root,file),path.join(dist,file),{recursive:true});
}
await cp(path.join(root,'assets'),path.join(dist,'assets'),{
  recursive:true,filter:source=>!source.split(path.sep).includes('vendor')
});
const bytes=(await stat(path.join(root,'assets/sculpture.bundle.js'))).size;
console.log(`Web estática preparada en dist/. Pieza 3D: ${(bytes/1024).toFixed(0)} KiB de JavaScript sin comprimir.`);
