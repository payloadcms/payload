import type { ClientField } from 'payload'

import { describe, expect, it } from 'vitest'

import {
  getValidationEndpoint,
  projectValidationDataForSiblingLocales,
} from './validateAllLocales.js'

describe('validate all locales before publish', () => {
  it('should construct create, update, and global validation endpoints', () => {
    expect(
      getValidationEndpoint({
        apiRoute: '/api',
        collectionSlug: 'posts',
      }),
    ).toBe('/api/posts/validate')
    expect(
      getValidationEndpoint({
        apiRoute: '/api',
        collectionSlug: 'posts',
        id: 'post/id',
      }),
    ).toBe('/api/posts/post%2Fid/validate')
    expect(
      getValidationEndpoint({
        apiRoute: '/api',
        globalSlug: 'settings',
      }),
    ).toBe('/api/globals/settings/validate')
  })

  it('should remove localized values from nested sibling-locale candidate data', () => {
    const fields = [
      { localized: true, name: 'title', type: 'text' },
      {
        fields: [
          { localized: true, name: 'strapline', type: 'text' },
          { name: 'theme', type: 'text' },
        ],
        name: 'settings',
        type: 'group',
      },
      {
        fields: [
          { localized: true, name: 'caption', type: 'text' },
          { name: 'kind', type: 'text' },
        ],
        name: 'items',
        type: 'array',
      },
      {
        blocks: [
          {
            fields: [
              { localized: true, name: 'copy', type: 'text' },
              { name: 'style', type: 'text' },
            ],
            slug: 'hero',
          },
        ],
        name: 'layout',
        type: 'blocks',
      },
      {
        tabs: [
          {
            fields: [{ name: 'body', type: 'richText' }],
            localized: true,
            name: 'seo',
          },
        ],
        type: 'tabs',
      },
      { localized: true, name: 'metadata', type: 'json' },
    ] as ClientField[]

    expect(
      projectValidationDataForSiblingLocales({
        blocksMap: {},
        data: {
          layout: [{ blockType: 'hero', copy: 'Active copy', style: 'dark' }],
          items: [{ caption: 'Active caption', kind: 'card' }],
          metadata: { title: 'Active metadata' },
          settings: { strapline: 'Active strapline', theme: 'dark' },
          seo: { body: { root: {} } },
          title: 'Active title',
        },
        fields,
      }),
    ).toEqual({
      layout: [{ blockType: 'hero', style: 'dark' }],
      items: [{ kind: 'card' }],
      settings: { theme: 'dark' },
    })
  })
})
