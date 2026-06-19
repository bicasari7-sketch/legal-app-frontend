import React from 'react'
import ReactDOM from 'react-dom/client'
import LegalProcessDashboardV3 from './legal_process_v3_com_settings.jsx'

// Keep-alive FORTE: Mantém backend acordado
let keepAliveInterval = null;

function startKeepAlive() {
  if (keepAliveInterval) return; // Não duplicar
  
  // A cada 30 segundos, faz ping no backend
  keepAliveInterval = setInterval(async () => {
    try {
      const backendUrl = localStorage.getItem('backendUrlV3') || 'http://localhost:3001'
      await fetch(`${backendUrl}/health`, { method: 'GET' })
    } catch (error) {
      // Ignora erros
    }
  }, 30000) // 30 segundos (muito mais frequente!)
}

// Inicia keep-alive quando app carrega
startKeepAlive()

// Se página fica inativa, para keep-alive
// Se volta a ser ativa, reinicia
document.addEventListener('visibilitychange', () => {
  if (document.visible) {
    startKeepAlive()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LegalProcessDashboardV3 />
  </React.StrictMode>,
)
