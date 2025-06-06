import React, { useState, useEffect } from "react";
import styles from "./TurnoForm.module.css";

// Cambiar URL a la de producción
const WEBHOOK_URL = "https://cavanna11.app.n8n.cloud/webhook/f8c01806-7678-49bc-af2d-9e314326acf8";

const opcionesServicio = [
  { value: "", label: "Selecciona un servicio" },
  { value: "Corte", label: "Corte" },
  { value: "Barba", label: "Barba" },
  { value: "Corte + Barba", label: "Corte + Barba" },
];

export default function TurnoForm() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [servicio, setServicio] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Horarios de ejemplo: 09:00 a 20:00 cada 30 minutos
  const horarios = [];
  for (let h = 9; h < 20; h++) {
    horarios.push(`${h.toString().padStart(2, "0")}:00`);
    horarios.push(`${h.toString().padStart(2, "0")}:30`);
  }

  const [dia, setDia] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().slice(0, 10); // YYYY-MM-DD
  });

  // Horario seleccionado
  const [horarioSeleccionado, setHorarioSeleccionado] = useState("");

  const [horariosOcupados, setHorariosOcupados] = useState([]);

  // Refrescar horarios ocupados después de reservar
  const fetchHorariosOcupados = () => {
    if (!dia || !servicio) return;
    fetch(`${WEBHOOK_URL}?dia=${dia}&servicio=${encodeURIComponent(servicio)}`)
      .then(res => res.json())
      .then(data => {
        setHorariosOcupados(Array.isArray(data) ? data : []);
      })
      .catch(() => setHorariosOcupados([]));
  };

  useEffect(() => {
    fetchHorariosOcupados();
  }, [dia, servicio]);

  const limpiarFormulario = () => {
    setNombre("");
    setTelefono("");
    setServicio("");
    setFechaHora("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!nombre || !telefono || !servicio || !dia || !horarioSeleccionado) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    // Unir fecha y hora seleccionada
    const fechaHora = `${dia}T${horarioSeleccionado}`;

    setEnviando(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono, servicio, fechaHora }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.mensaje || "Ocurrió un error al reservar el turno. Intenta nuevamente.");
        setEnviando(false);
        return;
      }
      setMensaje(data.mensaje || "¡Turno reservado con éxito!");
      limpiarFormulario();
      setHorarioSeleccionado("");
      setTimeout(() => {
        fetchHorariosOcupados(); // Refresca la grilla después de reservar
      }, 500);
    } catch (err) {
      setError("Ocurrió un error al reservar el turno. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className={styles.formulario} onSubmit={handleSubmit}>
      <h2>Reservar Turno</h2>
      <label>
        Nombre:
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </label>
      <label>
        Teléfono:
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
        />
      </label>
      <label>
        Servicio:
        <select
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          required
        >
          {opcionesServicio.map((op) => (
            <option key={op.value} value={op.value} disabled={op.value === ""}>
              {op.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Día:
        <input
          type="date"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
          required
        />
      </label>
      <label>
        Horario:
        <div className={styles.grillaHorarios}>
          {horarios.map((hora) => {
            const ocupado = horariosOcupados.includes(hora);
            const seleccionado = horarioSeleccionado === hora;
            return (
              <button
                type="button"
                key={hora}
                className={`${styles.horarioBtn} ${ocupado ? styles.ocupado : styles.disponible} ${seleccionado ? styles.seleccionado : ""}`}
                disabled={ocupado}
                onClick={() => setHorarioSeleccionado(hora)}
              >
                {hora}
              </button>
            );
          })}
        </div>
      </label>
      <button type="submit" disabled={enviando}>
        {enviando ? "Reservando..." : "Reservar"}
      </button>
      {mensaje && <div className={styles.mensajeExito}>{mensaje}</div>}
      {error && <div className={styles.mensajeError}>{error}</div>}
    </form>
  );
}