import { useState, useEffect } from 'react'

type DiaPrevision = {
  date: string
  temperature_2m_max: number
  temperature_2m_min: number
  precipitation_sum: number
  wind_speed_10m_max: number
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
  }
}

export default function Prevision() {
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
        const nuevosDias = data.daily.time.map((fecha, i) => ({
          date: fecha,
          temperature_2m_max: data.daily.temperature_2m_max[i],
          temperature_2m_min: data.daily.temperature_2m_min[i],
          precipitation_sum: data.daily.precipitation_sum[i],
          wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
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
    return <p style={{ textAlign: 'center' }}>Cargando previsión...</p>
  }

  if (error) {
    return <p style={{ textAlign: 'center', color: '#f39c12' }}>{error}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>Previsión 7 días</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dias.map((dia, index) => (
            <div key={dia.date} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem' }}>
              <div style={{ fontWeight: 'bold' }}>
                {index === 0 ? 'Hoy' : new Date(dia.date).toLocaleDateString('es-ES', { weekday: 'short' })}
              </div>
              <div>
                <span style={{ color: '#e74c3c' }}>{Math.round(dia.temperature_2m_max)}°</span>
                <span style={{ opacity: 0.5 }}> / </span>
                <span style={{ color: '#3498db' }}>{Math.round(dia.temperature_2m_min)}°</span>
              </div>
              <div>
                {dia.precipitation_sum > 0 ? `${dia.precipitation_sum} mm` : '0 mm'}
              </div>
              <div style={{ opacity: 0.8 }}>
                {Math.round(dia.wind_speed_10m_max)} km/h
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
