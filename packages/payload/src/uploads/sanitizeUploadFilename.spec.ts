import { describe, expect, it } from 'vitest'

import { sanitizeUploadFilename } from './sanitizeUploadFilename.js'

describe('sanitizeUploadFilename', () => {
  it('should remove illegal characters and preserve the extension', () => {
    expect(sanitizeUploadFilename('Baustelle4:5.png')).toBe('Baustelle45.png')
    expect(sanitizeUploadFilename('file?with*illegal<chars>.png')).toBe('filewithillegalchars.png')
    expect(sanitizeUploadFilename('normal-file.png')).toBe('normal-file.png')
  })

  it('should strip trailing dots and spaces from the base name', () => {
    expect(sanitizeUploadFilename('file.  .png')).toBe('file.png')
  })

  it('should handle files without an extension', () => {
    expect(sanitizeUploadFilename('test:file')).toBe('testfile')
  })

  it('should strip `?...` query suffix from the extension (mirrors generateFileData)', () => {
    expect(sanitizeUploadFilename('file.png?foo')).toBe('file.png')
    expect(sanitizeUploadFilename('image.jpg?version=2')).toBe('image.jpg')
    expect(sanitizeUploadFilename('doc.pdf?')).toBe('doc.pdf')
  })

  it('should handle filenames with multiple dots', () => {
    expect(sanitizeUploadFilename('archive.tar.gz')).toBe('archive.tar.gz')
  })

  it('should handle filenames with path separators by removing them', () => {
    expect(sanitizeUploadFilename('path/name.png')).toBe('pathname.png')
  })
})
