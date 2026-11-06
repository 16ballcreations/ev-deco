// Servidor local para ver el sitio: node herramientas/servir.mjs [puerto]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const puerto = Number(process.argv[2] || process.env.PORT || 4321);
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.json': 'application/json',
};

createServer(async (req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta.endsWith('/')) ruta += 'index.html';
  const archivo = normalize(join(raiz, ruta));
  if (!archivo.startsWith(normalize(raiz))) { res.writeHead(403).end(); return; }
  try {
    const s = await stat(archivo);
    const final = s.isDirectory() ? join(archivo, 'index.html') : archivo;
    res.writeHead(200, { 'content-type': tipos[extname(final)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(final));
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('No existe');
  }
}).listen(puerto, () => console.log(`EV DecoInteriorismo en http://localhost:${puerto}`));
