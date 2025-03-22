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
                                ${cantante.edad || 0}, 
                                ${cantante.anos_carrera || 0},
                                '${cantante.discografia?.replace(/'/g, "\\'") || ''}',
                                '${cantante.redes_sociales?.replace(/'/g, "\\'") || ''}',
                                '${cantante.premios?.replace(/'/g, "\\'") || ''}',
                                '${cantante.situacion_amorosa?.replace(/'/g, "\\'") || ''}',
                                '${cantante.cancion_favorita?.replace(/'/g, "\\'") || ''}'
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

        function limpiarTexto(texto) {
            return texto.replace(/<[^>]*>?/g, '').trim(); 
        }

        let datos = { 
            id: $("#id").val(),
            nombre: limpiarTexto($("#nombre").val()),
            nombre_artistico: limpiarTexto($("#nombre_artistico").val()),
            genero: limpiarTexto($("#genero").val()),
            pais: limpiarTexto($("#pais").val()),
            edad: parseInt($("#edad").val()) || 0,
            anos_carrera: parseInt($("#anos_carrera").val()) || 0,
            discografia: limpiarTexto($("#discografia").val()),
            redes_sociales: limpiarTexto($("#redes_sociales").val()),
            premios: limpiarTexto($("#premios").val()),
            situacion_amorosa: limpiarTexto($("#situacion_amorosa").val()),
            cancion_favorita: limpiarTexto($("#cancion_favorita").val())
        };

        if (datos.id) {
            $.post("http://localhost:3000/actualizarCantante", datos, function () {
                cargarCantantes();
                $("#formAgregar")[0].reset();
                $("#id").val("");
            });
        } else {
            $.post("http://localhost:3000/agregarCantante", datos, function () {
                cargarCantantes();
                $("#formAgregar")[0].reset();
            });
        }
    });

    window.eliminarCantante = function (id) {
        if (confirm("¿Seguro que quieres eliminar este cantante?")) {
            $.post("http://localhost:3000/eliminarCantante", { id: id }, function () {
                cargarCantantes();
            });
        }
    };

    window.cargarFormulario = function (id, nombre, nombre_artistico, genero, pais, edad, anos_carrera, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita) {
        $("#id").val(id);
        $("#nombre").val(nombre);
        $("#nombre_artistico").val(nombre_artistico);
        $("#genero").val(genero);
        $("#pais").val(pais);
        $("#edad").val(edad);
        $("#anos_carrera").val(anos_carrera);
        $("#discografia").val(discografia);
        $("#redes_sociales").val(redes_sociales);
        $("#premios").val(premios);
        $("#situacion_amorosa").val(situacion_amorosa);
        $("#cancion_favorita").val(cancion_favorita);
    };

    cargarCantantes();
});