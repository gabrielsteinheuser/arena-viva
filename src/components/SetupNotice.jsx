export default function SetupNotice() {
  return (
    <div className="auth-screen">
      <div className="auth-card setup-card">
        <h1>Configure o Supabase</h1>
        <p className="auth-text">Crie o arquivo <code>.env.local</code> na raiz do projeto (veja <code>.env.example</code>) e reinicie o <code>npm run dev</code>:</p>
        <pre>{'VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...'}</pre>
        <p className="auth-text">O passo a passo completo está no README, em “Configurando o Supabase”.</p>
      </div>
    </div>
  )
}
