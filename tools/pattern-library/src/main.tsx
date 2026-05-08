import '@fontsource-variable/inter'
import '@fontsource/roboto-mono'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- pattern library intentionally imports UI source directly
import '../../../packages/ui/src/styles.css'
import './app.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
