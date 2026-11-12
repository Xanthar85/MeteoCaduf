// src/screens/Prevision.tsx
import { useState, useEffect } from 'react'

type Modelo = 'harmonie' | 'ecmwf' | 'gfs' | 'icon'

const MODELOS: { id: Modelo; nombre: string; api: string }[] = [
  { id: 'harmonie', nombre: 'Harmonie', api: 'harmonie' },
  { id: 'ecmwf', nombre: 'ECMWF', api: 'ecmwf_ifs025' },
  { id: 'gfs', nombre: 'GFS', api: 'gfs_seamless' },
  { id: 'icon', nombre: 'ICON', api: 'icon_seamless' },
]

type DiaPrevision = {
  date: string
  temperature_2m_max: number
  temperature_2m_min: number
  precipitation_sum: number
  wind_speed_10m_max: number
  weather_code: number
  precipitation_probability_max: number
}

type HoraPrevision = {
  time: string
  temperature_2m: number
  precipitation_probability: number
  wind_speed_10m: number
  weather_code: number
}

type DatosOpenMeteo = {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    wind_speed_10m_max: number[]
    weather_code: number[]
    precipitation_probability_max: number[]
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: number[]
    wind_speed_10m: number[]
    weather_code: number[]
  }
}

const getIcono = (code: number) => {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code <= 48) return '☁️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  return '⛈️';
}

export default function Prevision() {
  const [modelo, setModelo] = useState<Modelo>('harmonie')
  const [dias, setDias] = useState<DiaPrevision[]>([])
  const [horas, setHoras] = useState<HoraPrevision[]>([])
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    setDiaAbierto(null)

    const modeloApi = MODELOS.find((m) => m.id === modelo)?.api ?? 'harmonie'
    const url = `https://api.open-meteo.com/v1/forecast?latitude=40.418&longitude=0.425&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code,precipitation_probability_max&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&timezone=Europe%2FMadrid&forecast_days=7&models=${modeloApi}`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Error al cargar datos (modelo ${modelo})`)
        return res.json()
      })
      .then((data: DatosOpenMeteo) => {
        const nuevosDias = data.daily.time.map((fecha, i) => ({
          date: fecha,
          temperature_2m_max: data.daily.temperature_2m_max[i],
          temperature_2m_min: data.daily.temperature_2m_min[i],
          precipitation_sum: data.daily.precipitation_sum[i],
          wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
          weather_code: data.daily.weather_code[i],
          precipitation_probability_max: data.daily.precipitation_probability_max[i],
        }))
        const nuevasHoras = data.hourly.time.map((t, i) => ({
          time: t,
          temperature_2m: data.hourly.temperature_2m[i],
          precipitation_probability: data.hourly.precipitation_probability[i],
          wind_speed_10m: data.hourly.wind_speed_10m[i],
          weather_code: data.hourly.weather_code[i],
        }))
        setDias(nuevosDias)
        setHoras(nuevasHoras)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [modelo])

  const horasDeDia = (fecha: string) =>
    horas.filter((h) => h.time.startsWith(fecha))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {MODELOS.map((m) => (
            <button
              key={m.id}
              onClick={() => setModelo(m.id)}
              style={{
                background: modelo === m.id ? 'var(--accent-color)' : 'rgba(0,0,0,0.3)',
                color: modelo === m.id ? '#1a1a1a' : '#f4f4f4',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: modelo === m.id ? 'bold' : 'normal',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {m.nombre}
            </button>
          ))}
        </div>
      </div>

      {cargando && <p style={{ textAlign: 'center' }}>Cargando previsión...</p>}
      {error && <p style={{ textAlign: 'center', color: '#f39c12' }}>{error}</p>}

      {!cargando && !error && (
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Próximos 7 días</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dias.map((dia, index) => {
              const abierto = diaAbierto === dia.date
              return (
                <div key={dia.date} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setDiaAbierto(abierto ? null : dia.date)}
                    style={{
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 0.6fr 1.2fr 1fr 1fr',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: '#f4f4f4',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>
                      {index === 0 ? 'Hoy' : new Date(dia.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                    </span>
                    <span style={{ fontSize: '1.4rem', textAlign: 'center' }}>{getIcono(dia.weather_code)}</span>
                    <span>
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{Math.round(dia.temperature_2m_max)}°</span>
                      <span style={{ opacity: 0.5 }}> / </span>
                      <span style={{ color: '#3498db' }}>{Math.round(dia.temperature_2m_min)}°</span>
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>🌧️ {dia.precipitation_probability_max ?? 0}%</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>💨 {Math.round(dia.wind_speed_10m_max)} km/h</span>
                  </button>

                  {abierto && (
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {horasDeDia(dia.date).map((h) => (
                        <div key={h.time} style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 1fr 1fr 1fr', gap: '6px', alignItems: 'center', fontSize: '0.85rem', padding: '4px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }}>
                          <span style={{ opacity: 0.8 }}>{new Date(h.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ fontSize: '1.1rem', textAlign: 'center' }}>{getIcono(h.weather_code)}</span>
                          <span style={{ fontWeight: 'bold' }}>{Math.round(h.temperature_2m)}°</span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>🌧️ {h.precipitation_probability ?? 0}%</span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>💨 {Math.round(h.wind_speed_10m)} km/h</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
// src/screens/Prevision.tsx