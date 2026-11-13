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
  const [modelo, setModelo] = useState('arome')

  useEffect(() => {
    setCargando(true)
    setError(null)
    
    // Pedimos 7 días de datos
    const url = `https://api.open-meteo.com/v1/forecast?latitude=40.418&longitude=0.425&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code&timezone=Europe%2FMadrid&models=${modelo}&forecast_days=7`
    
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar datos de Open-Meteo')
        return res.json()
      })
      .then((data: DatosOpenMeteo) => {
        // Verificamos si los últimos días tienen datos (por si el modelo no llega a tanto)
        const nuevosDias = data.daily.time.map((fecha, i) => {
          // Si el modelo devuelve null o undefined para las temperaturas, lo tratamos como falta de datos
          const max = data.daily.temperature_2m_max[i]
          const min = data.daily.temperature_2m_min[i]
          
          return {
            date: fecha,
            temperature_2m_max: max,
            temperature_2m_min: min,
            precipitation_sum: data.daily.precipitation_sum[i],
            wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
            weather_code: data.daily.weather_code[i],
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
            // Si la temperatura es null o 0, mostramos un guion para indicar que no hay datos para ese día con ese modelo
            const tempMax = dia.temperature_2m_max === null ? '-' : Math.round(dia.temperature_2m_max)
            const tempMin = dia.temperature_2m_min === null ? '-' : Math.round(dia.temperature_2m_min)
            
            return (
              <div key={dia.date} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem' }}>
                <div style={{ fontWeight: 'bold' }}>
                  {index === 0 ? 'Hoy' : new Date(dia.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div>
                  <span style={{ color: '#e74c3c' }}>{tempMax}°</span>
                  <span style={{ opacity: 0.5 }}> / </span>
                  <span style={{ color: '#3498db' }}>{tempMin}°</span>
                </div>
                <div>
                  {dia.precipitation_sum === null ? '-' : `${dia.precipitation_sum} mm`}
                </div>
                <div style={{ opacity: 0.8 }}>
                  {Math.round(dia.wind_speed_10m_max)} km/h
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}