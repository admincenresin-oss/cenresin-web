// Plantillas HTML del blog "Noticias" de CENRESIN.
// Las usa el worker (páginas generadas desde la base de datos) y
// scripts/preparar-publicacion.mjs (páginas estáticas de respaldo).

export const SITIO = 'https://cenresin.cl';
export const VERSION = '5.0';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fechaLarga(iso) {
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return '';
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

export function crearSlug(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 90).replace(/-+$/g, '') || 'noticia';
}

function enLinea(texto) {
  let html = esc(texto);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]*(?:\([^\s)]*\))?[^\s)]*)\)/g, (_, t, url) => {
    const externo = /^https?:\/\//.test(url) && !url.startsWith(SITIO);
    return `<a href="${url}"${externo ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });
  return html;
}

// Convierte el texto de una noticia en HTML y extrae sus preguntas frecuentes.
export function renderCuerpo(texto) {
  const bloques = String(texto || '').replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  const partes = [];
  const preguntas = [];
  let enFaq = false;
  let preguntaAbierta = null;

  for (const bloqueCrudo of bloques) {
    const bloque = bloqueCrudo.trim();
    if (!bloque) continue;
    const lineas = bloque.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lineas.every((l) => /^[-•*]\s+/.test(l))) {
      partes.push('<ul>' + lineas.map((l) => `<li>${enLinea(l.replace(/^[-•*]\s+/, ''))}</li>`).join('') + '</ul>');
      preguntaAbierta = null;
      continue;
    }
    for (const linea of lineas) {
      if (linea.startsWith('### ')) {
        const t = linea.slice(4);
        partes.push(`<h3>${enLinea(t)}</h3>`);
        preguntaAbierta = enFaq ? { pregunta: t, respuesta: '' } : null;
        if (preguntaAbierta) preguntas.push(preguntaAbierta);
      } else if (linea.startsWith('## ')) {
        const t = linea.slice(3);
        enFaq = /preguntas frecuentes/i.test(t);
        preguntaAbierta = null;
        partes.push(`<h2>${enLinea(t)}</h2>`);
      } else {
        partes.push(`<p>${enLinea(linea)}</p>`);
        if (preguntaAbierta) {
          preguntaAbierta.respuesta += (preguntaAbierta.respuesta ? ' ' : '') + linea.replace(/\*\*|\[|\]\([^)]*\)/g, '');
        }
      }
    }
  }
  return { html: partes.join('\n'), preguntas: preguntas.filter((p) => p.respuesta) };
}

export function resumenDe(noticia) {
  if (noticia.resumen) return noticia.resumen;
  const plano = String(noticia.cuerpo || '').replace(/^#+\s.*$/gm, '').replace(/\*\*|\[|\]\([^)]*\)|^[-•]\s/gm, '').replace(/\s+/g, ' ').trim();
  return plano.length > 160 ? plano.slice(0, 157).replace(/\s+\S*$/, '') + '…' : plano;
}

export function urlNoticia(n) {
  return `/noticias/${n.slug}/`;
}

function imagenAbsoluta(url) {
  if (!url) return `${SITIO}/assets/img/logo-cenresin.png`;
  return url.startsWith('http') ? url : SITIO + url;
}

const ORGANIZACION = {
  '@type': ['MedicalClinic', 'Organization'],
  '@id': `${SITIO}/#organizacion`,
  name: 'CENRESIN · Centro Respiratorio Integral',
  url: `${SITIO}/`,
  logo: `${SITIO}/assets/img/logo-cenresin.png`,
  telephone: '+56 33 2316393',
  address: { '@type': 'PostalAddress', streetAddress: 'San Martín 502', addressLocality: 'Quillota', addressRegion: 'Valparaíso', addressCountry: 'CL' },
  medicalSpecialty: 'Pulmonary',
  sameAs: ['https://www.facebook.com/cenresin/', 'https://www.instagram.com/cenresin/']
};

