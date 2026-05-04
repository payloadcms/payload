import type { ClientField } from 'payload'

import { describe, expect, it } from 'vitest'

import { reduceFields } from './reduceFields.js'

const values = (result: ReturnType<typeof reduceFields>) => result.map((f) => f.value)

describe('reduceFields', () => {
  describe('excludeUnsortable', () => {
    it('should include array and blocks fields by default', () => {
      const fields: ClientField[] = [
        { name: 'title', type: 'text' },
        { name: 'items', type: 'array', fields: [{ name: 'text', type: 'text' }] },
        { name: 'layout', type: 'blocks', blocks: [] },
      ]

      const result = values(reduceFields({ fields }))

      expect(result).toContain('title')
      expect(result).toContain('items')
      expect(result).toContain('layout')
    })

    it('should exclude array fields when excludeUnsortable is true', () => {
      const fields: ClientField[] = [
        { name: 'title', type: 'text' },
        { name: 'items', type: 'array', fields: [{ name: 'text', type: 'text' }] },
      ]

      const result = values(reduceFields({ excludeUnsortable: true, fields }))

      expect(result).toContain('title')
      expect(result).not.toContain('items')
    })

    it('should exclude blocks fields when excludeUnsortable is true', () => {
      const fields: ClientField[] = [
        { name: 'title', type: 'text' },
        { name: 'layout', type: 'blocks', blocks: [] },
      ]

      const result = values(reduceFields({ excludeUnsortable: true, fields }))

      expect(result).toContain('title')
      expect(result).not.toContain('layout')
    })
  })

  describe('disabledFields', () => {
    it('should include all fields when disabledFields is empty', () => {
      const fields: ClientField[] = [
        { name: 'title', type: 'text' },
        { name: 'slug', type: 'text' },
      ]

      const result = values(reduceFields({ disabledFields: [], fields }))

      expect(result).toContain('title')
      expect(result).toContain('slug')
    })

    it('should exclude a field whose path is in disabledFields', () => {
      const fields: ClientField[] = [
        { name: 'title', type: 'text' },
        { name: 'slug', type: 'text' },
      ]

      const result = values(reduceFields({ disabledFields: ['slug'], fields }))

      expect(result).toContain('title')
      expect(result).not.toContain('slug')
    })

    it('should exclude nested fields whose paths start with a disabled parent path', () => {
      const fields: ClientField[] = [
        {
          name: 'meta',
          type: 'group',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'description', type: 'text' },
          ],
        },
      ]

      const result = values(reduceFields({ disabledFields: ['meta.description'], fields }))

      expect(result).toContain('meta.title')
      expect(result).not.toContain('meta.description')
    })
  })

  describe('combined excludeUnsortable and disabledFields', () => {
    it('should apply both filters simultaneously', () => {
      const fields: ClientField[] = [
        { name: 'title', type: 'text' },
        { name: 'slug', type: 'text' },
        { name: 'items', type: 'array', fields: [{ name: 'text', type: 'text' }] },
      ]

      const result = values(
        reduceFields({ disabledFields: ['slug'], excludeUnsortable: true, fields }),
      )

      expect(result).toContain('title')
      expect(result).not.toContain('slug')
      expect(result).not.toContain('items')
    })
  })

  describe('recursive propagation through group sub-fields', () => {
    it('should propagate excludeUnsortable into group sub-fields', () => {
      const fields: ClientField[] = [
        {
          name: 'meta',
          type: 'group',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'tags', type: 'array', fields: [{ name: 'tag', type: 'text' }] },
          ],
        },
      ]

      const result = values(reduceFields({ excludeUnsortable: true, fields }))

      expect(result).toContain('meta.title')
      expect(result).not.toContain('meta.tags')
    })

    it('should propagate disabledFields into group sub-fields', () => {
      const fields: ClientField[] = [
        {
          name: 'meta',
          type: 'group',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'description', type: 'text' },
          ],
        },
      ]

      const result = values(reduceFields({ disabledFields: ['meta.description'], fields }))

      expect(result).toContain('meta.title')
      expect(result).not.toContain('meta.description')
    })
  })
})
