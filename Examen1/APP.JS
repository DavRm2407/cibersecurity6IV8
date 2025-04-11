const express = require("express");
const mysql = require("mysql2");
var bodyParser=require('body-parser');
const cors = require("cors");
const path = require('path');
const xss = require("xss");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PORT = process.env.PORT || 3000;

function limpiarTexto(texto) {
    if (!texto) return "";
    
    let textoLimpio = xss(texto.toString().trim());
    
    textoLimpio = textoLimpio
        .replace(/'/g, "''") 
        .replace(/;/g, "") 
        .replace(/--/g, "") 
        .replace(/\/\*/g, "") 
        .replace(/\*\//g, "") 
        .replace(/union\s+select/gi, "") 
        .replace(/select/gi, "") 
        .replace(/update/gi, "") 
        .replace(/delete/gi, "") 
        .replace(/insert/gi, "")
        .replace(/drop/gi, "") 
        .replace(/alter/gi, "") 
        .replace(/from/gi, "") 
        .replace(/where/gi, ""); 
    
    return textoLimpio;
}

function validarEntrada(texto) {
    if (!texto) return true;
    
    const patronesPeligrosos = [
        /'.*OR.*'/i,
        /'.*=.*'/i,
        /--/,
        /;.*/,
        /\/\*/,
        /\*\//,
        /union\s+select/i,
        /select.*from/i,
        /delete.*from/i,
        /insert.*into/i,
        /drop\s+table/i,
        /alter\s+table/i
    ];
    
    for (const patron of patronesPeligrosos) {
        if (patron.test(texto)) {
            return false;
        }
    }
    
    return true;
}

function validarCamposMultiples(campos) {
    for (const [nombre, valor] of Object.entries(campos)) {
        if (valor && !validarEntrada(valor)) {
            return {
                valido: false,
                mensaje: `Se detectaron caracteres no permitidos en el campo: ${nombre}`
            };
        }
    }
    
    return { valido: true };
}

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
    console.log("Connected a MySQL");
    
   
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
            console.log('Table usuarios ready baby');
            
            con.query("SHOW COLUMNS FROM cantantes LIKE 'usuario_id'", (err, result) => {
                if (err) {
                    console.error('Error al verificar columna usuario_id:', err);
                    return;
                }
                
                if (result.length === 0) {
                    con.query(`
                        ALTER TABLE cantantes 
                        ADD COLUMN usuario_id INT
                    `, (err, result) => {
                        if (err) {
                            console.error('Error al añadir columna usuario_id:', err);
                        } else {
                            console.log('Columna usuario_id añadida correctamente');
                            addForeignKeyConstraint();
                        }
                    });
                } else {
                    console.log('The column usuario_id already exist honey');
                    addForeignKeyConstraint();
                }
            });
        }
    });
    
    function addForeignKeyConstraint() {
        con.query(`
            SELECT COUNT(*) AS constraint_exists
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE CONSTRAINT_NAME = 'fk_usuario' 
            AND TABLE_NAME = 'cantantes'
        `, (err, result) => {
            if (err) {
                console.error('Error al verificar restricción:', err);
                return;
            }
            
            if (result[0].constraint_exists === 0) {
                con.query(`
                    ALTER TABLE cantantes 
                    ADD CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
                `, (err, result) => {
                    if (err) {
                        console.error('Error al añadir restricción:', err);
                    } else {
                        console.log('Restricción de clave foránea añadida');
                    }
                });
            } else {
                console.log('La restricción already exist mon amour');
            }
        });
    }
});


const JWT_SECRET = 'clave_secreta_para_jwt_cantantes_app';

function verificarToken(req, res, next) {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ exito: false, mensaje: 'No hay token, autorización denegada' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        con.query('SELECT id, nombre, usuario FROM usuarios WHERE id = ?', [decoded.usuario.id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(401).json({ exito: false, mensaje: 'Usuario no encontrado' });
            }
            
            req.usuario = results[0];
            req.usuario.esAdmin = req.usuario.usuario === 'admin';
            next();
        });
    } catch (error) {
        res.status(401).json({ exito: false, mensaje: 'Token no válido' });
    }
}


