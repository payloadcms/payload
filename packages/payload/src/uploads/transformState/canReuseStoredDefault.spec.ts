import { describe, expect, it } from 'vitest'

import { canReuseStoredDefault } from './canReuseStoredDefault.js'

describe('materialized representation ownership', () => {
  it('should trust an explicit default role even when the original shares its bytes', () => {
    expect(
      canReuseStoredDefault({
        doc: {
          filename: 'a.png',
          original: { filename: 'a.png' },
          _managedFiles: [
            {
              key: 'a.png',
              storageBackendId: 'local:media',
              roles: [{ type: 'original' }, { type: 'default' }],
            },
          ],
        },
      }),
    ).toBe(true)
  })
  it('should require a size role for a requested variant', () => {
    const doc = {
      filename: 'a.png',
      variants: { small: { filename: 'small.png' } },
      _managedFiles: [
        { key: 'a.png', storageBackendId: 'local:media', roles: [{ type: 'default' }] },
      ],
    }

    expect(canReuseStoredDefault({ doc, filename: 'small.png' })).toBe(false)
  })
  it('should not infer ownership from logical filenames or URLs', () => {
    expect(
      canReuseStoredDefault({
        doc: {
          filename: 'default.png',
          original: { filename: 'a.png' },
          _managedFiles: [
            { key: 'a.png', storageBackendId: 'local:media', roles: [{ type: 'original' }] },
          ],
        },
      }),
    ).toBe(false)
  })
})
