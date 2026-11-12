// src/screens/Playas.tsx
import { useState, useEffect } from 'react'

type Franja = {
  nombre: string
  inicio: number
  fin: number
}

const FRANJAS: Franja[] = [
  { nombre: 'Mañana', inicio: 6, fin: 14 },
  { nombre: 'Tarde', inicio: 14, fin: 22 },
  { nombre: 'Noche', inicio: 22, fin: 6 },
]

const PLAYAS = [
  'Morrongo',
  'Caracola',
  'Mar Xica',
  'Gurugú',
  'Fondalet',
  'Cala del Pino'
]

type DatosMarinos = {
  hourly: {
    time: string[]
    wave_height: number[]
    wave_period: number[]
    sea_surface_temperature: number[]
  }
}

type DatosForecast = {
  hourly: {
    time: string[]
    uv_index: number[]
  }
}

type FranjaDatos = {
  nombre: string
  dia: string
  oleaje: number
  periodo: number
  tempAgua: number
  uv: number
}

const getFranjaDeHora = (hora: number): string => {
  if (hora >= 6 && hora < 14) return 'Mañana'
  if (hora >= 14 && hora < 22) return 'Tarde'
  return 'Noche'
}

export default function Playas() {
  const [playa, setPlaya] = useState(PLAYAS[0])
  const [marinos, setMarinos] = useState<DatosMarinos | null>(null)
  const [forecast, setForecast] = useState<DatosForecast | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCargando(true)
    setError(null)

    const urlMarine = 'https://marine-api.open-meteo.com/v1/marine?latitude=40.418&longitude=0.425&hourly=wave_height,wave_period,sea_surface_temperature&timezone=Europe%2FMadrid&forecast_days=3'
    const urlForecast = 'https://api.open-meteo.com/v1/forecast?latitude=40.418&longitude=0.425&hourly=uv_index&timezone=Europe%2FMadrid&forecast_days=3'

    Promise.all([
      fetch(urlMarine).then((res) => {
        if (!res.ok) throw new Error('Error al cargar datos marinos')
        return res.json()
      }),
      fetch(urlForecast).then((res) => {
        if (!res.ok) throw new Error('Error al cargar radiación UV')
        return res.json()
      }),
    ])
      .then(([dataMarine, dataForecast]: [DatosMarinos, DatosForecast]) => {
        setMarinos(dataMarine)
        setForecast(dataForecast)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [])

  const getFranjas = (): FranjaDatos[] => {
    if (!marinos || !forecast) return []

    const resultado: FranjaDatos[] = []
    const ahora = new Date()
    ahora.setMinutes(0, 0, 0)

    const franjasHoy = FRANJAS.map((f) => {
      const fecha = new Date(ahora)
      fecha.setHours(f.inicio, 0, 0, 0)
      if (f.inicio < 6) fecha.setDate(fecha.getDate() + 1)
      return { ...f, fecha }
    }).filter((f) => f.fecha >= ahora)

    const siguientes = FRANJAS.map((f) => {
      const fecha = new Date(ahora)
      fecha.setDate(fecha.getDate() + 1)
      fecha.setHours(f.inicio, 0, 0, 0)
      if (f.inicio < 6) fecha.setDate(fecha.getDate() + 1)
      return { ...f, fecha }
    })

    const todas = [...franjasHoy, ...siguientes].slice(0, 3)

    todas.forEach((f) => {
      const horas = marinos.hourly.time
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => {
          const fecha = new Date(t)
          return fecha >= f.fecha && fecha < new Date(f.fecha.getTime() + 8 * 60 * 60 * 1000)
        })

      if (horas.length === 0) return

      const oleajeMedia = horas.reduce((acc, { i }) => acc + (marinos.hourly.wave_height[i] ?? 0), 0) / horas.length
      const periodoMedia = horas.reduce((acc, { i }) => acc + (marinos.hourly.wave_period[i] ?? 0), 0) / horas.length
      const tempMedia = horas.reduce((acc, { i }) => acc + (marinos.hourly.sea_surface_temperature[i] ?? 0), 0) / horas.length

      const uvHoras = forecast.hourly.time
        .map((t, i) => ({ t, i, uv: forecast.hourly.uv_index[i] }))
        .filter(({ t }) => {
          const fecha = new Date(t)
          return fecha >= f.fecha && fecha < new Date(f.fecha.getTime() + 8 * 60 * 60 * 1000)
        })

      const uvMax = uvHoras.length > 0 ? Math.max(...uvHoras.map((h) => h.uv ?? 0)) : 0

      resultado.push({
        nombre: getFranjaDeHora(f.inicio),
        dia: f.fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        oleaje: oleajeMedia,
        periodo: periodoMedia,
        tempAgua: tempMedia,
        uv: uvMax,
      })
    })

    return resultado
  }

  const franjas = getFranjas()

  const getNivelUV = (uv: number): string => {
    if (uv < 3) return 'Bajo'
    if (uv < 6) return 'Moderado'
    if (uv < 8) return 'Alto'
    if (uv < 11) return 'Muy alto'
    return 'Extremo'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '8px' }}>Elige playa</label>
        <select
          value={playa}
          onChange={(e) => setPlaya(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(0,0,0,0.3)',
            color: 'var(--text-color)',
            fontSize: '1rem',
          }}
        >
          {PLAYAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {cargando && <p style={{ textAlign: 'center' }}>Cargando datos marinos...</p>}
      {error && <p style={{ textAlign: 'center', color: '#f39c12' }}>{error}</p>}

      {!cargando && !error && (
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{playa}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {franjas.map((f, i) => (
              <div key={i} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{f.nombre}</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{f.dia}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.9rem' }}>
                  <div>🌊 Oleaje: <strong>{f.oleaje.toFixed(1)} m</strong></div>
                  <div>⏱️ Periodo: <strong>{f.periodo.toFixed(1)} s</strong></div>
                  <div>🌡️ Agua: <strong>{f.tempAgua.toFixed(1)} °C</strong></div>
                  <div>☀️ UV: <strong>{f.uv.toFixed(1)} ({getNivelUV(f.uv)})</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
// src/screens/Playas.tsx