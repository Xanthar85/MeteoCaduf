import { useState, useEffect } from 'react'

type DatosAvamet = {
  temperatura: string
  humedad: string
  viento: string
  lluvia: string
  actualizado: string
}

export default function Inicio() {
  const [datos, setDatos] = useState<DatosAvamet | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/avamet')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar datos de AVAMET')
        return res.json()
      })
      .then((data: DatosAvamet) => {
        setDatos(data)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [])

  if (cargando) {
    return <p style={{ textAlign: 'center' }}>Cargando datos de AVAMET...</p>
  }

  if (error) {
    return <p style={{ textAlign: 'center', color: '#f39c12' }}>{error}</p>
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
      
      <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center', marginTop: '10px' }}>
        Actualizado: {datos ? new Date(datos.actualizado).toLocaleString() : 'N/D'}
      </p>
    </div>
  )
}
