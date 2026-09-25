import { describe, expect, it } from 'vitest'

import {
  assertStorageDestinationAvailable,
  getArchivedFilename,
  getBaseFilenameFromOriginal,
  getOriginalFilename,
  joinStorageKey,
} from './naming.js'

describe('file version naming', () => {
  it.each([
    ['photo.jpg', 'photo-original.jpg'],
    ['report', 'report-original'],
    ['archive.tar.gz', 'archive.tar-original.gz'],
    ['café.写真.png', 'café.写真-original.png'],
    ['photo-original.jpg', 'photo-original-original.jpg'],
  ])('should preserve the base name when adding an original marker to %s', (name, original) => {
    expect(getOriginalFilename({ filename: name })).toBe(original)
    expect(getBaseFilenameFromOriginal({ filename: original })).toBe(name)
  })

  it('should insert a version suffix before the extension', () => {
    expect(getArchivedFilename({ filename: 'archive.tar-original.gz', versionID: 'abc123' })).toBe(
      'archive.tar-original-abc123.gz',
    )
    expect(getArchivedFilename({ filename: 'report', versionID: 42 })).toBe('report-42')
  })

  it('should encode unsafe version IDs without creating a path', () => {
    const archived = getArchivedFilename({ filename: 'photo.jpg', versionID: 'a/b' })

    expect(archived).toMatch(/^photo-~[A-Za-z0-9_-]+\.jpg$/)
    expect(archived).not.toBe(getArchivedFilename({ filename: 'photo.jpg', versionID: 'a-b' }))
    expect(archived).not.toBe(getArchivedFilename({ filename: 'photo.jpg', versionID: 'a_b' }))
  })

  it('should normalize a storage prefix once', () => {
    expect(joinStorageKey({ filename: 'café.jpg', prefix: 'media//2026/' })).toBe(
      'media/2026/café.jpg',
    )
  })

  it.each(['../photo.jpg', '/photo.jpg', 'nested/photo.jpg', 'nested\\photo.jpg', ''])(
    'should reject an unsafe display filename %s',
    (filename) => {
      expect(() => getOriginalFilename({ filename })).toThrow()
    },
  )

  it('should reject a destination collision in the same backend', () => {
    expect(() =>
      assertStorageDestinationAvailable({
        backend: 's3:media',
        destination: 'media/photo.jpg',
        occupied: [{ backend: 's3:media', key: 'media//photo.jpg' }],
      }),
    ).toThrow()
  })

  it('should permit the same key in another backend', () => {
    expect(() =>
      assertStorageDestinationAvailable({
        backend: 's3:public',
        destination: 'media/photo.jpg',
        occupied: [{ backend: 's3:private', key: 'media/photo.jpg' }],
      }),
    ).not.toThrow()
  })
})
