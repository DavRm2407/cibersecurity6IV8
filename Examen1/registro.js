document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formularioRegistro');
    const mensajeDiv = document.getElementById('mensaje');
    
    // Verificar si ya hay token almacenado
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
        const confirmarContrasena = document.getElementById('confirmarContrasena')?.value;
        
        // Validación básica
        if (!nombre || !apellido || !usuario || !email || !contrasena) {
            mostrarMensaje('Por favor, completa todos los campos.', 'error');
            return;
        }
        
        // Validar que las contraseñas coincidan (si existe campo de confirmación)
        if (confirmarContrasena && contrasena !== confirmarContrasena) {
            mostrarMensaje('Las contraseñas no coinciden.', 'error');
            return;
        }
        
        // Validar email básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mostrarMensaje('Por favor, ingresa un email válido.', 'error');
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
            console.log('🔐 Contraseña cifrada para registro');
            
            const datos = {
                nombre: nombre,
                apellido: apellido,
                usuario: usuario,
                email: email,
                contrasena: contrasenaCifrada, // Enviar la contraseña cifrada
                esCifrada: true // Indicar al servidor que viene cifrada
            };
            
            // Mostrar loading
            mostrarMensaje('Registrando usuario...', 'info');
            
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
                    mostrarMensaje(`${data.mensaje} Redirigiendo al login...`, 'exito');
                    formulario.reset();
                    
                    console.log('✅ Registro exitoso, redirigiendo...');
                    
                    setTimeout(function() {
                        window.location.href = 'login.html';
                    }, 2000);
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

// Función para mostrar fortaleza de contraseña en tiempo real
function mostrarFortalezaContrasena() {
    const passwordInput = document.getElementById('contrasena');
    const strengthDiv = document.getElementById('password-strength');
    
    if (!passwordInput || !strengthDiv) return;
    
    passwordInput.addEventListener('input', function() {
        const contrasena = this.value;
        
        if (!contrasena) {
            strengthDiv.style.display = 'none';
            return;
        }
        
        const validacion = validarContrasena(contrasena);
        const errores = validacion.errores.length;
        
        let nivel, color, texto;
        
        if (errores === 0) {
            nivel = 'fuerte';
            color = '#27ae60';
            texto = '✅ Contraseña fuerte';
        } else if (errores <= 2) {
            nivel = 'media';
            color = '#f39c12';
            texto = '⚠️ Contraseña media';
        } else {
            nivel = 'debil';
            color = '#e74c3c';
            texto = '❌ Contraseña débil';
        }
        
        strengthDiv.style.display = 'block';
        strengthDiv.style.color = color;
        strengthDiv.textContent = texto;
        
        if (errores > 0) {
            strengthDiv.innerHTML += '<br><small>' + validacion.errores.join('<br>') + '</small>';
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', mostrarFortalezaContrasena);

// Función para mostrar/ocultar contraseña (opcional)
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = document.querySelector(`[data-toggle="${inputId}"]`);
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (toggleButton) toggleButton.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        if (toggleButton) toggleButton.textContent = '👁️';
    }
}