const express = require("express");
const mysql = require("mysql2");
var bodyParser=require('body-parser');
const cors = require("cors");
const path = require('path');
const xss = require("xss");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Examen1')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Examen1', 'Crud.html'));
});

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "n0m3l0",
    database: "cantantes_db"
});

con.connect(err => {
    if (err) {
        console.error("Error de conexión a MySQL:", err);
        return;
    }
    console.log("Conectado a MySQL");
    
    // Crear tabla de usuarios si no existe
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        apellido VARCHAR(50) NOT NULL,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        contrasena VARCHAR(100) NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    
    con.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Error al crear la tabla usuarios:', err);
        } else {
            console.log('Tabla usuarios lista');
        }
    });
});

// Clave secreta para JWT
const JWT_SECRET = 'clave_secreta_para_jwt_cantantes_app';

// Middleware para verificar token
function verificarToken(req, res, next) {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ exito: false, mensaje: 'No hay token, autorización denegada' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded.usuario;
        next();
    } catch (error) {
        res.status(401).json({ exito: false, mensaje: 'Token no válido' });
    }
}

const limpiarTexto = (texto) => xss(texto).replace(/<[^>]*>?/g, '').trim().substring(0, 255);

// Rutas para la autenticación de usuarios

// Registro de usuarios
app.post('/api/registro', async (req, res) => {
    const { nombre, apellido, usuario, email, contrasena } = req.body;
    
    // Validar campos
    if (!nombre || !apellido || !usuario || !email || !contrasena) {
        return res.status(400).json({ exito: false, mensaje: 'Por favor, complete todos los campos' });
    }
    
    try {
        // Verificar si el usuario o email ya existe
        con.query('SELECT * FROM usuarios WHERE usuario = ? OR email = ?', [usuario, email], async (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ exito: false, mensaje: 'El usuario o email ya está registrado' });
            }
            
            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasena, salt);
            
            // Insertar usuario en la base de datos
            const insertQuery = 'INSERT INTO usuarios (nombre, apellido, usuario, email, contrasena) VALUES (?, ?, ?, ?, ?)';
            con.query(insertQuery, [nombre, apellido, usuario, email, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error al insertar usuario:', err);
                    return res.status(500).json({ exito: false, mensaje: 'Error al registrar usuario' });
                }
                
                res.json({ exito: true, mensaje: 'Usuario registrado con éxito' });
            });
        });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
    }
});

// Login de usuarios
app.post('/api/login', (req, res) => {
    const { usuarioEmail, contrasena } = req.body;
    
    // Validar campos
    if (!usuarioEmail || !contrasena) {
        return res.status(400).json({ exito: false, mensaje: 'Por favor, complete todos los campos' });
    }
    
    try {
        // Buscar usuario por usuario o email
        const query = 'SELECT * FROM usuarios WHERE usuario = ? OR email = ?';
        con.query(query, [usuarioEmail, usuarioEmail], async (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
            }
            
            if (results.length === 0) {
                return res.status(400).json({ exito: false, mensaje: 'Credenciales inválidas' });
            }
            
            const usuario = results[0];
            
            // Verificar contraseña
            const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);
            if (!isMatch) {
                return res.status(400).json({ exito: false, mensaje: 'Credenciales inválidas' });
            }
            
            // Crear y firmar el JWT
            const payload = {
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    usuario: usuario.usuario
                }
            };
            
            jwt.sign(
                payload,
                JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        exito: true,
                        mensaje: 'Inicio de sesión exitoso',
                        token,
                        usuario: {
                            id: usuario.id,
                            nombre: usuario.nombre,
                            usuario: usuario.usuario
                        }
                    });
                }
            );
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
    }
});

