
document.addEventListener('DOMContentLoaded', () => {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.menu');

  if (mobileToggle && menu) {
    mobileToggle.addEventListener('click', () => {
      menu.classList.toggle('open');
    });
  }

  document.querySelectorAll('.drop-toggle').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const dropdown = btn.closest('.dropdown');
      event.preventDefault();
      event.stopPropagation();
      document.querySelectorAll('.dropdown.open').forEach((item) => {
        if (item !== dropdown) item.classList.remove('open');
      });

      dropdown.classList.toggle('open');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.open').forEach((item) => item.classList.remove('open'));
  });

  document.querySelectorAll('.dropdown-content').forEach((content) => {
    content.addEventListener('click', (event) => event.stopPropagation());
  });

  // Formularios: se envían a /api/formulario y luego se muestra la página de gracias.
  document.querySelectorAll('form[data-clinical-form], form[data-formulario]').forEach((form) => {
    const trampa = document.createElement('input');
    trampa.type = 'text';
    trampa.name = 'sitio_web';
    trampa.tabIndex = -1;
    trampa.autocomplete = 'off';
    trampa.setAttribute('aria-hidden', 'true');
    trampa.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    form.appendChild(trampa);

    const aviso = document.createElement('p');
    aviso.className = 'form-aviso';
    aviso.setAttribute('role', 'alert');
    aviso.hidden = true;
    form.appendChild(aviso);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const boton = form.querySelector('[type="submit"]');
      const datos = new FormData(form);
      datos.append('origen', location.pathname);
      aviso.hidden = true;
      if (boton) boton.disabled = true;
      try {
        const respuesta = await fetch('/api/formulario', { method: 'POST', body: datos });
        let resultado = {};
        try { resultado = await respuesta.json(); } catch (e) {}
        if (!respuesta.ok || !resultado.ok) throw new Error(resultado.error);
        window.location.href = 'gracias.html';
      } catch (error) {
        aviso.textContent = (error && error.message) || 'No pudimos enviar tu mensaje. Por favor llámanos al 33 2 316393 o escríbenos por WhatsApp.';
        aviso.hidden = false;
        if (boton) boton.disabled = false;
      }
    });
  });
});
