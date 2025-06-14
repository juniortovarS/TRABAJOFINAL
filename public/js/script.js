document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------
     1) MENÚ – Resaltar enlace activo al hacer scroll
  -------------------------------------------- */
  const contenedor = document.querySelector('.main-content');
  const secciones = document.querySelectorAll('.main-content section');
  const enlaces = document.querySelectorAll('.header-top nav a, .sidebar-icon a');

  function activarEnlace() {
    const scrollY = contenedor.scrollTop;

    secciones.forEach(seccion => {
      const offsetTop = seccion.offsetTop - 150;
      const height = seccion.offsetHeight;

      if (scrollY >= offsetTop && scrollY < offsetTop + height) {
        const id = seccion.getAttribute('id');

        enlaces.forEach(enlace => {
          // Remueve clase en todos
          enlace.classList.remove('activo');

          // Agrega solo al enlace correspondiente
          if (enlace.getAttribute('href') === `#${id}`) {
            enlace.classList.add('activo');
          }
        });
      }
    });
  }

  contenedor.addEventListener('scroll', activarEnlace);
  activarEnlace();

  /* --------------------------------------------
     2) ANIMACIÓN – Fade-in al aparecer en pantalla
  -------------------------------------------- */
  const faders = document.querySelectorAll('.fade-in, .scroll-fade-in');

  const observerOptions = {
    root: contenedor,
    threshold: 0.2
  };

  const aparecer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('opacity-100', 'translate-y-0');
        entry.target.classList.remove('opacity-0', 'translate-y-10');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  faders.forEach(el => {
    el.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-10');
    aparecer.observe(el);
  });

  /* --------------------------------------------
     3) INTERACCIÓN – Efecto de clic en botones
  -------------------------------------------- */
  const botones = document.querySelectorAll('button');

  botones.forEach(boton => {
    boton.addEventListener('click', () => {
      boton.classList.add('scale-95');
      setTimeout(() => boton.classList.remove('scale-95'), 150);
    });
  });

  /* --------------------------------------------
     4) BOTÓN FLOTANTE LOGIN – Mostrar tras 10 segundos
  -------------------------------------------- */
  setTimeout(() => {
    const btn = document.getElementById('openAuthBtn');
    if (btn) {
      btn.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
      btn.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
    }
  }, 10000);


function mostrarMensaje(texto, esError = false) {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = texto;
  mensaje.style.color = esError ? '#ff5555' : '#00ffff';
}


document.addEventListener('DOMContentLoaded', () => {
  const contenedorUsuario = document.getElementById('usuarioLogeado');
  const usuarioLogeado = JSON.parse(localStorage.getItem('usuarioLogeado'));

  if (usuarioLogeado) {
    contenedorUsuario.textContent = `Bienvenido, ${usuarioLogeado.nombreCompleto || usuarioLogeado.usuario}`;
  } else {
    contenedorUsuario.textContent = 'No has iniciado sesión.';
  }
});





const helpBtn = document.getElementById('help-btn');
  const helpBox = document.getElementById('help-box');

  helpBtn.addEventListener('click', () => {
    helpBox.classList.toggle('hidden');
  });

  // Cerrar al hacer clic fuera (opcional)
  window.addEventListener('click', (e) => {
    if (!helpBox.contains(e.target) && !helpBtn.contains(e.target)) {
      helpBox.classList.add('hidden');
    }
  });

});
