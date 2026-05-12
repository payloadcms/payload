import { describe, expect, it } from 'vitest'

import type { ConfigSnapshot } from './types.js'

import { diffConfig } from './diffConfig.js'

const base: ConfigSnapshot = {
  version: 1,
  collections: {
    posts: {
      versions: false,
      drafts: false,
      autosave: false,
      localizeStatus: false,
      fields: { title: { localized: false }, body: { localized: false } },
    },
  },
  globals: {},
  localization: { locales: ['en'], defaultLocale: 'en' },
}

describe('diffConfig', () => {
  it('should return empty array when nothing changed', () => {
    expect(diffConfig(base, base)).toEqual([])
  })

  it('should detect drafts_enabled', () => {
    const next: ConfigSnapshot = {
      ...base,
      collections: {
        posts: { ...base.collections['posts']!, drafts: true, versions: true },
      },
    }
    const changes = diffConfig(base, next)
    expect(changes).toContainEqual({
      type: 'versions_enabled',
      slug: 'posts',
      entity: 'collection',
    })
    expect(changes).toContainEqual(
      expect.objectContaining({
        type: 'drafts_enabled',
        slug: 'posts',
        entity: 'collection',
      }),
    )
  })

  it('should detect field_localized', () => {
    const next: ConfigSnapshot = {
      ...base,
      collections: {
        posts: {
          ...base.collections['posts']!,
          fields: { title: { localized: true }, body: { localized: false } },
        },
      },
    }
    const changes = diffConfig(base, next)
    expect(changes).toContainEqual({
      type: 'field_localized',
      slug: 'posts',
      entity: 'collection',
      fieldPath: 'title',
    })
    expect(changes).not.toContainEqual(expect.objectContaining({ fieldPath: 'body' }))
  })

  it('should detect locale_added and locale_removed', () => {
    const next: ConfigSnapshot = {
      ...base,
      localization: { locales: ['en', 'es'], defaultLocale: 'en' },
    }
    expect(diffConfig(base, next)).toContainEqual({ type: 'locale_added', locale: 'es' })

    const removed: ConfigSnapshot = {
      ...base,
      localization: { locales: [], defaultLocale: 'en' },
    }
    expect(diffConfig(base, removed)).toContainEqual({ type: 'locale_removed', locale: 'en' })
  })

  it('should detect versions_disabled when versions goes from true to false', () => {
    const prev: ConfigSnapshot = {
      ...base,
      collections: {
        posts: { ...base.collections['posts']!, versions: true, drafts: true },
      },
    }
    const changes = diffConfig(prev, base)
    expect(changes).toContainEqual({
      type: 'versions_disabled',
      slug: 'posts',
      entity: 'collection',
    })
    expect(changes).toContainEqual({
      type: 'drafts_disabled',
      slug: 'posts',
      entity: 'collection',
    })
  })
})