app.post('/api/registro', async (req, res) => {
    const { nombre, apellido, usuario, email, contrasena } = req.body;
    
    const validacion = validarCamposMultiples({
        nombre, apellido, usuario, email
    });
    
    if (!validacion.valido) {
        return res.status(400).json({ exito: false, mensaje: validacion.mensaje });
    }
    
    if (!nombre || !apellido || !usuario || !email || !contrasena) {
        return res.status(400).json({ exito: false, mensaje: 'Por favor, complete todos los campos' });
    }
    
    try {
        const nombreLimpio = limpiarTexto(nombre);
        const apellidoLimpio = limpiarTexto(apellido);
        const usuarioLimpio = limpiarTexto(usuario);
        const emailLimpio = limpiarTexto(email);
        
        con.query('SELECT * FROM usuarios WHERE usuario = ? OR email = ?', [usuarioLimpio, emailLimpio], async (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ exito: false, mensaje: 'El usuario o email ya está registrado' });
            }
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasena, salt);
            
            const insertQuery = 'INSERT INTO usuarios (nombre, apellido, usuario, email, contrasena) VALUES (?, ?, ?, ?, ?)';
            con.query(insertQuery, [nombreLimpio, apellidoLimpio, usuarioLimpio, emailLimpio, hashedPassword], (err, result) => {
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

app.post('/api/login', (req, res) => {
    const { usuarioEmail, contrasena } = req.body;
    
    const validacion = validarCamposMultiples({
        usuarioEmail
    });
    
    if (!validacion.valido) {
        return res.status(400).json({ exito: false, mensaje: validacion.mensaje });
    }
    
    if (!usuarioEmail || !contrasena) {
        return res.status(400).json({ exito: false, mensaje: 'Por favor, complete todos los campos' });
    }
    
    try {
        const usuarioEmailLimpio = limpiarTexto(usuarioEmail);
        
        const query = 'SELECT * FROM usuarios WHERE usuario = ? OR email = ?';
        con.query(query, [usuarioEmailLimpio, usuarioEmailLimpio], async (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
            }
            
            if (results.length === 0) {
                return res.status(400).json({ exito: false, mensaje: 'Credenciales inválidas' });
            }
            
            const usuario = results[0];
            
            const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);
            if (!isMatch) {
                return res.status(400).json({ exito: false, mensaje: 'Credenciales inválidas' });
            }
            
            const payload = {
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    usuario: usuario.usuario,
                    esAdmin: usuario.usuario === 'admin'
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
                            usuario: usuario.usuario,
                            esAdmin: usuario.usuario === 'admin'
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

app.get('/api/usuario', verificarToken, (req, res) => {
    try {
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

app.get("/obtenerCantantes", verificarToken, (req, res) => {
    const usuarioId = req.usuario.id;
    const isAdmin = req.usuario.esAdmin;

    const query = isAdmin 
        ? "SELECT c.*, u.usuario as creador FROM cantantes c LEFT JOIN usuarios u ON c.usuario_id = u.id" 
        : "SELECT * FROM cantantes WHERE usuario_id = ?";
    
    const params = isAdmin ? [] : [usuarioId];
    
    con.query(query, params, (err, results) => {
        if (err) {
            console.error("Error al obtener cantantes:", err);
            return res.status(500).json({ error: "Error al obtener datos" });
        }
        res.json(results);
    });
});

app.post("/agregarCantante", verificarToken, (req, res) => {
    let { nombre, nombre_artistico, genero, pais, edad, anos_carrera, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita } = req.body;
    const usuarioId = req.usuario.id;
    
    const validacion = validarCamposMultiples({
        nombre, nombre_artistico, genero, pais, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita
    });
    
    if (!validacion.valido) {
        return res.status(400).json({ error: validacion.mensaje });
    }
    
    if (!nombre || !nombre_artistico || !genero || !pais || !edad || !anos_carrera) {
        return res.status(400).json({ error: "Todos los campos requeridos deben estar llenos" });
    }

    let query = "INSERT INTO cantantes (nombre, nombre_artistico, genero, pais, edad, anos_carrera, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    let values = [
        limpiarTexto(nombre), 
        limpiarTexto(nombre_artistico), 
        limpiarTexto(genero), 
        limpiarTexto(pais), 
        edad, 
        anos_carrera, 
        limpiarTexto(discografia), 
        limpiarTexto(redes_sociales), 
        limpiarTexto(premios), 
        limpiarTexto(situacion_amorosa), 
        limpiarTexto(cancion_favorita),
        usuarioId
    ];

    con.query(query, values, (err) => {
        if (err) {
            console.error("Error al agregar cantante:", err);
            return res.status(500).json({ error: "Error al agregar cantante" });
        }
        res.json({ mensaje: "Cantante agregado correctamente" });
    });
});

app.post("/actualizarCantante", verificarToken, (req, res) => {
    let { id, nombre, nombre_artistico, genero, pais, edad, anos_carrera, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita } = req.body;
    const usuarioId = req.usuario.id;
    const isAdmin = req.usuario.esAdmin;
    
    const validacion = validarCamposMultiples({
        nombre, nombre_artistico, genero, pais, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita
    });
    
    if (!validacion.valido) {
        return res.status(400).json({ error: validacion.mensaje });
    }
    
    const checkOwnershipQuery = "SELECT usuario_id FROM cantantes WHERE id = ?";
    
    con.query(checkOwnershipQuery, [id], (err, results) => {
        if (err) {
            console.error("Error al verificar propiedad:", err);
            return res.status(500).json({ error: "Error del servidor" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Cantante no encontrado" });
        }
        
        const cantanteUsuarioId = results[0].usuario_id;
        
        if (!isAdmin && cantanteUsuarioId !== usuarioId) {
            return res.status(403).json({ error: "No tienes permiso para editar este cantante" });
        }
        
        let query = "UPDATE cantantes SET nombre=?, nombre_artistico=?, genero=?, pais=?, edad=?, anos_carrera=?, discografia=?, redes_sociales=?, premios=?, situacion_amorosa=?, cancion_favorita=? WHERE id=?";
        let values = [
            limpiarTexto(nombre), 
            limpiarTexto(nombre_artistico), 
            limpiarTexto(genero), 
            limpiarTexto(pais), 
            edad, 
            anos_carrera, 
            limpiarTexto(discografia), 
            limpiarTexto(redes_sociales), 
            limpiarTexto(premios), 
            limpiarTexto(situacion_amorosa), 
            limpiarTexto(cancion_favorita), 
            id
        ];

        con.query(query, values, (err) => {
            if (err) {
                console.error("Error al actualizar cantante:", err);
                return res.status(500).json({ error: "Error al actualizar cantante" });
            }
            res.json({ mensaje: "Cantante actualizado correctamente" });
        });
    });
});

app.post("/eliminarCantante", verificarToken, (req, res) => {
    let { id } = req.body;
    const usuarioId = req.usuario.id;
    const isAdmin = req.usuario.esAdmin;

    if (isAdmin) {
        con.query("DELETE FROM cantantes WHERE id=?", [id], (err) => {
            if (err) {
                console.error("Error al eliminar cantante:", err);
                return res.status(500).json({ error: "Error al eliminar cantante" });
            }
            res.json({ mensaje: "Cantante eliminado correctamente" });
        });
    } else {
        con.query("DELETE FROM cantantes WHERE id=? AND usuario_id=?", [id, usuarioId], (err, result) => {
            if (err) {
                console.error("Error al eliminar cantante:", err);
                return res.status(500).json({ error: "Error al eliminar cantante" });
            }
            
            if (result.affectedRows === 0) {
                return res.status(403).json({ error: "No tienes permiso para eliminar este cantante" });
            }
            
            res.json({ mensaje: "Cantante eliminado correctamente" });
        });
    }
});

app.listen(3000, () => {
    console.log("Servidor corriendo in the port: 3000");
});