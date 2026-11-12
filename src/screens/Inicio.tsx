// src/screens/Inicio.tsx
import { useState, useEffect } from 'react'

type DatosAvamet = {
  temperatura: string
  humedad: string
  viento: string
  lluvia: string
  actualizado: string
}

type DatosHorarios = {
  time: string[]
  temperature_2m: number[]
  precipitation_probability: number[]
  wind_speed_10m: number[]
  weather_code: number[]
}

type EstadoAvisos =
  | { tipo: 'SIN_AVISOS'; actualizado: string }
  | { tipo: 'HAY_AVISOS'; actualizado: string; enlace: string }
  | { tipo: 'ERROR'; actualizado: string; detalle: string }

export default function Inicio() {
  const [datos, setDatos] = useState<DatosAvamet | null>(null)
  const [horarios, setHorarios] = useState<DatosHorarios | null>(null)
  const [avisos, setAvisos] = useState<EstadoAvisos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/avamet')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar datos de AVAMET')
        return res.json()
      })
      .then((data: DatosAvamet) => setDatos(data))
      .catch((err) => setError(err.message))

    fetch('/api/aemet')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar avisos de AEMET')
        return res.json()
      })
      .then((data: EstadoAvisos) => setAvisos(data))
      .catch(() => setAvisos({ tipo: 'ERROR', actualizado: new Date().toISOString(), detalle: 'No se pudo consultar AEMET.' }))

    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.418&longitude=0.425&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&timezone=Europe%2FMadrid&forecast_days=3'
    
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar datos de Open-Meteo')
        return res.json()
      })
      .then((data: { hourly: DatosHorarios }) => {
        setHorarios(data.hourly)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [])

  if (cargando) {
    return <p style={{ textAlign: 'center' }}>Cargando datos...</p>
  }

  if (error) {
    return <p style={{ textAlign: 'center', color: '#f39c12' }}>{error}</p>
  }

  const getFranjas = () => {
    if (!horarios) return []
    
    const ahora = new Date()
    const franjas = []
    
    let indiceActual = horarios.time.findIndex(t => new Date(t) > ahora)
    if (indiceActual === -1) indiceActual = 0

    for (let i = 0; i < 3; i++) {
      const idx = indiceActual + (i * 8)
      if (idx >= horarios.time.length) break

      const fechaInicio = new Date(horarios.time[idx])
      const horaInicio = fechaInicio.getHours()
      
      let nombreFranja = ''
      if (horaInicio >= 6 && horaInicio < 14) nombreFranja = 'Mañana'
      else if (horaInicio >= 14 && horaInicio < 22) nombreFranja = 'Tarde'
      else nombreFranja = 'Noche'

      const horasFranja = horarios.time.slice(idx, idx + 8).map((t, j) => ({ t, i: idx + j }))
      
      const tempMedia = horasFranja.reduce((acc, { i }) => acc + horarios.temperature_2m[i], 0) / horasFranja.length
      const vientoMax = Math.max(...horasFranja.map(({ i }) => horarios.wind_speed_10m[i]))
      const probLluviaMax = Math.max(...horasFranja.map(({ i }) => horarios.precipitation_probability[i]))
      const icono = horasFranja[Math.floor(horasFranja.length / 2)].i

      franjas.push({
        nombre: nombreFranja,
        dia: fechaInicio.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        tempMedia,
        vientoMax,
        probLluviaMax,
        weather_code: horarios.weather_code[icono]
      })
    }
    return franjas
  }

  const franjasMostrar = getFranjas()

  const getIcono = (code: number) => {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code <= 48) return '☁️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    return '⛈️';
  }

  const renderAvisos = () => {
    if (!avisos) {
      return <p style={{ textAlign: 'center', opacity: 0.7 }}>Consultando avisos de AEMET...</p>
    }
    if (avisos.tipo === 'HAY_AVISOS') {
      return (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f39c12', marginBottom: '10px' }}>
            ⚠️ Hay avisos meteorológicos activos en la Comunitat Valenciana
          </p>
          <a href={avisos.enlace} target="_blank" rel="noopener noreferrer"
             style={{ color: 'var(--accent-color)', textDecoration: 'underline', fontSize: '0.9rem' }}>
            Ver avisos oficiales de AEMET
          </a>
        </div>
      )
    }
    if (avisos.tipo === 'SIN_AVISOS') {
      return <p style={{ textAlign: 'center', opacity: 0.7 }}>No hay avisos activos en la Comunitat Valenciana.</p>
    }
    return <p style={{ textAlign: 'center', color: '#f39c12' }}>{avisos.detalle}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>Datos Actuales (AVAMET)</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>Temperatura</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{datos?.temperatura || 'N/D'}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>Humedad</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{datos?.humedad || 'N/D'}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>Viento</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{datos?.viento || 'N/D'}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>Lluvia</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{datos?.lluvia || 'N/D'}</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Tiempo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {franjasMostrar.map((franja, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{franja.dia}</span>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--accent-color)' }}>{franja.nombre}</span>
              <span style={{ fontSize: '1.5rem', margin: '5px 0' }}>{getIcono(franja.weather_code)}</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{Math.round(franja.tempMedia)}°</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>💨 {Math.round(franja.vientoMax)} km/h</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>🌧️ {franja.probLluviaMax}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Alertas y Consejos</h2>
        <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          {renderAvisos()}
        </div>
      </div>
      
      <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center', marginTop: '10px' }}>
        Actualizado: {datos ? datos.actualizado : 'N/D'}
      </p>
    </div>
  )
}
// src/screens/Inicio.tsx