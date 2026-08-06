import type { FlattenedBlock, FlattenedField } from 'payload'

import { flatKeyToPathSegments } from './flatKeyToPathSegments.js'

import { describe, it, expect } from 'vitest'

describe('flatKeyToPathSegments', () => {
  describe('flat field names containing underscores', () => {
    const fields: FlattenedField[] = [
      { name: 'vat_number', type: 'text' } as FlattenedField,
      { name: '_start_with_underscore', type: 'text' } as FlattenedField,
      { name: 'with_numbers_1', type: 'text' } as FlattenedField,
    ]

    it('should keep a snake_case name as a single segment', () => {
      expect(flatKeyToPathSegments({ fields, flatKey: 'vat_number' })).toEqual(['vat_number'])
    })

    it('should keep a leading underscore', () => {
      expect(flatKeyToPathSegments({ fields, flatKey: '_start_with_underscore' })).toEqual([
        '_start_with_underscore',
      ])
    })

    it('should not treat a trailing digit in a name as an array index', () => {
      expect(flatKeyToPathSegments({ fields, flatKey: 'with_numbers_1' })).toEqual([
        'with_numbers_1',
      ])
    })
  })

  describe('groups', () => {
    it('should resolve a snake_case field nested in a group', () => {
      const fields: FlattenedField[] = [
        {
          name: 'group',
          type: 'group',
          flattenedFields: [{ name: 'vat_number', type: 'text' }],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'group_vat_number' })).toEqual([
        'group',
        'vat_number',
      ])
    })

    it('should resolve a group whose own name contains underscores', () => {
      const fields: FlattenedField[] = [
        {
          name: 'billing_details',
          type: 'group',
          flattenedFields: [{ name: 'vat_number', type: 'text' }],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'billing_details_vat_number' })).toEqual([
        'billing_details',
        'vat_number',
      ])
    })

    it('should prefer a flat field over descending into a group with a colliding name', () => {
      const fields: FlattenedField[] = [
        { name: 'vat_number', type: 'text' } as FlattenedField,
        {
          name: 'vat',
          type: 'group',
          flattenedFields: [{ name: 'number', type: 'text' }],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'vat_number' })).toEqual(['vat_number'])
    })

    it('should backtrack to a group when the longer flat name cannot resolve the whole key', () => {
      const fields: FlattenedField[] = [
        { name: 'vat_number', type: 'text' } as FlattenedField,
        {
          name: 'vat',
          type: 'group',
          flattenedFields: [{ name: 'number_suffix', type: 'text' }],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'vat_number_suffix' })).toEqual([
        'vat',
        'number_suffix',
      ])
    })

    it('should resolve nested groups that both contain underscores', () => {
      const fields: FlattenedField[] = [
        {
          name: 'outer_group',
          type: 'group',
          flattenedFields: [
            {
              name: 'inner_group',
              type: 'group',
              flattenedFields: [{ name: 'my_field', type: 'text' }],
            },
          ],
        } as unknown as FlattenedField,
      ]

      expect(
        flatKeyToPathSegments({ fields, flatKey: 'outer_group_inner_group_my_field' }),
      ).toEqual(['outer_group', 'inner_group', 'my_field'])
    })

    it('should resolve a named tab like a group', () => {
      const fields: FlattenedField[] = [
        {
          name: 'meta_tab',
          type: 'tab',
          flattenedFields: [{ name: 'vat_number', type: 'text' }],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'meta_tab_vat_number' })).toEqual([
        'meta_tab',
        'vat_number',
      ])
    })

    it('should not resolve a group that carries no flattenedFields', () => {
      const fields: FlattenedField[] = [{ name: 'group', type: 'group' } as FlattenedField]

      expect(flatKeyToPathSegments({ fields, flatKey: 'group_field1' })).toBeUndefined()
    })
  })

  describe('localized fields', () => {
    const localeCodes = ['en', 'en_US', 'es']

    it('should emit the locale as its own segment', () => {
      const fields: FlattenedField[] = [
        { name: 'vat_number', type: 'text', localized: true } as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'vat_number_en', localeCodes })).toEqual([
        'vat_number',
        'en',
      ])
    })

    it('should prefer a longer locale code over a shorter one', () => {
      const fields: FlattenedField[] = [
        { name: 'title', type: 'text', localized: true } as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'title_en_US', localeCodes })).toEqual([
        'title',
        'en_US',
      ])
    })

    it('should recognize a locale by shape when no locale codes are configured', () => {
      const fields: FlattenedField[] = [
        { name: 'vat_number', type: 'text', localized: true } as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'vat_number_es' })).toEqual([
        'vat_number',
        'es',
      ])
    })

    it('should resolve a field inside a localized group', () => {
      const fields: FlattenedField[] = [
        {
          name: 'group',
          type: 'group',
          localized: true,
          flattenedFields: [{ name: 'vat_number', type: 'text' }],
        } as unknown as FlattenedField,
      ]

      expect(
        flatKeyToPathSegments({ fields, flatKey: 'group_en_vat_number', localeCodes }),
      ).toEqual(['group', 'en', 'vat_number'])
    })

    it('should backtrack when a locale-shaped segment is actually part of a field name', () => {
      const fields: FlattenedField[] = [
        {
          name: 'group',
          type: 'group',
          localized: true,
          flattenedFields: [{ name: 'es_label', type: 'text' }],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'group_es_label' })).toEqual([
        'group',
        'es_label',
      ])
    })

    it('should not consume a locale suffix on a field that is not localized', () => {
      const fields: FlattenedField[] = [{ name: 'title', type: 'text' } as FlattenedField]

      expect(flatKeyToPathSegments({ fields, flatKey: 'title_en', localeCodes })).toBeUndefined()
    })
  })

  describe('arrays and hasMany fields', () => {
    it('should resolve a snake_case field inside an array row', () => {
      const fields: FlattenedField[] = [
        {
          name: 'line_items',
          type: 'array',
          flattenedFields: [{ name: 'vat_number', type: 'text' }],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'line_items_0_vat_number' })).toEqual([
        'line_items',
        '0',
        'vat_number',
      ])
    })

    it('should resolve an indexed hasMany scalar column', () => {
      const fields: FlattenedField[] = [
        { name: 'my_tags', type: 'text', hasMany: true } as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'my_tags_0' })).toEqual(['my_tags', '0'])
    })

    it('should not treat an index suffix as valid on a field that is not hasMany', () => {
      const fields: FlattenedField[] = [{ name: 'my_tags', type: 'text' } as FlattenedField]

      expect(flatKeyToPathSegments({ fields, flatKey: 'my_tags_0' })).toBeUndefined()
    })
  })

  describe('blocks', () => {
    const fields: FlattenedField[] = [
      {
        name: 'page_content',
        type: 'blocks',
        blocks: [
          {
            slug: 'hero_section',
            flattenedFields: [{ name: 'call_to_action', type: 'text' }],
          },
        ],
      } as unknown as FlattenedField,
    ]

    it('should resolve an underscored block slug and field name', () => {
      expect(
        flatKeyToPathSegments({ fields, flatKey: 'page_content_0_hero_section_call_to_action' }),
      ).toEqual(['page_content', '0', 'hero_section', 'call_to_action'])
    })

    it('should resolve the blockType column', () => {
      expect(
        flatKeyToPathSegments({ fields, flatKey: 'page_content_0_hero_section_blockType' }),
      ).toEqual(['page_content', '0', 'hero_section', 'blockType'])
    })

    it('should resolve a block referenced by slug', () => {
      const referencingFields: FlattenedField[] = [
        {
          name: 'page_content',
          type: 'blocks',
          blocks: ['hero_section'],
        } as unknown as FlattenedField,
      ]

      const blocksBySlug: Record<string, FlattenedBlock> = {
        hero_section: {
          slug: 'hero_section',
          fields: [],
          flattenedFields: [{ name: 'call_to_action', type: 'text' }],
        } as unknown as FlattenedBlock,
      }

      expect(
        flatKeyToPathSegments({
          blocksBySlug,
          fields: referencingFields,
          flatKey: 'page_content_0_hero_section_call_to_action',
        }),
      ).toEqual(['page_content', '0', 'hero_section', 'call_to_action'])
    })

    it('should not resolve a block reference that cannot be looked up', () => {
      const referencingFields: FlattenedField[] = [
        {
          name: 'page_content',
          type: 'blocks',
          blocks: ['hero_section'],
        } as unknown as FlattenedField,
      ]

      expect(
        flatKeyToPathSegments({
          fields: referencingFields,
          flatKey: 'page_content_0_hero_section_call_to_action',
        }),
      ).toBeUndefined()
    })
  })

  describe('relationships', () => {
    it('should resolve the id and relationTo columns of a polymorphic relationship', () => {
      const fields: FlattenedField[] = [
        {
          name: 'related_doc',
          type: 'relationship',
          relationTo: ['posts', 'pages'],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'related_doc_id' })).toEqual([
        'related_doc',
        'id',
      ])
      expect(flatKeyToPathSegments({ fields, flatKey: 'related_doc_relationTo' })).toEqual([
        'related_doc',
        'relationTo',
      ])
    })

    it('should resolve indexed columns of a polymorphic hasMany relationship', () => {
      const fields: FlattenedField[] = [
        {
          name: 'related_docs',
          type: 'relationship',
          hasMany: true,
          relationTo: ['posts', 'pages'],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'related_docs_0_relationTo' })).toEqual([
        'related_docs',
        '0',
        'relationTo',
      ])
    })

    it('should not resolve populated relationship data', () => {
      const fields: FlattenedField[] = [
        { name: 'author', type: 'relationship', relationTo: 'users' } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields, flatKey: 'author_email_address' })).toBeUndefined()
    })
  })

  describe('unresolvable keys', () => {
    const fields: FlattenedField[] = [{ name: 'title', type: 'text' } as FlattenedField]

    it('should not resolve a column that is absent from the schema', () => {
      expect(flatKeyToPathSegments({ fields, flatKey: 'my_extra_column' })).toBeUndefined()
    })

    it('should not resolve a partial field path', () => {
      const groupFields: FlattenedField[] = [
        {
          name: 'group',
          type: 'group',
          flattenedFields: [{ name: 'nested', type: 'text' }],
        } as unknown as FlattenedField,
      ]

      expect(flatKeyToPathSegments({ fields: groupFields, flatKey: 'group' })).toBeUndefined()
    })
  })

  it('should match a naive underscore split when no field name contains an underscore', () => {
    const fields: FlattenedField[] = [
      { name: 'title', type: 'text', localized: true } as FlattenedField,
      {
        name: 'items',
        type: 'array',
        flattenedFields: [{ name: 'name', type: 'text' }],
      } as unknown as FlattenedField,
      {
        name: 'group',
        type: 'group',
        flattenedFields: [{ name: 'nested', type: 'text' }],
      } as unknown as FlattenedField,
      { name: 'poly', type: 'relationship', relationTo: ['posts'] } as unknown as FlattenedField,
    ]

    const keys = ['title_en', 'items_0_name', 'group_nested', 'poly_id', 'poly_relationTo']

    for (const flatKey of keys) {
      expect(flatKeyToPathSegments({ fields, flatKey, localeCodes: ['en'] })).toEqual(
        flatKey.split('_'),
      )
    }
  })
})
