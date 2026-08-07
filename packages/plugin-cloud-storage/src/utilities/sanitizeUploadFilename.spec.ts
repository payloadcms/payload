import { describe, expect, it } from 'vitest'

import { sanitizeUploadFilename } from './sanitizeUploadFilename.js'

describe('sanitizeUploadFilename', () => {
  it('removes illegal characters and preserves extension', () => {
    expect(sanitizeUploadFilename('Baustelle4:5.png')).toBe('Baustelle45.png')
    expect(sanitizeUploadFilename('file?with*illegal<chars>.png')).toBe(
      'filewithillegalchars.png',
    )
    expect(sanitizeUploadFilename('path/name.png')).toBe('name.png')
    expect(sanitizeUploadFilename('normal-file.png')).toBe('normal-file.png')
  })

  it('strips trailing dots and spaces from the base name', () => {
    expect(sanitizeUploadFilename('file.  .png')).toBe('file.png')
  })

  it('handles files without an extension', () => {
    expect(sanitizeUploadFilename('test:file')).toBe('testfile')
  })
})
