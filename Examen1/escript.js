$(document).ready(() => {
    // Obtener el token y usuario del localStorage
    const token = localStorage.getItem('token');
    const usuarioJSON = localStorage.getItem('usuario');
    
    // Mostrar información del usuario si está autenticado
    if (token && usuarioJSON) {
        const usuario = JSON.parse(usuarioJSON);
        $('.login-options').hide();
        $('.user-info').show();
        $('#username').text(usuario.nombre || usuario.usuario);
        
        // Actualizar el link de logout
        $('#logout-link').click(function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.reload();
        });
    }
    
    // Resto del código...
    
    // Función para verificar autenticación antes de realizar operaciones CRUD
    function verificarAutenticacion() {
        if (!token) {
            alert('Debe iniciar sesión para realizar esta acción');
            window.location.href = 'Login.html';
            return false;
        }
        return true;
    }
    
    // Modificar submit del formulario para verificar autenticación
    $("#formAgregar").submit(function (e) {
        e.preventDefault();
        
        if (!verificarAutenticacion()) return;
        
        // El resto del código para agregar/editar cantantes...
    });
    
    // También actualizar las funciones de eliminar y editar
    window.eliminarCantante = function (id) {
        if (!verificarAutenticacion()) return;
        
        if (confirm("¿Seguro que quieres eliminar este cantante?")) {
            // Código para eliminar...
        }
    };
    
    // Resto del código...
});
$(document).ready(() => {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    
    function cargarCantantes() {
        $.ajax({
            url: "http://localhost:3000/obtenerCantantes",
            type: "GET",
            headers: {
                'x-auth-token': token
            },
            success: function(data) {
                let filas = "";
                data.forEach(cantante => {
                    // El código existente para mostrar cantantes
                    // ...
                });
                $("#tablaCantantes").html(filas);
            }
        });
    }
    
    $("#formAgregar").submit(function (e) {
        e.preventDefault();
        
        // El resto del código para agregar/editar cantantes
        // ...
        
        if (datos.id) {
            $.ajax({
                url: "http://localhost:3000/actualizarCantante",
                type: "POST",
                headers: {
                    'x-auth-token': token
                },
                data: datos,
                success: function() {
                    cargarCantantes();
                    $("#formAgregar")[0].reset();
                    $("#id").val("");
                }
            });
        } else {
            $.ajax({
                url: "http://localhost:3000/agregarCantante",
                type: "POST",
                headers: {
                    'x-auth-token': token
                },
                data: datos,
                success: function() {
                    cargarCantantes();
                    $("#formAgregar")[0].reset();
                }
            });
        }
    });

    // También actualiza la función eliminarCantante de manera similar
    window.eliminarCantante = function (id) {
        if (confirm("¿Seguro que quieres eliminar este cantante?")) {
            $.ajax({
                url: "http://localhost:3000/eliminarCantante",
                type: "POST",
                headers: {
                    'x-auth-token': token
                },
                data: { id: id },
                success: function() {
                    cargarCantantes();
                }
            });
        }
    };
    
});
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