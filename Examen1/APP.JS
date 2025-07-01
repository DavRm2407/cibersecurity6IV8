const express = require("express");
const mysql = require("mysql2");
var bodyParser=require('body-parser');
const cors = require("cors");
const path = require('path');
const xss = require("xss");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const PORT = process.env.PORT || 3000;

// CONFIGURACIÓN AES PARA EL SERVIDOR
const AES_SECRET_KEY = 'MiClaveSecretaParaCifradoAES2024!';
const AES_ALGORITHM = 'aes-256-cbc';

// Funciones de cifrado AES para el servidor
function descifrarAES(textoCifrado) {
    try {
        const CryptoJS = require('crypto-js');
        const bytes = CryptoJS.AES.decrypt(textoCifrado, AES_SECRET_KEY);
        const textoOriginal = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!textoOriginal) {
            throw new Error('Error al descifrar');
        }
        
        return textoOriginal;
    } catch (error) {
        console.error('Error al descifrar AES:', error);
        throw new Error('Error en descifrado');
    }
}

function cifrarAES(texto) {
    try {
        const CryptoJS = require('crypto-js');
        const textoCifrado = CryptoJS.AES.encrypt(texto, AES_SECRET_KEY).toString();
        return textoCifrado;
    } catch (error) {
        console.error('Error al cifrar AES:', error);
        throw new Error('Error en cifrado');
    }
}

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
app.use(express.static(__dirname));

