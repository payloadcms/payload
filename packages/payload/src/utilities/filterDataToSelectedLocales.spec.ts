import type { Field } from '../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { filterDataToSelectedLocales } from './filterDataToSelectedLocales.js'

describe('filterDataToSelectedLocales', () => {
  const selectedLocales = ['en']
  const configBlockReferences = []

  describe('block metadata preservation', () => {
    it('should preserve blockType, id, and blockName on non-localized blocks', () => {
      const fields: Field[] = [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [
            {
              slug: 'content',
              fields: [
                {
                  name: 'richText',
                  type: 'richText',
                  localized: true,
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        layout: [
          {
            blockType: 'content',
            id: 'abc123',
            blockName: 'My Block',
            richText: { en: 'English', es: 'Spanish' },
          },
        ],
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.layout).toHaveLength(1)
      expect(result.layout[0].blockType).toBe('content')
      expect(result.layout[0].id).toBe('abc123')
      expect(result.layout[0].blockName).toBe('My Block')
      expect(result.layout[0].richText).toEqual({ en: 'English' })
    })

    it('should preserve blockType and id when block has no blockName', () => {
      const fields: Field[] = [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [
            {
              slug: 'text',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        layout: [
          {
            blockType: 'text',
            id: 'def456',
            text: { en: 'English', es: 'Spanish' },
          },
        ],
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.layout).toHaveLength(1)
      expect(result.layout[0].blockType).toBe('text')
      expect(result.layout[0].id).toBe('def456')
      expect(result.layout[0].text).toEqual({ en: 'English' })
    })

    it('should preserve blockType and id with configBlockReferences', () => {
      const fields: Field[] = [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [],
          blockReferences: ['content'],
        },
      ]

      const result = filterDataToSelectedLocales({
        configBlockReferences: [
          {
            slug: 'content',
            flattenedFields: [],
            fields: [
              {
                name: 'body',
                type: 'text',
                localized: true,
              },
            ],
          },
        ],
        docWithLocales: {
          layout: [
            {
              blockType: 'content',
              id: 'ref123',
              body: { en: 'English', es: 'Spanish' },
            },
          ],
        },
        fields,
        selectedLocales,
      })

      expect(result.layout).toHaveLength(1)
      expect(result.layout[0].blockType).toBe('content')
      expect(result.layout[0].id).toBe('ref123')
      expect(result.layout[0].body).toEqual({ en: 'English' })
    })
  })

  describe('localized arrays', () => {
    it('should filter localized array to selected locales and recurse into rows', () => {
      const fields: Field[] = [
        {
          name: 'items',
          type: 'array',
          localized: true,
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
      ]

      const docWithLocales = {
        items: {
          en: [{ title: 'English Item' }],
          es: [{ title: 'Spanish Item' }],
          de: [{ title: 'German Item' }],
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.items).toEqual({
        en: [{ title: 'English Item' }],
      })
    })

    it('should handle non-localized array with localized children', () => {
      const fields: Field[] = [
        {
          name: 'items',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
            },
            {
              name: 'value',
              type: 'text',
            },
          ],
        },
      ]

      const docWithLocales = {
        items: [
          { label: { en: 'English', es: 'Spanish' }, value: 'one' },
          { label: { en: 'English 2', es: 'Spanish 2' }, value: 'two' },
        ],
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.items).toEqual([
        { label: { en: 'English' }, value: 'one' },
        { label: { en: 'English 2' }, value: 'two' },
      ])
    })
  })

  describe('localized blocks', () => {
    it('should filter localized blocks field to selected locales', () => {
      const fields: Field[] = [
        {
          name: 'layout',
          type: 'blocks',
          localized: true,
          blocks: [
            {
              slug: 'hero',
              fields: [
                {
                  name: 'heading',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        layout: {
          en: [{ blockType: 'hero', id: '1', blockName: 'Hero EN', heading: 'Hello' }],
          es: [{ blockType: 'hero', id: '2', blockName: 'Hero ES', heading: 'Hola' }],
          de: [{ blockType: 'hero', id: '3', blockName: 'Hero DE', heading: 'Hallo' }],
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.layout).toEqual({
        en: [{ blockType: 'hero', id: '1', blockName: 'Hero EN', heading: 'Hello' }],
      })
    })

    it('should filter localized blocks with multiple selected locales', () => {
      const fields: Field[] = [
        {
          name: 'layout',
          type: 'blocks',
          localized: true,
          blocks: [
            {
              slug: 'text',
              fields: [
                {
                  name: 'body',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        layout: {
          en: [{ blockType: 'text', id: '1', blockName: 'Text EN', body: 'English' }],
          es: [{ blockType: 'text', id: '2', blockName: 'Text ES', body: 'Spanish' }],
          de: [{ blockType: 'text', id: '3', blockName: 'Text DE', body: 'German' }],
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en', 'es'],
      })

      expect(result.layout).toEqual({
        en: [{ blockType: 'text', id: '1', blockName: 'Text EN', body: 'English' }],
        es: [{ blockType: 'text', id: '2', blockName: 'Text ES', body: 'Spanish' }],
      })
    })
  })

  describe('localized groups', () => {
    it('should filter localized group to selected locales and recurse into children', () => {
      const fields: Field[] = [
        {
          name: 'meta',
          type: 'group',
          localized: true,
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
          ],
        },
      ]

      const docWithLocales = {
        meta: {
          en: { title: 'English Title', description: 'English Desc' },
          es: { title: 'Spanish Title', description: 'Spanish Desc' },
          de: { title: 'German Title', description: 'German Desc' },
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.meta).toEqual({
        en: { title: 'English Title', description: 'English Desc' },
      })
    })

    it('should handle non-localized group with localized children', () => {
      const fields: Field[] = [
        {
          name: 'seo',
          type: 'group',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
            },
            {
              name: 'slug',
              type: 'text',
            },
          ],
        },
      ]

      const docWithLocales = {
        seo: {
          title: { en: 'English SEO', es: 'Spanish SEO' },
          slug: 'my-page',
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.seo).toEqual({
        title: { en: 'English SEO' },
        slug: 'my-page',
      })
    })
  })

  describe('simple fields', () => {
    it('should filter localized field values to selected locales', () => {
      const fields: Field[] = [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ]

      const docWithLocales = {
        title: {
          en: 'English Title',
          es: 'Spanish Title',
          de: 'German Title',
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.title).toEqual({ en: 'English Title' })
    })

    it('should pass through non-localized fields as-is', () => {
      const fields: Field[] = [
        {
          name: 'slug',
          type: 'text',
        },
      ]

      const docWithLocales = {
        slug: 'my-slug',
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.slug).toBe('my-slug')
    })
  })
})
