import { useState, useEffect, useRef } from 'react'
import Inicio from './screens/Inicio'
import Prevision from './screens/Prevision'
import Playas from './screens/Playas'
import { Analytics } from '@vercel/analytics/react';

const TABS = ['inicio', 'prevision', 'playas'] as const
type Tab = (typeof TABS)[number]

const FOTOS = [
  "https://upload.wikimedia.org/wikipedia/commons/6/67/Antiga_pres%C3%B3_de_Benicarl%C3%B3.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/e/e7/Esgl%C3%A9sia_de_Sant_Bartomeu.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/6/66/Casa_Marqu%C3%A9s_de_Benicarl%C3%B3.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/0/09/Ajuntament_de_Benicarl%C3%B3.webp",
  "https://upload.wikimedia.org/wikipedia/commons/c/c9/Estacionblo.jpg",
  "/assets/aistudio/42230594_2200784209962793_3410670032680648704_n_08595981.jpg",
  "/assets/aistudio/65482738_1237103823138152_4051430031702884352_n_e9b20897.jpg",
  "/assets/aistudio/65830724_2804326032941938_8242227431423868928_n_91e67df3.jpg",
  "/assets/aistudio/65961970_1237103806471487_716257389417857024_n_aa8dfeb6.jpg",
  "/assets/aistudio/830188050_1591793512993097_6114515605583001609_n_2eafba68.jpg"
]

export default function App() {
  const [tab, setTab] = useState<Tab>(() => {
    const guardado = localStorage.getItem('meteocaduf_tab')
    if (guardado === 'inicio' || guardado === 'prevision' || guardado === 'playas') {
      return guardado
    }
    return 'inicio'
  })
  const [fotoActual, setFotoActual] = useState(FOTOS[0])
  const [bannerInstalacion, setBannerInstalacion] = useState(false)
  const [eventoInstalacion, setEventoInstalacion] = useState<any>(null)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const bloqueandoScrollRef = useRef(false)
  const scrollTimerRef = useRef<number | null>(null)

  useEffect(() => {
    localStorage.setItem('meteocaduf_tab', tab)
  }, [tab])

  useEffect(() => {
    const random = Math.floor(Math.random() * FOTOS.length)
    setFotoActual(FOTOS[random])
  }, [])

  useEffect(() => {
    const manejarBeforeInstall = (e: Event) => {
      e.preventDefault()
      setEventoInstalacion(e)
      setBannerInstalacion(true)
    }

    window.addEventListener('beforeinstallprompt', manejarBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', manejarBeforeInstall)
  }, [])

  useEffect(() => {
    const manejarAppInstalled = () => {
      setBannerInstalacion(false)
      setEventoInstalacion(null)
    }

    window.addEventListener('appinstalled', manejarAppInstalled)
    return () => window.removeEventListener('appinstalled', manejarAppInstalled)
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

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const idx = TABS.indexOf(tab)
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'auto' })
  }, [])

  useEffect(() => {
    const manejarResize = () => {
      const el = carouselRef.current
      if (!el) return
      const idx = TABS.indexOf(tab)
      el.scrollTo({ left: idx * el.clientWidth, behavior: 'auto' })
    }
    window.addEventListener('resize', manejarResize)
    return () => window.removeEventListener('resize', manejarResize)
  }, [tab])

  const irAPestana = (nuevaTab: Tab) => {
    setTab(nuevaTab)
    const el = carouselRef.current
    if (!el) return
    const idx = TABS.indexOf(nuevaTab)
    bloqueandoScrollRef.current = true
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = window.setTimeout(() => {
      bloqueandoScrollRef.current = false
    }, 450)
  }

  const manejarScrollCarrusel = () => {
    if (bloqueandoScrollRef.current) return
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = window.setTimeout(() => {
      const el = carouselRef.current
      if (!el || el.clientWidth === 0) return
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      const nuevaTab = TABS[Math.max(0, Math.min(TABS.length - 1, idx))]
      if (nuevaTab !== tab) {
        setTab(nuevaTab)
      }
    }, 70)
  }

  return (
    <div className="app-container" style={{ backgroundImage: `url(${fotoActual})` }}>
      <div className="content">
        <header style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
          <h1 style={{ fontSize: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            MeteoCaduf
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Benicarló</p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
            <a 
              href="https://ko-fi.com/xanthar" 
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
                fontWeight: 'bold',
                position: 'relative',
                zIndex: 2,
                pointerEvents: 'auto',
                cursor: 'pointer'
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

        {bannerInstalacion && (
          <div
            style={{
              background: 'rgba(243, 156, 18, 0.2)',
              border: '1px solid var(--accent-color)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '15px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
              Instala MeteoCaduf en tu móvil para acceder más rápido
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  if (eventoInstalacion) {
                    eventoInstalacion.prompt()
                  }
                  setBannerInstalacion(false)
                }}
                style={{
                  background: 'var(--accent-color)',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Instalar
              </button>
              <button
                onClick={() => setBannerInstalacion(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div
          ref={carouselRef}
          className="tabs-carousel"
          onScroll={manejarScrollCarrusel}
        >
          <div className="tab-slide">
            <Inicio />
          </div>
          <div className="tab-slide">
            <Prevision />
          </div>
          <div className="tab-slide">
            <Playas />
          </div>
        </div>

        <p className="aviso-no-oficial">
          App meteorológica no oficial de carácter informativo.
        </p>
      </div>

      <nav className="bottom-nav">
        <button className={tab === 'inicio' ? 'active' : ''} onClick={() => irAPestana('inicio')}>
          Ahora
        </button>
        <button className={tab === 'prevision' ? 'active' : ''} onClick={() => irAPestana('prevision')}>
          Previsión
        </button>
        <button className={tab === 'playas' ? 'active' : ''} onClick={() => irAPestana('playas')}>
          Playas
        </button>
      </nav>
      <Analytics />
    </div>
  )
}