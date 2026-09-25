import { describe, expect, it } from 'vitest'

import { createManagedFileManifest, hasManagedFile } from './manifest.js'

describe('createManagedFileManifest', () => {
  it('should keep original and default roles on one physical object', () => {
    const manifest = createManagedFileManifest({
      references: [
        {
          storageBackendId: 'local:media',
          key: 'media/photo-original.jpg',
          role: { type: 'original' },
        },
        {
          storageBackendId: 'local:media',
          key: 'media/photo-original.jpg',
          role: { type: 'default' },
        },
      ],
    })

    expect(manifest).toEqual([
      {
        storageBackendId: 'local:media',
        key: 'media/photo-original.jpg',
        roles: [{ type: 'original' }, { type: 'default' }],
      },
    ])
  })

  it('should retain a separate managed thumbnail', () => {
    const manifest = createManagedFileManifest({
      references: [
        { storageBackendId: 's3:media', key: 'media/photo.jpg', role: { type: 'default' } },
        { storageBackendId: 's3:media', key: 'media/photo-thumb.jpg', role: { type: 'thumbnail' } },
      ],
    })

    expect(manifest).toHaveLength(2)
    expect(manifest[1]?.roles).toEqual([{ type: 'thumbnail' }])
  })

  it('should distinguish identical keys in different configured storage locations', () => {
    const manifest = createManagedFileManifest({
      references: [
        { storageBackendId: 's3:private', key: 'photo.jpg', role: { type: 'original' } },
        { storageBackendId: 's3:public', key: 'photo.jpg', role: { type: 'original' } },
      ],
    })

    expect(manifest).toHaveLength(2)
    expect(hasManagedFile({ manifest, storageBackendId: 's3:private', key: 'photo.jpg' })).toBe(
      true,
    )
    expect(hasManagedFile({ manifest, storageBackendId: 's3:other', key: 'photo.jpg' })).toBe(false)
  })

  it('should preserve saved size keys even when the collection configuration changes', () => {
    const manifest = createManagedFileManifest({
      references: [
        {
          storageBackendId: 'local:media',
          key: 'photo-card.jpg',
          role: { type: 'size', sizeKey: 'card' },
        },
        {
          storageBackendId: 'local:media',
          key: 'photo-card.jpg',
          role: { type: 'size', sizeKey: 'legacy' },
        },
        {
          storageBackendId: 'local:media',
          key: 'photo-card.jpg',
          role: { type: 'size', sizeKey: 'card' },
        },
      ],
    })

    expect(manifest).toEqual([
      {
        storageBackendId: 'local:media',
        key: 'photo-card.jpg',
        roles: [
          { type: 'size', sizeKey: 'card' },
          { type: 'size', sizeKey: 'legacy' },
        ],
      },
    ])
  })

  it('should retain complete storage keys without using display URLs as ownership', () => {
    const manifest = createManagedFileManifest({
      references: [
        { storageBackendId: 's3:media', key: 'media/2026/photo.jpg', role: { type: 'original' } },
        { storageBackendId: 's3:media', key: 'media/2026/photo.jpg', role: { type: 'default' } },
      ],
    })

    expect(manifest).toEqual([
      {
        storageBackendId: 's3:media',
        key: 'media/2026/photo.jpg',
        roles: [{ type: 'original' }, { type: 'default' }],
      },
    ])
  })

  it.each([
    '../photo.jpg',
    '/photo.jpg',
    'media//photo.jpg',
    'media/../../photo.jpg',
    'media\\photo.jpg',
  ])('should reject unsafe managed key %s', (key) => {
    expect(() =>
      createManagedFileManifest({
        references: [{ storageBackendId: 'local:media', key, role: { type: 'original' } }],
      }),
    ).toThrow()
  })
})
