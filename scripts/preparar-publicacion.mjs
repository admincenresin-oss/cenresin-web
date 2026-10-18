// Prepara la carpeta "publicar" que se sube a Cloudflare.
// Uso: node scripts/preparar-publicacion.mjs
// - Genera las páginas estáticas de respaldo de Noticias (noticias/…).
// - Genera assets/data/noticias.json, sitemap.xml y la migración con las noticias de ejemplo.
// - Copia solo los archivos públicos del sitio a "publicar/".
import { mkdirSync, writeFileSync, rmSync, cpSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTICIAS_SEMILLA } from '../worker/noticias-semilla.js';
import { paginaLista, paginaNoticia, rss, sitemap } from '../worker/plantilla.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const noticias = [...NOTICIAS_SEMILLA].sort((a, b) => b.fecha.localeCompare(a.fecha));

// 1. Páginas estáticas de Noticias (se usan si la base de datos no está conectada)
rmSync(join(raiz, 'noticias'), { recursive: true, force: true });
mkdirSync(join(raiz, 'noticias'), { recursive: true });
writeFileSync(join(raiz, 'noticias/index.html'), paginaLista(noticias));
writeFileSync(join(raiz, 'noticias/rss.xml'), rss(noticias));
for (const n of noticias) {
  mkdirSync(join(raiz, 'noticias', n.slug), { recursive: true });
  writeFileSync(join(raiz, 'noticias', n.slug, 'index.html'), paginaNoticia(n, noticias));
}

// 2. Datos de respaldo para las secciones de la portada y de Estudios Clínicos
mkdirSync(join(raiz, 'assets/data'), { recursive: true });
writeFileSync(join(raiz, 'assets/data/noticias.json'), JSON.stringify(noticias.map(({ cuerpo, ...resto }) => resto), null, 2));

// 3. Sitemap
writeFileSync(join(raiz, 'sitemap.xml'), sitemap(noticias));

// 4. Migración con las noticias de ejemplo
const sql = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const filas = noticias.map((n) => `INSERT OR IGNORE INTO noticias (slug, titulo, resumen, cuerpo, fecha, imagen_url, imagen_alt, mostrar_inicio, mostrar_estudios, autor, creado, actualizado) VALUES (${[n.slug, n.titulo, n.resumen, n.cuerpo, n.fecha, n.imagen_url, n.imagen_alt, n.mostrar_inicio, n.mostrar_estudios, 'cenresin', n.fecha, n.fecha].map(sql).join(', ')});`);
writeFileSync(join(raiz, 'migraciones/0002_noticias_ejemplo.sql'), '-- Noticias de ejemplo (generado por scripts/preparar-publicacion.mjs)\n' + filas.join('\n') + '\n');

// 5. Copiar archivos públicos a "publicar/"
const PUBLICOS = ['assets', 'noticias', 'robots.txt', 'sitemap.xml', '_headers'];
// Imágenes PNG antiguas que ya no usa ninguna página (se reemplazaron por .jpg livianos)
const textos = readdirSync(raiz).filter((f) => f.endsWith('.html')).map((f) => readFileSync(join(raiz, f), 'utf8'))
  .concat(readdirSync(join(raiz, 'assets/css')).map((f) => readFileSync(join(raiz, 'assets/css', f), 'utf8'))).join('\n');
const pngSinUso = (origen) => dirname(origen) === join(raiz, 'assets/img') && origen.endsWith('.png') && !textos.includes(basename(origen));
const destino = join(raiz, 'publicar');
rmSync(destino, { recursive: true, force: true });
mkdirSync(destino);
for (const nombre of readdirSync(raiz)) {
  if (nombre.endsWith('.html') || PUBLICOS.includes(nombre)) {
    cpSync(join(raiz, nombre), join(destino, nombre), {
      recursive: true,
      filter: (origen) => !origen.endsWith('.DS_Store') && !pngSinUso(origen) && !(statSync(origen).isFile() && statSync(origen).size > 25 * 1024 * 1024)
    });
  }
}
console.log(`Listo: ${noticias.length} noticias de ejemplo y carpeta "publicar" preparada.`);
