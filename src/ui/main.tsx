import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Panel } from '../features/open-plugin-panel'
import { TranslationProvider } from '../shared/i18n'
import '../shared/styles/global.css'

// Create root element if it doesn't exist
let rootElement = document.getElementById('root')
if (!rootElement) {
  rootElement = document.createElement('div')
  rootElement.id = 'root'
  document.body.appendChild(rootElement)
}

createRoot(rootElement).render(
  <StrictMode>
    <TranslationProvider>
      <Panel />
    </TranslationProvider>
  </StrictMode>
)
