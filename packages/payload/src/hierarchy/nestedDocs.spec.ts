import { describe, expect, it } from 'vitest'

import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { RelationshipField } from '../fields/config/types.js'

import { sanitizeCollection } from '../collections/config/sanitize.js'
import { buildNestedDocsHierarchy } from './presets.js'
import { sanitizeHierarchyCollection } from './sanitizeHierarchyCollection.js'

describe('nested documents', () => {
  it.each(['folders', 'tags', 'hierarchy'] as const)(
    'should reject combining nested documents with %s',
    (preset) => {
      const collection: CollectionConfig = {
        slug: 'pages',
        fields: [],
        nestedDocs: true,
        [preset]: true,
      }

      expect(() => sanitizeCollection({ collections: [], globals: [] }, collection)).toThrow(
        "Only one of 'folders', 'tags', 'hierarchy', or 'nestedDocs' can be specified",
      )
    },
  )

  it('should retain collection navigation and use a sidebar parent field', () => {
    const hierarchy = buildNestedDocsHierarchy({ config: true })
    const collection: CollectionConfig = {
      slug: 'pages',
      fields: [{ name: 'title', type: 'text' }],
      hierarchy,
      nestedDocs: true,
    }

    sanitizeHierarchyCollection(collection, {} as Config)

    expect(collection.hierarchy).toMatchObject({
      admin: { injectSidebarTab: false, useHeaderButton: false },
      parentFieldName: '_h_parent',
    })
    expect(
      collection.fields.find((field) => 'name' in field && field.name === '_h_parent'),
    ).toMatchObject({ type: 'relationship', admin: { position: 'sidebar' }, relationTo: 'pages' })
    expect(collection.admin?.group).toBeUndefined()
  })

  it('should leave an unrelated parent field untouched when creating the default parent relationship', () => {
    const collection: CollectionConfig = {
      slug: 'pages',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'parent', type: 'text' },
      ],
      hierarchy: buildNestedDocsHierarchy({ config: true }),
      nestedDocs: true,
    }

    sanitizeHierarchyCollection(collection, {} as Config)

    expect(
      collection.fields.find((field) => 'name' in field && field.name === 'parent'),
    ).toMatchObject({ type: 'text' })
    expect(
      collection.fields.find((field) => 'name' in field && field.name === '_h_parent'),
    ).toMatchObject({ type: 'relationship', relationTo: 'pages' })
  })

  it('should exclude a document with ID zero from its parent picker', () => {
    const collection: CollectionConfig = {
      slug: 'pages',
      fields: [],
      hierarchy: buildNestedDocsHierarchy({ config: true }),
      nestedDocs: true,
    }

    sanitizeHierarchyCollection(collection, {} as Config)

    const parent = collection.fields.find((field) => 'name' in field && field.name === '_h_parent')

    expect(parent).toBeDefined()
    expect(
      (
        parent as RelationshipField & { filterOptions: (args: { id: number }) => unknown }
      ).filterOptions({ id: 0 }),
    ).toEqual({
      id: { not_equals: 0 },
    })
  })

  it('should allow custom parent and slug fields', () => {
    expect(
      buildNestedDocsHierarchy({ config: { parentFieldName: 'ancestor', slugField: 'slug' } }),
    ).toMatchObject({ parentFieldName: 'ancestor', slugField: 'slug' })
  })
})
