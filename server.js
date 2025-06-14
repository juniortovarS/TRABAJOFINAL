const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const PORT = 3000;

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'secreto_super_seguro',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a SQLite
const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'), (err) => {
  if (err) console.error('❌ Error al conectar DB:', err.message);
  else console.log('📦 Conectado a la base de datos SQLite');
});

// Crear tablas si no existen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE,
    password TEXT,
    nombreCompleto TEXT,
    email TEXT,
    foto TEXT,
    rol TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS proyectos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    titulo TEXT,
    descripcion TEXT,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS catalogo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    imagen TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS carrito (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    proyecto_id INTEGER,
    cantidad INTEGER DEFAULT 1,
    FOREIGN KEY(proyecto_id) REFERENCES catalogo(id)
  )`);
});

// Middleware de autenticación
function verificarSesion(req, res, next) {
  if (req.session.usuario) next();
  else res.status(401).json({ mensaje: 'No autenticado' });
}

// Registro
app.post('/register', async (req, res) => {
  const { usuario, password, nombreCompleto, email } = req.body;
  if (!usuario || !password || !nombreCompleto || !email)
    return res.status(400).json({ mensaje: 'Faltan datos' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const rol = 'usuario';
    const foto = 'img/avatar.png';

    db.run(`INSERT INTO usuarios (usuario, password, nombreCompleto, email, foto, rol)
            VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario, hashedPassword, nombreCompleto, email, foto, rol],
      function (err) {
        if (err) return res.status(500).json({ mensaje: 'Error al registrar usuario' });
        res.status(200).json({ mensaje: 'Usuario registrado correctamente' });
      });
  } catch {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Usuario o contraseña incorrectos
 */
// Login
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) return res.status(400).json({ mensaje: 'Faltan datos.' });

  db.get('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, row) => {
    if (err) return res.status(500).json({ mensaje: 'Error base de datos' });
    if (!row) return res.status(400).json({ mensaje: 'Usuario no encontrado' });

    bcrypt.compare(password, row.password, (err, valido) => {
      if (err) return res.status(500).json({ mensaje: 'Error al comparar contraseña' });
      if (!valido) return res.status(400).json({ mensaje: 'Contraseña incorrecta' });

      req.session.usuario = row.usuario;
      res.json({ mensaje: 'Login exitoso', usuario: row.usuario, nombre: row.nombreCompleto });
    });
  });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ mensaje: 'Sesión cerrada' });
});

// Obtener info de sesión y proyectos del usuario
app.get('/session', (req, res) => {
  if (!req.session.usuario) return res.json({ logueado: false });

  db.get('SELECT * FROM usuarios WHERE usuario = ?', [req.session.usuario], (err, usuarioRow) => {
    if (err || !usuarioRow) return res.json({ logueado: false });

    db.all('SELECT titulo, descripcion FROM proyectos WHERE usuario_id = ?', [usuarioRow.id], (err, proyectos) => {
      if (err) return res.status(500).json({ mensaje: 'Error al obtener proyectos' });

      res.json({
        logueado: true,
        usuario: usuarioRow.usuario,
        nombreCompleto: usuarioRow.nombreCompleto,
        email: usuarioRow.email,
        rol: usuarioRow.rol,
        foto: usuarioRow.foto || 'img/avatar.png',
        proyectos: proyectos || []
      });
    });
  });
});

// Catálogo
app.get('/api/catalogo', (req, res) => {
  db.all('SELECT * FROM catalogo', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/catalogo/:id', (req, res) => {
  db.get('SELECT * FROM catalogo WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener proyecto' });
    if (!row) return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
    res.json(row);
  });
});

app.post('/api/catalogo', (req, res) => {
  const { titulo, descripcion, imagen } = req.body;
  if (!titulo || !descripcion || !imagen) return res.status(400).json({ error: 'Faltan datos obligatorios' });

  db.run(`INSERT INTO catalogo (titulo, descripcion, imagen) VALUES (?, ?, ?)`,
    [titulo, descripcion, imagen],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Proyecto agregado', id: this.lastID });
    });
});

