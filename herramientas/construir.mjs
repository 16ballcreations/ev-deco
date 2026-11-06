// Construye la web estática desde fuente/: node herramientas/construir.mjs
// - fuente/marco.html: menú, pie y <head> compartidos.
// - fuente/paginas/*.html: el cuerpo de cada página; la primera línea es un comentario JSON
//   con titulo, descripcion, salida (ruta del archivo final) y activo (enlace del menú).
// - fuente/proyectos.json: los proyectos; de aquí salen el listado y una página por proyecto.
// {{raiz}} se cambia por la ruta relativa a la raíz del sitio según la profundidad de la página.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const raizSitio = fileURLToPath(new URL('..', import.meta.url));
const fuente = join(raizSitio, 'fuente');
const marco = await readFile(join(fuente, 'marco.html'), 'utf8');
const { proyectos } = JSON.parse(await readFile(join(fuente, 'proyectos.json'), 'utf8'));

const MENU = [
  ['inicio', '', 'Inicio'],
  ['proyectos', 'proyectos/', 'Proyectos'],
  ['servicios', 'servicios/', 'Servicios'],
  ['nosotros', 'nosotros/', 'Nosotros'],
  ['ideas', 'ideas/', 'Ideas'],
  ['contacto', 'contacto/', 'Contacto'],
];
const WA = 'https://wa.me/573204980360?text=';
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const img = (r, i, extra = '') => `<img src="${r}assets/img/web/${i.src}" width="${i.w}" height="${i.h}" alt="${esc(i.alt)}"${extra}>`;

function pagina({ salida, titulo, descripcion, activo, contenido }) {
  const nivel = salida.split('/').length - 1;
  const r = '../'.repeat(nivel);
  const menu = MENU.map(([id, ruta, nombre]) =>
    `    <a class="etiqueta${id === activo ? ' activo' : ''}" href="${r}${ruta}"${id === activo ? ' aria-current="page"' : ''}>${nombre}</a>`).join('\n');
  const movil = MENU.slice(1).map(([, ruta, nombre]) => `  <a href="${r}${ruta}">${nombre}</a>`).join('\n')
    + `\n  <a href="${WA}Hola%2C%20quiero%20cotizar%20un%20espacio." target="_blank" rel="noopener">Cotiza sin costo</a>`;
  const pie = MENU.map(([, ruta, nombre]) => `      <a href="${r}${ruta}">${nombre}</a>`).join('\n');
  const html = marco
    .replaceAll('{{titulo}}', esc(titulo))
    .replaceAll('{{descripcion}}', esc(descripcion))
    .replaceAll('{{activo}}', activo)
    .replace('{{menu}}', menu)
    .replace('{{menu-movil}}', movil)
    .replace('{{pie-paginas}}', pie)
    .replace('{{contenido}}', contenido)
    .replaceAll('{{raiz}}', r);
  return { ruta: join(raizSitio, salida), html };
}

// Tarjeta de proyecto (inicio, listado y «otros proyectos»)
const tarjeta = (p, r, clase = '') => `
        <article class="tarjeta ${clase} aparece">
          <a class="tarjeta-foto" href="${r}proyectos/${p.slug}/">${img(r, p.portada, ' loading="lazy"')}</a>
          <div class="tarjeta-pie">
            <h3><a href="${r}proyectos/${p.slug}/">${p.nombre}</a></h3>
            <a class="ver-detalle etiqueta" href="${r}proyectos/${p.slug}/">Ver detalle<svg aria-hidden="true"><use href="#flecha-diag"/></svg></a>
          </div>
          <p class="etiqueta tarjeta-tipo">${p.tipo}</p>
        </article>`;

const pendiente = (texto, clase = '') =>
  `<div class="pendiente ${clase}"><span class="etiqueta">Por confirmar</span><span>${texto}</span></div>`;

