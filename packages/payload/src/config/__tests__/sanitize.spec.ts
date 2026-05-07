import { describe, expect, it } from 'vitest'

import { sanitizeConfig } from '../sanitize.js'

describe('sanitizeConfig', () => {
  it('should populate collectionsBySlug map from collections array', async () => {
    const config = await sanitizeConfig({
      collections: [
        { slug: 'posts', fields: [] },
        { slug: 'users', auth: true, fields: [] },
      ],
      globals: [{ slug: 'settings', fields: [] }],
    } as any)

    expect(config.collectionsBySlug).toBeInstanceOf(Map)
    expect(config.collectionsBySlug.size).toBe(config.collections.length)
    expect(config.collectionsBySlug.get('posts')).toBe(
      config.collections.find((c) => c.slug === 'posts'),
    )
  })

  it('should populate globalsBySlug map from globals array', async () => {
    const config = await sanitizeConfig({
      collections: [],
      globals: [
        { slug: 'settings', fields: [] },
        { slug: 'nav', fields: [] },
      ],
    } as any)

    expect(config.globalsBySlug).toBeInstanceOf(Map)
    expect(config.globalsBySlug.size).toBe(config.globals.length)
    expect(config.globalsBySlug.get('settings')).toBe(
      config.globals.find((g) => g.slug === 'settings'),
    )
  })
})
