import { describe, expect, it } from 'vitest'

import type { CollectionConfig } from '../../../collections/config/types.js'
import type { GlobalConfig } from '../../../globals/config/types.js'

import { registerBranchStorage } from './registerBranchStorage.js'

describe('Internal branch storage registration', () => {
  it('should leave versions-disabled and history-only entities unchanged', () => {
    const collections: CollectionConfig[] = [
      { slug: 'disabled', fields: [] },
      { slug: 'history', fields: [], versions: true },
      { slug: 'history-options', fields: [], versions: { drafts: false } },
    ]
    const globals: GlobalConfig[] = [{ slug: 'history-global', fields: [], versions: true }]
    const registered = registerBranchStorage({ collections, globals, versionIDType: 'number' })

    expect(registered.collections).toStrictEqual(collections)
    expect(registered.globals).toStrictEqual(globals)
    expect(registered.collections.every((entity, index) => entity === collections[index])).toBe(
      true,
    )
  })

  it('should register isolated typed storage without mutating incoming config', () => {
    const articles: CollectionConfig = { slug: 'articles', fields: [], versions: { drafts: true } }
    const settings: GlobalConfig = { slug: 'settings', fields: [], versions: { drafts: true } }
    const registered = registerBranchStorage({
      collections: [articles],
      globals: [settings],
      versionIDType: 'text',
    })
    const heads = registered.collections.find(({ slug }) => slug === 'collection-articles-heads')!
    const globalHeads = registered.collections.find(({ slug }) => slug === 'global-settings-heads')!

    expect(registered.collections).toHaveLength(9)
    expect(articles.custom).toBeUndefined()
    expect(settings.custom).toBeUndefined()
    expect(heads.fields).toContainEqual({
      name: 'parent',
      type: 'relationship',
      relationTo: 'articles',
      required: true,
    })
    expect(heads.fields).toContainEqual({ name: 'versionID', type: 'text' })
    expect(globalHeads.fields.some((field) => 'name' in field && field.name === 'parent')).toBe(
      false,
    )
    expect(heads.custom?.branchHeadStorage).toEqual({
      globalSlug: null,
      parentCollection: 'articles',
    })
  })

  it('should refuse overwriting an existing custom storage marker', () => {
    expect(() =>
      registerBranchStorage({
        collections: [
          {
            slug: 'articles',
            fields: [],
            versions: { drafts: true },
            custom: { branchStorage: { userData: true } },
          },
        ],
        globals: [],
        versionIDType: 'text',
      }),
    ).toThrow('cannot overwrite')
  })

  it('should refuse internal storage slug collisions before schema creation', () => {
    expect(() =>
      registerBranchStorage({
        collections: [
          { slug: 'articles', fields: [], versions: { drafts: true } },
          { slug: 'collection-articles-heads', fields: [] },
        ],
        globals: [],
        versionIDType: 'number',
      }),
    ).toThrow('collide')
  })
})
