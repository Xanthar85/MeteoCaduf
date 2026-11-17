import { useState, useEffect } from 'react'

type DatosAvamet = {
  temp: string
  humedad: string
  viento: string
  direccion: string
  lluvia: string
  presion: string
  tempMax: string
  tempMin: string
  actualizado: string
}

const AVAMET_MOCK: DatosAvamet = {
  temp: '16,7',
  humedad: '81%',
  viento: '5 km/h NO',
  direccion: 'NO',
  lluvia: '0,0mm',
  presion: '1.016',
  tempMax: '20,1',
  tempMin: '14,5',
  actualizado: 'Datos de ejemplo',
}

type DatosHorarios = {
  time: string[]
  temperature_2m: number[]
  precipitation: number[]
  weather_code: number[]
  wind_speed_10m: number[]
  wind_gusts_10m: number[]
  relative_humidity_2m: number[]
  uv_index: number[]
}

type EstadoAvisos =
  | { tipo: 'SIN_AVISOS'; actualizado: string }
  | { tipo: 'HAY_AVISOS'; actualizado: string; enlace: string }
  | { tipo: 'ERROR'; actualizado: string; detalle: string }

type Franja = {
  nombre: string
  dia: string
  tempMedia: number
  precipTotal: number
  weather_code: number
  vientoMedio: number
  rachasMax: number
  humedadMedia: number
  uvMax: number
}

