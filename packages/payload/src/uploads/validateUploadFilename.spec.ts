import { describe, expect, it } from 'vitest'

import { validateUploadFilename } from './validateUploadFilename.js'

describe('validateUploadFilename', () => {
  it.each([
    '../document.pdf',
    'archive/../document.pdf',
    '..\\document.pdf',
    'archive\\..\\document.pdf',
    '/archive/document.pdf',
    'C:\\archive\\document.pdf',
  ])('rejects non-contained filename %s', (filename) => {
    expect(validateUploadFilename(filename, {} as never)).toBe('Invalid filename')
  })

  it.each(['document.pdf', 'tenant/document.pdf', 'tenant\\document.pdf', 'summary..pdf'])(
    'accepts contained filename %s',
    (filename) => {
      expect(validateUploadFilename(filename, {} as never)).toBe(true)
    },
  )
})