function detalle(p, i) {
  const r = '../../';
  const portada = p.comparar
    ? `<div class="comparar proyecto-comparar" data-comparar>
        ${img(r, p.comparar.antes)}
        ${img(r, p.comparar.despues, ' class="despues"')}
        <span class="marca a">Antes · foto real</span><span class="marca d">Después · render</span>
        <span class="tirador" aria-hidden="true"><svg viewBox="0 0 22 16"><path d="M7 3 2 8l5 5M15 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></span>
        <input type="range" min="0" max="100" value="50" aria-label="Mover el corte entre el antes y el después">
      </div>`
    : `<figure class="proyecto-portada">${img(r, p.portada, ' fetchpriority="high"')}<figcaption class="etiqueta">${p.portada.rotulo}</figcaption></figure>`;
  const campo = (nombre, valor) => `<div><dt class="etiqueta">${nombre}</dt><dd>${valor ?? '<span class="pendiente-dato">Por confirmar</span>'}</dd></div>`;
  const galeria = p.galeria.map((g) => g.pendiente
    ? `<figure class="aparece">${pendiente(g.pendiente, 'pendiente-foto')}</figure>`
    : `<figure class="aparece">${img(r, g, ' loading="lazy"')}<figcaption class="etiqueta">${g.rotulo}</figcaption></figure>`).join('\n        ');
  const otros = [1, 2].map((k) => proyectos[(i + k) % proyectos.length]);
  const wa = WA + encodeURIComponent(`Hola, vi el proyecto «${p.nombre}» en su página y quiero cotizar un espacio.`);
  const contenido = `
  <section class="cabecera">
    <p class="etiqueta acento aparece">${p.tipo}</p>
    <h1 class="cabecera-titulo aparece">${p.nombre}</h1>
    <span class="cota" data-medida aria-hidden="true"><span>EV DecoInteriorismo · Bogotá</span></span>
    <p class="cabecera-intro aparece">${p.resumen}</p>
  </section>

  <section class="proyecto-imagen">
    <div class="reticula">${portada}</div>
  </section>

  <section class="hoja claro proyecto-ficha">
    <div class="reticula">
      <dl class="ficha aparece">
        ${campo('Ubicación', p.ficha.ubicacion)}
        ${campo('Alcance', p.ficha.alcance)}
        ${campo('Año', p.ficha.anio)}
        ${campo('Área', p.ficha.area)}
        <div><dt class="etiqueta">Publicado en</dt><dd><a href="${p.instagram}" target="_blank" rel="noopener">Instagram</a></dd></div>
      </dl>
      <div class="proyecto-texto aparece">
        <h2 class="titular">${p.titular}</h2>
        ${p.texto.map((t) => `<p>${t}</p>`).join('\n        ')}
      </div>
      <div class="proyecto-galeria">
        ${galeria}
      </div>
      <div class="testimonio aparece">
        ${pendiente('La opinión del cliente sobre su espacio, con su nombre y su permiso.', 'pendiente-testimonio')}
      </div>
    </div>
  </section>

  <section class="hoja claro otros">
    <div class="reticula">
      <div class="otros-tope">
        <h2 class="titular">Otros <em>proyectos</em>.</h2>
        <span class="filete" aria-hidden="true"></span>
        <a class="boton boton-dorado" href="${r}proyectos/">Todos los proyectos<span class="boton-flecha" aria-hidden="true"><svg><use href="#flecha-diag"/></svg></span></a>
      </div>
      <div class="otros-lista">${otros.map((o) => tarjeta(o, r)).join('')}
      </div>
    </div>
  </section>

  <section class="hoja oscuro llamado">
    <div class="reticula">
      <h2 class="titular grande centrado aparece">¿Tienes un espacio <em>así</em>?</h2>
      <p class="llamado-texto">Cuéntanos qué quieres renovar y te enviamos la cotización sin costo.</p>
      <a class="boton" href="${wa}" target="_blank" rel="noopener">Escríbenos por WhatsApp<span class="boton-flecha" aria-hidden="true"><svg><use href="#flecha"/></svg></span></a>
    </div>
  </section>`;
  return pagina({
    salida: `proyectos/${p.slug}/index.html`,
    titulo: `${p.nombre} · EV DecoInteriorismo`,
    descripcion: p.resumen,
    activo: 'proyectos',
    contenido,
  });
}