function encabezado() {
  return `<header class="site-header">
  <div class="container nav">
    <a class="logo" href="/"><img src="/assets/img/logo-cenresin.png" alt="Logo CENRESIN Centro Respiratorio Integral"></a>
    <button class="mobile-toggle" type="button" aria-label="Abrir menú">Menú</button>
    <nav class="menu" aria-label="Navegación principal">
      <a class="menu-link" href="/">Inicio</a>
      <div class="dropdown"><button class="drop-toggle" type="button">Quiénes Somos</button><div class="dropdown-content"><a href="/quienes-somos.html">Historia, misión y visión</a><a href="/nuestro-equipo.html">Nuestro Equipo</a></div></div>
      <div class="dropdown"><button class="drop-toggle" type="button">Centro Médico</button><div class="dropdown-content"><a href="/centro-medico.html">Especialidades</a><a href="/profesionales.html">Profesionales</a><a href="/examenes.html">Exámenes</a></div></div>
      <div class="dropdown clinical-dropdown"><button class="drop-toggle" type="button">Estudios Clínicos</button><div class="dropdown-content clinical-menu"><a class="clinical-menu-home" href="/estudios-clinicos.html">Inicio de Estudios Clínicos</a><span>Para participantes</span><a href="/estudios-disponibles.html">Áreas de estudio</a><a href="/pacientes.html">¿Qué es un estudio clínico?</a><a href="/estudios-clinicos.html#experiencia-participacion">Tu experiencia de estudio</a><a href="/formulario-estudios-clinicos.html">Cómo participar</a><a href="/estudios-clinicos.html#preguntas">Preguntas frecuentes</a><span>Para patrocinadores y CRO</span><a href="/patrocinadores-cro.html">Experiencia y capacidades</a><a href="/patrocinadores-cro.html#contacto-factibilidad">Factibilidad y contacto</a></div></div>
      <a class="menu-link menu-noticias active" href="/noticias/" aria-current="page">Noticias</a>
      <a class="btn" href="/contacto.html">Contacto</a>
    </nav>
  </div>
</header>`;
}

function pie() {
  return `<section class="cta-band orientation-band">
  <div class="container orientation-grid">
    <div>
      <div class="eyebrow">CONTACTO Y ORIENTACIÓN</div>
      <h2>¿Necesitas orientación?</h2>
      <p class="sub">Puedes contactarnos para resolver dudas sobre atención médica, exámenes o participación en estudios clínicos.</p>
    </div>
    <div class="orientation-card">
      <div class="actions orientation-actions">
        <a class="btn primary orientation-btn" href="/contacto.html">Agendar consulta</a>
        <a class="btn white orientation-btn" href="/pacientes.html">Información para pacientes</a>
      </div>
      <div class="social-links">
        <a href="https://www.facebook.com/cenresin/?locale=es_LA" target="_blank" rel="noopener"><span class="icon-circle"><img src="/assets/img/facebook.svg" alt="Facebook"></span>Facebook</a>
        <a href="https://www.instagram.com/cenresin/" target="_blank" rel="noopener"><span class="icon-circle"><img src="/assets/img/instagram.svg" alt="Instagram"></span>Instagram</a>
      </div>
    </div>
  </div>
</section>
</main>
<footer class="footer">
  <div class="container">
    <span>CENRESIN · Centro Respiratorio Integral</span>
    <span>San Martín 502, Quillota · 33 2 316393 · www.cenresin.cl</span>
  </div>
</footer>
<a class="whatsapp-float" href="https://wa.me/56332316393" target="_blank" rel="noopener" aria-label="WhatsApp CENRESIN"><img src="/assets/img/whatsapp.svg" alt="WhatsApp"></a>
<script src="/assets/js/main.js?v=${VERSION}"></script>
</body>
</html>`;
}

function cabeza({ titulo, descripcion, canonica, imagen, tipo = 'website', jsonld, extra = '' }) {
  return `<!doctype html>
<html lang="es-CL">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" href="/assets/img/favicon.png">
  <meta name="theme-color" content="#d9e000">
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(descripcion)}">
  <link rel="canonical" href="${canonica}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:site_name" content="CENRESIN">
  <meta property="og:locale" content="es_CL">
  <meta property="og:type" content="${tipo}">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(descripcion)}">
  <meta property="og:url" content="${canonica}">
  <meta property="og:image" content="${esc(imagen)}">
  <meta name="twitter:card" content="summary_large_image">
  ${extra}
  <link rel="alternate" type="application/rss+xml" title="Noticias CENRESIN" href="${SITIO}/noticias/rss.xml">
  <link rel="stylesheet" href="/assets/css/style.css?v=${VERSION}">
  <link rel="stylesheet" href="/assets/css/noticias.css?v=${VERSION}">
  <script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>
</head>
<body class="news-page">
${encabezado()}
<main>`;
}

