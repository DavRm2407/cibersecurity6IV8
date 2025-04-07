document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formularioLogin');
    const mensajeDiv = document.getElementById('mensaje');
    
    // Verificar si hay una sesión activa
    if (localStorage.getItem('token')) {
        window.location.href = 'panel.html';
    }
    
    formulario.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Obtener los valores del formulario
        const usuarioEmail = document.getElementById('usuarioEmail').value;
        const contrasena = document.getElementById('contrasena').value;
        
        // Validar campos
        if (!usuarioEmail || !contrasena) {
            mostrarMensaje('Por favor, completa todos los campos.', 'error');
            return;
        }
        
        // Crear objeto con los datos
        const datos = {
            usuarioEmail: usuarioEmail,
            contrasena: contrasena
        };
        
        // Enviar datos al servidor Node.js
        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        })
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                mostrarMensaje(data.mensaje, 'exito');
                
                // Guardar token y datos de usuario
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                // Redirigir según el tipo de usuario (línea 34 modificada)
                setTimeout(function() {
                    if (data.usuario.usuario === 'admin') {
                        window.location.href = 'panel.html'; // Admin va al panel
                    } else {
                        window.location.href = 'Crud.html'; // Usuario normal va a la página de CRUD
                    }
                }, 1000);
            } else {
                mostrarMensaje(data.mensaje, 'error');
            }
        })
        .catch(error => {
            mostrarMensaje('Error al conectar con el servidor. Por favor, intenta más tarde.', 'error');
            console.error('Error:', error);
        });
    });
    
    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.style.display = 'block';
        
        // Eliminar clases previas
        mensajeDiv.classList.remove('error', 'exito');
        
        // Agregar clase según el tipo
        mensajeDiv.classList.add(tipo);
        
        // Hacer scroll hacia el mensaje
        mensajeDiv.scrollIntoView({ behavior: 'smooth' });
    }
});

// Eliminar o comentar el segundo manejador de eventos que está duplicado
/* 
document.getElementById('loginForm').addEventListener('submit', function(e) {
    // Este segundo manejador está causando conflictos y debe eliminarse
    // ...
});
*/