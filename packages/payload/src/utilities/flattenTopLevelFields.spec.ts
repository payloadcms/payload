import { I18nClient } from '@ruya.sa/translations'
import { describe, it, expect } from 'vitest'
import { ClientField } from '../fields/config/client.js'
import { flattenTopLevelFields } from './flattenTopLevelFields.js'

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
      const result = flattenTopLevelFields(fields)
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

      const result = flattenTopLevelFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(result).toHaveLength(2)
      expect(result[1].name).toBe('slug')
      expect(result[1].accessor).toBe('meta.slug')
      expect(result[1].labelWithPrefix).toBe('Meta Info > Slug')
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

      const result = flattenTopLevelFields(fields)

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

      const hoisted = flattenTopLevelFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(hoisted).toHaveLength(3)
      expect(hoisted[2].name).toBe('deep')
      expect(hoisted[2].accessor).toBe('outer.inner.deep')
      expect(hoisted[2].labelWithPrefix).toBe('Outer > Inner > Deep Field')

      const nonHoisted = flattenTopLevelFields(fields)

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

      const withExtract = flattenTopLevelFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      // Should include top level group and its nested field as a top-level field
      expect(withExtract).toHaveLength(2)
      expect(withExtract[1].type).toBe('text')
      expect(withExtract[1].accessor).toBeUndefined()
      expect(withExtract[1].labelWithPrefix).toBeUndefined()

      const withoutExtract = flattenTopLevelFields(fields)

      // Should return the group as a top-level item, not the inner field
      expect(withoutExtract).toHaveLength(1)
      expect(withoutExtract[0].type).toBe('text')
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

      const hoistedResult = flattenTopLevelFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(hoistedResult).toHaveLength(5)
      expect(hoistedResult[4].name).toBe('nestedField')
      expect(hoistedResult[4].accessor).toBe('namedGroup.nestedField')
      expect(hoistedResult[4].labelWithPrefix).toBe('Named Group > Nested Field')

      const nonHoistedResult = flattenTopLevelFields(fields)

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

      const result = flattenTopLevelFields(fields, { moveSubFieldsToTop: true })
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

      const result = flattenTopLevelFields(fields)
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

      const result = flattenTopLevelFields(fields, { moveSubFieldsToTop: true })
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

      const result = flattenTopLevelFields(fields, { moveSubFieldsToTop: true })
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

      const defaultResult = flattenTopLevelFields(fields)
      const hoistedResult = flattenTopLevelFields(fields, { moveSubFieldsToTop: true })

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

      const defaultResult = flattenTopLevelFields(fields)
      const hoistedResult = flattenTopLevelFields(fields, { moveSubFieldsToTop: true })

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

      const result = flattenTopLevelFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(result).toHaveLength(2)
      expect(result[1].accessor).toBe('groupInRow.nestedInRowGroup')
      expect(result[1].labelWithPrefix).toBe('Group In Row > Nested In Row Group')
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

      const result = flattenTopLevelFields(fields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(result).toHaveLength(2)
      expect(result[1].accessor).toBe('groupInCollapsible.nestedInCollapsibleGroup')
      expect(result[1].labelWithPrefix).toBe('Group In Collapsible > Nested In Collapsible Group')
    })
  })

  describe('tab integration', () => {
    const namedTabFields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Tab One',
            name: 'tabOne',
            fields: [
              {
                type: 'array',
                name: 'array',
                fields: [
                  {
                    type: 'text',
                    name: 'text',
                  },
                ],
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'arrayInRow',
                    type: 'array',
                    fields: [
                      {
                        name: 'textInArrayInRow',
                        type: 'text',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'text',
                name: 'textInTab',
                label: 'Text In Tab',
              },
              {
                type: 'group',
                name: 'groupInTab',
                label: 'Group In Tab',
                fields: [
                  {
                    type: 'text',
                    name: 'nestedTextInTabGroup',
                    label: 'Nested Text In Tab Group',
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const unnamedTabFields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Tab One',
            fields: [
              {
                type: 'array',
                name: 'array',
                fields: [
                  {
                    type: 'text',
                    name: 'text',
                  },
                ],
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'arrayInRow',
                    type: 'array',
                    fields: [
                      {
                        name: 'textInArrayInRow',
                        type: 'text',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'text',
                name: 'textInTab',
                label: 'Text In Tab',
              },
            ],
          },
        ],
      },
    ]

    it('should hoist named group fields inside unamed tabs when moveSubFieldsToTop is true', () => {
      const unnamedTabWithNamedGroup: ClientField[] = [
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

      const result = flattenTopLevelFields(unnamedTabWithNamedGroup, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(result).toHaveLength(2)
      expect(result[1].accessor).toBe('groupInTab.nestedInTabGroup')
      expect(result[1].labelWithPrefix).toBe('Group In Tab > Nested In Tab Group')
    })

    it('should hoist fields inside unnamed groups inside unnamed tabs when moveSubFieldsToTop is true', () => {
      const unnamedTabWithUnnamedGroup: ClientField[] = [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Tab One',
              fields: [
                {
                  type: 'group',
                  label: 'Unnamed Group In Tab',
                  fields: [
                    {
                      type: 'text',
                      name: 'nestedInUnnamedGroup',
                      label: 'Nested In Unnamed Group',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const defaultResult = flattenTopLevelFields(unnamedTabWithUnnamedGroup)

      expect(defaultResult).toHaveLength(1)
      expect(defaultResult[0].type).toBe('text')
      expect(defaultResult[0].label).toBe('Nested In Unnamed Group')
      expect('accessor' in defaultResult[0]).toBe(false)
      expect('labelWithPrefix' in defaultResult[0]).toBe(false)

      const hoistedResult = flattenTopLevelFields(unnamedTabWithUnnamedGroup, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(hoistedResult).toHaveLength(2)
      const hoistedField = hoistedResult[1]
      expect(hoistedField.name).toBe('nestedInUnnamedGroup')
      expect(hoistedField.accessor).toBeUndefined()
      expect(hoistedField.labelWithPrefix).toBeUndefined()
    })

    it('should properly hoist fields inside named tabs when moveSubFieldsToTop is true', () => {
      const result = flattenTopLevelFields(namedTabFields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(result).toHaveLength(5)
      expect(result[0].accessor).toBe('tabOne.array')
      expect(result[0].labelWithPrefix).toBe('Tab One > array')
      expect(result[1].accessor).toBe('tabOne.arrayInRow')
      expect(result[1].labelWithPrefix).toBe('Tab One > arrayInRow')
      expect(result[2].accessor).toBe('tabOne.textInTab')
      expect(result[2].labelWithPrefix).toBe('Tab One > Text In Tab')
      expect(result[4].accessor).toBe('tabOne.groupInTab.nestedTextInTabGroup')
      expect(result[4].labelWithPrefix).toBe('Tab One > Group In Tab > Nested Text In Tab Group')
    })

    it('should NOT hoist fields inside named tabs when moveSubFieldsToTop is false', () => {
      const result = flattenTopLevelFields(namedTabFields)

      // We expect one top-level field: the tabs container itself is *not* hoisted
      expect(result).toHaveLength(1)

      const tabField = result[0]
      expect(tabField.type).toBe('tab')

      // Confirm nested fields are NOT hoisted: no accessors or labelWithPrefix at the top level
      expect('accessor' in tabField).toBe(false)
      expect('labelWithPrefix' in tabField).toBe(false)
    })

    it('should hoist fields inside unnamed tabs regardless of moveSubFieldsToTop', () => {
      const resultDefault = flattenTopLevelFields(unnamedTabFields)
      const resultHoisted = flattenTopLevelFields(unnamedTabFields, {
        moveSubFieldsToTop: true,
        i18n,
      })

      expect(resultDefault).toHaveLength(3)
      expect(resultHoisted).toHaveLength(3)
      expect(resultDefault).toEqual(resultHoisted)

      for (const field of resultDefault) {
        expect(field.accessor).toBeUndefined()
        expect(field.labelWithPrefix).toBeUndefined()
      }
    })
  })
})
