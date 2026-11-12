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

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const tabDesdeHash = (): Tab => {
  const h = window.location.hash.replace('#', '')
  if (h === 'prevision' || h === 'playas' || h === 'inicio') return h
  return 'inicio'
}

const esIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
const esStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true

export default function App() {
  const [tab, setTab] = useState<Tab>(tabDesdeHash())
  const [fotoActual, setFotoActual] = useState(FOTOS[0])
  const [promptInstalacion, setPromptInstalacion] = useState<BeforeInstallPromptEvent | null>(null)
  const [mostrarInstalar, setMostrarInstalar] = useState(false)
  const [modoIOS, setModoIOS] = useState(false)

  useEffect(() => {
    const random = Math.floor(Math.random() * FOTOS.length)
    setFotoActual(FOTOS[random])
  }, [])

  useEffect(() => {
    const onHash = () => setTab(tabDesdeHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (esStandalone()) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setPromptInstalacion(e as BeforeInstallPromptEvent)
      setMostrarInstalar(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    if (esIOS()) {
      setModoIOS(true)
      setMostrarInstalar(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  const instalar = async () => {
    if (modoIOS) {
      return
    }
    if (!promptInstalacion) return
    await promptInstalacion.prompt()
    const eleccion = await promptInstalacion.userChoice
    if (eleccion.outcome === 'accepted') {
      setMostrarInstalar(false)
    }
    setPromptInstalacion(null)
  }

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
          <a
            href="https://ko-fi.com/xanthar"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '8px',
              fontSize: '0.75rem',
              color: 'var(--accent-color)',
              textDecoration: 'none',
              padding: '4px 10px',
              border: '1px solid var(--accent-color)',
              borderRadius: '12px',
              opacity: 0.9,
            }}
          >
            ☕ Apoya a MeteoCaduf
          </a>
        </header>

        {tab === 'inicio' && <Inicio />}
        {tab === 'prevision' && <Prevision />}
        {tab === 'playas' && <Playas />}
      </div>

      {mostrarInstalar && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid var(--accent-color)',
            borderRadius: '12px',
            padding: '25px',
            maxWidth: '360px',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--accent-color)' }}>
              Instala MeteoCaduf
            </h2>
            {modoIOS ? (
              <p style={{ fontSize: '0.9rem', marginBottom: '15px', lineHeight: 1.5 }}>
                Pulsa <strong>Compartir</strong> (el cuadrado con la flecha) y luego <strong>Añadir a pantalla de inicio</strong>.
              </p>
            ) : (
              <p style={{ fontSize: '0.9rem', marginBottom: '15px', lineHeight: 1.5 }}>
                Tenla siempre a mano en tu escritorio, sin abrir el navegador.
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setMostrarInstalar(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--text-color)',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Ahora no
              </button>
              {!modoIOS && (
                <button
                  onClick={instalar}
                  style={{
                    background: 'var(--accent-color)',
                    color: '#1a1a1a',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}
                >
                  Instalar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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