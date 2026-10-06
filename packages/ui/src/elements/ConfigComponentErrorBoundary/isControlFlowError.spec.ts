import { expect, test } from 'vitest'

import { isControlFlowError } from './isControlFlowError.js'

test.each([
  { isRedirect: true },
  { isNotFound: true },
  new Error('not-found'),
  new Error('redirect:/admin'),
])('should recognize navigation signals used by the TanStack adapters', (error) => {
  expect(isControlFlowError({ error })).toBe(true)
})

test.each([
  null,
  'Configured component failed',
  new Error('Configured component failed'),
  { digest: '1335636757' },
  { isRedirect: false, isNotFound: false },
])('should isolate ordinary component failures', (error) => {
  expect(isControlFlowError({ error })).toBe(false)
})
