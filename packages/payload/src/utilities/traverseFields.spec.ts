import { describe, it, expect } from 'vitest'
import { traverseFields } from './traverseFields.js'
import type { Field } from '../fields/config/types.js'

describe('traverseFields', () => {
  const tabsField: Field = {
    type: 'tabs',
    tabs: [
      {
        label: 'Tab 1',
        name: 'tab1',
        fields: [
          {
            type: 'tabs',
            tabs: [
              {
                label: 'Ui Only Tab',
                fields: [
                  {
                    type: 'group',
                    name: 'group1',
                    label: 'Group 1',
                    fields: [
                      {
                        type: 'text',
                        name: 'text1',
                        label: 'Text 1',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }

  describe('tabs traversal', () => {
    it('should return correct dot notation in parentPath', () => {
      traverseFields({
        fields: [tabsField],
        callback: ({ field, parentPath }) => {
          if (field.type === 'text' && field.name === 'text1') {
            expect(parentPath).toEqual('tab1.group1.')
          }
        },
      })
    })
  })

  describe('parent localization', () => {
    it('should preserve parent localization through tabs', () => {
      const fields: Field[] = [
        {
          name: 'group',
          type: 'group',
          localized: true,
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  label: 'Tab',
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
      let textParentIsLocalized: boolean | undefined

      traverseFields({
        fields,
        callback: ({ field, parentIsLocalized }) => {
          if (field.type === 'text') {
            textParentIsLocalized = parentIsLocalized
          }
        },
      })

      expect(textParentIsLocalized).toBe(true)
    })

    it('should traverse localized tabs within localized parents', () => {
      let textParentIsLocalized: boolean | undefined

      traverseFields({
        callback: ({ field, parentIsLocalized }) => {
          if (field.type === 'text') {
            textParentIsLocalized = parentIsLocalized
          }
        },
        fields: [
          {
            name: 'group',
            type: 'group',
            localized: true,
            fields: [
              {
                type: 'tabs',
                tabs: [
                  {
                    name: 'tab',
                    localized: true,
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
        ],
        ref: {
          group: {
            en: {
              tab: {
                text: 'value',
              },
            },
          },
        },
      })

      expect(textParentIsLocalized).toBe(true)
    })

    it('should preserve parent localization through collapsibles', () => {
      const fields: Field[] = [
        {
          name: 'group',
          type: 'group',
          localized: true,
          fields: [
            {
              type: 'collapsible',
              label: 'Collapsible',
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
      let textParentIsLocalized: boolean | undefined

      traverseFields({
        fields,
        callback: ({ field, parentIsLocalized }) => {
          if (field.type === 'text') {
            textParentIsLocalized = parentIsLocalized
          }
        },
      })

      expect(textParentIsLocalized).toBe(true)
    })
  })
})
