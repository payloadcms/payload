import type { Field } from '../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { mergeLocalizedData } from './mergeLocalizedData.js'

describe('mergeLocalizedData', () => {
  const selectedLocales = ['en']
  const configBlockReferences = []

  describe('simple fields', () => {
    it('should merge localized field values for selected locales', () => {
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

      const dataWithLocales = {
        title: {
          en: 'Updated English Title',
          es: 'Updated Spanish Title',
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.title).toEqual({
        en: 'Updated English Title',
        es: 'Spanish Title',
        de: 'German Title',
      })
    })

    it('should keep doc value for non-localized fields', () => {
      const fields: Field[] = [
        {
          name: 'title',
          type: 'text',
          localized: false,
        },
      ]

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales: {
          title: 'New Title',
        },
        docWithLocales: {
          title: 'Old Title',
        },
        fields,
        selectedLocales,
      })

      expect(result.title).toBe('New Title')

      const missingData = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales: {},
        docWithLocales: {
          title: 'Old Title',
        },
        fields,
        selectedLocales,
      })

      expect(missingData.title).toBe('Old Title')

      const updatedData = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales: {
          title: 'Updated Title',
        },
        docWithLocales: {},
        fields,
        selectedLocales,
      })

      expect(updatedData.title).toBe('Updated Title')
    })
  })

  describe('groups', () => {
    it('should merge localized group with locale keys at top level', () => {
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
          en: {
            title: 'EN Title',
            description: 'EN Desc',
          },
          es: {
            title: 'ES Title',
            description: 'ES Desc',
          },
        },
      }

      const dataWithLocales = {
        meta: {
          en: {
            title: 'Updated EN Title',
            description: 'Updated EN Desc',
          },
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.meta).toEqual({
        en: {
          title: 'Updated EN Title',
          description: 'Updated EN Desc',
        },
        es: {
          title: 'ES Title',
          description: 'ES Desc',
        },
      })
    })

    it('should handle non-localized group with localized children', () => {
      const fields: Field[] = [
        {
          name: 'meta',
          type: 'group',
          localized: false,
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
            },
            {
              name: 'version',
              type: 'number',
              localized: false,
            },
          ],
        },
      ]

      const docWithLocales = {
        meta: {
          title: {
            en: 'EN Title',
            es: 'ES Title',
          },
          version: 1,
        },
      }

      const dataWithLocales = {
        meta: {
          title: {
            en: 'Updated EN Title',
          },
          version: 2,
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.meta).toEqual({
        title: {
          en: 'Updated EN Title',
          es: 'ES Title',
        },
        version: 2,
      })
    })
  })

  describe('arrays', () => {
    it('should merge localized array with locale keys at top level', () => {
      const fields: Field[] = [
        {
          name: 'items',
          type: 'array',
          localized: true,
          fields: [
            {
              name: 'name',
              type: 'text',
            },
          ],
        },
      ]

      const docWithLocales = {
        items: {
          en: [{ name: 'EN Item 1' }, { name: 'EN Item 2' }],
          es: [{ name: 'ES Item 1' }],
        },
      }

      const dataWithLocales = {
        items: {
          en: [{ name: 'Updated EN Item 1' }, { name: 'Updated EN Item 2' }],
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.items).toEqual({
        en: [{ name: 'Updated EN Item 1' }, { name: 'Updated EN Item 2' }],
        es: [{ name: 'ES Item 1' }],
      })
    })

    it('should handle non-localized array with localized children', () => {
      const fields: Field[] = [
        {
          name: 'items',
          type: 'array',
          localized: false,
          fields: [
            {
              name: 'name',
              type: 'text',
              localized: true,
            },
          ],
        },
      ]

      const docWithLocales = {
        items: [
          {
            name: {
              en: 'EN Item 1',
              es: 'ES Item 1',
            },
          },
          {
            name: {
              en: 'EN Item 2',
              es: 'ES Item 2',
            },
          },
        ],
      }

      const dataWithLocales = {
        items: [
          {
            name: {
              en: 'Updated EN Item 1',
            },
          },
          {
            name: {
              en: 'Updated EN Item 2',
            },
          },
        ],
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.items).toEqual([
        {
          name: {
            en: 'Updated EN Item 1',
            es: 'ES Item 1',
          },
        },
        {
          name: {
            en: 'Updated EN Item 2',
            es: 'ES Item 2',
          },
        },
      ])
    })
  })

  describe('blocks', () => {
    it('should merge localized blocks with locale keys at top level', () => {
      const fields: Field[] = [
        {
          name: 'content',
          type: 'blocks',
          localized: true,
          blocks: [
            {
              slug: 'text',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        content: {
          en: [{ blockType: 'text', text: 'EN Text' }],
          es: [{ blockType: 'text', text: 'ES Text' }],
        },
      }

      const dataWithLocales = {
        content: {
          en: [{ blockType: 'text', text: 'Updated EN Text' }],
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.content).toEqual({
        en: [{ blockType: 'text', text: 'Updated EN Text' }],
        es: [{ blockType: 'text', text: 'ES Text' }],
      })
    })

    it('should handle blocks with nested arrays', () => {
      const fields: Field[] = [
        {
          name: 'content',
          type: 'blocks',
          localized: true,
          blocks: [
            {
              slug: 'nested',
              fields: [
                {
                  name: 'items',
                  type: 'array',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        content: {
          en: [
            {
              blockType: 'nested',
              items: [{ name: 'EN Item 1' }],
            },
          ],
          es: [
            {
              blockType: 'nested',
              items: [{ name: 'ES Item 1' }],
            },
          ],
        },
      }

      const dataWithLocales = {
        content: {
          en: [
            {
              blockType: 'nested',
              items: [{ name: 'Updated EN Item 1' }],
            },
          ],
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.content).toEqual({
        en: [
          {
            blockType: 'nested',
            items: [{ name: 'Updated EN Item 1' }],
          },
        ],
        es: [
          {
            blockType: 'nested',
            items: [{ name: 'ES Item 1' }],
          },
        ],
      })
    })
  })

  describe('tabs', () => {
    it('should merge localized named tabs with locale keys at top level', () => {
      const fields: Field[] = [
        {
          type: 'tabs',
          tabs: [
            {
              name: 'meta',
              localized: true,
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        meta: {
          en: {
            title: 'EN Title',
          },
          es: {
            title: 'ES Title',
          },
        },
      }

      const dataWithLocales = {
        meta: {
          en: {
            title: 'Updated EN Title',
          },
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.meta).toEqual({
        en: {
          title: 'Updated EN Title',
        },
        es: {
          title: 'ES Title',
        },
      })
    })

    it('should handle unnamed tabs with localized fields', () => {
      const fields: Field[] = [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'tab1',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        title: {
          en: 'EN Title',
          es: 'ES Title',
        },
      }

      const dataWithLocales = {
        title: {
          en: 'Updated EN Title',
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.title).toEqual({
        en: 'Updated EN Title',
        es: 'ES Title',
      })
    })
  })

  describe('deeply nested structures', () => {
    it('should handle multiple levels of nesting with locale keys only at topmost localized field', () => {
      const fields: Field[] = [
        {
          name: 'outer',
          type: 'group',
          localized: true,
          fields: [
            {
              name: 'inner',
              type: 'group',
              localized: false,
              fields: [
                {
                  name: 'items',
                  type: 'array',
                  localized: false,
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                      localized: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        outer: {
          en: {
            inner: {
              items: [{ text: 'EN Item 1' }],
            },
          },
          es: {
            inner: {
              items: [{ text: 'ES Item 1' }],
            },
          },
        },
      }

      const dataWithLocales = {
        outer: {
          en: {
            inner: {
              items: [{ text: 'Updated EN Item 1' }],
            },
          },
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales,
      })

      expect(result.outer).toEqual({
        en: {
          inner: {
            items: [{ text: 'Updated EN Item 1' }],
          },
        },
        es: {
          inner: {
            items: [{ text: 'ES Item 1' }],
          },
        },
      })
    })
  })

  describe('multiple selected locales', () => {
    it('should merge multiple locales when selected', () => {
      const fields: Field[] = [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ]

      const docWithLocales = {
        title: {
          en: 'EN Title',
          es: 'ES Title',
          de: 'DE Title',
          fr: 'FR Title',
        },
      }

      const dataWithLocales = {
        title: {
          en: 'Updated EN Title',
          es: 'Updated ES Title',
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales: ['en', 'es'],
      })

      expect(result.title).toEqual({
        en: 'Updated EN Title',
        es: 'Updated ES Title',
        de: 'DE Title',
        fr: 'FR Title',
      })
    })
  })

  describe('pass through fields, rows, collapsibles, unnamed tabs, unnamed groups', () => {
    it('should not lose merged locale data when processing unnamed tabs', () => {
      const fields: Field[] = [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Other Fields',
              fields: [
                {
                  name: 'description',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        title: {
          en: 'English Title',
        },
        description: {
          en: 'English Description',
        },
      }

      const dataWithLocales = {
        title: {
          en: 'English Title',
          es: 'Spanish Title',
        },
        description: {
          en: 'English Description',
          es: 'Spanish Description',
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales: ['es'],
      })

      expect(result.title).toEqual({
        en: 'English Title',
        es: 'Spanish Title',
      })

      expect(result.description).toEqual({
        en: 'English Description',
        es: 'Spanish Description',
      })
    })

    it('should not lose other locale data when processing unnamed groups', () => {
      // https://github.com/payloadcms/payload/issues/15642
      const fields: Field[] = [
        {
          name: 'textFieldRoot',
          type: 'text',
        },
        {
          name: 'textFieldRootLocalized',
          type: 'text',
          localized: true,
        },
        // Unnamed group - fields at same data level as root
        {
          type: 'group',
          fields: [
            {
              name: 'textFieldNested',
              type: 'text',
            },
            {
              name: 'textFieldNestedLocalized',
              type: 'text',
              localized: true,
            },
          ],
        },
      ]

      // Document already has English data published
      const docWithLocales = {
        textFieldRoot: 'Root Value',
        textFieldRootLocalized: {
          en: 'English Root Localized',
          es: 'Spanish Root Localized',
        },
        textFieldNested: 'Nested Value',
        textFieldNestedLocalized: {
          en: 'English Nested Localized',
          es: 'Spanish Nested Localized',
        },
      }

      // Publishing only English locale with updated data
      const dataWithLocales = {
        textFieldRoot: 'Updated Root Value',
        textFieldRootLocalized: {
          en: 'Updated English Root Localized',
        },
        textFieldNested: 'Updated Nested Value',
        textFieldNestedLocalized: {
          en: 'Updated English Nested Localized',
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      // Root non-localized field should be updated
      expect(result.textFieldRoot).toBe('Updated Root Value')

      // Root localized field should merge: update en, preserve es
      expect(result.textFieldRootLocalized).toEqual({
        en: 'Updated English Root Localized',
        es: 'Spanish Root Localized',
      })

      // Nested non-localized field should be updated
      expect(result.textFieldNested).toBe('Updated Nested Value')

      // Nested localized field should merge: update en, preserve es
      // This is the bug - es data is lost
      expect(result.textFieldNestedLocalized).toEqual({
        en: 'Updated English Nested Localized',
        es: 'Spanish Nested Localized',
      })
    })

    it('should not lose other locale data when processing row fields', () => {
      const fields: Field[] = [
        {
          type: 'row',
          fields: [
            {
              name: 'rowFieldLocalized',
              type: 'text',
              localized: true,
            },
          ],
        },
      ]

      const docWithLocales = {
        rowFieldLocalized: {
          en: 'English Value',
          es: 'Spanish Value',
        },
      }

      const dataWithLocales = {
        rowFieldLocalized: {
          en: 'Updated English Value',
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.rowFieldLocalized).toEqual({
        en: 'Updated English Value',
        es: 'Spanish Value',
      })
    })

    it('should preserve other locale data when updating through unnamed tabs', () => {
      const fields: Field[] = [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Tab 1',
              fields: [
                {
                  name: 'tabFieldLocalized',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
      ]

      // Document has both en and es data
      const docWithLocales = {
        tabFieldLocalized: {
          en: 'English Value',
          es: 'Spanish Value',
        },
      }

      // Only updating en
      const dataWithLocales = {
        tabFieldLocalized: {
          en: 'Updated English Value',
        },
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      // es should be preserved
      expect(result.tabFieldLocalized).toEqual({
        en: 'Updated English Value',
        es: 'Spanish Value',
      })
    })
  })

  describe('block metadata preservation', () => {
    it('should preserve blockType, id, and blockName when existing doc has no blocks', () => {
      // Reproduces the bug where autosave creates a doc without blocks,
      // then blocks are added and publishSpecificLocale drops metadata
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

      // Main doc has no blocks (autosave wrote before blocks were added)
      const docWithLocales = {}

      const dataWithLocales = {
        layout: [
          {
            blockType: 'content',
            id: 'abc123',
            blockName: 'My Content Block',
            richText: { en: 'Hello' },
          },
        ],
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.layout).toHaveLength(1)
      expect(result.layout[0].blockType).toBe('content')
      expect(result.layout[0].id).toBe('abc123')
      expect(result.layout[0].blockName).toBe('My Content Block')
    })

    it('should preserve blockType and id when existing doc has undefined for block field', () => {
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

      // existingValue is undefined (field not present in existing doc)
      const docWithLocales = {
        layout: undefined,
      }

      const dataWithLocales = {
        layout: [
          {
            blockType: 'text',
            id: 'def456',
            text: { en: 'English text', es: 'Spanish text' },
          },
        ],
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.layout).toHaveLength(1)
      expect(result.layout[0].blockType).toBe('text')
      expect(result.layout[0].id).toBe('def456')
      expect(result.layout[0].text).toEqual({ en: 'English text' })
    })

    it('should preserve blockType when existing doc already has blocks', () => {
      // Ensures the fix doesn't break the happy path
      const fields: Field[] = [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [
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
        },
      ]

      const docWithLocales = {
        layout: [
          {
            blockType: 'content',
            id: 'existing-id',
            body: { en: 'Old English', es: 'Old Spanish' },
          },
        ],
      }

      const dataWithLocales = {
        layout: [
          {
            blockType: 'content',
            id: 'existing-id',
            body: { en: 'New English', es: 'New Spanish' },
          },
        ],
      }

      const result = mergeLocalizedData({
        configBlockReferences: [],
        dataWithLocales,
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.layout).toHaveLength(1)
      expect(result.layout[0].blockType).toBe('content')
      expect(result.layout[0].id).toBe('existing-id')
      expect(result.layout[0].body).toEqual({ en: 'New English', es: 'Old Spanish' })
    })
  })
})
