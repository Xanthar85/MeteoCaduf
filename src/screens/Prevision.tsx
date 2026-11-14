// src/screens/Prevision.tsx
import { useState, useEffect } from 'react'

type DiaPrevision = {
  date: string
  temperature_2m_max: number
  temperature_2m_min: number
  precipitation_sum: number
  weather_code: number
  wind_speed_10m_max: number
  relative_humidity_2m_mean: number
  uv_index_max: number
}

type DatosOpenMeteo = {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    weather_code: number[]
    wind_speed_10m_max: number[]
    relative_humidity_2m_mean: number[]
    uv_index_max: number[]
  }
}

export default function Prevision() {
  const [dias, setDias] = useState<DiaPrevision[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modelo, setModelo] = useState('arome')

  useEffect(() => {
    setCargando(true)
    setError(null)
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=40.418&longitude=0.425&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,relative_humidity_2m_mean,uv_index_max&timezone=Europe%2FMadrid&models=${modelo}&forecast_days=7`
    
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar datos de Open-Meteo')
        return res.json()
      })
      .then((data: DatosOpenMeteo) => {
        const nuevosDias = data.daily.time.map((fecha, i) => {
          return {
            date: fecha,
            temperature_2m_max: data.daily.temperature_2m_max[i],
            temperature_2m_min: data.daily.temperature_2m_min[i],
            precipitation_sum: data.daily.precipitation_sum[i],
            weather_code: data.daily.weather_code[i],
            wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
            relative_humidity_2m_mean: data.daily.relative_humidity_2m_mean[i],
            uv_index_max: data.daily.uv_index_max[i],
          }
        })
        
        setDias(nuevosDias)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [modelo])

  if (cargando) {
    return <p style={{ textAlign: 'center' }}>Cargando previsión...</p>
  }

  if (error) {
    return <p style={{ textAlign: 'center', color: '#f39c12' }}>{error}</p>
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Previsión 7 días</h2>
          <select 
            value={modelo} 
            onChange={(e) => setModelo(e.target.value)}
            style={{ padding: '5px', borderRadius: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
          >
            <option value="arome">AROME</option>
            <option value="icon">ICON</option>
            <option value="ecmwf">ECMWF</option>
            <option value="gfs">GFS</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dias.map((dia, index) => {
            const tempMax = dia.temperature_2m_max === null || dia.temperature_2m_max === undefined ? '-' : Math.round(dia.temperature_2m_max)
            const tempMin = dia.temperature_2m_min === null || dia.temperature_2m_min === undefined ? '-' : Math.round(dia.temperature_2m_min)
            const precip = dia.precipitation_sum === null || dia.precipitation_sum === undefined ? '-' : dia.precipitation_sum.toFixed(1)
            const viento = dia.wind_speed_10m_max === null || dia.wind_speed_10m_max === undefined ? '-' : Math.round(dia.wind_speed_10m_max)
            const hr = dia.relative_humidity_2m_mean === null || dia.relative_humidity_2m_mean === undefined ? '-' : Math.round(dia.relative_humidity_2m_mean)
            const uv = dia.uv_index_max === null || dia.uv_index_max === undefined ? '-' : dia.uv_index_max.toFixed(1)

            return (
              <div key={dia.date} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', textAlign: 'left' }}>
                  {index === 0 ? 'Hoy' : new Date(dia.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '1.2rem' }}>{dia.weather_code !== null ? getIcono(dia.weather_code) : '-'}</div>
                <div>{precip} mm</div>
                <div><span style={{ color: '#e74c3c' }}>{tempMax}°</span></div>
                <div><span style={{ color: '#3498db' }}>{tempMin}°</span></div>
                <div>{viento} km/h</div>
                <div>{hr}%</div>
                <div>{uv}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr 1fr 1fr 1fr', gap: '8px', fontSize: '0.65rem', opacity: 0.6, marginTop: '5px', textAlign: 'center', padding: '0 10px' }}>
          <span style={{ textAlign: 'left' }}>Día</span>
          <span>Icono</span>
          <span>Precip.</span>
          <span>Máx</span>
          <span>Mín</span>
          <span>V. Medio</span>
          <span>HR</span>
          <span>UV</span>
        </div>
      </div>
    </div>
  )
}
// src/screens/Prevision.tsx