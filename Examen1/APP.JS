const express = require("express");
const mysql = require("mysql2");
var bodyParser=require('body-parser');
const cors = require("cors");
const path = require('path');
const xss = require("xss");
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
});


const limpiarTexto = (texto) => xss(texto).replace(/<[^>]*>?/g, '').trim().substring(0, 255);

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

app.listen(3000, () => {
    console.log("Servidor corriendo in the port: 3000");
});
