import { describe, expect, it } from 'vitest'

import { serializeConfig } from './serializeConfig.js'

describe('serializeConfig', () => {
  it('should serialize a collection with drafts and localized fields', () => {
    const result = serializeConfig({
      collections: [
        {
          slug: 'posts',
          fields: [
            { name: 'title', type: 'text', localized: true },
            { name: 'body', type: 'text' },
            {
              name: 'meta',
              type: 'group',
              fields: [{ name: 'description', type: 'text', localized: true }],
            },
          ],
          versions: { drafts: { autosave: false }, localizeStatus: false },
        },
      ],
      globals: [],
      localization: {
        defaultLocale: 'en',
        fallback: true,
        locales: [{ code: 'en' }, { code: 'es' }],
      },
    } as any)

    expect(result).toEqual({
      collections: {
        posts: {
          autosave: false,
          drafts: true,
          fields: {
            body: { localized: false },
            meta: { localized: false },
            'meta.description': { localized: true },
            title: { localized: true },
          },
          localizeStatus: false,
          versions: true,
        },
      },
      globals: {},
      localization: { defaultLocale: 'en', locales: ['en', 'es'] },
      version: 1,
    })
  })

  it('should treat a collection with no versions config as versions: false', () => {
    const result = serializeConfig({
      collections: [{ slug: 'pages', fields: [{ name: 'title', type: 'text' }] }],
      globals: [],
    } as any)

    expect(result.collections['pages']).toEqual({
      autosave: false,
      drafts: false,
      fields: { title: { localized: false } },
      localizeStatus: false,
      versions: false,
    })
  })

  it('should serialize globals identically to collections', () => {
    const result = serializeConfig({
      collections: [],
      globals: [
        {
          slug: 'settings',
          fields: [{ name: 'siteTitle', type: 'text', localized: true }],
        },
      ],
    } as any)

    expect(result.globals['settings'].fields['siteTitle']).toEqual({
      localized: true,
    })
  })

  it('should return empty localization when config has none', () => {
    const result = serializeConfig({ collections: [], globals: [] } as any)
    expect(result.localization).toEqual({ defaultLocale: '', locales: [] })
  })
})
