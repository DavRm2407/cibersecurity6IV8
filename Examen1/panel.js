document.addEventListener('DOMContentLoaded', function() {
    const nombreUsuarioSpan = document.getElementById('nombreUsuario');
    const usuarioNombreSpan = document.getElementById('usuarioNombre');
    const usuarioIdSpan = document.getElementById('usuarioId');
    const cerrarSesionBtn = document.getElementById('cerrarSesion');
    
    // Verificar si hay una sesión activa
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }
    
    // Obtener datos del usuario del localStorage
    const usuarioJSON = localStorage.getItem('usuario');
    if (usuarioJSON) {
        const usuario = JSON.parse(usuarioJSON);
        nombreUsuarioSpan.textContent = usuario.nombre;
        usuarioNombreSpan.textContent = usuario.usuario;
        usuarioIdSpan.textContent = usuario.id;
    }
    
    // Cargar información actualizada del usuario
    cargarInfoUsuario();
    
    // Evento para cerrar sesión
    cerrarSesionBtn.addEventListener('click', function() {
        cerrarSesion();
    });
    
    function cargarInfoUsuario() {
        fetch('http://localhost:3000/api/usuario', {
            method: 'GET',
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Sesión expirada o inválida');
            }
            return response.json();
        })
        .then(data => {
            if (data.exito) {
                const usuario = data.usuario;
                nombreUsuarioSpan.textContent = usuario.nombre;
                usuarioNombreSpan.textContent = usuario.usuario;
                usuarioIdSpan.textContent = usuario.id;
                
                // Actualizar datos en localStorage
                localStorage.setItem('usuario', JSON.stringify({
                    id: usuario.id,
                    nombre: usuario.nombre,
                    usuario: usuario.usuario
                }));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Manejar el error - sesión expirada o inválida
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            alert('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
            window.location.href = 'login.html';
        });
    }
    
    function cerrarSesion() {
        // Eliminar datos de sesión del localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        // Redireccionar al login
        window.location.href = 'login.html';
    }
});