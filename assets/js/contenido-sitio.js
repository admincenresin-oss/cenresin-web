(() => {
  const API = '/api/contenido-sitio';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const ruta = location.pathname === '/index.html' ? '/' : location.pathname;
  const rutaCms = ruta.endsWith('/') ? ruta.slice(0, -1) || '/' : ruta;
  const scriptQuery = new URLSearchParams(location.search);
  let datosSitio = {};

  function elementosTexto() {
    const raiz = document.body;
    const selectores = 'h1,h2,h3,h4,p,li,blockquote,.role,.area-label,.specialty-label,.exam-price,.exam-convenio,.clinical-kicker';
    const elementos = [...raiz.querySelectorAll(selectores)].filter((el) => !el.closest('.site-header,header,nav,form,[data-cms-collection]') && el.textContent.trim() && !el.closest('svg'));
    const citaInstitucional = document.querySelector('.quote');
    if (citaInstitucional && !elementos.includes(citaInstitucional) && citaInstitucional.textContent.trim()) elementos.push(citaInstitucional);
    return elementos;
  }

  function marcarColecciones() {
    document.querySelectorAll('.team-area .people-grid').forEach((el,i)=>{if(i<3)el.dataset.cmsCollection='personas';});
    document.querySelectorAll('.professionals-area .professional-row-grid,.specialty-professionals').forEach((el)=>el.dataset.cmsCollection='personas');
    document.querySelectorAll('.sponsor-logo-track,.pathology-grid,.study-grid-areas,.specialty-area,.exam-area .exam-flip-grid').forEach((el)=>el.dataset.cmsCollection='contenido');
    const teamGrid=document.querySelector('.clinical-team-section .team-cms-grid');
    if(teamGrid)teamGrid.dataset.cmsCollection='personas';
  }

  function camposPagina() {
    const root = document.body;
    const textos = elementosTexto();
    const imagenes = [...root.querySelectorAll('img')].filter((img) => !img.closest('.site-header,header,nav,form,[data-cms-collection]'));
    const enlaces = [...root.querySelectorAll('main a,footer a')].filter((a)=>!a.closest('[data-cms-collection]')&&a.textContent.trim());
    const elementos = [...new Set([...textos, ...imagenes, ...enlaces])].sort((a,b) => {
      const posicion = a.compareDocumentPosition(b);
      if (posicion & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (posicion & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
    const orden = new Map(elementos.map((el, indice) => [el, indice]));
    const texts = textos.map((el, i) => ({ id: `t${i}`, orden: orden.get(el), areaId: el.closest('.exam-area')?.id || '', tag: el.tagName.toLowerCase(), label: etiquetaSeccion(el), value: el.textContent.trim() }));
    const images = imagenes.map((img, i) => ({ id: `i${i}`, orden: orden.get(img), label: etiquetaSeccion(img), src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '' }));
    const links = enlaces.map((a,i)=>({id:`l${i}`,orden:orden.get(a),label:etiquetaSeccion(a),text:a.textContent.trim(),href:a.getAttribute('href')||''}));
    return { texts, images, links };
  }

  function etiquetaSeccion(el) {
    if (el.matches('.quote')) return 'Frase institucional · Cita institucional';
    const seccion = el.closest('section,article');
    const heading = seccion?.querySelector('h1,h2,h3') || document.querySelector('main h1');
    const titulo = heading?.textContent.trim();
    const texto = el.textContent.trim().replace(/\s+/g, ' ');
    return `${titulo ? `${titulo} · ` : ''}${texto.slice(0, 72)}`;
  }

  function aplicarPagina(overrides = {}) {
    const texts = elementosTexto();
    for (const [id, value] of Object.entries(overrides.text || {})) {
      const i = Number(id.slice(1));
      if (id[0] === 't' && texts[i] && typeof value === 'string') texts[i].textContent = value;
    }
    const root = document.body;
    const images = [...root.querySelectorAll('img')].filter((img) => !img.closest('.site-header,header,nav,form,[data-cms-collection]'));
    for (const [id, value] of Object.entries(overrides.images || {})) {
      const i = Number(id.slice(1));
      if (id[0] === 'i' && images[i] && value && typeof value.src === 'string') {
        images[i].src = value.src;
        images[i].alt = value.alt || images[i].alt;
      }
    }
    const links=[...root.querySelectorAll('main a,footer a')].filter((a)=>!a.closest('[data-cms-collection]')&&a.textContent.trim());
    for(const [id,value] of Object.entries(overrides.links||{})){
      const i=Number(id.slice(1));
      if(id[0]==='l'&&links[i]&&value&&typeof value.href==='string'){
        links[i].href=/^(\/(?!\/)|#|https:\/\/|mailto:|tel:)/i.test(value.href)?value.href:'#';
        if(typeof value.text==='string')links[i].textContent=value.text;
      }
    }
  }

  function menuHref(path) {
    if (!path) return '#';
    return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(path) ? path : '#';
  }

  function pintarMenu(items) {
    const nav = document.querySelector('.site-header nav.menu');
    if (!nav || !Array.isArray(items) || !items.length) return;
    const actual = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    nav.innerHTML = items.filter((item) => item.visible !== false).slice().sort((a,b)=>(a.orden||0)-(b.orden||0)).map((item) => {
      const children = (item.children || []).filter((child) => child.visible !== false).slice().sort((a,b)=>(a.orden||0)-(b.orden||0));
      const link = menuHref(item.url);
      if (children.length) {
        const activeChild = children.some((child) => child.tipo !== 'grupo' && actual === menuHref(child.url).replace(/\/$/, ''));
        return `<div class="dropdown"><button class="drop-toggle${activeChild?' active':''}" type="button">${esc(item.label)}</button><div class="dropdown-content">${children.map((child) => child.tipo === 'grupo' ? `<span class="dropdown-heading">${esc(child.label)}</span>` : `<a href="${esc(menuHref(child.url))}">${esc(child.label)}</a>`).join('')}</div></div>`;
      }
      if (item.tipo === 'grupo') return `<span class="menu-group-label">${esc(item.label)}</span>`;
      const active = actual === link.replace(/\/$/, '') ? ' active' : '';
      const style = /contacto/i.test(item.label) ? 'btn' : 'menu-link';
      return `<a class="${style}${active}" href="${esc(link)}">${esc(item.label)}</a>`;
    }).join('');
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.site-header nav.menu .drop-toggle');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const dropdown = button.closest('.dropdown');
    document.querySelectorAll('.site-header nav.menu .dropdown.open').forEach((item) => {
      if (item !== dropdown) item.classList.remove('open');
    });
    dropdown?.classList.toggle('open');
  });

  const cmsStyles = document.createElement('style');
  cmsStyles.textContent = '.dropdown-heading{display:block;padding:10px 16px 5px;font-size:.78rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;opacity:.72}.menu-group-label{display:block}.cms-service-image{display:block;width:100%;max-height:320px;object-fit:cover;border-radius:14px;margin-top:16px}';
  document.head.append(cmsStyles);

  function cardPersona(persona) {
    const image = persona.foto || persona.imagen;
    return `<article class="person-card"><img src="${esc(image || '/assets/img/logo-cenresin.png')}" alt="${esc(persona.alt || persona.nombre)}" loading="lazy"><div class="person-info"><h3>${esc(persona.nombre)}</h3><span class="role">${esc(persona.cargo)}</span>${persona.descripcion ? `<p>${esc(persona.descripcion)}</p>` : ''}</div></article>`;
  }

  function professionalCard(persona, specialty=false) {
    const image=persona.foto||persona.imagen||'';
    return `<article class="professional-row-card">${image?`<img src="${esc(image)}" alt="${esc(persona.alt||persona.nombre)}" loading="lazy">`:''}<div class="${specialty?'professional-info':'professional-row-info'}"><h3>${esc(persona.nombre)}</h3><span class="role">${esc(persona.cargo)}</span>${persona.descripcion?`<p>${esc(persona.descripcion)}</p>`:''}</div></article>`;
  }

  function pintarPersonas(personas) {
    if (!Array.isArray(personas)) return;
    const visibles = personas.filter((p) => p.activo !== false);
    const grids = [...document.querySelectorAll('.team-area .people-grid')].slice(0, 3);
    const grupos = ['liderazgo','apoyo','investigacion'];
    grids.forEach((grid, index) => {
      const lista = visibles.filter((p) => p.grupo === grupos[index]).sort((a,b) => (a.orden||0)-(b.orden||0));
      grid.dataset.cmsCollection = 'personas';
      grid.innerHTML = lista.map(cardPersona).join('');
    });
    const rows=[...document.querySelectorAll('.professionals-area .professional-row-grid')];
    rows.forEach((grid,index)=>{
      const list=visibles.filter((p)=>index===0?Boolean(p.area):p.grupo==='investigacion').sort((a,b)=>(a.orden||0)-(b.orden||0));
      grid.dataset.cmsCollection='personas';grid.innerHTML=list.map((p)=>professionalCard(p)).join('');
    });
    document.querySelectorAll('.specialty-area').forEach((area)=>{
      const key=area.id;
      const grid=area.querySelector('.specialty-professionals');
      if(!grid)return;
      grid.dataset.cmsCollection='personas';
      const list=visibles.filter((p)=>p.area===key).sort((a,b)=>(a.orden||0)-(b.orden||0));
      grid.innerHTML=list.map((p)=>professionalCard(p,true)).join('');
    });
    const bloqueClinico = document.querySelector('.clinical-team-section .team-cms-grid');
    if (bloqueClinico) {
      const lista = visibles.filter((p) => p.grupo === 'investigacion').sort((a,b) => (a.orden||0)-(b.orden||0));
      bloqueClinico.innerHTML = lista.map((p) => professionalCard(p)).join('');
    }
  }

  function pintarPatrocinadores(items) {
    const tracks = [...document.querySelectorAll('.sponsor-logo-track')];
    if (!tracks.length || !Array.isArray(items)) return;
    const visibles = items.filter((x) => x.activo !== false).sort((a,b) => (a.orden||0)-(b.orden||0));
    const markup = visibles.map((x) => `<figure class="sponsor-logo-card"><img src="${esc(x.logo || x.imagen || '')}" alt="${esc(x.nombre)}" loading="lazy"></figure>`).join('');
    tracks.forEach((track) => { track.dataset.cmsCollection = 'patrocinadores'; track.innerHTML = markup; });
  }

  function pintarEstudios(items) {
    if (!Array.isArray(items)) return;
    const visibles = items.filter((x) => x.activo !== false).sort((a,b) => (a.orden||0)-(b.orden||0));
    const pathologia = document.querySelector('.pathology-grid');
    if (pathologia) {
      pathologia.dataset.cmsCollection = 'estudios';
      pathologia.innerHTML = visibles.map((x) => `<article class="pathology-card">${x.foto?`<img src="${esc(x.foto)}" alt="${esc(x.titulo)}" loading="lazy" style="width:100%;max-width:180px;max-height:140px;object-fit:cover;border-radius:14px">`:`<div class="pathology-icon" aria-hidden="true">＋</div>`}<div><span>${esc(x.estado || x.categoria)}</span><h2>${esc(x.titulo)}</h2>${x.descripcion ? `<p>${esc(x.descripcion)}</p>` : ''}<a class="clinical-btn solid" href="${esc(x.enlace || '/formulario-estudios-clinicos.html')}">Solicitar información <b>›</b></a></div></article>`).join('');
    }
    const areas = document.querySelector('.study-grid-areas');
    if (areas) {
      areas.dataset.cmsCollection = 'estudios';
      areas.innerHTML = visibles.map((x) => `<article class="study-card">${x.foto?`<img src="${esc(x.foto)}" alt="${esc(x.titulo)}" loading="lazy" style="width:100%;max-height:160px;object-fit:cover;border-radius:12px">`:`<div class="study-icon" aria-hidden="true">＋</div>`}<small>${esc(x.estado || x.categoria || 'Área de estudio')}</small><h3>${esc(x.titulo)}</h3>${x.descripcion ? `<p>${esc(x.descripcion)}</p>` : ''}<a href="${esc(x.enlace || '/formulario-estudios-clinicos.html')}">Solicitar información <b>›</b></a></article>`).join('');
    }
  }

  function pintarServicios(items) {
    if (!Array.isArray(items)) return;
    const areas = [...document.querySelectorAll('.specialty-area')];
    const visibles = items.filter((x) => x.activo !== false).sort((a,b) => (a.orden||0)-(b.orden||0));
    if (!areas.length) return;
    const base = areas[0].cloneNode(true);
    const contenedor = areas[0].parentElement;
    areas.forEach((area, i) => {
      if (!area.dataset.cmsId) area.dataset.cmsId = items[i]?.id || `servicio-${i+1}`;
      const x = visibles.find((item) => item.id === area.dataset.cmsId);
      if (!x) { area.remove(); return; }
      area.dataset.cmsCollection = 'servicios';
      area.classList.toggle('alt', (x.orden || i + 1) % 2 === 0);
      const label = area.querySelector('.specialty-label');
      const title = area.querySelector('.specialty-panel h2');
      const desc = area.querySelector('.specialty-panel p');
      if (label) label.textContent = x.categoria || 'Servicio';
      if (title) title.textContent = x.titulo || '';
      if (desc) desc.textContent = x.descripcion || '';
      let foto = area.querySelector('.cms-service-image');
      if (x.foto && !foto) { foto = document.createElement('img'); foto.className = 'cms-service-image'; foto.loading = 'lazy'; area.querySelector('.specialty-panel')?.append(foto); }
      if (foto) { if (x.foto) { foto.src = x.foto; foto.alt = x.titulo || 'Imagen del servicio'; } else foto.remove(); }
    });
    const rendered = new Set(areas.map((area) => area.dataset.cmsId));
    const extras = visibles.filter((x) => !rendered.has(x.id));
    extras.forEach((x) => {
      const area = base.cloneNode(true);
      area.dataset.cmsCollection = 'servicios';
      area.dataset.cmsId = x.id;
      const label = area.querySelector('.specialty-label');
      const title = area.querySelector('.specialty-panel h2');
      const desc = area.querySelector('.specialty-panel p');
      if (label) label.textContent = x.categoria || 'Servicio';
      if (title) title.textContent = x.titulo || '';
      if (desc) desc.textContent = x.descripcion || '';
      area.querySelector('.specialty-professionals')?.remove();
      if (x.foto) { const foto = document.createElement('img'); foto.className='cms-service-image'; foto.src=x.foto; foto.alt=x.titulo||'Imagen del servicio'; foto.loading='lazy'; area.querySelector('.specialty-panel')?.append(foto); }
      contenedor.append(area);
    });
  }

  function pintarExamenes(items) {
    if (!Array.isArray(items)) return;
    const grids = [...document.querySelectorAll('.exam-area .exam-flip-grid')];
    const visibles = items.filter((x) => x.activo !== false).sort((a,b) => (a.orden||0)-(b.orden||0));
    const grupos = ['respiratoria','cardiovascular','imagenologia'];
    grids.forEach((grid, i) => {
      const lista = visibles.filter((x) => x.grupo === grupos[i]);
      grid.dataset.cmsCollection = 'examenes';
      grid.innerHTML = lista.map((x) => `<article class="exam-flip-card" tabindex="0" aria-label="${esc(x.titulo)}"><div class="exam-flip-inner"><div class="exam-face exam-front">${x.foto?`<img src="${esc(x.foto)}" alt="${esc(x.titulo)}" loading="lazy" style="width:100%;max-height:130px;object-fit:cover;border-radius:12px">`:`<span class="exam-icon" aria-hidden="true">＋</span>`}<h3>${esc(x.titulo)}</h3>${x.descripcion ? `<p>${esc(x.descripcion)}</p>` : ''}<span class="exam-price">${esc(x.valor || 'Valor: consultar')}</span><div class="exam-convenio">Consultar convenios disponibles</div><p class="exam-note">Pasa el cursor o toca la tarjeta para revisar preparación.</p></div><div class="exam-face exam-back"><h3>${esc(x.titulo)}</h3><div class="exam-prep-title">Indicaciones de preparación</div><ul class="exam-prep-list">${(x.preparacion || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div></div></article>`).join('');
    });
  }

  function hidratarColecciones(data) {
    pintarMenu(data.menu);
    pintarPersonas(data.personas);
    pintarPatrocinadores(data.patrocinadores);
    pintarEstudios(data.estudios);
    pintarServicios(data.servicios);
    pintarExamenes(data.examenes);
  }

  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || !event.data) return;
    if (event.data.tipo === 'cenresin-cms-campos') {
      event.source?.postMessage({ tipo: 'cenresin-cms-campos', pagina: rutaCms, campos: camposPagina() }, location.origin);
    }
    if (event.data.tipo === 'cenresin-cms-preview') aplicarPagina(event.data.contenido || {});
  });

  fetch(API, { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : null).then((data) => {
    if (!data) return;
    datosSitio = data;
    marcarColecciones();
    aplicarPagina((data.pagina || {})[rutaCms] || {});
    hidratarColecciones(data);
    if (scriptQuery.has('cmsAdminPreview') && window.parent !== window) {
      window.parent.postMessage({ tipo: 'cenresin-cms-campos', pagina: rutaCms, campos: camposPagina() }, location.origin);
    }
  }).catch(() => {});
})();
