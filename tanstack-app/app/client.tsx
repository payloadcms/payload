import { StartClient } from '@tanstack/react-start'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

import { getRouter } from './router.js'

const router = getRouter()

hydrateRoot(
  document,
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>,
)