// Obtener información del usuario autenticado
app.get('/api/usuario', verificarToken, (req, res) => {
    try {
        // Consultar información actualizada del usuario
        con.query('SELECT id, nombre, apellido, usuario, email FROM usuarios WHERE id = ?', [req.usuario.id], (err, results) => {
            if (err) {
                console.error('Error al obtener datos del usuario:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
            }
            
            res.json({
                exito: true,
                usuario: results[0]
            });
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
    }
});

// Rutas existentes para cantantes
app.get("/obtenerCantantes", (req, res) => {
    con.query("SELECT * FROM cantantes", (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener datos" });
        res.json(results);
    });
});

app.post("/agregarCantante", (req, res) => {
    let { nombre, nombre_artistico, genero, pais, edad, anos_carrera, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita } = req.body;
    
    if (!nombre || !nombre_artistico || !genero || !pais || !edad || !anos_carrera) {
        return res.status(400).json({ error: "Todos los campos requeridos deben estar llenos" });
    }

    let query = "INSERT INTO cantantes (nombre, nombre_artistico, genero, pais, edad, anos_carrera, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    let values = [limpiarTexto(nombre), limpiarTexto(nombre_artistico), limpiarTexto(genero), limpiarTexto(pais), edad, anos_carrera, limpiarTexto(discografia), limpiarTexto(redes_sociales), limpiarTexto(premios), limpiarTexto(situacion_amorosa), limpiarTexto(cancion_favorita)];

    con.query(query, values, (err) => {
        if (err) return res.status(500).json({ error: "Error al agregar cantante" });
        res.json({ mensaje: "Cantante agregado correctamente" });
    });
});

app.post("/actualizarCantante", (req, res) => {
    let { id, nombre, nombre_artistico, genero, pais, edad, anos_carrera, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita } = req.body;

    let query = "UPDATE cantantes SET nombre=?, nombre_artistico=?, genero=?, pais=?, edad=?, anos_carrera=?, discografia=?, redes_sociales=?, premios=?, situacion_amorosa=?, cancion_favorita=? WHERE id=?";
    let values = [limpiarTexto(nombre), limpiarTexto(nombre_artistico), limpiarTexto(genero), limpiarTexto(pais), edad, anos_carrera, limpiarTexto(discografia), limpiarTexto(redes_sociales), limpiarTexto(premios), limpiarTexto(situacion_amorosa), limpiarTexto(cancion_favorita), id];

    con.query(query, values, (err) => {
        if (err) return res.status(500).json({ error: "Error al actualizar cantante" });
        res.json({ mensaje: "Cantante actualizado correctamente" });
    });
});

app.post("/eliminarCantante", (req, res) => {
    let { id } = req.body;
    con.query("DELETE FROM cantantes WHERE id=?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Error al eliminar cantante" });
        res.json({ mensaje: "Cantante eliminado correctamente" });
    });
});

function esAdmin(req, res, next) {
    // Verificar si el usuario es admin
    con.query('SELECT usuario FROM usuarios WHERE id = ?', [req.usuario.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).json({ exito: false, mensaje: 'Acceso denegado' });
        }
        
        if (results[0].usuario === 'admin') {
            next(); // Es administrador, permitir acceso
        } else {
            return res.status(403).json({ exito: false, mensaje: 'Se requiere permisos de administrador' });
        }
    });
}

// Modifica las rutas de cantantes para usar los middlewares
app.get("/obtenerCantantes", verificarToken, (req, res) => {
    con.query("SELECT * FROM cantantes", (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener datos" });
        res.json(results);
    });
});

app.post("/agregarCantante", verificarToken, esAdmin, (req, res) => {
    // El código existente...
});

app.post("/actualizarCantante", verificarToken, esAdmin, (req, res) => {
    // El código existente...
});

app.post("/eliminarCantante", verificarToken, esAdmin, (req, res) => {
    // El código existente...
});

// Middleware para rutas que requieren ser administrador
function verificarAdmin(req, res, next) {
    con.query('SELECT usuario FROM usuarios WHERE id = ?', [req.usuario.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).json({ exito: false, mensaje: 'Acceso denegado' });
        }
        
        if (results[0].usuario === 'admin') {
            next(); // Es administrador, permitir acceso
        } else {
            return res.status(403).json({ exito: false, mensaje: 'Se requiere permisos de administrador' });
        }
    });
}

// Rutas que solo administradores pueden usar
app.get("/cantantesAdmin", verificarToken, verificarAdmin, (req, res) => {
    // Operaciones administrativas
});

// Rutas que cualquier usuario autenticado puede usar
app.get("/obtenerCantantes", verificarToken, (req, res) => {
    // Cualquier usuario autenticado puede ver cantantes
});

app.post("/agregarCantante", verificarToken, (req, res) => {
    // Cualquier usuario autenticado puede agregar cantantes
});

// Si quieres que solo administradores puedan eliminar o actualizar:
app.post("/eliminarCantante", verificarToken, verificarAdmin, (req, res) => {
    // Solo administradores pueden eliminar
});

app.listen(3000, () => {
    console.log("Servidor corriendo in the port: 3000");
});