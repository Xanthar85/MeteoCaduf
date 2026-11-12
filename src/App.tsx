// src/App.tsx
import { useState, useEffect } from 'react'
import Inicio from './screens/Inicio'
import Prevision from './screens/Prevision'
import Playas from './screens/Playas'

const FOTOS = [
  "https://upload.wikimedia.org/wikipedia/commons/6/67/Antiga_pres%C3%B3_de_Benicarl%C3%B3.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/e/e7/Esgl%C3%A9sia_de_Sant_Bartomeu.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/6/66/Casa_Marqu%C3%A9s_de_Benicarl%C3%B3.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/5/59/Escudo_de_Benicarl%C3%B3_%28Piferrer%2C_1860%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/0/09/Ajuntament_de_Benicarl%C3%B3.webp",
  "https://upload.wikimedia.org/wikipedia/commons/c/c9/Estacionblo.jpg"
]

type Tab = 'inicio' | 'prevision' | 'playas'

const tabDesdeHash = (): Tab => {
  const h = window.location.hash.replace('#', '')
  if (h === 'prevision' || h === 'playas' || h === 'inicio') return h
  return 'inicio'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabDesdeHash())
  const [fotoActual, setFotoActual] = useState(FOTOS[0])

  useEffect(() => {
    const random = Math.floor(Math.random() * FOTOS.length)
    setFotoActual(FOTOS[random])
  }, [])

  useEffect(() => {
    const onHash = () => setTab(tabDesdeHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const cambiarTab = (nuevo: Tab) => {
    setTab(nuevo)
    window.location.hash = nuevo
  }

  return (
    <div className="app-container" style={{ backgroundImage: `url(${fotoActual})` }}>
      <div className="content">
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            MeteoCaduf
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Benicarló</p>
        </header>

        {tab === 'inicio' && <Inicio />}
        {tab === 'prevision' && <Prevision />}
        {tab === 'playas' && <Playas />}
      </div>

      <nav className="bottom-nav">
        <button className={tab === 'inicio' ? 'active' : ''} onClick={() => cambiarTab('inicio')}>
          Ahora
        </button>
        <button className={tab === 'prevision' ? 'active' : ''} onClick={() => cambiarTab('prevision')}>
          Previsión
        </button>
        <button className={tab === 'playas' ? 'active' : ''} onClick={() => cambiarTab('playas')}>
          Playas
        </button>
      </nav>
    </div>
  )
}
// src/App.tsx