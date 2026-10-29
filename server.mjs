import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const mime = {'.webp':'image/webp','.woff2':'font/woff2','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  // This loopback server is a development preview, not the public deployment.
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  try {
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
    const requested=new URL(req.url,'http://localhost');
    const pathname = decodeURIComponent(requested.pathname);
    if(pathname.includes('\\') || pathname.includes('\0')){res.writeHead(400);res.end();return;}
    if(pathname.endsWith('/index.html')){
      res.writeHead(301,{'Location':pathname.slice(0,-10)+requested.search});res.end();return;
    }
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const info=await stat(file);
    if(info.isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(301,{'Location':pathname+'/'+requested.search});res.end();return;}
      file=path.join(file,'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:body);
  } catch {
    const body=await readFile(path.join(root,'404.html')).catch(()=>Buffer.from('Not found'));
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
    res.end(req.method==='HEAD'?undefined:body);
  }
});
server.listen(4173, '127.0.0.1', () => console.log('Noxum Lab: http://127.0.0.1:4173'));
