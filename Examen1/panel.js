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
    let usuario;
    
    if (usuarioJSON) {
        usuario = JSON.parse(usuarioJSON);
        
        // Verificar si es administrador
        if (usuario.usuario !== 'admin') {
            alert('Solo los administradores pueden acceder al panel de control');
            window.location.href = 'Crud.html'; // Redirigir a usuarios normales
            return;
        }
        
        // Si es admin, mostrar información
        nombreUsuarioSpan.textContent = usuario.nombre || usuario.usuario;
        usuarioNombreSpan.textContent = usuario.usuario;
        usuarioIdSpan.textContent = usuario.id;
    }
    
    // Cargar información actualizada del usuario
    cargarInfoUsuario();
    
    // Cargar los cantantes en el panel
    cargarCantantes();
   
});
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
        
        // Verificar si es administrador
        if (usuario.usuario !== 'admin') {
            alert('Solo los administradores pueden acceder al panel de control');
            window.location.href = 'crud.html';
            return;
        }
    }
    
    // Cargar información actualizada del usuario
    cargarInfoUsuario();
    
    // Cargar los cantantes en el panel
    cargarCantantes();
    
    // Evento para cerrar sesión
    cerrarSesionBtn.addEventListener('click', function() {
        cerrarSesion();
    });
    
    function cargarInfoUsuario() {
        // Tu código existente...
    }
    
    function cargarCantantes() {
        fetch('http://localhost:3000/obtenerCantantes', {
            method: 'GET',
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar cantantes');
            }
            return response.json();
        })
        .then(cantantes => {
            // Crear tabla de cantantes
            const cantantesDiv = document.querySelector('.gestion-cantantes') || 
                                document.querySelector('div h3:contains("Gestión de cantantes")').parentNode;
            
            let tablaHTML = `
                <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Nombre Artístico</th>
                            <th>Género</th>
                            <th>País</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            cantantes.forEach(cantante => {
                tablaHTML += `
                    <tr>
                        <td>${cantante.id}</td>
                        <td>${cantante.nombre || ''}</td>
                        <td>${cantante.nombre_artistico || ''}</td>
                        <td>${cantante.genero || ''}</td>
                        <td>${cantante.pais || ''}</td>
                    </tr>
                `;
            });
            
            tablaHTML += `
                    </tbody>
                </table>
                <p><a href="crud.html" style="display: inline-block; margin-top: 15px; padding: 8px 16px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Ir a gestión completa</a></p>
            `;
            
            // Agregar la tabla al panel
            cantantesDiv.innerHTML += tablaHTML;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    function cerrarSesion() {
        
    }
});

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