// Servir crypto-js desde node_modules
app.use('/crypto-js', express.static(path.join(__dirname, 'node_modules/crypto-js')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Crud.html'));
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
    
    // ✅ CORREGIDO: Tabla usuarios con las columnas correctas
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        apellido VARCHAR(50) NOT NULL,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        hash_bcrypt_inicio VARCHAR(255),
        cifrado_aes_inicio TEXT,
        longitud_hash INT DEFAULT 60,
        longitud_cifrado INT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
 
    con.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Error al crear la tabla usuarios:', err);
        } else {
            console.log('✅ Tabla usuarios creada/verificada correctamente');
            
            // Verificar si necesitamos añadir las nuevas columnas a usuarios existentes
            con.query("SHOW COLUMNS FROM usuarios LIKE 'cifrado_aes_inicio'", (err, result) => {
                if (err) {
                    console.error('Error al verificar columnas:', err);
                    return;
                }
                
                if (result.length === 0) {
                    console.log('📝 Añadiendo columnas de cifrado a tabla existente...');
                    const alterQuery = `
                        ALTER TABLE usuarios 
                        ADD COLUMN hash_bcrypt_inicio VARCHAR(255),
                        ADD COLUMN cifrado_aes_inicio TEXT,
                        ADD COLUMN longitud_hash INT DEFAULT 60,
                        ADD COLUMN longitud_cifrado INT
                    `;
                    
                    con.query(alterQuery, (err, result) => {
                        if (err) {
                            console.error('Error al añadir columnas:', err);
                        } else {
                            console.log('✅ Columnas de cifrado añadidas correctamente');
                        }
                    });
                }
            });
            
            // Verificar columna usuario_id en cantantes
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
                            console.log('✅ Columna usuario_id añadida correctamente');
                            addForeignKeyConstraint();
                        }
                    });
                } else {
                    console.log('✅ La columna usuario_id ya existe');
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
                        console.log('✅ Restricción de clave foránea añadida');
                    }
                });
            } else {
                console.log('✅ La restricción de clave foránea ya existe');
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

// ✅ REGISTRO CORREGIDO CON COLUMNAS ACTUALIZADAS
app.post('/api/registro', async (req, res) => {
    const { nombre, apellido, usuario, email, contrasena, esCifrada } = req.body;
    
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
        
        // Descifrar contraseña si viene cifrada desde el frontend
        let contrasenaParaProcesar = contrasena;
        if (esCifrada) {
            try {
                contrasenaParaProcesar = descifrarAES(contrasena);
                console.log('🔓 Contraseña descifrada en el servidor');
            } catch (error) {
                return res.status(400).json({ exito: false, mensaje: 'Error al procesar la contraseña' });
            }
        }
        
        con.query('SELECT * FROM usuarios WHERE usuario = ? OR email = ?', [usuarioLimpio, emailLimpio], async (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ exito: false, mensaje: 'El usuario o email ya está registrado' });
            }
            
            // Cifrar con bcrypt para la BD
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasenaParaProcesar, salt);
            
            // Guardar también la versión AES
            const contrasenaAES = cifrarAES(contrasenaParaProcesar);
            
            // ✅ CORREGIDO: Usar las columnas correctas
            const insertQuery = `
                INSERT INTO usuarios (
                    nombre, apellido, usuario, email, contrasena, 
                    hash_bcrypt_inicio, cifrado_aes_inicio, longitud_hash, longitud_cifrado
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const valores = [
                nombreLimpio, 
                apellidoLimpio, 
                usuarioLimpio, 
                emailLimpio, 
                hashedPassword,
                hashedPassword.substring(0, 50), // Primeros 50 chars del hash bcrypt
                contrasenaAES,
                hashedPassword.length,
                contrasenaAES.length
            ];
            
            con.query(insertQuery, valores, (err, result) => {
                if (err) {
                    console.error('Error al insertar usuario:', err);
                    return res.status(500).json({ exito: false, mensaje: 'Error al registrar usuario' });
                }
                
                console.log('✅ Usuario registrado exitosamente con cifrado AES');
                res.status(201).json({ 
                    exito: true, 
                    mensaje: 'Usuario registrado exitosamente',
                    usuario: {
                        id: result.insertId,
                        nombre: nombreLimpio,
                        apellido: apellidoLimpio,
                        usuario: usuarioLimpio,
                        email: emailLimpio
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
    }
});

// ✅ LOGIN CORREGIDO
app.post('/api/login', async (req, res) => {
    const { usuario, contrasena, esCifrada } = req.body;
    
    if (!usuario || !contrasena) {
        return res.status(400).json({ exito: false, mensaje: 'Por favor, ingrese usuario y contraseña' });
    }
    
    const validacion = validarCamposMultiples({ usuario });
    if (!validacion.valido) {
        return res.status(400).json({ exito: false, mensaje: validacion.mensaje });
    }
    
    try {
        const usuarioLimpio = limpiarTexto(usuario);
        
        // Descifrar contraseña si viene cifrada desde el frontend
        let contrasenaParaProcesar = contrasena;
        if (esCifrada) {
            try {
                contrasenaParaProcesar = descifrarAES(contrasena);
                console.log('🔓 Contraseña de login descifrada en el servidor');
            } catch (error) {
                return res.status(400).json({ exito: false, mensaje: 'Error al procesar la contraseña' });
            }
        }
        
        con.query('SELECT * FROM usuarios WHERE usuario = ?', [usuarioLimpio], async (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
            }
            
            if (results.length === 0) {
                return res.status(400).json({ exito: false, mensaje: 'Usuario no encontrado' });
            }
            
            const usuarioDB = results[0];
            
            // Verificar contraseña con bcrypt
            const contrasenaValida = await bcrypt.compare(contrasenaParaProcesar, usuarioDB.contrasena);
            
            if (!contrasenaValida) {
                return res.status(400).json({ exito: false, mensaje: 'Contraseña incorrecta' });
            }
            
            // Crear token JWT
            const payload = {
                usuario: {
                    id: usuarioDB.id,
                    nombre: usuarioDB.nombre,
                    usuario: usuarioDB.usuario,
                    esAdmin: usuarioDB.usuario === 'admin'
                }
            };
            
            jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) {
                    console.error('Error al generar token:', err);
                    return res.status(500).json({ exito: false, mensaje: 'Error al generar token' });
                }
                
                console.log('✅ Login exitoso para:', usuarioLimpio);
                res.json({
                    exito: true,
                    mensaje: 'Login exitoso',
                    token,
                    usuario: {
                        id: usuarioDB.id,
                        nombre: usuarioDB.nombre,
                        apellido: usuarioDB.apellido,
                        usuario: usuarioDB.usuario,
                        email: usuarioDB.email,
                        esAdmin: usuarioDB.usuario === 'admin'
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
    }
});

// VERIFICAR TOKEN
app.get('/api/verificar-token', verificarToken, (req, res) => {
    res.json({
        exito: true,
        usuario: {
            id: req.usuario.id,
            nombre: req.usuario.nombre,
            usuario: req.usuario.usuario,
            esAdmin: req.usuario.esAdmin
        }
    });
});

// CRUD DE CANTANTES CON CONTROL DE USUARIOS

// Obtener todos los cantantes
app.get('/api/cantantes', verificarToken, (req, res) => {
    let query = `
        SELECT c.*, u.nombre as nombre_usuario, u.usuario as username_usuario 
        FROM cantantes c 
        LEFT JOIN usuarios u ON c.usuario_id = u.id
    `;
    
    if (!req.usuario.esAdmin) {
        query += ` WHERE c.usuario_id = ?`;
        con.query(query, [req.usuario.id], (err, results) => {
            if (err) {
                console.error('Error al obtener cantantes:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
            }
            res.json({ exito: true, cantantes: results });
        });
    } else {
        con.query(query, (err, results) => {
            if (err) {
                console.error('Error al obtener cantantes:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
            }
            res.json({ exito: true, cantantes: results });
        });
    }
});

// Crear cantante
app.post('/api/cantantes', verificarToken, (req, res) => {
    const { nombre, apellido, genero, edad, foto } = req.body;
    
    const validacion = validarCamposMultiples({
        nombre, apellido, genero, edad: edad?.toString(), foto
    });
    
    if (!validacion.valido) {
        return res.status(400).json({ exito: false, mensaje: validacion.mensaje });
    }
    
    if (!nombre || !apellido || !genero || !edad) {
        return res.status(400).json({ exito: false, mensaje: 'Por favor, complete todos los campos obligatorios' });
    }
    
    const nombreLimpio = limpiarTexto(nombre);
    const apellidoLimpio = limpiarTexto(apellido);
    const generoLimpio = limpiarTexto(genero);
    const edadLimpia = parseInt(edad);
    const fotoLimpia = foto ? limpiarTexto(foto) : null;
    
    if (isNaN(edadLimpia) || edadLimpia < 1 || edadLimpia > 120) {
        return res.status(400).json({ exito: false, mensaje: 'La edad debe ser un número válido entre 1 y 120' });
    }
    
    const query = 'INSERT INTO cantantes (nombre, apellido, genero, edad, foto, usuario_id) VALUES (?, ?, ?, ?, ?, ?)';
    
    con.query(query, [nombreLimpio, apellidoLimpio, generoLimpio, edadLimpia, fotoLimpia, req.usuario.id], (err, result) => {
        if (err) {
            console.error('Error al crear cantante:', err);
            return res.status(500).json({ exito: false, mensaje: 'Error al crear cantante' });
        }
        
        console.log('✅ Cantante creado exitosamente por usuario:', req.usuario.usuario);
        res.status(201).json({
            exito: true,
            mensaje: 'Cantante creado exitosamente',
            cantante: {
                id: result.insertId,
                nombre: nombreLimpio,
                apellido: apellidoLimpio,
                genero: generoLimpio,
                edad: edadLimpia,
                foto: fotoLimpia,
                usuario_id: req.usuario.id
            }
        });
    });
});

// Actualizar cantante
app.put('/api/cantantes/:id', verificarToken, (req, res) => {
    const cantanteId = parseInt(req.params.id);
    const { nombre, apellido, genero, edad, foto } = req.body;
    
    if (isNaN(cantanteId)) {
        return res.status(400).json({ exito: false, mensaje: 'ID de cantante inválido' });
    }
    
    const validacion = validarCamposMultiples({
        nombre, apellido, genero, edad: edad?.toString(), foto
    });
    
    if (!validacion.valido) {
        return res.status(400).json({ exito: false, mensaje: validacion.mensaje });
    }
    
    let verificarQuery = 'SELECT * FROM cantantes WHERE id = ?';
    let verificarParams = [cantanteId];
    
    if (!req.usuario.esAdmin) {
        verificarQuery += ' AND usuario_id = ?';
        verificarParams.push(req.usuario.id);
    }
    
    con.query(verificarQuery, verificarParams, (err, results) => {
        if (err) {
            console.error('Error al verificar cantante:', err);
            return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Cantante no encontrado o no tiene permisos para editarlo' });
        }
        
        const nombreLimpio = limpiarTexto(nombre);
        const apellidoLimpio = limpiarTexto(apellido);
        const generoLimpio = limpiarTexto(genero);
        const edadLimpia = parseInt(edad);
        const fotoLimpia = foto ? limpiarTexto(foto) : null;
        
        if (isNaN(edadLimpia) || edadLimpia < 1 || edadLimpia > 120) {
            return res.status(400).json({ exito: false, mensaje: 'La edad debe ser un número válido entre 1 y 120' });
        }
        
        const updateQuery = 'UPDATE cantantes SET nombre = ?, apellido = ?, genero = ?, edad = ?, foto = ? WHERE id = ?';
        
        con.query(updateQuery, [nombreLimpio, apellidoLimpio, generoLimpio, edadLimpia, fotoLimpia, cantanteId], (err, result) => {
            if (err) {
                console.error('Error al actualizar cantante:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error al actualizar cantante' });
            }
            
            console.log('✅ Cantante actualizado exitosamente por usuario:', req.usuario.usuario);
            res.json({
                exito: true,
                mensaje: 'Cantante actualizado exitosamente',
                cantante: {
                    id: cantanteId,
                    nombre: nombreLimpio,
                    apellido: apellidoLimpio,
                    genero: generoLimpio,
                    edad: edadLimpia,
                    foto: fotoLimpia
                }
            });
        });
    });
});

// ✅ ELIMINAR CANTANTE - CÓDIGO COMPLETADO
app.delete('/api/cantantes/:id', verificarToken, (req, res) => {
    const cantanteId = parseInt(req.params.id);
    
    if (isNaN(cantanteId)) {
        return res.status(400).json({ exito: false, mensaje: 'ID de cantante inválido' });
    }
    
    let verificarQuery = 'SELECT * FROM cantantes WHERE id = ?';
    let verificarParams = [cantanteId];
    
    if (!req.usuario.esAdmin) {
        verificarQuery += ' AND usuario_id = ?';
        verificarParams.push(req.usuario.id);
    }
    
    con.query(verificarQuery, verificarParams, (err, results) => {
        if (err) {
            console.error('Error al verificar cantante:', err);
            return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Cantante no encontrado o no tiene permisos para eliminarlo' });
        }
        
        const deleteQuery = 'DELETE FROM cantantes WHERE id = ?';
        
        con.query(deleteQuery, [cantanteId], (err, result) => {
            if (err) {
                console.error('Error al eliminar cantante:', err);
                return res.status(500).json({ exito: false, mensaje: 'Error al eliminar cantante' });
            }
            
            console.log('✅ Cantante eliminado exitosamente por usuario:', req.usuario.usuario);
            res.json({
                exito: true,
                mensaje: 'Cantante eliminado exitosamente'
            });
        });
    });
});

// ✅ ENDPOINTS ADICIONALES PARA ADMINISTRACIÓN

// Obtener todos los usuarios (solo admin)
app.get('/api/usuarios', verificarToken, (req, res) => {
    if (!req.usuario.esAdmin) {
        return res.status(403).json({ exito: false, mensaje: 'No tiene permisos de administrador' });
    }
    
    const query = `
        SELECT id, nombre, apellido, usuario, email, fecha_registro,
               longitud_hash, longitud_cifrado
        FROM usuarios 
        ORDER BY fecha_registro DESC
    `;
    
    con.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
        }
        
        res.json({ exito: true, usuarios: results });
    });
});

// Obtener estadísticas del sistema (solo admin)
app.get('/api/estadisticas', verificarToken, (req, res) => {
    if (!req.usuario.esAdmin) {
        return res.status(403).json({ exito: false, mensaje: 'No tiene permisos de administrador' });
    }
    
    const promises = [
        new Promise((resolve, reject) => {
            con.query('SELECT COUNT(*) as total FROM usuarios', (err, result) => {
                if (err) reject(err);
                else resolve({ totalUsuarios: result[0].total });
            });
        }),
        new Promise((resolve, reject) => {
            con.query('SELECT COUNT(*) as total FROM cantantes', (err, result) => {
                if (err) reject(err);
                else resolve({ totalCantantes: result[0].total });
            });
        }),
        new Promise((resolve, reject) => {
            con.query(`
                SELECT u.usuario, COUNT(c.id) as cantantes_count 
                FROM usuarios u 
                LEFT JOIN cantantes c ON u.id = c.usuario_id 
                GROUP BY u.id, u.usuario 
                ORDER BY cantantes_count DESC
            `, (err, result) => {
                if (err) reject(err);
                else resolve({ usuariosCantantes: result });
            });
        })
    ];
    
    Promise.all(promises)
        .then(resultados => {
            const estadisticas = Object.assign({}, ...resultados);
            res.json({ exito: true, estadisticas });
        })
        .catch(error => {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({ exito: false, mensaje: 'Error al obtener estadísticas' });
        });
});

// ✅ ENDPOINT PARA PROBAR CIFRADO AES
app.post('/api/probar-cifrado', (req, res) => {
    const { texto } = req.body;
    
    if (!texto) {
        return res.status(400).json({ exito: false, mensaje: 'Se requiere un texto para cifrar' });
    }
    
    try {
        const textoCifrado = cifrarAES(texto);
        const textoDescifrado = descifrarAES(textoCifrado);
        
        res.json({
            exito: true,
            textoOriginal: texto,
            textoCifrado: textoCifrado,
            textoDescifrado: textoDescifrado,
            longitudOriginal: texto.length,
            longitudCifrado: textoCifrado.length,
            cifradoExitoso: texto === textoDescifrado
        });
    } catch (error) {
        console.error('Error en prueba de cifrado:', error);
        res.status(500).json({ exito: false, mensaje: 'Error en el proceso de cifrado' });
    }
});

// ✅ MANEJO DE ERRORES GLOBALES
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
});

// ✅ INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`🔐 Cifrado AES configurado correctamente`);
    console.log(`📊 Endpoints disponibles:`);
    console.log(`   - POST /api/registro (con cifrado AES)`);
    console.log(`   - POST /api/login (con cifrado AES)`);
    console.log(`   - GET  /api/verificar-token`);
    console.log(`   - GET  /api/cantantes`);
    console.log(`   - POST /api/cantantes`);
    console.log(`   - PUT  /api/cantantes/:id`);
    console.log(`   - DELETE /api/cantantes/:id`);
    console.log(`   - GET  /api/usuarios (admin only)`);
    console.log(`   - GET  /api/estadisticas (admin only)`);
    console.log(`   - POST /api/probar-cifrado`);
    console.log(`🔑 Clave AES: ${AES_SECRET_KEY.substring(0, 10)}...`);
    console.log(`💾 Base de datos: cantantes_db`);
});

// ✅ EXPORTAR FUNCIONES PARA TESTING (opcional)
module.exports = {
    app,
    cifrarAES,
    descifrarAES,
    limpiarTexto,
    validarEntrada,
    validarCamposMultiples
};