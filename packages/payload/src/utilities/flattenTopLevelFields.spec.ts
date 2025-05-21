import { I18nClient } from '@payloadcms/translations'
import { ClientField } from '../fields/config/client.js'
import flattenFields from './flattenTopLevelFields.js'

describe('flattenFields', () => {
  const i18n: I18nClient = {
    t: (value: string) => value,
    language: 'en',
    dateFNS: {} as any,
    dateFNSKey: 'en-US',
    fallbackLanguage: 'en',
    translations: {},
  }

  const baseField: ClientField = {
    type: 'text',
    name: 'title',
    label: 'Title',
  }

  describe('basic flattening', () => {
    it('should return flat list for top-level fields', () => {
      const fields = [baseField]
      const result = flattenFields(fields)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('title')
    })
  })

  describe('group flattening', () => {
    it('should flatten fields inside group with accessor and labelWithPrefix with moveSubFieldsToTop', () => {
      const fields: ClientField[] = [
        {
          type: 'group',
          name: 'meta',
          label: 'Meta Info',
          fields: [
            {
              type: 'text',
              name: 'slug',
              label: 'Slug',
            },
          ],
        },
      ]

      const result = flattenFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('slug')
      expect(result[0].accessor).toBe('meta-slug')
      expect(result[0].labelWithPrefix).toBe('Meta Info > Slug')
    })

    it('should NOT flatten fields inside group without moveSubFieldsToTop', () => {
      const fields: ClientField[] = [
        {
          type: 'group',
          name: 'meta',
          label: 'Meta Info',
          fields: [
            {
              type: 'text',
              name: 'slug',
              label: 'Slug',
            },
          ],
        },
      ]

      const result = flattenFields(fields)

      // Should return the group as a top-level item, not the inner field
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('meta')
      expect('fields' in result[0]).toBe(true)
      expect('accessor' in result[0]).toBe(false)
      expect('labelWithPrefix' in result[0]).toBe(false)
    })

    it('should correctly handle deeply nested group fields with and without moveSubFieldsToTop', () => {
      const fields: ClientField[] = [
        {
          type: 'group',
          name: 'outer',
          label: 'Outer',
          fields: [
            {
              type: 'group',
              name: 'inner',
              label: 'Inner',
              fields: [
                {
                  type: 'text',
                  name: 'deep',
                  label: 'Deep Field',
                },
              ],
            },
          ],
        },
      ]

      const hoisted = flattenFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(hoisted).toHaveLength(1)
      expect(hoisted[0].name).toBe('deep')
      expect(hoisted[0].accessor).toBe('outer-inner-deep')
      expect(hoisted[0].labelWithPrefix).toBe('Outer > Inner > Deep Field')

      const nonHoisted = flattenFields(fields)

      expect(nonHoisted).toHaveLength(1)
      expect(nonHoisted[0].name).toBe('outer')
      expect('fields' in nonHoisted[0]).toBe(true)
      expect('accessor' in nonHoisted[0]).toBe(false)
      expect('labelWithPrefix' in nonHoisted[0]).toBe(false)
    })

    it('should hoist fields from unnamed group if moveSubFieldsToTop is true', () => {
      const fields: ClientField[] = [
        {
          type: 'group',
          label: 'Unnamed group',
          fields: [
            {
              type: 'text',
              name: 'insideUnnamedGroup',
            },
          ],
        },
      ]

      const withExtract = flattenFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      // Should keep the group as a single top-level field
      expect(withExtract).toHaveLength(1)
      expect(withExtract[0].type).toBe('text')
      expect(withExtract[0].accessor).toBeUndefined()
      expect(withExtract[0].labelWithPrefix).toBeUndefined()

      const withoutExtract = flattenFields(fields)

      expect(withoutExtract).toHaveLength(1)
      expect(withoutExtract[0].type).toBe('group')
      expect(withoutExtract[0].accessor).toBeUndefined()
      expect(withoutExtract[0].labelWithPrefix).toBeUndefined()
    })

    it('should hoist using deepest named group only if parents are unnamed', () => {
      const fields: ClientField[] = [
        {
          type: 'group',
          label: 'Outer',
          fields: [
            {
              type: 'group',
              label: 'Middle',
              fields: [
                {
                  type: 'group',
                  name: 'namedGroup',
                  label: 'Named Group',
                  fields: [
                    {
                      type: 'group',
                      label: 'Inner',
                      fields: [
                        {
                          type: 'text',
                          name: 'nestedField',
                          label: 'Nested Field',
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

      const hoistedResult = flattenFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(hoistedResult).toHaveLength(1)
      expect(hoistedResult[0].name).toBe('nestedField')
      expect(hoistedResult[0].accessor).toBe('namedGroup-nestedField')
      expect(hoistedResult[0].labelWithPrefix).toBe('Named Group > Nested Field')

      const nonHoistedResult = flattenFields(fields)

      expect(nonHoistedResult).toHaveLength(1)
      expect(nonHoistedResult[0].type).toBe('group')
      expect('fields' in nonHoistedResult[0]).toBe(true)
      expect('accessor' in nonHoistedResult[0]).toBe(false)
      expect('labelWithPrefix' in nonHoistedResult[0]).toBe(false)
    })
  })

  describe('array and block edge cases', () => {
    it('should NOT flatten fields in arrays or blocks with moveSubFieldsToTop', () => {
      const fields: ClientField[] = [
        {
          type: 'array',
          name: 'items',
          label: 'Items',
          fields: [
            {
              type: 'text',
              name: 'label',
              label: 'Label',
            },
          ],
        },
        {
          type: 'blocks',
          name: 'layout',
          blocks: [
            {
              slug: 'block',
              fields: [
                {
                  type: 'text',
                  name: 'content',
                  label: 'Content',
                },
              ],
            },
          ],
        },
      ]

      const result = flattenFields(fields, { moveSubFieldsToTop: true })
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('items')
      expect(result[1].name).toBe('layout')
    })

    it('should NOT flatten fields in arrays or blocks without moveSubFieldsToTop', () => {
      const fields: ClientField[] = [
        {
          type: 'array',
          name: 'things',
          label: 'Things',
          fields: [
            {
              type: 'text',
              name: 'thingLabel',
              label: 'Thing Label',
            },
          ],
        },
        {
          type: 'blocks',
          name: 'contentBlocks',
          blocks: [
            {
              slug: 'content',
              fields: [
                {
                  type: 'text',
                  name: 'body',
                  label: 'Body',
                },
              ],
            },
          ],
        },
      ]

      const result = flattenFields(fields)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('things')
      expect(result[1].name).toBe('contentBlocks')
    })

    it('should not hoist group fields nested inside arrays', () => {
      const fields: ClientField[] = [
        {
          type: 'array',
          name: 'arrayField',
          label: 'Array Field',
          fields: [
            {
              type: 'group',
              name: 'groupInArray',
              label: 'Group In Array',
              fields: [
                {
                  type: 'text',
                  name: 'nestedInArrayGroup',
                  label: 'Nested In Array Group',
                },
              ],
            },
          ],
        },
      ]

      const result = flattenFields(fields, { moveSubFieldsToTop: true })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('arrayField')
    })

    it('should not hoist group fields nested inside blocks', () => {
      const fields: ClientField[] = [
        {
          type: 'blocks',
          name: 'blockField',
          blocks: [
            {
              slug: 'exampleBlock',
              fields: [
                {
                  type: 'group',
                  name: 'groupInBlock',
                  label: 'Group In Block',
                  fields: [
                    {
                      type: 'text',
                      name: 'nestedInBlockGroup',
                      label: 'Nested In Block Group',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const result = flattenFields(fields, { moveSubFieldsToTop: true })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('blockField')
    })
  })

  describe('row and collapsible behavior', () => {
    it('should recursively flatten collapsible fields regardless of moveSubFieldsToTop', () => {
      const fields: ClientField[] = [
        {
          type: 'collapsible',
          label: 'Collapsible',
          fields: [
            {
              type: 'text',
              name: 'nickname',
              label: 'Nickname',
            },
          ],
        },
      ]

      const defaultResult = flattenFields(fields)
      const hoistedResult = flattenFields(fields, { moveSubFieldsToTop: true })

      for (const result of [defaultResult, hoistedResult]) {
        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('nickname')
        expect('accessor' in result[0]).toBe(false)
        expect('labelWithPrefix' in result[0]).toBe(false)
      }
    })

    it('should recursively flatten row fields regardless of moveSubFieldsToTop', () => {
      const fields: ClientField[] = [
        {
          type: 'row',
          fields: [
            {
              type: 'text',
              name: 'firstName',
              label: 'First Name',
            },
            {
              type: 'text',
              name: 'lastName',
              label: 'Last Name',
            },
          ],
        },
      ]

      const defaultResult = flattenFields(fields)
      const hoistedResult = flattenFields(fields, { moveSubFieldsToTop: true })

      for (const result of [defaultResult, hoistedResult]) {
        expect(result).toHaveLength(2)
        expect(result[0].name).toBe('firstName')
        expect(result[1].name).toBe('lastName')
        expect('accessor' in result[0]).toBe(false)
        expect('labelWithPrefix' in result[0]).toBe(false)
      }
    })

    it('should hoist named group fields inside rows', () => {
      const fields: ClientField[] = [
        {
          type: 'row',
          fields: [
            {
              type: 'group',
              name: 'groupInRow',
              label: 'Group In Row',
              fields: [
                {
                  type: 'text',
                  name: 'nestedInRowGroup',
                  label: 'Nested In Row Group',
                },
              ],
            },
          ],
        },
      ]

      const result = flattenFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(result).toHaveLength(1)
      expect(result[0].accessor).toBe('groupInRow-nestedInRowGroup')
      expect(result[0].labelWithPrefix).toBe('Group In Row > Nested In Row Group')
    })

    it('should hoist named group fields inside collapsibles', () => {
      const fields: ClientField[] = [
        {
          type: 'collapsible',
          label: 'Collapsible',
          fields: [
            {
              type: 'group',
              name: 'groupInCollapsible',
              label: 'Group In Collapsible',
              fields: [
                {
                  type: 'text',
                  name: 'nestedInCollapsibleGroup',
                  label: 'Nested In Collapsible Group',
                },
              ],
            },
          ],
        },
      ]

      const result = flattenFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(result).toHaveLength(1)
      expect(result[0].accessor).toBe('groupInCollapsible-nestedInCollapsibleGroup')
      expect(result[0].labelWithPrefix).toBe('Group In Collapsible > Nested In Collapsible Group')
    })
  })

  describe('tab integration', () => {
    it('should hoist named group fields inside tabs when moveSubFieldsToTop is true', () => {
      const fields: ClientField[] = [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Tab One',
              fields: [
                {
                  type: 'group',
                  name: 'groupInTab',
                  label: 'Group In Tab',
                  fields: [
                    {
                      type: 'text',
                      name: 'nestedInTabGroup',
                      label: 'Nested In Tab Group',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const result = flattenFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(result).toHaveLength(1)
      expect(result[0].accessor).toBe('groupInTab-nestedInTabGroup')
      expect(result[0].labelWithPrefix).toBe('Group In Tab > Nested In Tab Group')
    })
  })
})
