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
