import { describe, expect, it } from 'vitest'

import type { CollectionConfig } from '../../../collections/config/types.js'
import type { Field } from '../../../fields/config/types.js'

import { buildBranchProjectionCollections } from './buildBranchProjectionCollections.js'

describe('Private branch query projection schema', () => {
  it('should isolate application behavior while preserving content schema and indexes', () => {
    const hook = () => undefined
    const articles: CollectionConfig = {
      slug: 'articles',
      versions: { drafts: true },
      upload: true,
      hooks: { afterRead: [hook] },
      indexes: [{ fields: ['title', 'description'], unique: true }],
      fields: [
        { name: 'id', type: 'number' },
        {
          name: 'title',
          type: 'text',
          localized: true,
          index: true,
          unique: true,
          required: true,
          defaultValue: 'side effect',
          access: { read: () => false },
          hooks: { afterRead: [hook] },
          admin: { condition: () => false },
          validate: () => true,
        },
        { name: 'description', type: 'textarea' },
        {
          name: 'rows',
          type: 'array',
          dbName: 'ordinary_rows',
          fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'text', required: true },
          ],
        },
        { name: 'screen', type: 'ui', admin: { components: { Field: '/SideEffect' } } },
      ],
    }
    const originalTitle = articles.fields[1]
    const { collections, projectionSlugs } = buildBranchProjectionCollections({
      collections: [articles],
      defaultIDType: 'text',
    })
    const projection = collections[1]!

    expect(projectionSlugs).toEqual({ articles: 'collection-articles-projection' })
    expect(collections[0]).toBe(articles)
    expect(articles.fields[1]).toBe(originalTitle)
    expect(articles.fields[1]).toHaveProperty('hooks')
    expect(projection).toMatchObject({
      graphQL: false,
      versions: false,
      timestamps: false,
      admin: { hidden: true },
    })
    expect(projection.hooks).toBeUndefined()
    expect(projection.upload).toBeUndefined()
    expect(projection.auth).toBeUndefined()
    expect(projection.access?.read?.({} as never)).toBe(false)
    expect(projection.fields[0]).toEqual({ name: 'id', type: 'text' })
    expect(projection.fields[1]).toEqual({
      name: 'title',
      type: 'text',
      localized: true,
      index: true,
    })
    expect(projection.fields).not.toContainEqual(expect.objectContaining({ type: 'ui' }))
    expect(projection.fields).toContainEqual({
      name: 'rows',
      type: 'array',
      dbName: expect.any(Function),
      fields: [
        { name: 'name', type: 'text' },
        { name: 'id', type: 'text' },
        {
          name: '_branchProjection',
          type: 'group',
          fields: [{ name: 'logicalID', type: 'number', required: true }],
          hidden: true,
        },
      ],
    })
    expect(projection.fields).toContainEqual(
      expect.objectContaining({
        name: '_branchProjection',
        fields: expect.arrayContaining([{ name: 'logicalID', type: 'number', required: true }]),
      }),
    )
    expect(projection.indexes).toContainEqual({
      fields: ['title', 'description'],
      unique: false,
    })
    expect(projection.indexes).toContainEqual({
      fields: ['_branchProjection.logicalID'],
      unique: false,
    })
  })

  it('should rewrite only branch-enabled relationships and reverse joins at every nesting depth', () => {
    const fields: Field[] = [
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Unnamed',
            fields: [
              {
                name: 'related',
                type: 'relationship',
                relationTo: ['articles', 'media'],
                hasMany: true,
              },
            ],
          },
          { name: 'named', fields: [{ name: 'related', type: 'upload', relationTo: 'media' }] },
        ],
      },
      { name: 'content', type: 'blocks', blocks: ['callout'] },
      { name: 'backlinks', type: 'join', collection: 'articles', on: 'related' },
    ]
    const { collections } = buildBranchProjectionCollections({
      blocks: [
        {
          slug: 'callout',
          dbName: 'ordinary_callout',
          interfaceName: 'Callout',
          fields: [{ name: 'target', type: 'relationship', relationTo: 'articles' }],
        },
      ],
      collections: [
        { slug: 'articles', versions: { drafts: true }, fields },
        { slug: 'media', fields: [] },
      ],
      defaultIDType: 'number',
    })
    const projection = collections[2]!

    expect(JSON.stringify(projection.fields)).toContain('collection-articles-projection')
    expect(JSON.stringify(projection.fields)).not.toContain('ordinary_callout')
    expect(projection.fields).toContainEqual({
      name: 'content',
      type: 'blocks',
      blocks: [
        {
          slug: 'callout',
          dbName: expect.any(Function),
          fields: [
            {
              name: 'target',
              type: 'relationship',
              relationTo: 'collection-articles-projection',
              index: true,
            },
            { name: 'id', type: 'text' },
            {
              name: '_branchProjection',
              type: 'group',
              fields: [{ name: 'logicalID', type: 'text', required: true }],
              hidden: true,
            },
          ],
        },
      ],
    })
    expect(projection.fields).toContainEqual({
      name: 'backlinks',
      type: 'join',
      collection: 'collection-articles-projection',
      on: 'related',
    })
    expect(JSON.stringify(fields)).not.toContain('projection')
  })

  it('should reject unresolved block references instead of dropping content', () => {
    expect(() =>
      buildBranchProjectionCollections({
        collections: [
          {
            slug: 'articles',
            versions: { drafts: true },
            fields: [{ name: 'content', type: 'blocks', blocks: ['unknown'] }],
          },
        ],
        defaultIDType: 'text',
      }),
    ).toThrow('Unknown block')
  })

  it('should preserve wide index tuples through tabs and keep physical nested names bounded and private', () => {
    const long = 'a'.repeat(100)
    const { collections } = buildBranchProjectionCollections({
      collections: [
        {
          slug: 'articles',
          versions: { drafts: true },
          fields: [
            { name: 'title', type: 'text' },
            {
              type: 'tabs',
              tabs: [
                {
                  fields: [
                    {
                      type: 'row',
                      fields: [{ name: 'related', type: 'relationship', relationTo: 'articles' }],
                    },
                  ],
                },
                {
                  name: 'details',
                  fields: [{ name: 'related', type: 'relationship', relationTo: 'articles' }],
                },
              ],
            },
            {
              name: long,
              type: 'array',
              dbName: 'valid_short_name',
              fields: [
                { name: 'choice', type: 'select', enumName: 'valid_short_enum', options: ['a'] },
              ],
            },
          ],
          indexes: [{ fields: ['title', 'related'] }, { fields: ['title', 'details.related'] }],
        },
      ],
      defaultIDType: 'number',
    })
    const projection = collections[1]!
    expect(projection.indexes).toContainEqual({ fields: ['title'], unique: false })
    expect(projection.indexes).toContainEqual({ fields: ['related'], unique: false })
    expect(projection.indexes).toContainEqual({ fields: ['details.related'], unique: false })
    expect(projection.indexes).not.toContainEqual(
      expect.objectContaining({ fields: ['title', 'related'] }),
    )
    const array = projection.fields.find((field) => 'name' in field && field.name === long)
    if (array?.type !== 'array' || typeof array.dbName !== 'function')
      throw new Error('Expected private array name.')
    expect(array.dbName({ tableName: 'parent' })).toMatch(/^bq_[a-f0-9]{24}$/)
    expect(array.dbName({ tableName: 'parent' })).not.toBe(array.dbName({ tableName: 'other' }))
    const select = array.fields.find((field) => 'name' in field && field.name === 'choice')
    if (select?.type !== 'select' || typeof select.enumName !== 'function')
      throw new Error('Expected private enum name.')
    expect(select.enumName({ tableName: 'parent' })).toMatch(/^bq_[a-f0-9]{24}$/)
    expect(select.enumName({ tableName: 'parent' })).not.toBe(array.dbName({ tableName: 'parent' }))
  })

  it('should reject storage slug and root metadata namespace collisions', () => {
    expect(() =>
      buildBranchProjectionCollections({
        collections: [
          { slug: 'articles', versions: { drafts: true }, fields: [] },
          { slug: 'collection-articles-projection', fields: [] },
        ],
        defaultIDType: 'text',
      }),
    ).toThrow('collide')
    expect(() =>
      buildBranchProjectionCollections({
        collections: [
          {
            slug: 'articles',
            versions: { drafts: true },
            fields: [{ type: 'row', fields: [{ name: '_branchProjection', type: 'text' }] }],
          },
        ],
        defaultIDType: 'text',
      }),
    ).toThrow('collides')
  })

  it('should leave disabled and history-only entities without projections', () => {
    const collections: CollectionConfig[] = [
      { slug: 'plain', fields: [] },
      { slug: 'history', fields: [], versions: true },
    ]
    const result = buildBranchProjectionCollections({ collections, defaultIDType: 'number' })

    expect(result).toEqual({ collections, projectionSlugs: {} })
  })
})
