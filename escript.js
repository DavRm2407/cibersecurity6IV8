$(document).ready(() => {
    function cargarCantantes() {
        $.get("/obtenerCantantes", (data) => {
            let filas = "";
            data.forEach(cantante => {
                filas += `<tr><td>${cantante.id}</td><td>${cantante.nombre}</td><td><button onclick="eliminarCantante(${cantante.id})">Eliminar</button></td></tr>`;
            });
            $("#tablaCantantes").html(filas);
        });
    }
    
    $("#formAgregar").submit(function (e) {
        e.preventDefault();
        let datos = { nombre: $("#nombre").val() };
        $.post("/agregarCantante", datos, cargarCantantes);
    });

    cargarCantantes();
});
