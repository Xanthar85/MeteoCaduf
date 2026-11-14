import { useState, useEffect } from 'react'
import Inicio from './screens/Inicio'
import Prevision from './screens/Prevision'
import Playas from './screens/Playas'

const FOTOS = [
  "https://upload.wikimedia.org/wikipedia/commons/6/67/Antiga_pres%C3%B3_de_Benicarl%C3%B3.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/e/e7/Esgl%C3%A9sia_de_Sant_Bartomeu.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/6/66/Casa_Marqu%C3%A9s_de_Benicarl%C3%B3.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/0/09/Ajuntament_de_Benicarl%C3%B3.webp",
  "https://upload.wikimedia.org/wikipedia/commons/c/c9/Estacionblo.jpg"
]

export default function App() {
  const [tab, setTab] = useState<'inicio' | 'prevision' | 'playas'>('inicio')
  const [fotoActual, setFotoActual] = useState(FOTOS[0])

  useEffect(() => {
    const random = Math.floor(Math.random() * FOTOS.length)
    setFotoActual(FOTOS[random])
  }, [])

  const compartirApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MeteoCaduf',
        text: 'Mira el tiempo en Benicarló con MeteoCaduf',
        url: window.location.origin,
      }).catch((error) => console.log('Error al compartir', error));
    } else {
      alert('Tu navegador no soporta la función de compartir. Puedes copiar la URL: ' + window.location.origin);
    }
  };

  return (
    <div className="app-container" style={{ backgroundImage: `url(${fotoActual})` }}>
      <div className="content">
        <header style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
          <h1 style={{ fontSize: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            MeteoCaduf
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Benicarló</p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <a 
              href="https://ko-fi.com/Xanthar85" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(243, 156, 18, 0.2)',
                border: '1px solid var(--accent-color)',
                color: 'var(--accent-color)',
                padding: '8px 16px',
                borderRadius: '20px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}
            >
              ☕ Apoya a MeteoCaduf
            </a>
          </div>
          
          <button 
            onClick={compartirApp} 
            style={{ 
              position: 'absolute', 
              top: '0', 
              right: '0', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              padding: '5px'
            }}
            title="Compartir app"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
        </header>

        {tab === 'inicio' && <Inicio />}
        {tab === 'prevision' && <Prevision />}
        {tab === 'playas' && <Playas />}
      </div>

      <nav className="bottom-nav">
        <button className={tab === 'inicio' ? 'active' : ''} onClick={() => setTab('inicio')}>
          Ahora
        </button>
        <button className={tab === 'prevision' ? 'active' : ''} onClick={() => setTab('prevision')}>
          Previsión
        </button>
        <button className={tab === 'playas' ? 'active' : ''} onClick={() => setTab('playas')}>
          Playas
        </button>
      </nav>
    </div>
  )
}