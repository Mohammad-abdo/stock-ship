import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
///new
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" richColors />
  </StrictMode>,
)
