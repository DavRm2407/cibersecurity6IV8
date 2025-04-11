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
    
    function limpiarTexto(texto) {
        if (!texto) return "";
        
        let textoLimpio = texto.replace(/<[^>]*>?/g, '').trim();
        
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
    
    $("#formAgregar").submit(function (e) {
        e.preventDefault();
        
        if (!verificarAutenticacion()) return;
        
        const nombre = $("#nombre").val();
        const nombre_artistico = $("#nombre_artistico").val();
        const genero = $("#genero").val();
        const pais = $("#pais").val();
        const discografia = $("#discografia").val();
        const redes_sociales = $("#redes_sociales").val();
        const premios = $("#premios").val();
        const situacion_amorosa = $("#situacion_amorosa").val();
        const cancion_favorita = $("#cancion_favorita").val();
        
        const camposAValidar = [nombre, nombre_artistico, genero, pais, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita];
        
        for (const campo of camposAValidar) {
            if (campo && !validarEntrada(campo)) {
                alert("Se detectaron caracteres no permitidos en uno de los campos. Por favor, revise su entrada.");
                return;
            }
        }
    
        let datos = { 
            id: $("#id").val(),
            nombre: limpiarTexto(nombre),
            nombre_artistico: limpiarTexto(nombre_artistico),
            genero: limpiarTexto(genero),
            pais: limpiarTexto(pais),
            edad: parseInt($("#edad").val()) || 0,
            anos_carrera: parseInt($("#anos_carrera").val()) || 0,
            discografia: limpiarTexto(discografia),
            redes_sociales: limpiarTexto(redes_sociales),
            premios: limpiarTexto(premios),
            situacion_amorosa: limpiarTexto(situacion_amorosa),
            cancion_favorita: limpiarTexto(cancion_favorita)
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
    
    window.cargarFormulario = function (id, nombre, nombre_artistico, genero, pais, edad, anos_carrera, discografia, redes_sociales, premios, situacion_amorosa, cancion_favorita) {
        $("#id").val(id);
        $("#nombre").val(limpiarTexto(nombre));
        $("#nombre_artistico").val(limpiarTexto(nombre_artistico));
        $("#genero").val(limpiarTexto(genero));
        $("#pais").val(limpiarTexto(pais));
        $("#edad").val(edad);
        $("#anos_carrera").val(anos_carrera);
        $("#discografia").val(limpiarTexto(discografia));
        $("#redes_sociales").val(limpiarTexto(redes_sociales));
        $("#premios").val(limpiarTexto(premios));
        $("#situacion_amorosa").val(limpiarTexto(situacion_amorosa));
        $("#cancion_favorita").val(limpiarTexto(cancion_favorita));
    };
    
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
                    const nombre_seguro = limpiarTexto(cantante.nombre || '');
                    const nombre_artistico_seguro = limpiarTexto(cantante.nombre_artistico || '');
                    const genero_seguro = limpiarTexto(cantante.genero || '');
                    const pais_seguro = limpiarTexto(cantante.pais || '');
                    const discografia_seguro = limpiarTexto(cantante.discografia || '');
                    const redes_sociales_seguro = limpiarTexto(cantante.redes_sociales || '');
                    const premios_seguro = limpiarTexto(cantante.premios || '');
                    const situacion_amorosa_seguro = limpiarTexto(cantante.situacion_amorosa || '');
                    const cancion_favorita_seguro = limpiarTexto(cantante.cancion_favorita || '');
                    
                    filas += `
                        <tr>
                            <td>${cantante.id}</td>
                            <td>${nombre_seguro}</td>
                            <td>${nombre_artistico_seguro}</td>
                            <td>${genero_seguro}</td>
                            <td>${pais_seguro}</td>
                            <td>${cantante.edad || ''}</td>
                            <td>${cantante.anos_carrera || ''}</td>
                            <td>${discografia_seguro}</td>
                            <td>${redes_sociales_seguro}</td>
                            <td>${premios_seguro}</td>
                            <td>${situacion_amorosa_seguro}</td>
                            <td>${cancion_favorita_seguro}</td>
                            <td>`;
                    
                    if (esAdmin && cantante.creador) {
                        filas += `<small>Creado por: ${limpiarTexto(cantante.creador)}</small><br>`;
                    }
                    
                    filas += `
                                <button onclick="cargarFormulario(
                                    ${cantante.id}, 
                                    '${cantante.nombre?.replace(/'/g, "\\'") || ''}', 
                                    '${cantante.nombre_artistico?.replace(/'/g, "\\'") || ''}', 
                                    '${cantante.genero?.replace(/'/g, "\\'") || ''}', 
                                    '${cantante.pais?.replace(/'/g, "\\'") || ''}', 
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
                
                if (err.status === 401) {
                    alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuario');
                    window.location.href = 'Login.html';
                } else {
                    alert("Error al cargar cantantes: " + (err.responseJSON?.error || err.statusText));
                }
            }
        });
    }

    if (token) {
        cargarCantantes();
    }
});