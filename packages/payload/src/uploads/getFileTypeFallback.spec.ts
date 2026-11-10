import { describe, expect, it } from 'vitest'

import { getFileTypeFallback } from './getFileTypeFallback.js'

describe('getFileTypeFallback', () => {
  it('should map PDF filenames to application/pdf', () => {
    expect(getFileTypeFallback('document.pdf')).toStrictEqual({
      ext: 'pdf',
      mime: 'application/pdf',
    })
  })
})
