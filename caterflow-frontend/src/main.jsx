import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CateringManagement from './catering-management.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CateringManagement />
  </StrictMode>,
)