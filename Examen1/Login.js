document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formularioLogin');
    const mensajeDiv = document.getElementById('mensaje');
    
    if (localStorage.getItem('token')) {
        window.location.href = 'panel.html';
    }
    
    formulario.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const usuarioEmail = document.getElementById('usuarioEmail').value;
        const contrasena = document.getElementById('contrasena').value;
        
        if (!usuarioEmail || !contrasena) {
            mostrarMensaje('Por favor, completa todos los campos.', 'error');
            return;
        }
        
        const datos = {
            usuarioEmail: usuarioEmail,
            contrasena: contrasena
        };
        
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
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                setTimeout(function() {
                    if (data.usuario.usuario === 'admin') {
                        window.location.href = 'panel.html'; 
                    } else {
                        window.location.href = 'Crud.html'; 
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
        
        mensajeDiv.classList.remove('error', 'exito');
        
        mensajeDiv.classList.add(tipo);
        
        mensajeDiv.scrollIntoView({ behavior: 'smooth' });
    }
});


document.getElementById('loginForm').addEventListener('submit', function(e) {
 
});
