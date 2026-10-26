// Worker de cenresin.cl
// - Sirve el sitio estático (carpeta "publicar").
// - Blog "Noticias" con base de datos Cloudflare D1 (binding DB).
// - Panel para publicar noticias en /admin-login.
// - Envío de formularios por correo (Resend).
// Si la base de datos no está conectada, el sitio sigue funcionando con las
// noticias de ejemplo publicadas como páginas estáticas.

import { NOTICIAS_SEMILLA } from './noticias-semilla.js';
import { CONTENIDO_SEMILLA } from './contenido-semilla.js';
import { paginaLista, paginaNoticia, rss, sitemap, crearSlug, resumenDe, urlNoticia } from './plantilla.js';

const SESION_COOKIE = 'cenresin_sesion';
const SESION_HORAS = 12;
const MAX_IMAGEN = 1.5 * 1024 * 1024;
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ruta = url.pathname;
    try {
      if (env.DB && (ruta.startsWith('/noticias') || ruta.startsWith('/api/noticias') || ruta === '/sitemap.xml')) await sembrarNoticias(env);
      if (ruta === '/admin-login' || ruta === '/admin-login/') return panel(request, env);
      if (ruta.startsWith('/admin-login/api/')) return await apiAdmin(request, env, ruta.slice('/admin-login/api'.length));
      if (ruta === '/api/contenido-sitio') return await apiContenidoPublico(env);
      if (ruta === '/api/noticias') return await apiNoticiasPublicas(request, env, url);
      if (ruta.startsWith('/api/imagen/')) return await imagen(env, ruta.slice('/api/imagen/'.length));
      if (ruta === '/api/formulario') return await formulario(request, env);
      if (ruta === '/noticias' || ruta.startsWith('/noticias/')) return await noticias(request, env, ruta);
      if (ruta === '/sitemap.xml' && env.DB) return await sitemapDinamico(env);
    } catch (error) {
      console.error(error);
      if (ruta.startsWith('/admin-login/api/') || ruta.startsWith('/api/')) {
        return json({ error: 'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.' }, 500);
      }
    }
    return estatico(request, env);
  }
};

// Archivos del sitio. Las direcciones terminadas en "/" muestran su index.html
// (por ejemplo "/" y "/noticias/"); las páginas .html se sirven con su nombre.
async function estatico(request, env) {
  const url = new URL(request.url);
  if (url.pathname.endsWith('/')) {
    url.pathname += 'index.html';
    return inyectarRespuestaHtml(await env.ASSETS.fetch(new Request(url, request)));
  }
  if (url.pathname === '/index.html') return Response.redirect(new URL('/', request.url), 301);
  const r = await env.ASSETS.fetch(request);
  if (r.ok && (r.headers.get('content-type') || '').includes('text/html')) return inyectarRespuestaHtml(r);
  if (r.status === 404 && !/\.[a-z0-9]+$/i.test(url.pathname)) {
    const conBarra = await env.ASSETS.fetch(new Request(new URL(url.pathname + '/index.html', url), request));
    if (conBarra.ok) return Response.redirect(new URL(url.pathname + '/', request.url), 301);
  }
  return r;
}

function inyectarRespuestaHtml(respuesta) {
  return respuesta.text().then((cuerpo) => {
    const headers = new Headers(respuesta.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    return new Response(inyectarEditorSitio(cuerpo), { status: respuesta.status, statusText: respuesta.statusText, headers });
  });
}

function inyectarEditorSitio(cuerpo) {
  if (!/<\/body>/i.test(cuerpo) || /contenido-sitio\.js/.test(cuerpo)) return cuerpo;
  return cuerpo.replace(/<\/body>/i, '<script src="/assets/js/contenido-sitio.js?v=6.1" defer></script></body>');
}

/* ---------- noticias de ejemplo ---------- */

// La primera vez que el sitio se publica con la base de datos conectada, carga las
// noticias de ejemplo (una sola vez; si luego se borran, no vuelven a aparecer).
let sembrado = false;
async function sembrarNoticias(env) {
  if (sembrado) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS ajustes (clave TEXT PRIMARY KEY, valor TEXT)').run();
  const marca = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'noticias_ejemplo'").first();
  if (!marca) {
    const insertar = env.DB.prepare(
      'INSERT OR IGNORE INTO noticias (slug, titulo, resumen, cuerpo, fecha, imagen_url, imagen_alt, mostrar_inicio, mostrar_estudios, autor, creado, actualizado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    await env.DB.batch([
      ...NOTICIAS_SEMILLA.map((n) => insertar.bind(n.slug, n.titulo, n.resumen, n.cuerpo, n.fecha, n.imagen_url, n.imagen_alt, n.mostrar_inicio, n.mostrar_estudios, 'cenresin', n.fecha, n.fecha)),
      env.DB.prepare("INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('noticias_ejemplo', ?)").bind(ahora())
    ]);
  }
  sembrado = true;
}

