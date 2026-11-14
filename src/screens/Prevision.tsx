import { useState, useEffect } from 'react'

type DiaPrevision = {
  date: string
  temperature_2m_max: number | null
  temperature_2m_min: number | null
  precipitation_sum: number | null
  weather_code: number | null
  wind_speed_10m_max: number | null
  relative_humidity_2m_max: number | null
  uv_index_max: number | null
}

type DatosOpenMeteo = {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    weather_code: number[]
    wind_speed_10m_max: number[]
    relative_humidity_2m_max: number[]
    uv_index_max: number[]
  }
}

export default function Prevision() {
  const [dias, setDias] = useState<DiaPrevision[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modelo, setModelo] = useState('meteofrance_arome_france_hd')
  const [diaExpandido, setDiaExpandido] = useState<string | null>(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    
    const fetchData = async (modeloAUsar: string) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=40.418&longitude=0.425&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,relative_humidity_2m_max,uv_index_max&timezone=Europe%2FMadrid&models=${modeloAUsar}&forecast_days=7`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al cargar datos de Open-Meteo')
      return res.json() as Promise<DatosOpenMeteo>
    }

    fetchData(modelo)
      .then((data) => {
        const tieneDatosSuficientes = data.daily.temperature_2m_max.slice(3).some(t => t !== null && t !== undefined)
        
        if (!tieneDatosSuficientes) {
          return fetchData('icon_seamless').then((dataFallback) => {
            const nuevosDias = dataFallback.daily.time.map((fecha, i) => ({
              date: fecha,
              temperature_2m_max: dataFallback.daily.temperature_2m_max[i],
              temperature_2m_min: dataFallback.daily.temperature_2m_min[i],
              precipitation_sum: dataFallback.daily.precipitation_sum[i],
              weather_code: dataFallback.daily.weather_code[i],
              wind_speed_10m_max: dataFallback.daily.wind_speed_10m_max[i],
              relative_humidity_2m_max: dataFallback.daily.relative_humidity_2m_max[i],
              uv_index_max: dataFallback.daily.uv_index_max[i],
            }))
            setDias(nuevosDias)
          })
        }

        const nuevosDias = data.daily.time.map((fecha, i) => ({
          date: fecha,
          temperature_2m_max: data.daily.temperature_2m_max[i],
          temperature_2m_min: data.daily.temperature_2m_min[i],
          precipitation_sum: data.daily.precipitation_sum[i],
          weather_code: data.daily.weather_code[i],
          wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
          relative_humidity_2m_max: data.daily.relative_humidity_2m_max[i],
          uv_index_max: data.daily.uv_index_max[i],
        }))
        setDias(nuevosDias)
      })
      .catch((err) => {
        if (modelo !== 'icon_seamless') {
          return fetchData('icon_seamless')
            .then((dataFallback) => {
              const nuevosDias = dataFallback.daily.time.map((fecha, i) => ({
                date: fecha,
                temperature_2m_max: dataFallback.daily.temperature_2m_max[i],
                temperature_2m_min: dataFallback.daily.temperature_2m_min[i],
                precipitation_sum: dataFallback.daily.precipitation_sum[i],
                weather_code: dataFallback.daily.weather_code[i],
                wind_speed_10m_max: dataFallback.daily.wind_speed_10m_max[i],
                relative_humidity_2m_max: dataFallback.daily.relative_humidity_2m_max[i],
                uv_index_max: dataFallback.daily.uv_index_max[i],
              }))
              setDias(nuevosDias)
            })
            .catch((err2) => setError(err2.message))
        } else {
          setError(err.message)
        }
      })
      .finally(() => setCargando(false))
  }, [modelo])

  if (cargando) {
    return <p style={{ textAlign: 'center' }}>Cargando previsión...</p>
  }

  if (error) {
    return <p style={{ textAlign: 'center', color: '#f39c12' }}>{error}</p>
  }

  const getIcono = (code: number | null) => {
    if (code === null || code === undefined) return '-';
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
            <option value="meteofrance_arome_france_hd">AROME</option>
            <option value="icon_seamless">ICON</option>
            <option value="ecmwf_ifs025">ECMWF</option>
            <option value="gfs_seamless">GFS</option>
          </select>
        </div>
        
        <div className="card-container">
          {dias.map((dia, index) => {
            const tempMax = dia.temperature_2m_max === null || dia.temperature_2m_max === undefined ? '-' : Math.round(dia.temperature_2m_max)
            const tempMin = dia.temperature_2m_min === null || dia.temperature_2m_min === undefined ? '-' : Math.round(dia.temperature_2m_min)
            const precip = dia.precipitation_sum === null || dia.precipitation_sum === undefined ? '-' : dia.precipitation_sum.toFixed(1)
            const viento = dia.wind_speed_10m_max === null || dia.wind_speed_10m_max === undefined ? '-' : Math.round(dia.wind_speed_10m_max)
            const hr = dia.relative_humidity_2m_max === null || dia.relative_humidity_2m_max === undefined ? '-' : Math.round(dia.relative_humidity_2m_max)
            const uv = dia.uv_index_max === null || dia.uv_index_max === undefined ? '-' : dia.uv_index_max.toFixed(1)
            
            const nombreDia = index === 0 ? 'Hoy' : new Date(dia.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
            const expandido = diaExpandido === dia.date

            return (
              <div key={dia.date} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                <div 
                  style={{ padding: '12px', cursor: 'pointer' }}
                  onClick={() => setDiaExpandido(expandido ? null : dia.date)}
                >
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{nombreDia}</span>
                    <span>{expandido ? '▲' : '▼'}</span>
                  </div>
                  <div className="card-row">
                    <span style={{ fontSize: '1.5rem' }}>{getIcono(dia.weather_code)}</span>
                    <span><span style={{ color: '#e74c3c' }}>{tempMax}°</span> / <span style={{ color: '#3498db' }}>{tempMin}°</span></span>
                    <span>{precip} mm</span>
                    <span>💨 {viento} km/h</span>
                    <span>HR: {hr}%</span>
                    <span>UV: {uv}</span>
                  </div>
                </div>
                {expandido && (
                  <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>Vista por horas disponible próximamente.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}