import { describe, expect, it } from 'vitest'

import { getFileTypeFallback } from './getFileTypeFallback.js'

describe('getFileTypeFallback', () => {
  it('should use application/pdf for PDF files', () => {
    expect(getFileTypeFallback('document.pdf')).toStrictEqual({
      ext: 'pdf',
      mime: 'application/pdf',
    })
  })

  it('should fall back to text/plain for unknown extensions', () => {
    expect(getFileTypeFallback('file.unknown')).toStrictEqual({
      ext: 'unknown',
      mime: 'text/plain',
    })
  })
})