/* ---------- utilidades ---------- */

function json(datos, estado = 200, cabeceras = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cabeceras }
  });
}

function html(cuerpo, estado = 200, extra = {}) {
  return new Response(inyectarEditorSitio(cuerpo), {
    status: estado,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=120', ...extra }
  });
}

function ahora() {
  return new Date().toISOString();
}

function hoyChile() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
}

async function noticiasEstaticas(env, request) {
  const r = await env.ASSETS.fetch(new Request(new URL('/assets/data/noticias.json', request.url)));
  return r.ok ? r.json() : [];
}

const COLUMNAS_PUBLICAS = 'id, slug, titulo, resumen, cuerpo, imagen_url, imagen_alt, fecha, mostrar_inicio, mostrar_estudios, actualizado';

async function todasLasNoticias(env) {
  const { results } = await env.DB.prepare(`SELECT ${COLUMNAS_PUBLICAS} FROM noticias WHERE fecha <= ? ORDER BY fecha DESC, id DESC`).bind(hoyChile()).all();
  return results;
}

/* ---------- sitio público ---------- */

async function apiNoticiasPublicas(request, env, url) {
  const seccion = url.searchParams.get('seccion');
  const limite = Math.min(Math.max(parseInt(url.searchParams.get('limite') || '3', 10) || 3, 1), 12);
  let lista;
  if (env.DB) {
    let sql = `SELECT ${COLUMNAS_PUBLICAS} FROM noticias WHERE fecha <= ?`;
    if (seccion === 'inicio') sql += ' AND mostrar_inicio = 1';
    if (seccion === 'estudios') sql += ' AND mostrar_estudios = 1';
    sql += ' ORDER BY fecha DESC, id DESC LIMIT ?';
    lista = (await env.DB.prepare(sql).bind(hoyChile(), limite).all()).results;
  } else {
    lista = (await noticiasEstaticas(env, request))
      .filter((n) => (seccion === 'inicio' ? n.mostrar_inicio : seccion === 'estudios' ? n.mostrar_estudios : true))
      .slice(0, limite);
  }
  const salida = lista.map((n) => ({
    titulo: n.titulo,
    resumen: resumenDe(n),
    fecha: n.fecha,
    imagen_url: n.imagen_url,
    imagen_alt: n.imagen_alt,
    url: urlNoticia(n)
  }));
  return json(salida, 200, { 'cache-control': 'public, max-age=60' });
}

