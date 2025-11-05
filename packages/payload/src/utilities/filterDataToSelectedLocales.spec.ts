import type { Field } from '../fields/config/types.js'

import { filterDataToSelectedLocales } from './filterDataToSelectedLocales.js'

describe('filterDataToSelectedLocales', () => {
  const configBlockReferences = []

  describe('edge cases', () => {
    it('should return docWithLocales when selectedLocales is empty', () => {
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
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: [],
      })

      expect(result).toEqual(docWithLocales)
    })
  })

  describe('simple fields', () => {
    it('should filter localized field to selected locales only', () => {
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
        selectedLocales: ['en'],
      })

      expect(result.title).toEqual({
        en: 'English Title',
      })
    })

    it('should filter localized field to multiple selected locales', () => {
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
          fr: 'French Title',
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en', 'es'],
      })

      expect(result.title).toEqual({
        en: 'English Title',
        es: 'Spanish Title',
      })
    })

    it('should keep non-localized fields as-is', () => {
      const fields: Field[] = [
        {
          name: 'title',
          type: 'text',
        },
      ]

      const docWithLocales = {
        title: 'Simple Title',
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.title).toBe('Simple Title')
    })

    it('should handle fields not present in docWithLocales', () => {
      const fields: Field[] = [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ]

      const docWithLocales = {}

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.title).toBeUndefined()
    })
  })

  describe('groups', () => {
    it('should filter localized group with locale keys at top level', () => {
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
          de: {
            title: 'DE Title',
            description: 'DE Desc',
          },
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.meta).toEqual({
        en: {
          title: 'EN Title',
          description: 'EN Desc',
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
            },
          ],
        },
      ]

      const docWithLocales = {
        meta: {
          title: {
            en: 'EN Title',
            es: 'ES Title',
            de: 'DE Title',
          },
          version: 1,
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.meta).toEqual({
        title: {
          en: 'EN Title',
        },
        version: 1,
      })
    })

    it('should handle unnamed groups', () => {
      const fields: Field[] = [
        {
          type: 'group',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
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

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.title).toEqual({
        en: 'EN Title',
      })
    })
  })

  describe('arrays', () => {
    it('should filter localized array with locale keys at top level', () => {
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
          de: [{ name: 'DE Item 1' }],
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.items).toEqual({
        en: [{ name: 'EN Item 1' }, { name: 'EN Item 2' }],
      })
    })

    it('should handle non-localized array with localized children', () => {
      const fields: Field[] = [
        {
          name: 'items',
          type: 'array',
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
              de: 'DE Item 1',
            },
          },
          {
            name: {
              en: 'EN Item 2',
              es: 'ES Item 2',
              de: 'DE Item 2',
            },
          },
        ],
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.items).toEqual([
        {
          name: {
            en: 'EN Item 1',
          },
        },
        {
          name: {
            en: 'EN Item 2',
          },
        },
      ])
    })

    it('should not include localized array if no selected locales match', () => {
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
          es: [{ name: 'ES Item 1' }],
          de: [{ name: 'DE Item 1' }],
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.items).toBeUndefined()
    })
  })

  describe('blocks', () => {
    it('should filter localized blocks with locale keys at top level', () => {
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
          de: [{ blockType: 'text', text: 'DE Text' }],
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en', 'es'],
      })

      expect(result.content).toEqual({
        en: [{ blockType: 'text', text: 'EN Text' }],
        es: [{ blockType: 'text', text: 'ES Text' }],
      })
    })

    it('should handle non-localized blocks with localized children', () => {
      const fields: Field[] = [
        {
          name: 'content',
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
        content: [
          {
            blockType: 'text',
            text: {
              en: 'EN Text',
              es: 'ES Text',
              de: 'DE Text',
            },
          },
        ],
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.content).toEqual([
        {
          blockType: 'text',
          text: {
            en: 'EN Text',
          },
        },
      ])
    })

    it('should handle blocks with nested arrays', () => {
      const fields: Field[] = [
        {
          name: 'content',
          type: 'blocks',
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
                      localized: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        content: [
          {
            blockType: 'nested',
            items: [
              {
                name: {
                  en: 'EN Item 1',
                  es: 'ES Item 1',
                  de: 'DE Item 1',
                },
              },
            ],
          },
        ],
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.content).toEqual([
        {
          blockType: 'nested',
          items: [
            {
              name: {
                en: 'EN Item 1',
              },
            },
          ],
        },
      ])
    })

    it('should handle blocks without matching block definition', () => {
      const fields: Field[] = [
        {
          name: 'content',
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
        content: [
          {
            blockType: 'unknown',
            text: {
              en: 'EN Text',
              es: 'ES Text',
            },
          },
        ],
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.content).toEqual([
        {
          blockType: 'unknown',
          text: {
            en: 'EN Text',
            es: 'ES Text',
          },
        },
      ])
    })
  })

  describe('tabs', () => {
    it('should filter localized named tabs with locale keys at top level', () => {
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
          de: {
            title: 'DE Title',
          },
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.meta).toEqual({
        en: {
          title: 'EN Title',
        },
      })
    })

    it('should handle non-localized named tabs with localized children', () => {
      const fields: Field[] = [
        {
          type: 'tabs',
          tabs: [
            {
              name: 'meta',
              localized: false,
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
        meta: {
          title: {
            en: 'EN Title',
            es: 'ES Title',
            de: 'DE Title',
          },
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.meta).toEqual({
        title: {
          en: 'EN Title',
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
          de: 'DE Title',
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.title).toEqual({
        en: 'EN Title',
      })
    })
  })

  describe('layout fields', () => {
    it('should handle collapsible fields', () => {
      const fields: Field[] = [
        {
          type: 'collapsible',
          label: 'Meta',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
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

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.title).toEqual({
        en: 'EN Title',
      })
    })

    it('should handle row fields', () => {
      const fields: Field[] = [
        {
          type: 'row',
          fields: [
            {
              name: 'firstName',
              type: 'text',
              localized: true,
            },
            {
              name: 'lastName',
              type: 'text',
              localized: true,
            },
          ],
        },
      ]

      const docWithLocales = {
        firstName: {
          en: 'EN First',
          es: 'ES First',
        },
        lastName: {
          en: 'EN Last',
          es: 'ES Last',
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result).toEqual({
        firstName: {
          en: 'EN First',
        },
        lastName: {
          en: 'EN Last',
        },
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
              fields: [
                {
                  name: 'items',
                  type: 'array',
                  fields: [
                    {
                      name: 'text',
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
          de: {
            inner: {
              items: [{ text: 'DE Item 1' }],
            },
          },
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.outer).toEqual({
        en: {
          inner: {
            items: [{ text: 'EN Item 1' }],
          },
        },
      })
    })

    it('should handle complex nested structures with mixed localization', () => {
      const fields: Field[] = [
        {
          name: 'page',
          type: 'group',
          fields: [
            {
              name: 'sections',
              type: 'array',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  localized: true,
                },
                {
                  name: 'content',
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
              ],
            },
          ],
        },
      ]

      const docWithLocales = {
        page: {
          sections: [
            {
              title: {
                en: 'EN Section 1',
                es: 'ES Section 1',
                de: 'DE Section 1',
              },
              content: [
                {
                  blockType: 'text',
                  text: {
                    en: 'EN Text',
                    es: 'ES Text',
                    de: 'DE Text',
                  },
                },
              ],
            },
          ],
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.page).toEqual({
        sections: [
          {
            title: {
              en: 'EN Section 1',
            },
            content: [
              {
                blockType: 'text',
                text: {
                  en: 'EN Text',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe('parentIsLocalized parameter', () => {
    it('should inherit localization from parent when field does not specify', () => {
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
          en: [{ name: 'EN Item 1' }],
          es: [{ name: 'ES Item 1' }],
        },
      }

      const result = filterDataToSelectedLocales({
        configBlockReferences: [],
        docWithLocales,
        fields,
        selectedLocales: ['en'],
      })

      expect(result.items).toEqual({
        en: [{ name: 'EN Item 1' }],
      })
    })
  })
})