// Carrito
app.post('/api/carrito/agregar', verificarSesion, (req, res) => {
  const { proyecto_id, cantidad } = req.body;
  const usuario = req.session.usuario;

  if (!proyecto_id || !cantidad) return res.status(400).json({ mensaje: 'Faltan datos' });

  db.get(`SELECT * FROM carrito WHERE usuario = ? AND proyecto_id = ?`, [usuario, proyecto_id], (err, row) => {
    if (err) return res.status(500).json({ mensaje: 'Error al buscar en el carrito' });

    if (row) {
      db.run(`UPDATE carrito SET cantidad = cantidad + ? WHERE id = ?`, [cantidad, row.id], (err) => {
        if (err) return res.status(500).json({ mensaje: 'Error al actualizar cantidad' });
        res.json({ mensaje: 'Cantidad actualizada en el carrito' });
      });
    } else {
      db.run(`INSERT INTO carrito (usuario, proyecto_id, cantidad) VALUES (?, ?, ?)`,
        [usuario, proyecto_id, cantidad], function (err) {
          if (err) return res.status(500).json({ mensaje: 'Error al agregar al carrito' });
          res.json({ mensaje: 'Proyecto agregado al carrito' });
        });
    }
  });
});

app.get('/api/carrito', verificarSesion, (req, res) => {
  db.all(`
    SELECT carrito.id, catalogo.titulo, catalogo.descripcion, catalogo.imagen, carrito.cantidad
    FROM carrito
    JOIN catalogo ON carrito.proyecto_id = catalogo.id
    WHERE carrito.usuario = ?
  `, [req.session.usuario], (err, rows) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener carrito' });
    res.json(rows);
  });
});

app.delete('/api/carrito/eliminar/:id', verificarSesion, (req, res) => {
  db.run(`DELETE FROM carrito WHERE id = ? AND usuario = ?`, [req.params.id, req.session.usuario], function (err) {
    if (err) return res.status(500).json({ mensaje: 'Error al eliminar del carrito' });
    res.json({ mensaje: 'Proyecto eliminado del carrito' });
  });
});

app.delete('/api/carrito/vaciar', verificarSesion, (req, res) => {
  db.run('DELETE FROM carrito WHERE usuario = ?', [req.session.usuario], function (err) {
    if (err) return res.status(500).json({ mensaje: 'Error al vaciar carrito' });
    res.json({ mensaje: 'Carrito vaciado' });
  });
});

// Chatbot con respuestas.json
app.post('/api/chat', verificarSesion, (req, res) => {
  const mensaje = req.body.mensaje?.toLowerCase().trim();
  if (!mensaje) return res.status(400).json({ respuesta: 'No se recibió ningún mensaje.' });

  fs.readFile(path.join(__dirname, 'respuestas.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).json({ respuesta: 'Error al leer respuestas.' });

    let respuesta = "Gracias por tu mensaje. Un asesor te responderá pronto.";

    try {
      const respuestas = JSON.parse(data);
      for (let r of respuestas) {
        const regex = new RegExp(r.regex, 'i');
        if (regex.test(mensaje)) {
          respuesta = r.respuesta;
          break;
        }
      }
    } catch (parseError) {
      console.error("❌ Error al parsear respuestas.json:", parseError);
    }

    res.json({ respuesta });
  });
});

// Página de inicio
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public'));
});

// Ruta explícita para respuestas.json
app.get('/respuestas.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'respuestas.json'));
});



const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Proyecto Final',
      version: '1.0.0',
      description: 'Documentación de la API de tu proyecto',
    },
    servers: [
      {
        url: 'https://trabajo-final-junior.onrender.com', // Reemplaza con tu URL real
      },
    ],
  },
  apis: ['./server.js'], // Aquí puedes poner más archivos si defines rutas en otros archivos
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}/bienvenido.html`);
});
