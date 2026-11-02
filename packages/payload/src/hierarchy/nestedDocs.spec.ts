import { describe, expect, it } from 'vitest'

import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { buildNestedDocsHierarchy } from './presets.js'
import { sanitizeHierarchyCollection } from './sanitizeHierarchyCollection.js'

describe('nested documents', () => {
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
      parentFieldName: 'parent',
    })
    expect(
      collection.fields.find((field) => 'name' in field && field.name === 'parent'),
    ).toMatchObject({ type: 'relationship', admin: { position: 'sidebar' }, relationTo: 'pages' })
    expect(collection.admin?.group).toBeUndefined()
  })

  it('should allow custom parent and slug fields', () => {
    expect(
      buildNestedDocsHierarchy({ config: { parentFieldName: 'ancestor', slugField: 'slug' } }),
    ).toMatchObject({ parentFieldName: 'ancestor', slugField: 'slug' })
  })
})
