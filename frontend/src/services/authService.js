// src/services/authService.js

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

/**
 * Realiza la solicitud POST al endpoint de login de FastAPI.
 * @param {string} usuario
 * @param {string} password
 */
export const login = async (usuario, password) => {
    // Usamos FormData porque la ruta de FastAPI espera correo y contraseña como Form-Data, no JSON
    const formData = new URLSearchParams();
    formData.append('usuario', usuario);
    formData.append('contraseña', password);

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                // No necesitamos Content-Type: application/json aquí; Fetch lo maneja con URLSearchParams
            },
            body: formData 
        });

        const data = await response.json();

        if (!response.ok) {
            // FastAPI devuelve 400 con {detail: "..."} si la autenticación falla
            throw new Error(data.detail || 'Fallo en la autenticación.');
        }

        // 🚨 CRÍTICO: Guarda el token en el almacenamiento local para usarlo en futuras peticiones
        localStorage.setItem('access_token', data.access_token);

        return data; // Devuelve los datos que React necesita para el Contexto
        
    } catch (error) {
        console.error("Error al conectar con la API de login:", error);
        throw error;
    }
};