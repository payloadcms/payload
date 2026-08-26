import { describe, expect, it } from 'vitest'

import type { Config } from './types.js'

import { assertNoLegacySharpConfig } from './assertNoLegacySharpConfig.js'

describe('assertNoLegacySharpConfig', () => {
  it('should throw when the top-level sharp option is present', () => {
    const config = { collections: [], sharp: {} } as unknown as Config

    expect(() => assertNoLegacySharpConfig({ config })).toThrow(/sharp/i)
  })

  it('should throw when a collection uses a removed Sharp-specific upload option', () => {
    const config = {
      collections: [
        {
          slug: 'media',
          upload: { resizeOptions: { width: 100 } },
        },
      ],
    } as unknown as Config

    expect(() => assertNoLegacySharpConfig({ config })).toThrow(/resizeOptions/)
  })

  it.each(['constructorOptions', 'formatOptions', 'trimOptions', 'withMetadata'])(
    'should throw when a collection uses the removed %s upload option',
    (field) => {
      const config = {
        collections: [{ slug: 'media', upload: { [field]: {} } }],
      } as unknown as Config

      expect(() => assertNoLegacySharpConfig({ config })).toThrow(new RegExp(field))
    },
  )

  it('should not throw for a config with no legacy Sharp options', () => {
    const config = {
      collections: [{ slug: 'media', upload: { imageSizes: [] } }],
    } as unknown as Config

    expect(() => assertNoLegacySharpConfig({ config })).not.toThrow()
  })

  it('should throw when a collection declares imageSizes but no transformer is registered', () => {
    const config = {
      collections: [{ slug: 'media', upload: { imageSizes: [{ name: 'thumbnail' }] } }],
    } as unknown as Config

    expect(() => assertNoLegacySharpConfig({ config })).toThrow(/imageSizes/)
  })

  it('should not throw when a collection declares imageSizes and a transformer is registered', () => {
    const config = {
      collections: [{ slug: 'media', upload: { imageSizes: [{ name: 'thumbnail' }] } }],
      upload: { transformers: [{ mimeTypes: ['image/*'], slug: 'sharp' }] },
    } as unknown as Config

    expect(() => assertNoLegacySharpConfig({ config })).not.toThrow()
  })

  it('should report every violation across multiple collections in a single error', () => {
    const config = {
      collections: [
        { slug: 'media-a', upload: { resizeOptions: {} } },
        { slug: 'media-b', upload: { formatOptions: {} } },
      ],
    } as unknown as Config

    let thrownMessage = ''

    try {
      assertNoLegacySharpConfig({ config })
    } catch (error) {
      thrownMessage = (error as Error).message
    }

    expect(thrownMessage).toContain('media-a')
    expect(thrownMessage).toContain('resizeOptions')
    expect(thrownMessage).toContain('media-b')
    expect(thrownMessage).toContain('formatOptions')
  })

  it('should not throw when a collection has no upload config', () => {
    const config = { collections: [{ slug: 'pages' }] } as unknown as Config

    expect(() => assertNoLegacySharpConfig({ config })).not.toThrow()
  })

  it('should not throw when a collection upload is a boolean', () => {
    const config = { collections: [{ slug: 'media', upload: true }] } as unknown as Config

    expect(() => assertNoLegacySharpConfig({ config })).not.toThrow()
  })

  it('should not throw when there are no collections', () => {
    const config = {} as unknown as Config

    expect(() => assertNoLegacySharpConfig({ config })).not.toThrow()
  })
})
