import { getFieldsForRowComparison } from './getFieldsForRowComparison'
import type { ArrayFieldClient, BlocksFieldClient, ClientField } from 'payload'

describe('getFieldsForRowComparison', () => {
  describe('array fields', () => {
    it('should return fields from array field', () => {
      const arrayFields: ClientField[] = [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ]

      const field: ArrayFieldClient = {
        type: 'array',
        name: 'items',
        fields: arrayFields,
      }

      const { fields } = getFieldsForRowComparison({
        field,
        versionRow: {},
        comparisonRow: {},
        row: 0,
        baseVersionField: { fields: [] },
      })

      expect(fields).toEqual(arrayFields)
    })
  })

  describe('blocks fields', () => {
    it('should return combined fields when block types match', () => {
      const blockAFields: ClientField[] = [
        { name: 'a', type: 'text' },
        { name: 'b', type: 'text' },
      ]

      const field: BlocksFieldClient = {
        type: 'blocks',
        name: 'myBlocks',
        blocks: [
          {
            slug: 'blockA',
            fields: blockAFields,
          },
        ],
      }

      const versionRow = { blockType: 'blockA' }
      const comparisonRow = { blockType: 'blockA' }

      const { fields } = getFieldsForRowComparison({
        field,
        versionRow,
        comparisonRow,
        row: 0,
        baseVersionField: { fields: [] },
      })

      expect(fields).toEqual(blockAFields)
    })

    it('should return unique combined fields when block types differ', () => {
      const field: BlocksFieldClient = {
        type: 'blocks',
        name: 'myBlocks',
        blocks: [
          {
            slug: 'blockA',
            fields: [
              { name: 'a', type: 'text' },
              { name: 'b', type: 'text' },
            ],
          },
          {
            slug: 'blockB',
            fields: [
              { name: 'b', type: 'text' },
              { name: 'c', type: 'text' },
            ],
          },
        ],
      }

      const versionRow = { blockType: 'blockA' }
      const comparisonRow = { blockType: 'blockB' }

      const { fields } = getFieldsForRowComparison({
        field,
        versionRow,
        comparisonRow,
        row: 0,
        baseVersionField: { fields: [] },
      })

      // Should contain all unique fields from both blocks
      expect(fields).toEqual([
        { name: 'a', type: 'text' },
        { name: 'b', type: 'text' },
        { name: 'c', type: 'text' },
      ])
    })
  })
})
