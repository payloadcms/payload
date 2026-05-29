import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig, ClientGlobalConfig, SanitizedPermissions } from 'payload'

import { describe, expect, it } from 'vitest'

import { buildActions } from './buildActions.js'
import { filterActions } from './filterActions.js'

// getTranslation returns string labels as-is, and i18n.t echoes the key — enough for these tests.
const i18n = { language: 'en', t: (key: string) => key, translations: {} } as unknown as I18nClient

const makeCollection = (slug: string) =>
  ({
    admin: {},
    labels: { plural: slug, singular: slug },
    slug,
  }) as unknown as ClientCollectionConfig

const makeGlobal = (slug: string) =>
  ({ admin: {}, label: slug, slug }) as unknown as ClientGlobalConfig

const args = (permissions: SanitizedPermissions) => ({
  adminRoute: '/admin',
  collections: [makeCollection('posts'), makeCollection('pages'), makeCollection('media')],
  globals: [makeGlobal('settings')],
  i18n,
  permissions,
})

describe('buildActions', () => {
  it('includes only readable entities and adds createHref only with create permission', () => {
    const groups = buildActions(
      args({
        collections: {
          media: { read: true },
          pages: { create: true, read: true },
          posts: { read: true },
        },
        globals: { settings: { read: true } },
      } as unknown as SanitizedPermissions),
    )

    expect(groups.map((g) => g.label)).toEqual(['general:collections', 'general:globals'])

    const collections = groups[0].actions
    expect(collections.map((a) => a.id)).toEqual([
      'collection-posts',
      'collection-pages',
      'collection-media',
    ])
    expect(collections.find((a) => a.id === 'collection-pages')?.createHref).toBe(
      '/admin/collections/pages/create',
    )
    expect(collections.find((a) => a.id === 'collection-posts')?.createHref).toBeUndefined()

    const globals = groups[1].actions
    expect(globals[0]).toMatchObject({ href: '/admin/globals/settings', id: 'global-settings' })
    expect(globals[0].createHref).toBeUndefined()
  })

  it('omits entities without read permission and omits empty groups', () => {
    const groups = buildActions(
      args({ collections: { posts: { read: true } } } as unknown as SanitizedPermissions),
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].actions.map((a) => a.id)).toEqual(['collection-posts'])
  })

  it('excludes entities with admin.group === false', () => {
    const hidden = {
      admin: { group: false },
      labels: { plural: 'secret', singular: 'secret' },
      slug: 'secret',
    } as unknown as ClientCollectionConfig
    const groups = buildActions({
      adminRoute: '/admin',
      collections: [hidden],
      globals: [],
      i18n,
      permissions: { collections: { secret: { read: true } } } as unknown as SanitizedPermissions,
    })
    expect(groups).toHaveLength(0)
  })
})

describe('filterActions', () => {
  const groups = buildActions(
    args({
      collections: { media: { read: true }, pages: { read: true }, posts: { read: true } },
      globals: { settings: { read: true } },
    } as unknown as SanitizedPermissions),
  )

  it('returns groups unchanged for an empty query', () => {
    expect(filterActions(groups, '')).toEqual(groups)
  })

  it('filters non-matches and removes emptied groups', () => {
    const filtered = filterActions(groups, 'pa')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].actions.map((a) => a.id)).toEqual(['collection-pages'])
  })
})
