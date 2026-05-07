import { describe, expect, it } from 'vitest'

import { sanitizeConfig } from './sanitize.js'

describe('sanitizeConfig', () => {
  it('should populate collectionsBySlug map from collections array', async () => {
    const config = await sanitizeConfig({
      collections: [
        { slug: 'posts', fields: [] },
        { slug: 'users', auth: true, fields: [] },
      ],
      globals: [{ slug: 'settings', fields: [] }],
    } as any)

    expect(config.collectionsBySlug).toEqual(expect.objectContaining({ posts: expect.any(Object) }))
    expect(Object.keys(config.collectionsBySlug).length).toBe(config.collections.length)
    expect(config.collectionsBySlug['posts']).toBe(
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

    expect(config.globalsBySlug).toEqual(expect.objectContaining({ settings: expect.any(Object) }))
    expect(Object.keys(config.globalsBySlug).length).toBe(config.globals.length)
    expect(config.globalsBySlug['settings']).toBe(config.globals.find((g) => g.slug === 'settings'))
  })
})