export default function Inicio() {
  const [datos, setDatos] = useState<DatosAvamet>(AVAMET_MOCK)
  const [esMockAvamet, setEsMockAvamet] = useState(false)
  const [horarios, setHorarios] = useState<DatosHorarios | null>(null)
  const [avisos, setAvisos] = useState<EstadoAvisos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorTiempo, setErrorTiempo] = useState<string | null>(null)

  useEffect(() => {
    const avametPromise = fetch('/api/avamet', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`Error al cargar datos de AVAMET (${res.status})`)
        return res.json()
      })
      .then((data) => {
        setDatos({
          temp: data.temp ?? data.temperatura ?? 'N/D',
          humedad: data.humedad ?? 'N/D',
          viento: data.viento ?? 'N/D',
          direccion: data.direccion ?? 'N/D',
          lluvia: data.lluvia ?? 'N/D',
          presion: data.presion ?? 'N/D',
          tempMax: data.tempMax ?? 'N/D',
          tempMin: data.tempMin ?? 'N/D',
          actualizado: data.actualizado ?? 'N/D',
        })
        setEsMockAvamet(false)
      })
      .catch(() => {
        setDatos(AVAMET_MOCK)
        setEsMockAvamet(true)
      })

    fetch('/api/aemet')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar avisos de AEMET')
        return res.json()
      })
      .then((data: EstadoAvisos) => setAvisos(data))
      .catch(() => setAvisos({ tipo: 'ERROR', actualizado: new Date().toISOString(), detalle: 'No se pudo consultar AEMET.' }))

    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.418&longitude=0.425&hourly=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,uv_index&timezone=Europe%2FMadrid&forecast_days=3'

    const tiempoPromise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Error al cargar datos de Open-Meteo (${res.status})`)
        return res.json()
      })
      .then((data: { hourly: DatosHorarios }) => {
        setHorarios(data.hourly)
      })
      .catch((err) => {
        setErrorTiempo(err instanceof Error ? err.message : 'Error desconocido en Open-Meteo')
      })

    Promise.allSettled([avametPromise, tiempoPromise]).finally(() => {
      setCargando(false)
    })
  }, [])

  if (cargando) {
    return <p style={{ textAlign: 'center' }}>Cargando datos...</p>
  }

  const getFranjas = (): Franja[] => {
    if (!horarios) return []
    
    const ahora = new Date()
    const franjas: Franja[] = []
    
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
      
      const tempMedia = horasFranja.reduce((acc, { i }) => acc + (horarios.temperature_2m[i] ?? 0), 0) / horasFranja.length
      const precipTotal = horasFranja.reduce((acc, { i }) => acc + (horarios.precipitation[i] ?? 0), 0)
      const vientoMedio = horasFranja.reduce((acc, { i }) => acc + (horarios.wind_speed_10m[i] ?? 0), 0) / horasFranja.length
      const rachasMax = Math.max(...horasFranja.map(({ i }) => horarios.wind_gusts_10m[i] ?? 0))
      const humedadMedia = horasFranja.reduce((acc, { i }) => acc + (horarios.relative_humidity_2m[i] ?? 0), 0) / horasFranja.length
      const uvMax = Math.max(...horasFranja.map(({ i }) => horarios.uv_index[i] ?? 0))
      
      const icono = horasFranja[Math.floor(horasFranja.length / 2)].i

      franjas.push({
        nombre: nombreFranja,
        dia: fechaInicio.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        tempMedia,
        precipTotal,
        weather_code: horarios.weather_code[icono],
        vientoMedio,
        rachasMax,
        humedadMedia,
        uvMax
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
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '22px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
          Datos Actuales (AVAMET)
          {esMockAvamet && (
            <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 'normal', marginLeft: '8px' }}>
              (Datos de ejemplo)
            </span>
          )}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          <div>
            <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '4px' }}>Temperatura</p>
            <p style={{ fontSize: 'clamp(1.6rem, 6vw, 2rem)', fontWeight: 'bold' }}>{datos.temp}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '4px' }}>Humedad</p>
            <p style={{ fontSize: 'clamp(1.6rem, 6vw, 2rem)', fontWeight: 'bold' }}>{datos.humedad}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '4px' }}>Viento</p>
            <p style={{ fontSize: 'clamp(1.45rem, 5.2vw, 1.85rem)', fontWeight: 'bold' }}>
              {datos.viento}
              {datos.direccion && datos.direccion !== 'N/D' && !datos.viento.includes(datos.direccion) ? ` ${datos.direccion}` : ''}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '4px' }}>Lluvia</p>
            <p style={{ fontSize: 'clamp(1.6rem, 6vw, 2rem)', fontWeight: 'bold' }}>{datos.lluvia}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '4px' }}>Presión (hPa)</p>
            <p style={{ fontSize: 'clamp(1.6rem, 6vw, 2rem)', fontWeight: 'bold' }}>{datos.presion}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '4px' }}>Máx Registrada (ºC)</p>
            <p style={{ fontSize: 'clamp(1.6rem, 6vw, 2rem)', fontWeight: 'bold' }}>{datos.tempMax}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '4px' }}>Mín Registrada (ºC)</p>
            <p style={{ fontSize: 'clamp(1.6rem, 6vw, 2rem)', fontWeight: 'bold' }}>{datos.tempMin}</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '22px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Tiempo</h2>
        {errorTiempo ? (
          <p style={{ color: '#f39c12', fontSize: '0.95rem' }}>
            No se pudieron cargar los datos de Open-Meteo ({errorTiempo}).
          </p>
        ) : (
          <div className="card-container">
            {franjasMostrar.map((franja, i) => (
              <div key={i} style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--accent-color)', marginBottom: '10px' }}>
                  {franja.dia} - {franja.nombre}
                </div>
                <div className="card-row" style={{ fontSize: '1.05rem' }}>
                  <span style={{ fontSize: '1.7rem' }}>{getIcono(franja.weather_code)}</span>
                  <span style={{ fontSize: '1.2rem' }}><strong>{Math.round(franja.tempMedia)}°</strong></span>
                  <span>{franja.precipTotal.toFixed(1)} mm</span>
                  <span>💨 {Math.round(franja.vientoMedio)} km/h</span>
                  <span>Rachas: {Math.round(franja.rachasMax)} km/h</span>
                  <span>HR: {Math.round(franja.humedadMedia)}%</span>
                  <span>UV: {franja.uvMax.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Alertas y Consejos</h2>
        <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          {renderAvisos()}
        </div>
      </div>
      
      <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center', marginTop: '10px' }}>
        Actualizado: {datos.actualizado}
      </p>
    </div>
  )
}