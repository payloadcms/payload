import { describe, expect, it } from 'vitest'

import { createManagedFileManifest, hasManagedFile } from './manifest.js'

describe('createManagedFileManifest', () => {
  it('should keep original and default roles on one physical object', () => {
    const manifest = createManagedFileManifest({
      references: [
        { backend: 'local:media', key: 'media/photo-original.jpg', role: { type: 'original' } },
        { backend: 'local:media', key: 'media/photo-original.jpg', role: { type: 'default' } },
      ],
    })

    expect(manifest).toEqual([
      {
        backend: 'local:media',
        key: 'media/photo-original.jpg',
        roles: [{ type: 'original' }, { type: 'default' }],
      },
    ])
  })

  it('should retain a separate managed thumbnail', () => {
    const manifest = createManagedFileManifest({
      references: [
        { backend: 's3:media', key: 'media/photo.jpg', role: { type: 'default' } },
        { backend: 's3:media', key: 'media/photo-thumb.jpg', role: { type: 'thumbnail' } },
      ],
    })

    expect(manifest).toHaveLength(2)
    expect(manifest[1]?.roles).toEqual([{ type: 'thumbnail' }])
  })

  it('should distinguish identical keys in different configured backends', () => {
    const manifest = createManagedFileManifest({
      references: [
        { backend: 's3:private', key: 'photo.jpg', role: { type: 'original' } },
        { backend: 's3:public', key: 'photo.jpg', role: { type: 'original' } },
      ],
    })

    expect(manifest).toHaveLength(2)
    expect(hasManagedFile({ manifest, backend: 's3:private', key: 'photo.jpg' })).toBe(true)
    expect(hasManagedFile({ manifest, backend: 's3:other', key: 'photo.jpg' })).toBe(false)
  })

  it('should preserve saved size keys even when the collection configuration changes', () => {
    const manifest = createManagedFileManifest({
      references: [
        { backend: 'local:media', key: 'photo-card.jpg', role: { type: 'size', sizeKey: 'card' } },
        {
          backend: 'local:media',
          key: 'photo-card.jpg',
          role: { type: 'size', sizeKey: 'legacy' },
        },
        { backend: 'local:media', key: 'photo-card.jpg', role: { type: 'size', sizeKey: 'card' } },
      ],
    })

    expect(manifest).toEqual([
      {
        backend: 'local:media',
        key: 'photo-card.jpg',
        roles: [
          { type: 'size', sizeKey: 'card' },
          { type: 'size', sizeKey: 'legacy' },
        ],
      },
    ])
  })

  it('should normalize complete keys without using display URLs as ownership', () => {
    const manifest = createManagedFileManifest({
      references: [
        { backend: 's3:media', key: 'media//2026/photo.jpg', role: { type: 'original' } },
        { backend: 's3:media', key: 'media/2026/photo.jpg', role: { type: 'default' } },
      ],
    })

    expect(manifest).toEqual([
      {
        backend: 's3:media',
        key: 'media/2026/photo.jpg',
        roles: [{ type: 'original' }, { type: 'default' }],
      },
    ])
  })

  it.each(['../photo.jpg', '/photo.jpg', 'media/../../photo.jpg', 'media\\photo.jpg'])(
    'should reject unsafe managed key %s',
    (key) => {
      expect(() =>
        createManagedFileManifest({
          references: [{ backend: 'local:media', key, role: { type: 'original' } }],
        }),
      ).toThrow()
    },
  )
})