async function noticias(request, env, ruta) {
  if (!env.DB) {
    if (ruta === '/noticias') return Response.redirect(new URL('/noticias/', request.url), 301);
    return estatico(request, env);
  }
  const partes = ruta.split('/').filter(Boolean);
  const lista = await todasLasNoticias(env);
  if (partes.length === 1) {
    if (!ruta.endsWith('/')) return Response.redirect(new URL('/noticias/', request.url), 301);
    return html(paginaLista(lista));
  }
  if (partes.length === 2 && partes[1] === 'rss.xml') {
    return new Response(rss(lista), { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=300' } });
  }
  if (partes.length === 2 || (partes.length === 3 && partes[2] === 'index.html')) {
    const noticia = lista.find((n) => n.slug === partes[1]);
    if (!noticia) return estatico(request, env);
    if (!ruta.endsWith('/')) return Response.redirect(new URL(urlNoticia(noticia), request.url), 301);
    return html(paginaNoticia(noticia, lista));
  }
  return estatico(request, env);
}

async function sitemapDinamico(env) {
  const lista = await todasLasNoticias(env);
  return new Response(sitemap(lista), { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

async function imagen(env, id) {
  if (!env.DB || !/^[a-f0-9]{32}$/.test(id)) return new Response('No encontrada', { status: 404 });
  const fila = await env.DB.prepare('SELECT tipo, datos FROM imagenes WHERE id = ?').bind(id).first();
  if (!fila) return new Response('No encontrada', { status: 404 });
  return new Response(new Uint8Array(fila.datos), {
    headers: { 'content-type': fila.tipo, 'cache-control': 'public, max-age=31536000, immutable' }
  });
}

/* ---------- formularios ---------- */

const CAMPOS_FORMULARIO = {
  nombre: 'Nombre', telefono: 'Teléfono', email: 'Correo', region: 'Región', patologia: 'Patología o área de interés',
  mensaje: 'Mensaje', consentimiento_contacto: 'Autoriza contacto', consentimiento_informacion: 'Autoriza recibir información', origen: 'Página'
};

async function formulario(request, env) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  const datos = await request.formData();
  if (datos.get('sitio_web')) return json({ ok: true }); // trampa para robots
  if (!datos.get('nombre') || !datos.get('telefono') || !datos.get('email')) {
    return json({ error: 'Completa nombre, teléfono y correo.' }, 400);
  }
  if (!env.RESEND_API_KEY || !env.FORM_TO_EMAIL) {
    return json({ error: 'El envío en línea aún no está configurado. Por favor llámanos al 33 2 316393 o escríbenos por WhatsApp.' }, 503);
  }
  const filas = Object.entries(CAMPOS_FORMULARIO)
    .filter(([k]) => datos.get(k))
    .map(([k, etiqueta]) => {
      let v = String(datos.get(k)).slice(0, 3000);
      if (v === 'on') v = 'Sí';
      return `<tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top">${etiqueta}</td><td style="padding:6px 12px">${v.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>')}</td></tr>`;
    }).join('');
  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.FORM_FROM_EMAIL || 'CENRESIN <formularios@cenresin.cl>',
      to: String(env.FORM_TO_EMAIL).split(',').map((c) => c.trim()).filter(Boolean),
      reply_to: String(datos.get('email')),
      subject: `Nueva solicitud web: ${String(datos.get('nombre')).slice(0, 80)}`,
      html: `<h2>Nueva solicitud desde cenresin.cl</h2><table>${filas}</table>`
    })
  });
  if (!respuesta.ok) {
    console.error('Resend', respuesta.status, await respuesta.text());
    return json({ error: 'No pudimos enviar tu mensaje. Por favor llámanos al 33 2 316393 o escríbenos por WhatsApp.' }, 502);
  }
  return json({ ok: true });
}

/* ---------- panel de administración ---------- */

async function panel(request, env) {
  const r = await env.ASSETS.fetch(new Request(new URL('/assets/admin/panel.html', request.url)));
  return new Response(r.body, {
    status: r.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'x-frame-options': 'DENY',
      'referrer-policy': 'same-origin'
    }
  });
}

function leerCookie(request, nombre) {
  const cookies = request.headers.get('cookie') || '';
  const m = cookies.match(new RegExp(`(?:^|;\\s*)${nombre}=([^;]+)`));
  return m ? m[1] : null;
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function aleatorio(bytes = 16) {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function hashClave(clave, salHex, iteraciones = 100000) {
  const sal = new Uint8Array(salHex.match(/../g).map((h) => parseInt(h, 16)));
  const llave = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteraciones }, llave, 256);
  return hex(bits);
}

