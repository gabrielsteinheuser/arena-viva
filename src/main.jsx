import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import './styles.css'

const Landing = lazy(() => import('./landing/Landing.jsx'))
const PainelApp = lazy(() => import('./painel/PainelApp.jsx'))

// Com VITE_DEFAULT_ARENA_SLUG definido, a raiz do site mostra a LP dessa arena
// (útil quando cada arena usa o próprio domínio).
const defaultSlug = import.meta.env.VITE_DEFAULT_ARENA_SLUG

function Home() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><span>AV</span><i></i></div>
          <div><strong>ARENA VIVA</strong><small>GESTÃO ESPORTIVA</small></div>
        </div>
        <h1>Reservas online para arenas esportivas</h1>
        <p className="auth-text">Página de reservas para seus clientes e painel completo para sua operação.</p>
        <Link className="primary" to="/painel">Acessar o painel</Link>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={defaultSlug ? <Landing slug={defaultSlug}/> : <Home/>}/>
          <Route path="/painel/*" element={<PainelApp/>}/>
          <Route path="/:slug" element={<Landing/>}/>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