export function tarjetaNoticia(n, { encabezadoNivel = 'h2' } = {}) {
  const h = encabezadoNivel;
  const img = n.imagen_url
    ? `<img src="${esc(n.imagen_url)}" alt="${esc(n.imagen_alt || n.titulo)}" loading="lazy" width="800" height="450">`
    : '<span class="news-card-placeholder" aria-hidden="true"></span>';
  return `<article class="news-card">
  <a class="news-card-img" href="${urlNoticia(n)}" tabindex="-1" aria-hidden="true">${img}</a>
  <div class="news-card-body">
    <time datetime="${esc(n.fecha)}">${fechaLarga(n.fecha)}</time>
    <${h}><a href="${urlNoticia(n)}">${esc(n.titulo)}</a></${h}>
    <p>${esc(resumenDe(n))}</p>
    <a class="news-card-more" href="${urlNoticia(n)}">Leer noticia <span aria-hidden="true">›</span></a>
  </div>
</article>`;
}

export function paginaLista(noticias) {
  const canonica = `${SITIO}/noticias/`;
  const descripcion = 'Noticias y artículos de salud respiratoria de CENRESIN, Quillota: asma, EPOC, VRS, alergias, exámenes y estudios clínicos explicados de forma simple.';
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      ORGANIZACION,
      {
        '@type': 'Blog',
        '@id': `${canonica}#blog`,
        name: 'Noticias CENRESIN',
        url: canonica,
        description: descripcion,
        inLanguage: 'es-CL',
        publisher: { '@id': `${SITIO}/#organizacion` },
        blogPost: noticias.slice(0, 20).map((n) => ({
          '@type': 'BlogPosting',
          headline: n.titulo,
          url: SITIO + urlNoticia(n),
          datePublished: n.fecha,
          image: imagenAbsoluta(n.imagen_url)
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITIO}/` },
          { '@type': 'ListItem', position: 2, name: 'Noticias', item: canonica }
        ]
      }
    ]
  };
  const lista = noticias.length
    ? `<div class="news-grid">${noticias.map((n) => tarjetaNoticia(n)).join('\n')}</div>`
    : '<p class="news-empty">Pronto publicaremos nuevas noticias.</p>';
  return cabeza({ titulo: 'Noticias de salud respiratoria | CENRESIN Quillota', descripcion, canonica, imagen: imagenAbsoluta(noticias[0]?.imagen_url), jsonld }) + `
<section class="page-hero news-hero">
  <div class="container">
    <div class="breadcrumb"><a href="/">Inicio</a> · Noticias</div>
    <h1>Noticias</h1>
    <p class="lead">Información clara sobre salud respiratoria, exámenes, prevención y estudios clínicos, preparada por CENRESIN.</p>
  </div>
</section>
<section class="section alt">
  <div class="container">
    ${lista}
  </div>
</section>
` + pie();
}

export function paginaNoticia(n, otras = []) {
  const canonica = SITIO + urlNoticia(n);
  const descripcion = resumenDe(n);
  const { html, preguntas } = renderCuerpo(n.cuerpo);
  const imagen = imagenAbsoluta(n.imagen_url);
  const grafo = [
    ORGANIZACION,
    {
      '@type': ['Article', 'MedicalWebPage'],
      '@id': `${canonica}#articulo`,
      headline: n.titulo,
      description: descripcion,
      url: canonica,
      mainEntityOfPage: canonica,
      image: [imagen],
      datePublished: n.fecha,
      dateModified: (n.actualizado || n.fecha).slice(0, 10),
      inLanguage: 'es-CL',
      author: { '@id': `${SITIO}/#organizacion` },
      publisher: { '@id': `${SITIO}/#organizacion` },
      audience: { '@type': 'PeopleAudience', geographicArea: { '@type': 'AdministrativeArea', name: 'Región de Valparaíso, Chile' } }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITIO}/` },
        { '@type': 'ListItem', position: 2, name: 'Noticias', item: `${SITIO}/noticias/` },
        { '@type': 'ListItem', position: 3, name: n.titulo, item: canonica }
      ]
    }
  ];
  if (preguntas.length) {
    grafo.push({
      '@type': 'FAQPage',
      '@id': `${canonica}#preguntas`,
      mainEntity: preguntas.map((p) => ({ '@type': 'Question', name: p.pregunta, acceptedAnswer: { '@type': 'Answer', text: p.respuesta } }))
    });
  }
  const extra = `<meta property="article:published_time" content="${esc(n.fecha)}">`;
  const foto = n.imagen_url
    ? `<figure class="article-photo"><img src="${esc(n.imagen_url)}" alt="${esc(n.imagen_alt || n.titulo)}" width="1200" height="630"></figure>`
    : '';
  const relacionadas = otras.filter((o) => o.slug !== n.slug).slice(0, 3);
  return cabeza({ titulo: `${n.titulo} | CENRESIN`, descripcion, canonica, imagen, tipo: 'article', jsonld: { '@context': 'https://schema.org', '@graph': grafo }, extra }) + `
<article class="article">
  <header class="article-head">
    <div class="container article-narrow">
      <div class="breadcrumb"><a href="/">Inicio</a> · <a href="/noticias/">Noticias</a></div>
      <h1>${esc(n.titulo)}</h1>
      <p class="article-lead">${esc(descripcion)}</p>
      <p class="article-meta">Publicado el <time datetime="${esc(n.fecha)}">${fechaLarga(n.fecha)}</time> · CENRESIN, Quillota</p>
    </div>
  </header>
  <div class="container article-narrow">
    ${foto}
    <div class="article-body">
${html}
    </div>
    <aside class="article-cta">
      <div>
        <strong>¿Tienes dudas sobre tu salud respiratoria?</strong>
        <p>Agenda una consulta o escríbenos por WhatsApp. Estamos en San Martín 502, Quillota.</p>
      </div>
      <div class="article-cta-actions">
        <a class="btn primary" href="/contacto.html">Agendar consulta</a>
        <a class="btn" href="https://wa.me/56332316393" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </aside>
    <p class="article-disclaimer">Esta información es educativa y no reemplaza una consulta médica. Si tienes una urgencia, acude al servicio de urgencia más cercano.</p>
  </div>
</article>
${relacionadas.length ? `<section class="section alt">
  <div class="container">
    <div class="section-head"><div><h2>Más noticias</h2></div><a class="btn" href="/noticias/">Ver todas</a></div>
    <div class="news-grid">${relacionadas.map((o) => tarjetaNoticia(o, { encabezadoNivel: 'h3' })).join('\n')}</div>
  </div>
