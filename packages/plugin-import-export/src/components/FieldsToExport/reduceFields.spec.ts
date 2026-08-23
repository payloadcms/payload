import type { ReactNode } from 'react'

import type { ClientField } from 'payload'

import { isValidElement } from 'react'
import { describe, expect, it } from 'vitest'

import { reduceFields } from './reduceFields.js'

const values = (result: ReturnType<typeof reduceFields>) => result.map((f) => f.value)

const labelText = (node: ReactNode): string => {
  if (typeof node === 'string') {
    return node
  }
  if (Array.isArray(node)) {
    return node.map(labelText).join('')
  }
  if (isValidElement(node)) {
    return labelText((node.props as { children?: ReactNode }).children)
  }
  return ''
}

const labels = (result: ReturnType<typeof reduceFields>) =>
  Object.fromEntries(result.map((f) => [f.value, labelText(f.label)]))

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

  describe('labelPrefix', () => {
    it('should not prefix row sub-field labels with "unnamed field"', () => {
      const fields: ClientField[] = [
        {
          type: 'row',
          fields: [
            { name: 'test1', type: 'text', label: 'Test1' },
            { name: 'test2', type: 'text', label: 'Test2' },
          ],
        },
      ]

      const result = labels(reduceFields({ fields }))

      expect(result.test1).toBe('Test1')
      expect(result.test2).toBe('Test2')
    })

    it('should still prefix sub-field labels with a named group label', () => {
      const fields: ClientField[] = [
        {
          name: 'meta',
          type: 'group',
          label: 'Meta',
          fields: [{ name: 'title', type: 'text', label: 'Title' }],
        },
      ]

      const result = labels(reduceFields({ fields }))

      expect(result['meta.title']).toBe('Meta > Title')
    })
  })
})
