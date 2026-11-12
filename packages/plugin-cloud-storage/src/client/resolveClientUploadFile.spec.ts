import { describe, expect, it } from 'vitest'

import { resolveClientUploadFile } from './resolveClientUploadFile.js'

describe('resolveClientUploadFile', () => {
  it.each([
    ['empty', ''],
    ['generic', 'application/octet-stream'],
  ])('should derive the type from the extension for a file with an %s type', (_, type) => {
    const file = new File(['content'], 'clip.mov', { lastModified: 1234, type })

    const resolved = resolveClientUploadFile(file)

    expect(resolved.type).toBe('video/quicktime')
    expect(resolved.name).toBe('clip.mov')
    expect(resolved.size).toBe(file.size)
    expect(resolved.lastModified).toBe(1234)
  })

  it('should match the extension case-insensitively', () => {
    expect(resolveClientUploadFile(new File(['x'], 'PHOTO.JPG')).type).toBe('image/jpeg')
  })

  it('should keep a type the browser identified, even if the extension disagrees', () => {
    const file = new File(['x'], 'clip.mov', { type: 'image/png' })

    expect(resolveClientUploadFile(file)).toBe(file)
  })

  it.each([
    ['an unknown extension', 'archive.xyz'],
    ['no extension', 'README'],
  ])('should leave a file with %s unchanged', (_, name) => {
    const file = new File(['x'], name, { type: 'application/octet-stream' })

    expect(resolveClientUploadFile(file)).toBe(file)
  })
})
