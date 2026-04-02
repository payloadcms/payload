import type { ClientConfig, SanitizedPermissions, VisibleEntities } from 'payload'

import { describe, expect, it } from 'vitest'

import { buildDashboardEntityLinks } from './buildDashboardEntityLinks'

describe('buildDashboardEntityLinks', () => {
  it('should return translated links for readable visible entities', () => {
    const clientConfig = {
      collections: [
        {
          labels: {
            plural: {
              de: 'Beitraege',
              en: 'Posts',
            },
          },
          slug: 'posts',
        },
        {
          labels: {
            plural: 'Pages',
          },
          slug: 'pages',
        },
      ],
      globals: [
        {
          label: {
            de: 'Einstellungen',
            en: 'Settings',
          },
          slug: 'settings',
        },
      ],
      routes: {
        admin: '/admin',
      },
    } as unknown as Pick<ClientConfig, 'collections' | 'globals' | 'routes'>

    const permissions = {
      collections: {
        pages: { fields: {}, read: false },
        posts: { fields: {}, read: true },
      },
      globals: {
        settings: { fields: {}, read: true },
      },
    } as unknown as SanitizedPermissions

    const visibleEntities = {
      collections: ['posts', 'pages'],
      globals: ['settings'],
    } as VisibleEntities

    const i18n = {
      language: 'en',
      t: (key: string) => key,
      translations: {},
    } as any

    expect(
      buildDashboardEntityLinks({
        clientConfig,
        i18n,
        permissions,
        visibleEntities,
      }),
    ).toEqual([
      {
        href: '/admin/collections/posts',
        label: 'Posts',
        slug: 'posts',
        type: 'collection',
      },
      {
        href: '/admin/globals/settings',
        label: 'Settings',
        slug: 'settings',
        type: 'global',
      },
    ])
  })
})
