import React, { useState } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";
import "../layout/Login.css";

function Login() {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInputError(false);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",  // 👈 PARA RECIBIR LA COOKIE
        body: JSON.stringify({
          username: correo,
          password: contraseña,
        }),
      });

      console.log("login status:", response.status);

      if (response.status === 401) {
        setError("Usuario o contraseña incorrectos");
        setInputError(true);
        return;
      }

      if (!response.ok) {
        setError(`Error en el servidor (${response.status})`);
        setInputError(true);
        return;
      }

      // Consumimos el body (aunque no lo usemos)
      await response.json();
      console.log("login ok, navegando a /pacientes");

      navigate("/pacientes");
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error al iniciar sesión");
      setInputError(true);
    }
  };

  const hasError = Boolean(error);

  return (
    <main
      className="login-page-container"
      role="main"
      aria-labelledby="login-title"
    >
      <section
        className="login-container"
        aria-describedby={hasError ? "login-error" : undefined}
      >
        <h1 id="login-title">Iniciar sesión</h1>

        <form
          onSubmit={handleLogin}
          className="login-form"
          noValidate
          aria-describedby={hasError ? "login-error" : undefined}
        >
          <label htmlFor="login-usuario" className="sr-only">
            Usuario
          </label>
          <input
            id="login-usuario"
            name="username"
            type="email"
            placeholder="Usuario"
            value={correo}
            autoComplete="username"
            autoFocus
            tabIndex={1}
            aria-required="true"
            aria-invalid={inputError ? "true" : "false"}
            aria-describedby={hasError ? "login-error" : undefined}
            onChange={(e) => {
              setCorreo(e.target.value);
              setInputError(false);
              setError("");
            }}
            className={inputError ? "input-error" : ""}
          />

          <label htmlFor="login-password" className="sr-only">
            Contraseña
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Contraseña"
            value={contraseña}
            autoComplete="current-password"
            tabIndex={2}
            aria-required="true"
            aria-invalid={inputError ? "true" : "false"}
            aria-describedby={hasError ? "login-error" : undefined}
            onChange={(e) => {
              setContraseña(e.target.value);
              setInputError(false);
              setError("");
            }}
            className={inputError ? "input-error" : ""}
          />

          <button
            type="submit"
            className="button"
            tabIndex={3}
            aria-label="Iniciar sesión en el sistema"
          >
            Iniciar sesión
          </button>
        </form>

        {hasError && (
          <p
            id="login-error"
            className="error-mensage"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}
      </section>
    </main>
  );
}

export default Login;