function listado() {
  const r = '../';
  const contenido = `
  <section class="cabecera">
    <p class="etiqueta acento aparece">EV DecoInteriorismo</p>
    <h1 class="cabecera-titulo aparece">Proyectos</h1>
    <span class="cota" data-medida aria-hidden="true"><span>Renders · antes y después · obra</span></span>
    <p class="cabecera-intro aparece">Espacios pensados para las personas que los viven. En cada uno te decimos qué es render y qué es foto real.</p>
  </section>

  <section class="hoja claro">
    <div class="reticula">
      <h2 class="titular coleccion-intro aparece">Espacios que ya <em>renovamos</em>.</h2>
      <div class="lista-proyectos">${proyectos.map((p, i) => tarjeta(p, r, i % 2 ? 'baja' : '')).join('')}
      </div>
    </div>
  </section>`;
  return pagina({
    salida: 'proyectos/index.html',
    titulo: 'Proyectos · EV DecoInteriorismo',
    descripcion: 'Renders, antes y después y obras de EV DecoInteriorismo en Bogotá. Cada imagen dice si es render o foto real.',
    activo: 'proyectos',
    contenido,
  });
}

// Páginas sueltas
const salidas = [];
for (const archivo of (await readdir(join(fuente, 'paginas'))).filter((f) => f.endsWith('.html'))) {
  const texto = await readFile(join(fuente, 'paginas', archivo), 'utf8');
  const [, json, cuerpo] = texto.match(/^<!--(\{.*?\})-->\r?\n([\s\S]*)$/);
  const meta = JSON.parse(json);
  let contenido = cuerpo;
  // La colección del inicio sale de los tres primeros proyectos
  contenido = contenido.replace('{{tarjetas-inicio}}', proyectos.slice(2, 4).map((p, i) => tarjeta(p, '{{raiz}}', `t${i + 2}`)).join(''));
  salidas.push(pagina({ ...meta, contenido }));
}
salidas.push(listado());
proyectos.forEach((p, i) => salidas.push(detalle(p, i)));

// Versiones: cada CSS, JS e imagen local lleva ?v=<huella de su contenido>. Si el archivo cambia,
// cambia la dirección y el navegador no muestra la copia vieja de su caché.
const huellas = new Map();
async function versionar(html, carpeta) {
  const refs = [...html.matchAll(/(href|src)="([^"#?:]+\.(?:css|js|jpg|jpeg|png|svg|webp))(?:\?v=[^"]*)?"/g)];
  for (const [entero, attr, rel] of refs) {
    const archivo = join(carpeta, rel);
    if (!huellas.has(archivo)) {
      try { huellas.set(archivo, createHash('sha1').update(await readFile(archivo)).digest('hex').slice(0, 8)); }
      catch { huellas.set(archivo, null); console.warn('  ! no existe', rel, 'en', carpeta.slice(raizSitio.length)); }
    }
    const v = huellas.get(archivo);
    if (v) html = html.replace(entero, `${attr}="${rel}?v=${v}"`);
  }
  return html;
}

for (const { ruta, html } of salidas) {
  await mkdir(dirname(ruta), { recursive: true });
  await writeFile(ruta, await versionar(html, dirname(ruta)));
  console.log('·', ruta.slice(raizSitio.length));
}

// El manual no se genera, pero sus enlaces también llevan versión
const manual = join(raizSitio, 'marca', 'index.html');
await writeFile(manual, await versionar(await readFile(manual, 'utf8'), dirname(manual)));
console.log('·', manual.slice(raizSitio.length), '(versiones)');
