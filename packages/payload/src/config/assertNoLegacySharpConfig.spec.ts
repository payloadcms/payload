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
