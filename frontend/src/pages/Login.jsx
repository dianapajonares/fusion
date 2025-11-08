//import { login as loginService } from "../services/authService";
import React, { useState } from "react";
import "../App.css";
//import { useAuth } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "../layout/Login.css"

function Login() {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  //const [error, setError] = useState("");
  //const [mensaje, setMensaje] = useState("");

  //const { login } = useAuth();
  const navigate = useNavigate();
  const handleLogin = (e) => { // La declaramos sin 'async' ya que la lógica es simple
    e.preventDefault();
    console.log("Formulario de login activo (Solo Diseño)");
  };
  /*const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    try {
      const data = await loginService(correo, contraseña);

      if (data && data.tipo_usuario) {
        login({
          tipo_usuario: data.tipo_usuario,
          usuario_id: data.usuario_id || data._id, // Ajusta según lo que regrese tu backend
          nombre_usuario: data.nombre_usuario || data.nombre,
          idrol_usuario: data.rol_usuario// Asegúrate de usar el campo correcto
        });

        setMensaje(data.message || "Inicio de sesión exitoso");
        console.log('Login correcto con:', data);
        navigate("/");
      }
      else {
        setError("Respuesta inesperada del servidor");
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError(err.message || "Error al iniciar sesión");
    }
  };*/

  return (
<div className="login-page-container">
      
      {/* Contenedor central (la caja blanca) */}
      <div className="login-container">
        
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
          />
          <button type="submit" className="button">Inicio de sesión</button>
        </form>
        
        {/* Los mensajes de error/éxito se pueden añadir aquí después de descomentar el estado */}
      </div>
      
    </div>
   
  );
}

export default Login;
