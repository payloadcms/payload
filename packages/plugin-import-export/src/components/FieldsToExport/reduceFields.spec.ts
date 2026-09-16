import type { I18nClient } from '@payloadcms/translations'
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

  describe('labels', () => {
    const i18n = {
      fallbackLanguage: 'en',
      language: 'de',
      t: (key: string) => key,
    } as unknown as I18nClient

    it('should translate localized labels into the current admin language', () => {
      const fields: ClientField[] = [
        { name: 'title', type: 'text', label: { de: 'Titel', en: 'Title' } },
      ]

      const [option] = reduceFields({ fields, i18n })

      expect(option?.fieldLabel).toBe('Titel')
      expect(option?.displayLabel).toBe('Titel')
    })

    it('should fall back to the fallback language when the current language is missing', () => {
      const fields: ClientField[] = [{ name: 'title', type: 'text', label: { en: 'Title' } }]

      const [option] = reduceFields({ fields, i18n })

      expect(option?.fieldLabel).toBe('Title')
    })

    it('should keep string labels and fall back to the field name without a label', () => {
      const fields: ClientField[] = [
        { name: 'title', type: 'text', label: 'Headline' },
        { name: 'slug', type: 'text' },
      ]

      const result = reduceFields({ fields, i18n })

      expect(result.map((f) => f.fieldLabel)).toEqual(['Headline', 'slug'])
    })

    it('should use the field name for localized labels when no i18n is provided', () => {
      const fields: ClientField[] = [
        { name: 'title', type: 'text', label: { de: 'Titel', en: 'Title' } },
      ]

      const [option] = reduceFields({ fields })

      expect(option?.fieldLabel).toBe('title')
    })

    it('should translate group and named tab prefixes', () => {
      const fields: ClientField[] = [
        {
          name: 'meta',
          type: 'group',
          label: { de: 'Meta', en: 'Meta' },
          fields: [{ name: 'title', type: 'text', label: { de: 'Titel', en: 'Title' } }],
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'seo',
              label: { de: 'Suchmaschinen', en: 'SEO' },
              fields: [
                {
                  name: 'description',
                  type: 'text',
                  label: { de: 'Beschreibung', en: 'Description' },
                },
              ],
            },
          ],
        },
      ]

      const result = reduceFields({ fields, i18n })

      expect(result.map((f) => [f.value, f.displayLabel, f.fieldLabel])).toEqual([
        ['meta.title', 'Meta > Titel', 'Titel'],
        ['seo.description', 'Suchmaschinen > Beschreibung', 'Beschreibung'],
      ])
    })
  })
})
