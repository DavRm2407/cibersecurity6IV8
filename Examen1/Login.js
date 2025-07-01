document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formularioLogin');
    const mensajeDiv = document.getElementById('mensaje');
    
    // Verificar si ya hay token almacenado
    if (localStorage.getItem('token')) {
        window.location.href = 'panel.html';
    }
    
    formulario.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const usuarioEmail = document.getElementById('usuarioEmail').value;
        const contrasena = document.getElementById('contrasena').value;
        
        // Validación básica
        if (!usuarioEmail || !contrasena) {
            mostrarMensaje('Por favor, completa todos los campos.', 'error');
            return;
        }
        
        // Validar contraseña con criterios de seguridad
        const validacionContrasena = validarContrasena(contrasena);
        if (!validacionContrasena.valida) {
            mostrarMensaje(`Error en contraseña: ${validacionContrasena.errores.join(', ')}`, 'error');
            return;
        }
        
        try {
            // CIFRAR LA CONTRASEÑA ANTES DE ENVIAR
            const contrasenaCifrada = cifrarContrasena(contrasena);
            console.log('🔐 Contraseña cifrada para envío');
            
            const datos = {
                usuario: usuarioEmail,        // ✅ CORREGIDO: cambié 'usuarioEmail' por 'usuario'
                contrasena: contrasenaCifrada,
                esCifrada: true
            };
            
            // Mostrar loading
            mostrarMensaje('Verificando credenciales...', 'info');
            
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
                    
                    // Guardar token y datos del usuario
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('usuario', JSON.stringify(data.usuario));
                    
                    console.log('✅ Login exitoso, redirigiendo...');
                    
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
                console.error('❌ Error de conexión:', error);
            });
            
        } catch (error) {
            mostrarMensaje('Error al procesar la contraseña. Intenta nuevamente.', 'error');
            console.error('❌ Error en cifrado:', error);
        }
    });
    
    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.style.display = 'block';
        
        // Limpiar clases anteriores
        mensajeDiv.classList.remove('error', 'exito', 'info');
        
        // Agregar clase del tipo de mensaje
        mensajeDiv.classList.add(tipo);
        
        // Scroll suave al mensaje
        mensajeDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-ocultar mensajes info después de 3 segundos
        if (tipo === 'info') {
            setTimeout(() => {
                mensajeDiv.style.display = 'none';
            }, 3000);
        }
    }
});

// Función para mostrar/ocultar contraseña (opcional)
function togglePassword() {
    const passwordInput = document.getElementById('contrasena');
    const toggleButton = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

// Event listener para el formulario de login (por si tienes otro formulario)
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Formulario alternativo detectado');
});