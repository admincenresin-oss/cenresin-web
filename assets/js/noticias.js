// Carga las últimas noticias en la portada de bienvenida y en la de Estudios Clínicos.
// Usa la base de datos (/api/noticias) y, si no está disponible, las noticias de ejemplo.
(() => {
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fecha = (iso) => { const [a, m, d] = String(iso).split('-').map(Number); return a ? `${d} de ${MESES[m - 1]} de ${a}` : ''; };
  const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());

  function tarjeta(n) {
    const img = n.imagen_url
      ? `<img src="${esc(n.imagen_url)}" alt="${esc(n.imagen_alt || n.titulo)}" loading="lazy" width="800" height="450">`
      : '<span class="news-card-placeholder" aria-hidden="true"></span>';
    return `<article class="news-card">
      <a class="news-card-img" href="${esc(n.url)}" tabindex="-1" aria-hidden="true">${img}</a>
      <div class="news-card-body">
        <time datetime="${esc(n.fecha)}">${fecha(n.fecha)}</time>
        <h3><a href="${esc(n.url)}">${esc(n.titulo)}</a></h3>
        <p>${esc(n.resumen)}</p>
        <a class="news-card-more" href="${esc(n.url)}">Leer noticia <span aria-hidden="true">›</span></a>
      </div>
    </article>`;
  }

  async function obtener(seccion, limite) {
    try {
      const r = await fetch(`/api/noticias?seccion=${seccion}&limite=${limite}`, { headers: { accept: 'application/json' } });
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) return await r.json();
    } catch (e) { /* sin servidor: se usan las noticias de ejemplo */ }
    const r = await fetch('assets/data/noticias.json');
    const todas = await r.json();
    const campo = seccion === 'inicio' ? 'mostrar_inicio' : 'mostrar_estudios';
    return todas
      .filter((n) => n[campo] && n.fecha <= hoy())
      .slice(0, limite)
      .map((n) => ({ ...n, url: `/noticias/${n.slug}/` }));
  }

  document.querySelectorAll('[data-noticias]').forEach(async (seccion) => {
    const lista = seccion.querySelector('[data-noticias-lista]');
    try {
      const noticias = await obtener(seccion.dataset.noticias, Number(seccion.dataset.limite || 3));
      if (!noticias.length) { seccion.hidden = true; return; }
      lista.innerHTML = noticias.map(tarjeta).join('');
    } catch (e) { /* se mantiene el contenido inicial */ }
  });
})();
