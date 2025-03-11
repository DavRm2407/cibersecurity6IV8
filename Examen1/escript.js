$(document).ready(() => {
    function cargarCantantes() {
        $.get("http://localhost:3000/obtenerCantantes", (data) => {
            let filas = "";
            data.forEach(cantante => {
                filas += `
                    <tr>
                        <td>${cantante.id}</td>
                        <td>${cantante.nombre || ''}</td>
                        <td>${cantante.nombre_artistico || ''}</td>
                        <td>${cantante.genero || ''}</td>
                        <td>${cantante.pais || ''}</td>
                        <td>${cantante.edad || ''}</td>
                        <td>${cantante.anos_carrera || ''}</td>
                        <td>${cantante.discografia || ''}</td>
                        <td>${cantante.redes_sociales || ''}</td>
                        <td>${cantante.premios || ''}</td>
                        <td>${cantante.situacion_amorosa || ''}</td>
                        <td>${cantante.cancion_favorita || ''}</td>
                        <td>
                            <button onclick="cargarFormulario(
                                ${cantante.id}, 
                                '${cantante.nombre?.replace(/'/g, "\\'")}', 
                                '${cantante.nombre_artistico?.replace(/'/g, "\\'")}', 
                                '${cantante.genero?.replace(/'/g, "\\'")}', 
                                '${cantante.pais?.replace(/'/g, "\\'")}', 
                                ${cantante.edad}, 
                                ${cantante.anos_carrera},
                                '${cantante.discografia?.replace(/'/g, "\\'")}',
                                '${cantante.redes_sociales?.replace(/'/g, "\\'")}',
                                '${cantante.premios?.replace(/'/g, "\\'")}',
                                '${cantante.situacion_amorosa?.replace(/'/g, "\\'")}',
                                '${cantante.cancion_favorita?.replace(/'/g, "\\'")}'
                            )">✏️ Editar</button>
                            <button onclick="eliminarCantante(${cantante.id})">🗑️ Eliminar</button>
                        </td>
                    </tr>`;
            });
            $("#tablaCantantes").html(filas);
        });
    }
    
    $("#formAgregar").submit(function (e) {
        e.preventDefault();
        let datos = { 
            id: $("#id").val(),
            nombre: $("#nombre").val(),
            nombre_artistico: $("#nombre_artistico").val(),
            genero: $("#genero").val(),
            pais: $("#pais").val(),
            edad: $("#edad").val(),
            anos_carrera: $("#anos_carrera").val(),
            discografia: $("#discografia").val(),
            redes_sociales: $("#redes_sociales").val(),
            premios: $("#premios").val(),
            situacion_amorosa: $("#situacion_amorosa").val(),
            cancion_favorita: $("#cancion_favorita").val()
        };

        if (datos.id) {
            // Si hay ID, es una actualización
            $.post("http://localhost:3000/actualizarCantante", datos, function () {
                cargarCantantes();
                $("#formAgregar")[0].reset();
                $("#id").val("");
            });
        } else {
            // Si no hay ID, es un nuevo cantante
            $.post("http://localhost:3000/agregarCantante", datos, function () {
                cargarCantantes();
                $("#formAgregar")[0].reset();
            });
        }
    });

    window.cargarFormulario = function (id, nombre, nombre_artistico, genero, pais, edad, anos_carrera, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita) {
        $("#id").val(id);
        $("#nombre").val(nombre);
        $("#nombre_artistico").val(nombre_artistico);
        $("#genero").val(genero);
        $("#pais").val(pais);
        $("#edad").val(edad);
        $("#anos_carrera").val(anos_carrera);
        $("#discografia").val(discografia || '');
        $("#redes_sociales").val(redes_sociales || '');
        $("#premios").val(premios || '');
        $("#situacion_amorosa").val(situacion_amorosa || '');
        $("#cancion_favorita").val(cancion_favorita || '');
    };

    window.eliminarCantante = function (id) {
        if (confirm("¿Seguro que quieres eliminar este cantante?")) {
            $.post("http://localhost:3000/eliminarCantante", { id }, function () {
                cargarCantantes();
            });
        }
    };

    cargarCantantes();
});