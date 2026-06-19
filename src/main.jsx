import React from 'react'
import ReactDOM from 'react-dom/client'
import LegalProcessDashboardV3 from './legal_process_v3_com_settings.jsx'

// Keep-alive: Mantém backend acordado a cada 10 minutos
setInterval(async () => {
  try {
    const backendUrl = localStorage.getItem('backendUrlV3') || 'http://localhost:3001'
    await fetch(`${backendUrl}/health`)
  } catch (error) {
    // Silenciosamente ignora erros
  }
}, 600000) // 10 minutos

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LegalProcessDashboardV3 />
  </React.StrictMode>,
)
