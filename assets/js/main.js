
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
      event.preventDefault();
      event.stopPropagation();

      const dropdown = btn.closest('.dropdown');
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

  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Formulario listo. Falta conectar el envío al correo o WhatsApp desde el hosting.');
    });
  });
});
