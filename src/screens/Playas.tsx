import { useState, useEffect } from 'react'

type DiaPrevision = {
  date: string
  temperature_2m_max: number
  temperature_2m_min: number
  wind_speed_10m_max: number
  precipitation_sum: number
  weather_code: number
}

type DatosOpenMeteo = {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    wind_speed_10m_max: number[]
    precipitation_sum: number[]
    weather_code: number[]
  }
}

const PLAYAS = [
  'Playa del Morrongo',
  'Playa de la Caracola',
  'Playa del Pinar',
  'Playa de la Mar Xica',
  'Playa de la Barbiguera',
  'Playa del Retor'
]

export default function Playas() {
  const [dias, setDias] = useState<DiaPrevision[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.418&longitude=0.425&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code&timezone=Europe%2FMadrid'
    
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar datos de Open-Meteo')
        return res.json()
      })
      .then((data: DatosOpenMeteo) => {
        // Tomamos los primeros 3 días (0 a 0+2)
        const nuevosDias = data.daily.time.slice(0, 3).map((fecha, i) => ({
          date: fecha,
          temperature_2m_max: data.daily.temperature_2m_max[i],
          temperature_2m_min: data.daily.temperature_2m_min[i],
          wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
          precipitation_sum: data.daily.precipitation_sum[i],
          weather_code: data.daily.weather_code[i],
        }))
        setDias(nuevosDias)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [])

  if (cargando) {
    return <p style={{ textAlign: 'center' }}>Cargando previsión de playas...</p>
  }

  if (error) {
    return <p style={{ textAlign: 'center', color: '#f39c12' }}>{error}</p>
  }

  // Helper para icono simple (opcional, se puede ampliar)
  const getIcono = (code: number) => {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code <= 48) return '☁️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    return '⛈️';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Previsión Playas (Datos Objetivos)</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {PLAYAS.map((playa) => (
            <div key={playa} style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', fontWeight: 'bold' }}>{playa}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {dias.map((dia, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', textAlign: 'center', padding: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--accent-color)' }}>
                      {i === 0 ? 'Hoy' : new Date(dia.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                    </span>
                    
                    <span style={{ fontSize: '1.5rem' }}>{getIcono(dia.weather_code)}</span>
                    
                    <div style={{ display: 'flex', gap: '4px', fontSize: '0.9rem' }}>
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{Math.round(dia.temperature_2m_max)}°</span>
                      <span style={{ opacity: 0.5 }}>/</span>
                      <span style={{ color: '#3498db' }}>{Math.round(dia.temperature_2m_min)}°</span>
                    </div>
                    
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>💨 {Math.round(dia.wind_speed_10m_max)} km/h</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>🌧️ {dia.precipitation_sum > 0 ? `${dia.precipitation_sum} mm` : '0 mm'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
