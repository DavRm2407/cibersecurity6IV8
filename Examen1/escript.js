$(document).ready(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        $("#tablaCantantes").html('<tr><td colspan="13" style="text-align:center">Debes iniciar sesión para ver y gestionar cantantes</td></tr>');
        $("#formAgregar").hide();
    } else {
        cargarCantantes();
        $("#formAgregar").show();
    }
    
    const usuarioJSON = localStorage.getItem('usuario');
    
    if (token && usuarioJSON) {
        const usuario = JSON.parse(usuarioJSON);
        $('.login-options').hide();
        $('.user-info').show();
        $('#username').text(usuario.nombre || usuario.usuario);
        
        $('#logout-link').click(function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.reload();
        });
    }
    
    
    function verificarAutenticacion() {
        if (!token) {
            alert('Debe iniciar sesión para realizar esta acción');
            window.location.href = 'Login.html';
            return false;
        }
        return true;
    }
    
    $("#formAgregar").submit(function (e) {
        e.preventDefault();
        
        if (!verificarAutenticacion()) return;
        
    });
    
    window.eliminarCantante = function (id) {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert("Debes iniciar sesión para eliminar cantantes");
            window.location.href = 'Login.html';
            return;
        }
        
        if (confirm("¿Seguro que quieres eliminar este cantante?")) {
            $.ajax({
                url: "http://localhost:3000/eliminarCantante",
                type: "POST",
                headers: {
                    'x-auth-token': token
                },
                data: { id: id },
                success: function(response) {
                    alert("Cantante eliminado correctamente");
                    cargarCantantes();
                },
                error: function(err) {
                    if (err.status === 401) {
                        alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
                        localStorage.removeItem('token');
                        localStorage.removeItem('usuario');
                        window.location.href = 'Login.html';
                    } else {
                        alert("Error al eliminar cantante: " + (err.responseJSON?.error || err.statusText));
                    }
                }
            });
        }
    };
$(document).ready(() => {
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
                });
                $("#tablaCantantes").html(filas);
            }
        });
    }
    
    $("#formAgregar").submit(function (e) {
        e.preventDefault();
            
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
  
    
});
function cargarCantantes() {
    const token = localStorage.getItem('token');
    const usuarioJSON = localStorage.getItem('usuario');
    const usuario = usuarioJSON ? JSON.parse(usuarioJSON) : null;
    const esAdmin = usuario && usuario.esAdmin;
    
    $.ajax({
        url: "http://localhost:3000/obtenerCantantes",
        type: "GET",
        headers: {
            'x-auth-token': token
        },
        success: function(data) {
            let filas = "";
            
            if (data.length === 0) {
                const mensaje = esAdmin 
                    ? "No hay cantantes registrados en el sistema."
                    : "No has agregado ningún cantante aún.";
                    
                $("#tablaCantantes").html(`<tr><td colspan="13" style="text-align:center">${mensaje}</td></tr>`);
                return;
            }
            
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
                        <td>`;
                
                if (esAdmin && cantante.creador) {
                    filas += `<small>Creado por: ${cantante.creador}</small><br>`;
                }
                
                filas += `
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
        },
        error: function(err) {
            console.error("Error al cargar cantantes:", err);
            alert("Error al cargar cantantes: " + (err.responseJSON?.error || err.statusText));
        }
    });
}
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
    ;
    
    $("#formAgregar").submit(function (e) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
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
            $.ajax({
                url: "http://localhost:3000/actualizarCantante",
                type: "POST",
                headers: {
                    'x-auth-token': token
                },
                data: datos,
                success: function(response) {
                    console.log("Cantante actualizado:", response);
                    cargarCantantes();
                    $("#formAgregar")[0].reset();
                    $("#id").val("");
                },
                error: function(err) {
                    console.error("Error al actualizar cantante:", err);
                    alert("Error al actualizar cantante: " + (err.responseJSON?.error || err.statusText));
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
                success: function(response) {
                    console.log("Cantante agregado:", response);
                    cargarCantantes();
                    $("#formAgregar")[0].reset();
                },
                error: function(err) {
                    console.error("Error al agregar cantante:", err);
                    alert("Error al agregar cantante: " + (err.responseJSON?.error || err.statusText));
                }
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
        $("#discografia").val(discografia);
        $("#redes_sociales").val(redes_sociales);
        $("#premios").val(premios);
        $("#situacion_amorosa").val(situacion_amorosa);
        $("#cancion_favorita").val(cancion_favorita);
    };

    function cargarCantantes() {
        const token = localStorage.getItem('token');
        $.ajax({
            url: "http://localhost:3000/obtenerCantantes",
            type: "GET",
            headers: {
                'x-auth-token': token
            },
            success: function(data) {
            },
            error: function(err) {
                console.error("Error al cargar cantantes:", err);
            }
        });
    }

    cargarCantantes();
});