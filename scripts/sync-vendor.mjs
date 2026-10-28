import {mkdir, copyFile} from 'node:fs/promises';
const vendor = new URL('../assets/vendor/', import.meta.url);
await mkdir(vendor, {recursive:true});
for (const name of ['three.module.js', 'three.core.js']) {
  await copyFile(new URL(`../node_modules/three/build/${name}`, import.meta.url), new URL(name, vendor));
}
await copyFile(new URL('../node_modules/three/LICENSE', import.meta.url), new URL('THREE-LICENSE.txt', vendor));
