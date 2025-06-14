
document.addEventListener('DOMContentLoaded', () => {
  // Función para mostrar mensajes en el elemento #mensaje
  function mostrarMensaje(texto, esError = false) {
    const mensaje = document.getElementById('mensaje');
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = esError ? '#ff5555' : '#00ffff';
  }

  // Cambiar pestañas
  const tabs = document.querySelectorAll('.tab');
  const forms = {
    loginForm: document.getElementById('loginForm'),
    registroForm: document.getElementById('registroForm')
  };
  const mensaje = document.getElementById('mensaje');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');

      Object.values(forms).forEach(form => form.classList.remove('active'));
      const targetForm = forms[tab.getAttribute('data-target')];
      targetForm.classList.add('active');

      mensaje.textContent = '';
      mensaje.style.color = '#00ffff'; // color neutro
    });

    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tab.click();
      }
    });
  });

  // Vista previa avatar (opcional)
  const inputAvatar = document.getElementById('fotoPerfil');
  const vistaPrevia = document.getElementById('vistaPrevia');

  if (inputAvatar && vistaPrevia) {
    inputAvatar.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) {
        vistaPrevia.style.display = 'none';
        vistaPrevia.src = '';
        return;
      }
      if (!file.type.startsWith('image/')) {
        mostrarMensaje('Por favor, selecciona un archivo de imagen válido.', true);
        vistaPrevia.style.display = 'none';
        vistaPrevia.src = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        vistaPrevia.src = e.target.result;
        vistaPrevia.style.display = 'block';
      };
      reader.readAsDataURL(file);
      mensaje.textContent = '';
    });
  }

  // LOGIN REAL
  forms.loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const user = e.target.usuario.value.trim();
    const pass = e.target.password.value.trim();

    if (user === '' || pass === '') {
      mostrarMensaje('Completa todos los campos para ingresar.', true);
      return;
    }

    mostrarMensaje('Validando...');

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ usuario: user, password: pass })
      });

      const data = await response.json();

if (response.ok) {
  mostrarMensaje('Accediendo...', false);

  setTimeout(() => {
    mostrarMensaje('Login exitoso, redirigiendo...', false);

    // Crear el mensaje grande de bienvenida
    const bienvenida = document.createElement('div');
    bienvenida.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50';
    bienvenida.innerHTML = `
      <div class="bg-gradient-to-r from-green-400 to-blue-500 p-10 rounded-xl shadow-xl text-center max-w-xl mx-4">
        <h1 class="text-6xl font-extrabold text-white mb-4">¡Bienvenido, <span id="nombreUsuario"></span>!</h1>
        <p class="text-xl text-white">Estamos felices de verte aquí.</p>
        <button id="cerrarBienvenida" class="mt-6 px-6 py-3 bg-white text-black rounded hover:bg-gray-200 transition">Cerrar y continuar</button>
      </div>
    `;

    console.log('Agregando mensaje bienvenida');
    document.body.appendChild(bienvenida);

    // Insertar el nombre de usuario dinámico
    const nombreSpan = document.getElementById('nombreUsuario');
    if(nombreSpan) {
      nombreSpan.textContent = data.usuario;
      console.log('Nombre de usuario insertado:', data.usuario);
    } else {
      console.warn('No se encontró el span para el nombre de usuario');
    }

    // Permitir cerrar el mensaje con un botón (para probar)
    const btnCerrar = document.getElementById('cerrarBienvenida');
    btnCerrar.addEventListener('click', () => {
      console.log('Cerrando mensaje bienvenida y redirigiendo...');
      document.body.removeChild(bienvenida);
      window.location.href = 'index.html';
    });

    // También quitar mensaje automáticamente después de 8 segundos (más tiempo para probar)
    setTimeout(() => {
      if(document.body.contains(bienvenida)) {
        console.log('Tiempo acabado, cerrando mensaje bienvenida automáticamente');
        document.body.removeChild(bienvenida);
        window.location.href = 'index.html';
      }
    }, 8000);

  }, 1500);
} else {
  mostrarMensaje(data.mensaje || 'Usuario o contraseña incorrectos.', true);
}

    } catch (error) {
      mostrarMensaje('Error de conexión con el servidor.', true);
      console.error(error);
    }
  });

  // REGISTRO REAL
  forms.registroForm.addEventListener('submit', async e => {
    e.preventDefault();

    const user = e.target.usuario.value.trim();
    const nombreCompleto = e.target.nombreCompleto.value.trim();
    const email = e.target.email.value.trim();
    const pass = e.target.password.value.trim();

    if (!user || !nombreCompleto || !email || !pass) {
      mostrarMensaje('Por favor, completa todos los campos.', true);
      return;
    }

    mostrarMensaje('Registrando usuario...');

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: user,
          password: pass,
          nombreCompleto: nombreCompleto,
          email: email
        })
      });

      const data = await response.json();

      if (response.ok) {
        mostrarMensaje(`Usuario ${user} registrado con éxito!`);
        e.target.reset();
        if (vistaPrevia) {
          vistaPrevia.style.display = 'none';
          vistaPrevia.src = '';
        }
      } else {
        mostrarMensaje(data.mensaje || 'Error en el registro.', true);
      }
    } catch (error) {
      mostrarMensaje('Error de conexión con el servidor.', true);
      console.error(error);
    }
  });
});
