import { FlattenedField, PayloadRequest } from 'payload'

import { unflattenObject } from './unflattenObject.js'

import { describe, it, expect, vi } from 'vitest'

describe('unflattenObject', () => {
  const mockReq = {
    payload: {
      logger: {
        error: vi.fn(),
      },
    },
  } as unknown as PayloadRequest

  describe('hasMany number fields', () => {
    const fields: FlattenedField[] = [
      {
        name: 'hasManyNumber',
        type: 'number',
        hasMany: true,
      } as FlattenedField,
    ]

    it('should handle comma-separated number strings', () => {
      const data = {
        hasManyNumber: '1,2,3,5,8',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyNumber: [1, 2, 3, 5, 8],
      })
    })

    it('should handle comma-separated numbers with spaces', () => {
      const data = {
        hasManyNumber: ' 10 , 20 , 30 ',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyNumber: [10, 20, 30],
      })
    })

    it('should filter out empty values in comma-separated strings', () => {
      const data = {
        hasManyNumber: '1,,3,,5',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyNumber: [1, 3, 5],
      })
    })

    it('should handle single number values', () => {
      const data = {
        hasManyNumber: 42,
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyNumber: [42],
      })
    })

    it('should handle single string number values', () => {
      const data = {
        hasManyNumber: '42',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyNumber: [42],
      })
    })

    it('should handle indexed array format', () => {
      const data = {
        hasManyNumber_0: 1,
        hasManyNumber_1: 2,
        hasManyNumber_2: 3,
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyNumber: [1, 2, 3],
      })
    })

    it('should filter out null and empty values from indexed arrays', () => {
      const data = {
        hasManyNumber_0: 1,
        hasManyNumber_1: null,
        hasManyNumber_2: '',
        hasManyNumber_3: 3,
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyNumber: [1, 3],
      })
    })

    it('should handle empty, null, and undefined values', () => {
      // explicit null gets converted to empty array in postProcess for hasMany
      expect(unflattenObject({ data: { hasManyNumber: null }, fields, req: mockReq })).toEqual({
        hasManyNumber: [],
      })
      // undefined is skipped entirely (preserves existing data)
      expect(unflattenObject({ data: { hasManyNumber: undefined }, fields, req: mockReq })).toEqual(
        {},
      )
    })
  })

  describe('hasMany relationship fields', () => {
    const fields: FlattenedField[] = [
      {
        name: 'hasManyRelationship',
        type: 'relationship',
        hasMany: true,
        relationTo: 'posts',
      } as FlattenedField,
    ]

    it('should handle comma-separated ID strings', () => {
      const data = {
        hasManyRelationship: 'id1,id2,id3',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyRelationship: ['id1', 'id2', 'id3'],
      })
    })

    it('should handle comma-separated IDs with spaces', () => {
      const data = {
        hasManyRelationship: ' id1 , id2 , id3 ',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyRelationship: ['id1', 'id2', 'id3'],
      })
    })

    it('should filter out empty values in comma-separated IDs', () => {
      const data = {
        hasManyRelationship: 'id1,,id3,,id5',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyRelationship: ['id1', 'id3', 'id5'],
      })
    })

    it('should handle single ID values', () => {
      const data = {
        hasManyRelationship: 'singleId',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyRelationship: ['singleId'],
      })
    })

    it('should handle indexed array format', () => {
      const data = {
        hasManyRelationship_0: 'id1',
        hasManyRelationship_1: 'id2',
        hasManyRelationship_2: 'id3',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyRelationship: ['id1', 'id2', 'id3'],
      })
    })

    it('should handle MongoDB ObjectIDs', () => {
      const data = {
        hasManyRelationship: '507f1f77bcf86cd799439011,507f191e810c19729de860ea',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        hasManyRelationship: ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'],
      })
    })
  })

  describe('localized fields', () => {
    const fields: FlattenedField[] = [
      {
        name: 'title',
        type: 'text',
        localized: true,
      } as FlattenedField,
    ]

    it('should transform locale-specific keys to nested structure', () => {
      const data = {
        title_en: 'English Title',
        title_es: 'Título en Español',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        title: {
          en: 'English Title',
          es: 'Título en Español',
        },
      })
    })

    it('should handle missing locales', () => {
      const data = {
        title_en: 'English Title',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        title: {
          en: 'English Title',
        },
      })
    })
  })

  describe('blocks fields', () => {
    const fields: FlattenedField[] = [
      {
        name: 'blocks',
        type: 'blocks',
      } as FlattenedField,
    ]

    it('should handle block fields with blockType', () => {
      const data = {
        blocks_0_hero_title: 'Hero Title',
        blocks_0_hero_subtitle: 'Hero Subtitle',
        blocks_0_hero_blockType: 'hero',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        blocks: [
          {
            blockType: 'hero',
            title: 'Hero Title',
            subtitle: 'Hero Subtitle',
          },
        ],
      })
    })

    it('should handle multiple blocks', () => {
      const data = {
        blocks_0_hero_title: 'Hero Title',
        blocks_0_hero_blockType: 'hero',
        blocks_1_text_content: 'Text Content',
        blocks_1_text_blockType: 'text',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        blocks: [
          {
            blockType: 'hero',
            title: 'Hero Title',
          },
          {
            blockType: 'text',
            content: 'Text Content',
          },
        ],
      })
    })
  })

  describe('array fields', () => {
    const fields: FlattenedField[] = [
      {
        name: 'items',
        type: 'array',
      } as FlattenedField,
    ]

    it('should handle indexed array objects', () => {
      const data = {
        items_0_name: 'Item 1',
        items_0_value: 10,
        items_1_name: 'Item 2',
        items_1_value: 20,
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        items: [
          { name: 'Item 1', value: 10 },
          { name: 'Item 2', value: 20 },
        ],
      })
    })

    it('should handle sparse arrays', () => {
      const data = {
        items_0_name: 'Item 1',
        items_2_name: 'Item 3',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        items: [{ name: 'Item 1' }, null, { name: 'Item 3' }],
      })
    })
  })

  describe('group fields', () => {
    const fields: FlattenedField[] = [
      {
        name: 'group',
        type: 'group',
      } as FlattenedField,
    ]

    it('should handle nested group fields', () => {
      const data = {
        group_field1: 'Value 1',
        group_field2: 'Value 2',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        group: {
          field1: 'Value 1',
          field2: 'Value 2',
        },
      })
    })
  })

  describe('polymorphic relationships', () => {
    const fields: FlattenedField[] = [
      {
        name: 'polymorphic',
        type: 'relationship',
        relationTo: ['posts', 'pages'],
      } as FlattenedField,
    ]

    it('should handle polymorphic relationship with id and relationTo', () => {
      const data = {
        polymorphic_id: '123',
        polymorphic_relationTo: 'posts',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        polymorphic: {
          relationTo: 'posts',
          value: '123',
        },
      })
    })

    it('should handle explicitly null polymorphic relationships', () => {
      const data = {
        polymorphic_id: null,
        polymorphic_relationTo: null,
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        polymorphic: null,
      })
    })

    it('should skip polymorphic relationships with undefined values', () => {
      const data = {
        polymorphic_id: undefined,
        polymorphic_relationTo: undefined,
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      // Both undefined means field is not set (preserves existing data)
      expect(result).toEqual({})
    })

    it('should skip polymorphic relationship with undefined id', () => {
      const data = {
        polymorphic_id: undefined,
        polymorphic_relationTo: 'posts',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      // Undefined ID means don't update this field
      expect(result).toEqual({})
    })

    it('should skip polymorphic relationship with undefined relationTo', () => {
      const data = {
        polymorphic_id: '123',
        polymorphic_relationTo: undefined,
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      // Undefined relationTo means don't update this field
      expect(result).toEqual({})
    })

    it('should handle polymorphic hasMany relationships', () => {
      const fields: FlattenedField[] = [
        {
          name: 'polymorphicMany',
          type: 'relationship',
          hasMany: true,
          relationTo: ['posts', 'pages'],
        } as FlattenedField,
      ]

      const data = {
        polymorphicMany_0_id: '123',
        polymorphicMany_0_relationTo: 'posts',
        polymorphicMany_1_id: '456',
        polymorphicMany_1_relationTo: 'pages',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        polymorphicMany: [
          {
            relationTo: 'posts',
            value: '123',
          },
          {
            relationTo: 'pages',
            value: '456',
          },
        ],
      })
    })

    it('should filter out empty polymorphic hasMany items', () => {
      const fields: FlattenedField[] = [
        {
          name: 'polymorphicMany',
          type: 'relationship',
          hasMany: true,
          relationTo: ['posts', 'pages'],
        } as FlattenedField,
      ]

      const data = {
        polymorphicMany_0_id: '123',
        polymorphicMany_0_relationTo: 'posts',
        polymorphicMany_1_id: null,
        polymorphicMany_1_relationTo: null,
        polymorphicMany_2_id: '456',
        polymorphicMany_2_relationTo: 'pages',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        polymorphicMany: [
          {
            relationTo: 'posts',
            value: '123',
          },
          {
            relationTo: 'pages',
            value: '456',
          },
        ],
      })
    })

    it('should handle all empty polymorphic hasMany items', () => {
      const fields: FlattenedField[] = [
        {
          name: 'polymorphicMany',
          type: 'relationship',
          hasMany: true,
          relationTo: ['posts', 'pages'],
        } as FlattenedField,
      ]

      const data = {
        polymorphicMany_0_id: null,
        polymorphicMany_0_relationTo: null,
        polymorphicMany_1_id: '',
        polymorphicMany_1_relationTo: '',
      }

      const result = unflattenObject({ data, fields, req: mockReq })

      expect(result).toEqual({
        polymorphicMany: [],
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty data', () => {
      const result = unflattenObject({ data: {}, fields: [], req: mockReq })
      expect(result).toEqual({})
    })

    it('should handle null data', () => {
      const result = unflattenObject({ data: null as any, fields: [], req: mockReq })
      expect(result).toEqual({})
    })

    it('should handle undefined values', () => {
      const data = {
        field1: undefined,
        field2: 'value',
      }

      const result = unflattenObject({ data, fields: [], req: mockReq })
      expect(result).toEqual({ field2: 'value' })
    })

    it('should preserve null values for validation', () => {
      const data = {
        field1: null,
        field2: 'value',
      }

      const result = unflattenObject({ data, fields: [], req: mockReq })
      // null values are preserved for validation
      expect(result).toEqual({ field1: null, field2: 'value' })
    })
  })
})
