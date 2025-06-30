class CifradoAES {
    constructor() {
        this.claveSecreta = 'MiClaveSecretaParaCifradoAES2024!';
    }

    /**
     * Cifra una contraseña usando AES
     * @param {string} contrasena - La contraseña a cifrar
     * @returns {string} - La contraseña cifrada en formato string
     */
    cifrarContrasena(contrasena) {
        try {
            if (!contrasena) {
                throw new Error('La contraseña no puede estar vacía');
            }

            const contrasenaCifrada = CryptoJS.AES.encrypt(contrasena, this.claveSecreta).toString();
            
            console.log('Contraseña cifrada exitosamente');
            return contrasenaCifrada;
        } catch (error) {
            console.error('Error al cifrar contraseña:', error);
            throw new Error('Error en el cifrado');
        }
    }

    /**
     * Descifra una contraseña usando AES
     * @param {string} contrasenaCifrada - La contraseña cifrada
     * @returns {string} - La contraseña descifrada
     */
    descifrarContrasena(contrasenaCifrada) {
        try {
            if (!contrasenaCifrada) {
                throw new Error('La contraseña cifrada no puede estar vacía');
            }

            const bytes = CryptoJS.AES.decrypt(contrasenaCifrada, this.claveSecreta);
            const contrasenaOriginal = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!contrasenaOriginal) {
                throw new Error('Error al descifrar - clave incorrecta o datos corruptos');
            }

            console.log('Contraseña descifrada exitosamente');
            return contrasenaOriginal;
        } catch (error) {
            console.error('Error al descifrar contraseña:', error);
            throw new Error('Error en el descifrado');
        }
    }

    /**
     * Verifica si una contraseña coincide con una cifrada
     * @param {string} contrasenaPlana - Contraseña sin cifrar
     * @param {string} contrasenaCifrada - Contraseña cifrada para comparar
     * @returns {boolean} - true si coinciden, false si no
     */
    verificarContrasena(contrasenaPlana, contrasenaCifrada) {
        try {
            const contrasenaDescifrada = this.descifrarContrasena(contrasenaCifrada);
            return contrasenaPlana === contrasenaDescifrada;
        } catch (error) {
            console.error('Error al verificar contraseña:', error);
            return false;
        }
    }

    /**
     * Genera un hash adicional para mayor seguridad (opcional)
     * Combina AES con un hash simple
     * @param {string} contrasena - Contraseña a procesar
     * @returns {string} - Hash de la contraseña cifrada
     */
    hashearContrasena(contrasena) {
        try {
            const contrasenaCifrada = this.cifrarContrasena(contrasena);

            const hash = CryptoJS.SHA256(contrasenaCifrada).toString();
            
            return {
                cifrada: contrasenaCifrada,
                hash: hash
            };
        } catch (error) {
            console.error('Error al hashear contraseña:', error);
            throw new Error('Error en el hash');
        }
    }

    /**
     * Valida que la contraseña cumpla con criterios de seguridad
     * @param {string} contrasena - Contraseña a validar
     * @returns {object} - Objeto con validación y mensaje
     */
    validarContrasena(contrasena) {
        const validacion = {
            valida: true,
            errores: []
        };

        if (!contrasena) {
            validacion.valida = false;
            validacion.errores.push('La contraseña es requerida');
            return validacion;
        }

        if (contrasena.length < 6) {
            validacion.valida = false;
            validacion.errores.push('La contraseña debe tener al menos 6 caracteres');
        }

        if (!/[a-z]/.test(contrasena)) {
            validacion.valida = false;
            validacion.errores.push('La contraseña debe contener al menos una letra minúscula');
        }

        if (!/[A-Z]/.test(contrasena)) {
            validacion.valida = false;
            validacion.errores.push('La contraseña debe contener al menos una letra mayúscula');
        }

        if (!/[0-9]/.test(contrasena)) {
            validacion.valida = false;
            validacion.errores.push('La contraseña debe contener al menos un número');
        }

        return validacion;
    }
}

const cifrador = new CifradoAES();

window.cifrarContrasena = function(contrasena) {
    return cifrador.cifrarContrasena(contrasena);
};

window.descifrarContrasena = function(contrasenaCifrada) {
    return cifrador.descifrarContrasena(contrasenaCifrada);
};

window.verificarContrasena = function(contrasenaPlana, contrasenaCifrada) {
    return cifrador.verificarContrasena(contrasenaPlana, contrasenaCifrada);
};

window.validarContrasena = function(contrasena) {
    return cifrador.validarContrasena(contrasena);
};

console.log('✅ Módulo de cifrado AES cargado correctamente');
console.log('📝 Funciones disponibles: cifrarContrasena(), descifrarContrasena(), verificarContrasena(), validarContrasena()');

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CifradoAES;
}