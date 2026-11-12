import { useState, useEffect } from 'react'

type DiaPrevision = {
  date: string
  temperature_2m_max: number
  wind_speed_10m_max: number
  precipitation_sum: number
}

type DatosOpenMeteo = {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    wind_speed_10m_max: number[]
    precipitation_sum: number[]
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
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.418&longitude=0.425&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max&timezone=Europe%2FMadrid'
    
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
          wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
          precipitation_sum: data.daily.precipitation_sum[i],
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

  // Función para simular la bandera
  const getBandera = (lluvia: number, viento: number) => {
    if (lluvia > 2 || viento > 35) return { color: '#e74c3c', texto: 'Roja' } // Roja: lluvia fuerte o viento muy fuerte
    if (lluvia > 0 || viento > 20) return { color: '#f1c40f', texto: 'Amarilla' } // Amarilla: riesgo moderado
    return { color: '#2ecc71', texto: 'Verde' } // Verde: condiciones óptimas
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Previsión Playas</h2>
        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '15px' }}>
          * La bandera oficial la coloca el socorrista. Esta es una simulación basada en condiciones objetivas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {PLAYAS.map((playa) => (
            <div key={playa} style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', marginBottom: '5px' }}>{playa}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                {dias.map((dia, i) => {
                  const bandera = getBandera(dia.precipitation_sum, dia.wind_speed_10m_max)
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>{i === 0 ? 'Hoy' : new Date(dia.date).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                      <div style={{ width: '20px', height: '30px', backgroundColor: bandera.color, borderRadius: '2px', boxShadow: '0 0 8px ' + bandera.color, marginTop: '5px' }} />
                      <span style={{ fontSize: '0.75rem', color: '#ccc' }}>{Math.round(dia.temperature_2m_max)}°</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{Math.round(dia.wind_speed_10m_max)} km/h</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{dia.precipitation_sum > 0 ? `${dia.precipitation_sum} mm` : '0 mm'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