function iguales(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function usuarioDeSesion(request, env) {
  const token = leerCookie(request, SESION_COOKIE);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return env.DB.prepare(
    'SELECT u.id, u.usuario, u.nombre FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ? AND s.expira > ? AND u.activo = 1'
  ).bind(token, ahora()).first();
}

function mismoOrigen(request) {
  const origen = request.headers.get('origin');
  return !origen || origen === new URL(request.url).origin;
}

async function apiAdmin(request, env, ruta) {
  if (!env.DB) {
    return json({ error: 'La base de datos de noticias todavía no está conectada. Revisa LEEME-NOTICIAS.txt.' }, 503);
  }
  if (request.method !== 'GET' && !mismoOrigen(request)) return json({ error: 'Origen no permitido' }, 403);

  if (ruta === '/entrar' && request.method === 'POST') return entrar(request, env);
  if (ruta === '/salir' && request.method === 'POST') {
    const token = leerCookie(request, SESION_COOKIE);
    if (token) await env.DB.prepare('DELETE FROM sesiones WHERE token = ?').bind(token).run();
    return json({ ok: true }, 200, { 'set-cookie': `${SESION_COOKIE}=; Path=/admin-login; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
  }

  const usuario = await usuarioDeSesion(request, env);
  if (!usuario) return json({ error: 'Tu sesión terminó. Vuelve a ingresar.' }, 401);

  if (ruta.startsWith('/contenido-sitio')) return await apiContenidoAdmin(request, env, ruta.slice('/contenido-sitio'.length));

  if (ruta === '/sesion') return json({ usuario: usuario.usuario, nombre: usuario.nombre });

  if (ruta === '/noticias' && request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT ${COLUMNAS_PUBLICAS}, autor FROM noticias ORDER BY fecha DESC, id DESC`).all();
    return json(results);
  }
  if (ruta === '/noticias' && request.method === 'POST') return guardarNoticia(request, env, usuario, null);

  const m = ruta.match(/^\/noticias\/(\d+)(\/interruptor)?$/);
  if (m) {
    const id = Number(m[1]);
    const existe = await env.DB.prepare('SELECT id, imagen_url FROM noticias WHERE id = ?').bind(id).first();
    if (!existe) return json({ error: 'La noticia no existe.' }, 404);
    if (m[2] && request.method === 'POST') {
      const { campo, valor } = await request.json();
      if (!['mostrar_inicio', 'mostrar_estudios'].includes(campo)) return json({ error: 'Interruptor desconocido' }, 400);
      await env.DB.prepare(`UPDATE noticias SET ${campo} = ?, actualizado = ? WHERE id = ?`).bind(valor ? 1 : 0, ahora(), id).run();
      return json({ ok: true });
    }
    if (!m[2] && request.method === 'POST') return guardarNoticia(request, env, usuario, existe);
    if (!m[2] && request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM noticias WHERE id = ?').bind(id).run();
      await borrarImagenSubida(env, existe.imagen_url);
      return json({ ok: true });
    }
  }
  return json({ error: 'No encontrado' }, 404);
}

async function entrar(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const hace15 = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM intentos_login WHERE ip = ? AND fecha > ?').bind(ip, hace15).first();
  if (n >= 10) return json({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' }, 429);

  const { usuario, clave } = await request.json().catch(() => ({}));
  const nombreUsuario = String(usuario || '').trim().toLowerCase();
  const fila = nombreUsuario
    ? await env.DB.prepare('SELECT id, hash, sal FROM usuarios WHERE usuario = ? AND activo = 1').bind(nombreUsuario).first()
    : null;
  const valido = fila && iguales(await hashClave(String(clave || ''), fila.sal), fila.hash);
  if (!valido) {
    await env.DB.prepare('INSERT INTO intentos_login (ip, fecha) VALUES (?, ?)').bind(ip, ahora()).run();
    return json({ error: 'Usuario o contraseña incorrectos.' }, 401);
  }
  const token = aleatorio(32);
  const expira = new Date(Date.now() + SESION_HORAS * 3600 * 1000).toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sesiones WHERE expira < ?').bind(ahora()),
    env.DB.prepare('DELETE FROM intentos_login WHERE fecha < ?').bind(hace15),
    env.DB.prepare('INSERT INTO sesiones (token, usuario_id, expira) VALUES (?, ?, ?)').bind(token, fila.id, expira)
  ]);
  return json({ ok: true }, 200, {
    'set-cookie': `${SESION_COOKIE}=${token}; Path=/admin-login; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESION_HORAS * 3600}`
  });
}

/* ---------- contenido editable del sitio ---------- */

let contenidoListo = false;
async function asegurarContenido(env) {
  if (contenidoListo) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS contenido_sitio (
    clave TEXT PRIMARY KEY,
    borrador TEXT NOT NULL,
    publicado TEXT NOT NULL,
    actualizado TEXT NOT NULL,
    publicado_en TEXT
  )`).run();
  const ahoraIso = ahora();
  for (const [clave, valor] of Object.entries(CONTENIDO_SEMILLA)) {
    const inicial = JSON.stringify(valor);
    await env.DB.prepare('INSERT OR IGNORE INTO contenido_sitio (clave, borrador, publicado, actualizado, publicado_en) VALUES (?, ?, ?, ?, ?)')
      .bind(clave, inicial, inicial, ahoraIso, ahoraIso).run();
  }
  contenidoListo = true;
}

async function apiContenidoPublico(env) {
  if (!env.DB) return json(CONTENIDO_SEMILLA);
  await asegurarContenido(env);
  const { results } = await env.DB.prepare('SELECT clave, publicado FROM contenido_sitio').all();
  const contenido = { ...CONTENIDO_SEMILLA };
  for (const fila of results) {
    try { contenido[fila.clave] = JSON.parse(fila.publicado); } catch (e) {}
  }
  return json(contenido, 200, { 'cache-control': 'public, max-age=60' });
}

function menuSeguro(items) {
  if (!Array.isArray(items)) return false;
  return items.every((item) => {
    if (!item || typeof item.label !== 'string' || (item.tipo !== 'grupo' && typeof item.url !== 'string')) return false;
    if (item.tipo === 'grupo' && item.children?.length) return false;
    const href = (item.url || '').trim();
    if (href && !(/^(\/(?!\/)|#|https:\/\/|mailto:|tel:)/i.test(href))) return false;
    return !item.children || menuSeguro(item.children);
  });
}

async function apiContenidoAdmin(request, env, ruta) {
  if (!env.DB) return json({ error: 'La base de datos del panel aún no está conectada.' }, 503);
  await asegurarContenido(env);
  const claves = Object.keys(CONTENIDO_SEMILLA);

  if (ruta === '' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT clave, borrador, publicado, actualizado, publicado_en FROM contenido_sitio').all();
    const datos = {};
    for (const fila of results) {
      try { datos[fila.clave] = { borrador: JSON.parse(fila.borrador), publicado: JSON.parse(fila.publicado), actualizado: fila.actualizado, publicado_en: fila.publicado_en }; } catch (e) {}
    }
    return json(datos);
  }

  if (ruta === '/imagen' && request.method === 'POST') {
    const datos = await request.formData();
    const foto = datos.get('foto');
    if (!foto || typeof foto !== 'object' || !foto.size) return json({ error: 'Elige una foto.' }, 400);
    if (!TIPOS_IMAGEN.includes(foto.type)) return json({ error: 'La foto debe ser JPG, PNG o WebP.' }, 400);
    if (foto.size > MAX_IMAGEN) return json({ error: 'La foto debe pesar menos de 1,5 MB.' }, 400);
    const id = aleatorio(16);
    await env.DB.prepare('INSERT INTO imagenes (id, tipo, datos, creado) VALUES (?, ?, ?, ?)').bind(id, foto.type, await foto.arrayBuffer(), ahora()).run();
    return json({ ok: true, url: `/api/imagen/${id}` });
  }

  const coincidencia = ruta.match(/^\/([a-z-]+)\/(borrador|publicar|descartar)$/);
  if (!coincidencia) return json({ error: 'No encontrado' }, 404);
  const [, clave, accion] = coincidencia;
  if (!claves.includes(clave)) return json({ error: 'Sección desconocida.' }, 404);

  if (accion === 'borrador' && request.method === 'POST') {
    const cuerpo = await request.json().catch(() => null);
    if (!cuerpo || !Object.prototype.hasOwnProperty.call(cuerpo, 'contenido')) return json({ error: 'No se recibió el contenido.' }, 400);
    let serializado;
    try { serializado = JSON.stringify(cuerpo.contenido); } catch (e) { return json({ error: 'El contenido no es válido.' }, 400); }
    if (clave === 'menu' && !menuSeguro(cuerpo.contenido)) return json({ error: 'Revisa los nombres, enlaces y submenús del menú.' }, 400);
    if (serializado.length > 800000) return json({ error: 'El contenido excede el tamaño permitido.' }, 413);
    await env.DB.prepare('UPDATE contenido_sitio SET borrador = ?, actualizado = ? WHERE clave = ?').bind(serializado, ahora(), clave).run();
    return json({ ok: true });
  }

  if (accion === 'publicar' && request.method === 'POST') {
    await env.DB.prepare('UPDATE contenido_sitio SET publicado = borrador, publicado_en = ?, actualizado = ? WHERE clave = ?').bind(ahora(), ahora(), clave).run();
    return json({ ok: true });
  }

  if (accion === 'descartar' && request.method === 'POST') {
    await env.DB.prepare('UPDATE contenido_sitio SET borrador = publicado, actualizado = ? WHERE clave = ?').bind(ahora(), clave).run();
    return json({ ok: true });
  }
  return json({ error: 'Método no permitido.' }, 405);
}

async function borrarImagenSubida(env, imagenUrl) {
  const m = String(imagenUrl || '').match(/^\/api\/imagen\/([a-f0-9]{32})$/);
  if (m) await env.DB.prepare('DELETE FROM imagenes WHERE id = ?').bind(m[1]).run();
}

async function slugDisponible(env, base, idActual) {
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const otra = await env.DB.prepare('SELECT id FROM noticias WHERE slug = ?').bind(slug).first();
    if (!otra || otra.id === idActual) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${aleatorio(3)}`;
}

async function guardarNoticia(request, env, usuario, existente) {
  const datos = await request.formData();
  const titulo = String(datos.get('titulo') || '').trim().slice(0, 160);
  const cuerpo = String(datos.get('cuerpo') || '').trim().slice(0, 30000);
  const resumen = String(datos.get('resumen') || '').trim().slice(0, 300);
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(datos.get('fecha') || '') ? datos.get('fecha') : hoyChile();
  const inicio = datos.get('mostrar_inicio') === '1' ? 1 : 0;
  const estudios = datos.get('mostrar_estudios') === '1' ? 1 : 0;
  let imagenAlt = String(datos.get('imagen_alt') || '').trim().slice(0, 200);
  if (!titulo) return json({ error: 'Escribe un título.' }, 400);
  if (!cuerpo) return json({ error: 'Escribe el texto de la noticia.' }, 400);

  let imagenUrl = existente ? existente.imagen_url : null;
  const foto = datos.get('foto');
  const quitarFoto = datos.get('quitar_foto') === '1';
  const sentencias = [];
  if (foto && typeof foto === 'object' && foto.size > 0) {
    if (!TIPOS_IMAGEN.includes(foto.type)) return json({ error: 'La foto debe ser JPG, PNG o WebP.' }, 400);
    if (foto.size > MAX_IMAGEN) return json({ error: 'La foto es demasiado pesada. Usa una de menos de 1,5 MB.' }, 400);
    const id = aleatorio(16);
    sentencias.push(env.DB.prepare('INSERT INTO imagenes (id, tipo, datos, creado) VALUES (?, ?, ?, ?)').bind(id, foto.type, await foto.arrayBuffer(), ahora()));
    if (existente) await borrarImagenSubida(env, existente.imagen_url);
    imagenUrl = `/api/imagen/${id}`;
  } else if (quitarFoto) {
    if (existente) await borrarImagenSubida(env, existente.imagen_url);
    imagenUrl = null;
  }
  if (imagenUrl && !imagenAlt) imagenAlt = titulo;

  if (existente) {
    sentencias.push(env.DB.prepare(
      'UPDATE noticias SET titulo = ?, resumen = ?, cuerpo = ?, fecha = ?, imagen_url = ?, imagen_alt = ?, mostrar_inicio = ?, mostrar_estudios = ?, actualizado = ? WHERE id = ?'
    ).bind(titulo, resumen, cuerpo, fecha, imagenUrl, imagenAlt, inicio, estudios, ahora(), existente.id));
    await env.DB.batch(sentencias);
    const fila = await env.DB.prepare('SELECT slug FROM noticias WHERE id = ?').bind(existente.id).first();
    return json({ ok: true, id: existente.id, url: urlNoticia(fila) });
  }
  const slug = await slugDisponible(env, crearSlug(titulo), null);
  sentencias.push(env.DB.prepare(
    'INSERT INTO noticias (slug, titulo, resumen, cuerpo, fecha, imagen_url, imagen_alt, mostrar_inicio, mostrar_estudios, autor, creado, actualizado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(slug, titulo, resumen, cuerpo, fecha, imagenUrl, imagenAlt, inicio, estudios, usuario.usuario, ahora(), ahora()));
  await env.DB.batch(sentencias);
  return json({ ok: true, url: urlNoticia({ slug }) });
}
