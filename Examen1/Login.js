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
                
                // Redirigir al panel después de un tiempo
                setTimeout(function() {
                    window.location.href = 'panel.html';
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
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const usuarioEmail = document.getElementById('usuarioEmail').value;
    const contrasena = document.getElementById('contrasena').value;
    
    // Enviar solicitud de login
    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuarioEmail, contrasena })
    })
    .then(response => response.json())
    .then(data => {
        if (data.exito) {
            // Guardar token y datos de usuario en localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            
            // Redirigir según el tipo de usuario
            if (data.usuario.usuario === 'admin') {
                window.location.href = 'panel.html'; // Admin va al panel
            } else {
                window.location.href = 'Crud.html'; // Usuario normal va a la página de CRUD
            }
        } else {
            alert('Error: ' + data.mensaje);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al iniciar sesión');
    });
});