// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - need to do this because this file doesn't actually exist
import React from 'react'
import { createRoot } from 'react-dom/client'

import Root from './Root'

const container = document.getElementById('app')
const root = createRoot(container) // createRoot(container!) if you use TypeScript
root.render(<Root />)

// Needed for Hot Module Replacement
if (
  typeof module !== 'undefined' &&
  module &&
  'hot' in module &&
  typeof module.hot === 'object' &&
  'accept' in module.hot &&
  typeof module.hot.accept === 'function'
) {
  module.hot.accept()
}
