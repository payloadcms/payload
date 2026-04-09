import { describe, expect, it } from 'vitest'

import optionsReducer from './optionsReducer.js'
import type { Option } from './types.js'

const mockI18n = {
  t: (key: string) => key,
} as any

const mockCollection = {
  admin: { useAsTitle: 'title' },
  labels: { plural: 'Posts' },
} as any

describe('optionsReducer', () => {
  describe('ADD — single relation', () => {
    it('deduplicates options when the same doc is loaded twice', () => {
      const initial: Option[] = [{ label: 'Post A', value: 'id-1' }]

      const result = optionsReducer(initial, {
        type: 'ADD',
        collection: mockCollection,
        data: {
          docs: [
            { id: 'id-1', title: 'Post A' }, // already in state
            { id: 'id-2', title: 'Post B' }, // new
          ],
          totalDocs: 2,
          limit: 10,
          totalPages: 1,
          page: 1,
          pagingCounter: 1,
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null,
        },
        hasMultipleRelations: false,
        i18n: mockI18n,
        relation: 'posts',
      })

      expect(result).toHaveLength(2)
      expect(result.map((o) => o.value)).toEqual(['id-1', 'id-2'])
    })

    it('appends all docs when state is empty', () => {
      const result = optionsReducer([], {
        type: 'ADD',
        collection: mockCollection,
        data: {
          docs: [
            { id: 'id-1', title: 'Post A' },
            { id: 'id-2', title: 'Post B' },
          ],
          totalDocs: 2,
          limit: 10,
          totalPages: 1,
          page: 1,
          pagingCounter: 1,
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null,
        },
        hasMultipleRelations: false,
        i18n: mockI18n,
        relation: 'posts',
      })

      expect(result).toHaveLength(2)
    })
  })

  describe('ADD — multiple relations (grouped options)', () => {
    it('deduplicates sub-options within a group when the same doc is loaded twice', () => {
      const initial: Option[] = [
        {
          label: 'Posts',
          value: undefined as any,
          options: [{ label: 'Post A', value: 'id-1', relationTo: 'posts' }],
        },
      ]

      const result = optionsReducer(initial, {
        type: 'ADD',
        collection: { ...mockCollection, labels: { plural: 'Posts' } },
        data: {
          docs: [
            { id: 'id-1', title: 'Post A' }, // duplicate
            { id: 'id-2', title: 'Post B' }, // new
          ],
          totalDocs: 2,
          limit: 10,
          totalPages: 1,
          page: 1,
          pagingCounter: 1,
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null,
        },
        hasMultipleRelations: true,
        i18n: { t: () => 'Posts' } as any,
        relation: 'posts',
      })

      const group = result.find((o) => o.options)
      expect(group?.options).toHaveLength(2)
      expect(group?.options?.map((o) => o.value)).toEqual(['id-1', 'id-2'])
    })
  })

  describe('CLEAR', () => {
    it('returns empty array when field is required', () => {
      const result = optionsReducer(
        [{ label: 'Post A', value: 'id-1' }],
        { type: 'CLEAR', required: true, i18n: mockI18n },
      )
      expect(result).toEqual([])
    })

    it('returns none option when field is not required', () => {
      const result = optionsReducer(
        [{ label: 'Post A', value: 'id-1' }],
        { type: 'CLEAR', required: false, i18n: mockI18n },
      )
      expect(result).toHaveLength(1)
      expect(result[0]?.value).toBe('null')
    })
  })
})
