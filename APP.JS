const express = require("express")
const mysql= require("mysql2")
var bodyParser=require('body-parser')
var app=express()
var con=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'n0m3l0',
    database:'6IV8'
})
con.connect();

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended:true
}))

app.use(express.static('public'))

app.post('/agregarUsuario',(req,res)=>{
        let nombre=req.body.nombre
        let id=req.body.id

        con.query('INSERT INTO usuario (id, nombre) VALUES (?, ?)', [id, nombre], (err, respuesta, fields) => {
            if (err) {
                console.log("Error al conectar", err);
                return res.status(500).send("Error al conectar");
            }
           
            return res.send(`<h1>Nombre:</h1> ${nombre}`);
        });
   
})
app.get('/obtenerUsuario',(req,res)=>{
    con.query('SELECT * FROM usuario', (err, results) => {
        if (err) {
            console.log("Error al consultar usuarios", err);
            return res.status(500).send("Error al consultar usuarios");
        }
       
        return res.send(results);
    });

})


app.listen(8000,()=>{
    console.log('Servidor escuchando en el puerto 8000')
})