</section>` : ''}
` + pie();
}

export function rss(noticias) {
  const items = noticias.slice(0, 30).map((n) => `<item><title>${esc(n.titulo)}</title><link>${SITIO}${urlNoticia(n)}</link><guid>${SITIO}${urlNoticia(n)}</guid><pubDate>${new Date(n.fecha + 'T12:00:00-03:00').toUTCString()}</pubDate><description>${esc(resumenDe(n))}</description></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Noticias CENRESIN</title><link>${SITIO}/noticias/</link><description>Salud respiratoria y estudios clínicos en Quillota</description><language>es-cl</language>${items}</channel></rss>`;
}

// Páginas fijas del sitio, para el sitemap.
export const PAGINAS = [
  ['/', '1.00'], ['/quienes-somos.html', '0.90'], ['/nuestro-equipo.html', '0.85'], ['/centro-medico.html', '0.90'],
  ['/profesionales.html', '0.90'], ['/examenes.html', '0.85'], ['/estudios-clinicos.html', '0.90'],
  ['/estudios-disponibles.html', '0.85'], ['/pacientes.html', '0.80'], ['/formulario-estudios-clinicos.html', '0.80'],
  ['/patrocinadores-cro.html', '0.80'], ['/contacto.html', '0.90'], ['/noticias/', '0.85']
];

export function sitemap(noticias) {
  const urls = PAGINAS.map(([p, pr]) => `  <url><loc>${SITIO}${p}</loc><priority>${pr}</priority></url>`)
    .concat(noticias.map((n) => `  <url><loc>${SITIO}${urlNoticia(n)}</loc><lastmod>${(n.actualizado || n.fecha).slice(0, 10)}</lastmod><priority>0.70</priority></url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
