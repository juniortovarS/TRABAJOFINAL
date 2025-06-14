document.getElementById('loginForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    });

    const data = await res.json();

    if (res.ok && data.success) {  // Aquí verificamos si fue exitoso
      // Redirigir al perfil si login ok
      window.location.href = 'perfil.html';
    } else {
      // Mostrar mensaje de error si no
      document.getElementById('mensaje').innerText = data.mensaje || 'Usuario o contraseña incorrectos';
    }
  } catch (error) {
    document.getElementById('mensaje').innerText = 'Error en la conexión';
  }
});
