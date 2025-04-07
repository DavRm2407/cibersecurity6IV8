document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formularioRegistro');
    const mensajeDiv = document.getElementById('mensaje');
    
    if (localStorage.getItem('token')) {
        window.location.href = 'panel.html';
    }
    
    formulario.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const usuario = document.getElementById('usuario').value;
        const email = document.getElementById('email').value;
        const contrasena = document.getElementById('contrasena').value;
        
        if (!nombre || !apellido || !usuario || !email || !contrasena) {
            mostrarMensaje('Por favor, completa todos los campos.', 'error');
            return;
        }
        
        const datos = {
            nombre: nombre,
            apellido: apellido,
            usuario: usuario,
            email: email,
            contrasena: contrasena
        };
        
        fetch('http://localhost:3000/api/registro', {
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
                formulario.reset();
                
                setTimeout(function() {
                    window.location.href = 'login.html';
                }, 2000);
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