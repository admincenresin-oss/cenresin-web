(() => {
  const API = '/admin-login/api/contenido-sitio';
  const $ = (selector) => document.querySelector(selector);
  const MODULES = {
    menu: { label:'Menú de navegación', description:'Edita las pestañas, submenús, nombres y enlaces del menú.', add:'Agregar opción', kind:'menu' },
    personas: { label:'Equipos y profesionales', description:'Administra los equipos de CENRESIN y Estudios Clínicos. Apaga una persona para ocultarla temporalmente sin borrar sus datos.', add:'Agregar persona', kind:'person' },
    patrocinadores: { label:'Patrocinadores y CRO', description:'Agrega, ordena, actualiza o archiva patrocinadores y sus logos.', add:'Agregar patrocinador', kind:'sponsor' },
    estudios: { label:'Estudios y áreas clínicas', description:'Edita las áreas de estudio, sus descripciones y enlaces.', add:'Agregar estudio o área', kind:'study' },
    servicios: { label:'Servicios y especialidades', description:'Administra las áreas de atención, sus textos y su orden.', add:'Agregar servicio', kind:'service' },
    examenes: { label:'Exámenes', description:'Administra exámenes, descripciones, valores e indicaciones de preparación.', add:'Agregar examen', kind:'exam' },
    pagina: { label:'Textos e imágenes de las páginas', description:'Selecciona una página para editar sus textos e imágenes visibles.', kind:'page' }
  };
  const PAGES = [
    ['/','Inicio'],['/quienes-somos.html','Quiénes Somos'],['/nuestro-equipo.html','Nuestro Equipo'],['/centro-medico.html','Centro Médico · Especialidades'],['/profesionales.html','Profesionales'],['/examenes.html','Exámenes'],['/estudios-clinicos.html','Estudios Clínicos'],['/estudios-disponibles.html','Estudios Clínicos · Áreas de estudio'],['/pacientes.html','Estudios Clínicos · Información para pacientes'],['/patrocinadores.html','Patrocinadores'],['/patrocinadores-cro.html','Patrocinadores y CRO'],['/contacto.html','Contacto'],['/formulario-estudios-clinicos.html','Formulario de Estudios Clínicos']
  ];
  let cms = {};
  let modulo = 'menu';
  let items = [];
  let editing = null;
  let formItem = null;
  let camposPagina = null;
  let paginaSeleccionada = '/';
  let paginaEdicion = { text:{}, images:{}, links:{} };
  let previewFrame = null;

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const aviso = (text, ok=false) => {
    const el = $('#cms-aviso');
    el.textContent = text;
    el.className = `aviso ${ok ? 'ok' : 'error'}`;
    el.classList.toggle('oculto', !text);
  };
  async function api(path, options={}) {
    const response = await fetch(API + path, { credentials:'same-origin', ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No se pudo guardar el contenido.');
    return data;
  }
  async function conProgreso(button, texto, accion) {
    if (button?.disabled) return;
    const original = button?.textContent;
    if (button) { button.disabled = true; button.textContent = texto; }
    aviso(texto, true);
    try { return await accion(); }
    finally { if (button) { button.disabled = false; button.textContent = original; } }
  }

  async function cargar() {
    try {
      cms = await api('');
      $('#btn-editar-sitio').classList.remove('oculto');
      poblarModulos();
    } catch (e) {
      $('#btn-editar-sitio').classList.add('oculto');
    }
  }

  function poblarModulos() {
    $('#cms-modulo').innerHTML = Object.entries(MODULES).map(([key, value]) => `<option value="${key}">${esc(value.label)}</option>`).join('');
    $('#cms-pagina').innerHTML = PAGES.map(([path,label]) => `<option value="${esc(path)}">${esc(label)}</option>`).join('');
    $('#cms-modulo').value = modulo;
    mostrarModulo();
  }

  function mostrarPanelCms(visible) {
    $('#vista-lista').classList.toggle('oculto', visible);
    $('#vista-form').classList.toggle('oculto', visible);
    $('#panel-cms').classList.toggle('oculto', !visible);
    if (visible) window.scrollTo(0,0);
  }

  function mostrarModulo() {
    modulo = $('#cms-modulo').value || 'menu';
    const cfg = MODULES[modulo];
    $('#cms-ayuda').textContent = cfg.description;
    $('#cms-coleccion').classList.toggle('oculto', cfg.kind === 'page');
    $('#cms-edicion').classList.add('oculto');
    $('#cms-paginas').classList.toggle('oculto', cfg.kind !== 'page');
    if (cfg.kind === 'page') {
      $('#cms-pagina').value = paginaSeleccionada;
      cargarPagina(paginaSeleccionada);
      return;
    }
    const saved = cms[modulo]?.borrador;
    items = Array.isArray(saved) ? structuredClone(saved) : [];
    $('#cms-titulo-lista').textContent = cfg.label;
    $('#cms-descripcion-lista').textContent = cfg.description;
    $('#cms-nuevo').textContent = `+ ${cfg.add}`;
    pintarLista();
  }

  function visibleItem(item) { return item.visible !== false && item.activo !== false; }
  function tituloItem(item) { return item.label || item.nombre || item.titulo || 'Sin título'; }
  function imagenItem(item) { return item.foto || item.logo || item.imagen || ''; }

  function aplanarMenu(menu, parent=null, path='') {
    const out=[];
    (menu||[]).forEach((item,index) => {
      const here = path ? `${path}.${index}` : String(index);
      out.push({item,parent,path:here});
      if (item.children?.length) out.push(...aplanarMenu(item.children,item,here));
    });
    return out;
  }

  function pintarLista() {
    let list = items.map((item,index) => ({item,index,parent:null}));
    if (modulo === 'menu') list = aplanarMenu(items).map((x,index) => ({item:x.item,index,parent:x.parent}));
    const activos = list.filter(({item}) => visibleItem(item));
    const archivados = list.filter(({item}) => !visibleItem(item));
    const all = [...activos,...archivados];
    if (!all.length) { $('#cms-lista').innerHTML = `<div class="vacio tarjeta">Aún no hay elementos. Presiona <b>${esc(MODULES[modulo].add)}</b> para crear el primero.</div>`; return; }
    $('#cms-lista').innerHTML = all.map(({item,index,parent}) => {
      const photo = imagenItem(item);
      const visible = visibleItem(item);
      const sub = modulo === 'menu' ? `${parent ? `Submenú de ${parent.label} · ` : ''}${item.tipo === 'grupo' ? 'Título de grupo del submenú' : item.url || ''}` : (item.cargo || item.categoria || item.grupo || item.valor || '');
      return `<article class="cms-fila" data-index="${index}">${photo ? `<img src="${esc(photo)}" alt="">` : '<div class="cms-sin-foto">Sin imagen</div>'}<div><h3>${esc(tituloItem(item))}</h3><p>${esc(sub)}</p><div class="cms-acciones"><button class="btn claro" type="button" data-cms-edit="${index}">Editar</button><button class="btn claro" type="button" data-cms-toggle="${index}">${visible?'Ocultar':'Volver a activar'}</button></div></div><label class="cms-estado"><input type="checkbox" data-cms-visible="${index}" ${visible?'checked':''}><span>${visible?'Visible':'Oculto'}</span></label></article>`;
    }).join('');
  }

  function camposPara(item, parent=null) {
    const text=(key,label,placeholder='')=>`<div class="cms-campo"><label for="cms-${key}">${label}</label><input type="text" id="cms-${key}" data-field="${key}" value="${esc(item[key]??'')}" placeholder="${esc(placeholder)}"></div>`;
    const area=(key,label,placeholder='')=>`<div class="cms-campo"><label for="cms-${key}">${label}</label><textarea id="cms-${key}" data-field="${key}" placeholder="${esc(placeholder)}">${esc(Array.isArray(item[key])?item[key].join('\n'):item[key]??'')}</textarea></div>`;
    const select=(key,label,opts)=>`<div class="cms-campo"><label for="cms-${key}">${label}</label><select id="cms-${key}" data-field="${key}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(item[key]??'')===v?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`;
    const image=(key,label)=>`<div class="cms-campo"><label>${label}</label><div class="cms-foto">${item[key]?`<img src="${esc(item[key])}" alt="">`:''}<div><input type="file" accept="image/jpeg,image/png,image/webp" data-image-field="${key}"><p class="ayuda">JPG, PNG o WebP. La foto se optimiza antes de guardarse.</p>${item[key]?`<button type="button" class="btn peligro" data-remove-image="${key}">Quitar imagen</button>`:''}</div></div></div>`;
    const active=`<label class="cms-check"><input type="checkbox" data-field="${modulo==='menu'?'visible':'activo'}" ${(modulo==='menu' ? item.visible!==false : item.activo!==false)?'checked':''}>${modulo==='menu'?'Mostrar esta opción':'Visible en el sitio'}</label>`;
    if (modulo==='menu') {
      const parents=items.filter(x=>x!==editing?.item).map((x,i)=>[String(i),x.label]);
      return text('label','Nombre en el menú','Ej.: Nuestro Equipo')+select('tipo','Tipo de opción',[['enlace','Enlace'],['grupo','Título de grupo del submenú']])+text('url','Enlace','/pagina.html')+select('parent','Ubicación',[['','Pestaña principal'],...parents])+text('orden','Orden de aparición')+active+`<p class="ayuda">Para crear una subopción, selecciona una pestaña principal. Los títulos de grupo organizan el submenú y no llevan enlace.</p>`;
    }
    if (modulo==='personas') return text('nombre','Nombre completo')+text('cargo','Cargo o especialidad')+select('grupo','Equipo principal',[['liderazgo','Equipo de gestión'],['apoyo','Centro Médico y servicios'],['investigacion','Estudios Clínicos']])+select('area','Área profesional (opcional)',[['','No mostrar en Profesionales'],['broncopulmonar','Broncopulmonar'],['medicina-general','Medicina general'],['cardiologia','Cardiología'],['nutricion-psicologia','Nutrición y Psicología']])+area('descripcion','Descripción breve')+image('foto','Fotografía')+text('alt','Descripción de la foto')+text('orden','Orden de aparición')+active;
    if (modulo==='patrocinadores') return text('nombre','Nombre del patrocinador o CRO')+area('descripcion','Descripción breve')+image('logo','Logo')+text('alt','Descripción del logo')+text('orden','Orden de aparición')+active;
    if (modulo==='estudios') return text('titulo','Nombre del estudio o área')+text('categoria','Categoría')+area('descripcion','Descripción')+image('foto','Imagen (opcional)')+text('enlace','Enlace o formulario','/formulario-estudios-clinicos.html')+select('estado','Estado',[['En reclutamiento','En reclutamiento'],['Sin reclutamiento','Sin reclutamiento'],['Finalizado','Finalizado']])+text('orden','Orden de aparición')+active;
    if (modulo==='servicios') return text('titulo','Nombre del servicio o especialidad')+text('categoria','Área o categoría')+area('descripcion','Descripción')+image('foto','Fotografía (opcional)')+text('orden','Orden de aparición')+active;
    if (modulo==='examenes') return text('titulo','Nombre del examen')+select('grupo','Área',[['respiratoria','Área Respiratoria'],['cardiovascular','Salud Cardiovascular, Nutrición y Deporte'],['imagenologia','Imagenología']])+area('descripcion','Descripción')+image('foto','Imagen (opcional)')+text('valor','Valor o indicación de precio')+area('preparacion','Indicaciones de preparación','Una indicación por línea')+text('orden','Orden de aparición')+active;
    return '';
  }

  function abrirEdicion(index=null,parent=null) {
    editing = index === null ? null : { item: itemEnIndice(index,parent), index, parent };
    formItem = editing ? structuredClone(editing.item) : nuevoItem();
    $('#cms-titulo-form').textContent = editing ? `Editar ${tituloItem(formItem)}` : MODULES[modulo].add;
    $('#cms-campos').innerHTML = camposPara(formItem,parent);
    $('#cms-coleccion').classList.add('oculto');
    $('#cms-paginas').classList.add('oculto');
    $('#cms-edicion').classList.remove('oculto');
    $('#cms-campos').querySelectorAll('[data-image-field]').forEach((el)=>el.addEventListener('change',async()=>{
      if (!el.files?.[0]) return;
      const file=await optimizar(el.files[0]).catch(()=>null); if(!file){aviso('No se pudo procesar la imagen.');return;}
      const data=new FormData(); data.append('foto',file,'contenido.jpg');
      try { const res=await api('/imagen',{method:'POST',body:data}); formItem[el.dataset.imageField]=res.url; $('#cms-campos').innerHTML=camposPara(formItem); bindFields(); aviso('Imagen cargada. Guarda el borrador para conservarla.',true); }
      catch(e){aviso(e.message);}
    }));
    bindFields();
    window.scrollTo(0,0);
  }

  function bindFields(){
    $('#cms-campos').querySelectorAll('[data-field]').forEach((el)=>{
      const key=el.dataset.field;
      el.addEventListener('input',()=>{formItem[key]=el.type==='checkbox'?el.checked:el.value;});
      el.addEventListener('change',()=>{formItem[key]=el.type==='checkbox'?el.checked:el.value;});
    });
    $('#cms-campos').querySelectorAll('[data-remove-image]').forEach((el)=>el.addEventListener('click',()=>{formItem[el.dataset.removeImage]='';$('#cms-campos').innerHTML=camposPara(formItem);bindFields();}));
  }

  async function optimizar(file){
    if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('Usa JPG, PNG o WebP.');
    const bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    for(const q of [.85,.72,.6,.48]){const blob=await new Promise(ok=>canvas.toBlob(ok,'image/jpeg',q));if(blob.size<=1.4*1024*1024)return new File([blob],'contenido.jpg',{type:'image/jpeg'});}
    throw new Error('La imagen es demasiado pesada.');
  }

  function nuevoItem(){
    if(modulo==='menu')return {tipo:'enlace',label:'',url:'',orden:items.length+1,children:[],visible:true};
    if(modulo==='personas')return {nombre:'',cargo:'',grupo:'liderazgo',area:'',descripcion:'',foto:'',alt:'',activo:true,orden:items.length+1};
    if(modulo==='patrocinadores')return {nombre:'',descripcion:'',logo:'',alt:'',activo:true,orden:items.length+1};
    if(modulo==='estudios')return {titulo:'',categoria:'Área de estudio',descripcion:'',foto:'',enlace:'/formulario-estudios-clinicos.html',estado:'Sin reclutamiento',activo:true,orden:items.length+1};
    if(modulo==='servicios')return {titulo:'',categoria:'Servicio',descripcion:'',foto:'',activo:true,orden:items.length+1};
    if(modulo==='examenes')return {titulo:'',grupo:'respiratoria',descripcion:'',foto:'',valor:'Valor: consultar',preparacion:[],activo:true,orden:items.length+1};
    return {};
  }

  function itemEnIndice(index,parent){
    if(modulo!=='menu')return items[index];
    const row=aplanarMenu(items)[index];return row?.item;
  }

  function guardarEnLista(){
    if(modulo==='menu'){
      const label=formItem.label.trim(); if(!label){aviso('Escribe el nombre de la opción.');return false;}
      if(formItem.tipo==='grupo')formItem.url=''; else formItem.tipo='enlace';
      formItem.children=formItem.children||[];
      if(editing){
        const target=aplanarMenu(items)[editing.index];
        if(target?.item)Object.assign(target.item,formItem);
      }else if(formItem.parent!==''&&formItem.parent!==undefined){const root=items[Number(formItem.parent)];if(root){root.children=root.children||[];root.children.push({...formItem,children:[]});}}
      else items.push({...formItem,children:[]});
    }else{
      const title=formItem.nombre||formItem.titulo;
      if(!title?.trim()){aviso('Completa el nombre o título.');return false;}
      if(modulo==='examenes')formItem.preparacion=String(formItem.preparacion||'').split('\n').map(x=>x.trim()).filter(Boolean);
      if(editing)items[editing.index]=formItem;else items.push({...formItem,id:formItem.id||`${modulo}-${Date.now()}`});
    }
    $('#cms-edicion').classList.add('oculto');$('#cms-coleccion').classList.remove('oculto');pintarLista();aviso('Cambios listos en esta sección. Guarda el borrador o publícalos.',true);return true;
  }

  async function guardarBorrador(){
    if(modulo==='pagina'){await guardarPagina(false);return;}
    await api(`/${modulo}/borrador`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contenido:items})});
    cms[modulo].borrador=structuredClone(items);aviso('Borrador guardado. Todavía no se muestra en el sitio.',true);
  }
  async function publicar(){
    if(modulo==='pagina'){await guardarPagina(true);return;}
    await api(`/${modulo}/borrador`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contenido:items})});
    await api(`/${modulo}/publicar`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
    cms[modulo].borrador=structuredClone(items);cms[modulo].publicado=structuredClone(items);aviso('Publicado. Los cambios ya se muestran en el sitio.',true);
  }

  function cargarPagina(path){
    paginaSeleccionada=path;
    paginaEdicion=structuredClone(cms.pagina?.borrador?.[path]||{text:{},images:{},links:{}});
    paginaEdicion.text=paginaEdicion.text||{};paginaEdicion.images=paginaEdicion.images||{};paginaEdicion.links=paginaEdicion.links||{};
    const frame=$('#cms-frame-lectura');
    frame.src=path+(path.includes('?')?'&':'?')+'cmsAdminPreview=1';
    camposPagina=null;$('#cms-pagina-campos').innerHTML='<div class="vacio tarjeta">Cargando el contenido de la página…</div>';
  }

  function dibujarCamposPagina(fields){
    camposPagina=fields;
    const text=(fields.texts||[]).map(f=>`<article class="cms-page-field"><label>${esc(f.label)}</label><textarea data-page-text="${esc(f.id)}">${esc(paginaEdicion.text[f.id]??f.value)}</textarea></article>`).join('');
    const images=(fields.images||[]).map(f=>`<article class="cms-page-field"><label>${esc(f.label)}</label><img src="${esc(paginaEdicion.images[f.id]?.src||f.src)}" alt=""><input type="file" accept="image/jpeg,image/png,image/webp" data-page-image="${esc(f.id)}"><textarea data-page-alt="${esc(f.id)}" aria-label="Descripción de la imagen">${esc(paginaEdicion.images[f.id]?.alt??f.alt)}</textarea></article>`).join('');
    const links=(fields.links||[]).map(f=>`<article class="cms-page-field"><label>${esc(f.label)}</label><textarea data-page-link-text="${esc(f.id)}">${esc(paginaEdicion.links[f.id]?.text??f.text)}</textarea><input type="url" data-page-link-href="${esc(f.id)}" value="${esc(paginaEdicion.links[f.id]?.href??f.href)}" aria-label="Enlace"></article>`).join('');
    $('#cms-pagina-campos').innerHTML=(text+images+links)||'<div class="vacio tarjeta">No encontré textos ni imágenes editables en esta página.</div>';
    $('#cms-pagina-campos').querySelectorAll('[data-page-text]').forEach(el=>el.addEventListener('input',()=>{paginaEdicion.text[el.dataset.pageText]=el.value;previewPagina();}));
    $('#cms-pagina-campos').querySelectorAll('[data-page-alt]').forEach(el=>el.addEventListener('input',()=>{const id=el.dataset.pageAlt;paginaEdicion.images[id]=paginaEdicion.images[id]||{};paginaEdicion.images[id].alt=el.value;previewPagina();}));
    $('#cms-pagina-campos').querySelectorAll('[data-page-link-text]').forEach(el=>el.addEventListener('input',()=>{const id=el.dataset.pageLinkText;paginaEdicion.links[id]=paginaEdicion.links[id]||{};paginaEdicion.links[id].text=el.value;previewPagina();}));
    $('#cms-pagina-campos').querySelectorAll('[data-page-link-href]').forEach(el=>el.addEventListener('input',()=>{const id=el.dataset.pageLinkHref;paginaEdicion.links[id]=paginaEdicion.links[id]||{};paginaEdicion.links[id].href=el.value;previewPagina();}));
    $('#cms-pagina-campos').querySelectorAll('[data-page-image]').forEach(el=>el.addEventListener('change',async()=>{
      if(!el.files?.[0])return;const f=await optimizar(el.files[0]).catch(()=>null);if(!f){aviso('No se pudo procesar la imagen.');return;}
      const data=new FormData();data.append('foto',f,'pagina.jpg');try{const r=await api('/imagen',{method:'POST',body:data});const id=el.dataset.pageImage;paginaEdicion.images[id]={...(paginaEdicion.images[id]||{}),src:r.url};dibujarCamposPagina(camposPagina);previewPagina();aviso('Imagen lista. Guarda el borrador o publícala.',true);}catch(e){aviso(e.message);}
    }));
    previewPagina();
  }

  function previewPagina(){
    const mensaje={tipo:'cenresin-cms-preview',contenido:paginaEdicion};
    $('#cms-frame-lectura').contentWindow?.postMessage(mensaje,location.origin);
    previewFrame?.contentWindow?.postMessage(mensaje,location.origin);
  }

  async function guardarPagina(publish){
    if(!cms.pagina)cms.pagina={borrador:{},publicado:{}};
    const draft=structuredClone(cms.pagina.borrador||{});draft[paginaSeleccionada]=structuredClone(paginaEdicion);
    await api('/pagina/borrador',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contenido:draft})});
    cms.pagina.borrador=draft;
    if(publish){await api('/pagina/publicar',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});cms.pagina.publicado=structuredClone(draft);aviso('Cambios publicados en esta página.',true);}
    else aviso('Borrador guardado. Todavía no se muestra en el sitio.',true);
  }

  function herramientasVista(markup){
    return `<div class="cms-preview-tools" role="group" aria-label="Tamaño de vista previa"><button type="button" data-cms-preview-size="desktop" aria-pressed="true">Vista escritorio</button><button type="button" data-cms-preview-size="mobile" aria-pressed="false">Vista celular</button></div><div class="cms-preview-stage" id="cms-preview-stage" data-size="desktop">${markup}</div>`;
  }
  function conectarHerramientasVista(){
    const stage=$('#cms-preview-stage');
    $('#cms-modal-contenido').querySelectorAll('[data-cms-preview-size]').forEach((button)=>button.addEventListener('click',()=>{
      stage.dataset.size=button.dataset.cmsPreviewSize;
      $('#cms-modal-contenido').querySelectorAll('[data-cms-preview-size]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));
    }));
  }
  function abrirPreview(){
    const title=formItem?.nombre||formItem?.titulo||formItem?.label||'Vista previa';
    const img=imagenItem(formItem);
    $('#cms-modal-titulo').textContent='Vista previa';
    const tarjeta=`<article class="cms-preview-card">${img?`<img src="${esc(img)}" alt="${esc(formItem.alt||title)}">`:''}<div><h3>${esc(title)}</h3>${formItem.cargo?`<span class="role">${esc(formItem.cargo)}</span>`:''}${formItem.categoria?`<p><b>${esc(formItem.categoria)}</b></p>`:''}${formItem.descripcion?`<p>${esc(formItem.descripcion)}</p>`:''}${formItem.valor?`<p>${esc(formItem.valor)}</p>`:''}</div></article>`;
    $('#cms-modal-contenido').innerHTML=herramientasVista(tarjeta);
    conectarHerramientasVista();
    $('#cms-modal').classList.remove('oculto');
  }

  function abrirVistaPagina(){
    $('#cms-modal-titulo').textContent='Vista previa de la página';
    const frame=`<iframe class="cms-preview-wide" title="Vista previa de la página" src="${esc(paginaSeleccionada+(paginaSeleccionada.includes('?')?'&':'?')+'cmsAdminPreview=1&preview=modal')}"></iframe>`;
    $('#cms-modal-contenido').innerHTML=herramientasVista(frame);
    conectarHerramientasVista();
    previewFrame=$('#cms-preview-stage iframe');
    previewFrame.addEventListener('load',previewPagina);
    $('#cms-modal').classList.remove('oculto');
  }

  $('#btn-editar-sitio').addEventListener('click',()=>{mostrarPanelCms(true);mostrarModulo();});
  $('#btn-volver-noticias').addEventListener('click',()=>mostrarPanelCms(false));
  $('#cms-modulo').addEventListener('change',mostrarModulo);
  $('#cms-pagina').addEventListener('change',()=>cargarPagina($('#cms-pagina').value));
  $('#cms-nuevo').addEventListener('click',()=>abrirEdicion());
  $('#cms-lista').addEventListener('click',(event)=>{
    const edit=event.target.closest('[data-cms-edit]');const toggle=event.target.closest('[data-cms-toggle]');
    if(edit)abrirEdicion(Number(edit.dataset.cmsEdit));
    if(toggle){const idx=Number(toggle.dataset.cmsToggle);if(modulo==='menu'){const row=aplanarMenu(items)[idx];row.item.visible=row.item.visible===false;}else items[idx].activo=items[idx].activo===false; pintarLista();}
  });
  $('#cms-lista').addEventListener('change',(event)=>{const input=event.target.closest('[data-cms-visible]');if(!input)return;const idx=Number(input.dataset.cmsVisible);if(modulo==='menu'){const row=aplanarMenu(items)[idx];row.item.visible=input.checked;}else items[idx].activo=input.checked;pintarLista();});
  $('#cms-cancelar').addEventListener('click',()=>{$('#cms-edicion').classList.add('oculto');$('#cms-coleccion').classList.remove('oculto');});
  $('#cms-guardar').addEventListener('click',(event)=>conProgreso(event.currentTarget,'Guardando borrador…',async()=>{if(guardarEnLista())await guardarBorrador();}).catch(e=>aviso(e.message)));
  $('#cms-vista-previa').addEventListener('click',abrirPreview);
  $('#cms-borrador').addEventListener('click',(event)=>conProgreso(event.currentTarget,'Guardando borrador…',guardarBorrador).catch(e=>aviso(e.message)));
  $('#cms-publicar').addEventListener('click',(event)=>conProgreso(event.currentTarget,'Publicando…',publicar).catch(e=>aviso(e.message)));
  $('#cms-publicar-form').addEventListener('click',(event)=>conProgreso(event.currentTarget,'Publicando…',async()=>{if(guardarEnLista())await publicar();}).catch(e=>aviso(e.message)));
  $('#cms-pagina-guardar').addEventListener('click',(event)=>conProgreso(event.currentTarget,'Guardando borrador…',()=>guardarPagina(false)).catch(e=>aviso(e.message)));
  $('#cms-pagina-publicar').addEventListener('click',(event)=>conProgreso(event.currentTarget,'Publicando…',()=>guardarPagina(true)).catch(e=>aviso(e.message)));
  $('#cms-pagina-preview').addEventListener('click',abrirVistaPagina);
  $('#cms-modal-cerrar').addEventListener('click',()=>$('#cms-modal').classList.add('oculto'));
  $('#cms-modal').addEventListener('click',(e)=>{if(e.target===$('#cms-modal'))$('#cms-modal').classList.add('oculto');});

  window.addEventListener('message',(event)=>{
    if(event.origin!==location.origin||!event.data||event.data.tipo!=='cenresin-cms-campos')return;
    if(event.source===$('#cms-frame-lectura').contentWindow){dibujarCamposPagina(event.data.campos);return;}
    if(previewFrame&&event.source===previewFrame.contentWindow)previewFrame.contentWindow.postMessage({tipo:'cenresin-cms-preview',contenido:paginaEdicion},location.origin);
  });

  window.addEventListener('cenresin-authenticated',cargar);
  cargar();
})();
