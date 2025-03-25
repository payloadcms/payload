import type { CollectionConfig } from 'payload'

import { conditionalLogicSlug } from '../../slugs.js'

const ConditionalLogic: CollectionConfig = {
  slug: conditionalLogicSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
    {
      name: 'toggleField',
      type: 'checkbox',
    },
    {
      name: 'fieldWithCondition',
      type: 'text',
      admin: {
        condition: ({ toggleField }) => Boolean(toggleField),
      },
    },
    {
      name: 'customFieldWithField',
      type: 'text',
      admin: {
        components: {
          Field: '/collections/ConditionalLogic/CustomFieldWithField.js',
        },
        condition: ({ toggleField }) => Boolean(toggleField),
      },
    },
    {
      name: 'customFieldWithHOC',
      label: 'Custom Field With HOC (legacy)',
      type: 'text',
      admin: {
        components: {
          Field: '/collections/ConditionalLogic/CustomFieldWithHOC.js',
        },
        condition: ({ toggleField }) => Boolean(toggleField),
      },
    },
    {
      name: 'customClientFieldWithCondition',
      type: 'text',
      admin: {
        components: {
          Field: '/collections/ConditionalLogic/CustomClientField.js',
        },
        condition: ({ toggleField }) => Boolean(toggleField),
      },
    },
    {
      name: 'customServerFieldWithCondition',
      type: 'text',
      admin: {
        components: {
          Field: '/collections/ConditionalLogic/CustomServerField.js',
        },
        condition: ({ toggleField }) => Boolean(toggleField),
      },
    },
    {
      name: 'conditionalRichText',
      type: 'richText',
      admin: {
        condition: ({ toggleField }) => Boolean(toggleField),
      },
    },
    {
      name: 'userConditional',
      type: 'text',
      admin: {
        condition: (_data, _siblingData, { user }) => {
          return Boolean(user?.canViewConditionalField)
        },
      },
    },
    {
      name: 'parentGroup',
      type: 'group',
      fields: [
        {
          name: 'enableParentGroupFields',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'siblingField',
          type: 'text',
          admin: {
            description: 'Ensures we can rely on nested fields within `data`.',
            condition: ({ parentGroup }) => Boolean(parentGroup?.enableParentGroupFields),
          },
        },
      ],
    },
    {
      name: 'reliesOnParentGroup',
      type: 'text',
      admin: {
        description: 'Ensures we can rely on nested fields within `siblingsData`.',
        condition: (_, { parentGroup }) => Boolean(parentGroup?.enableParentGroupFields),
      },
    },
    {
      name: 'groupSelection',
      type: 'select',
      options: ['group1', 'group2'],
    },
    {
      name: 'group1',
      type: 'group',
      fields: [
        {
          name: 'group1Field',
          type: 'text',
        },
      ],
      admin: {
        condition: ({ groupSelection }) => groupSelection === 'group1',
      },
    },
    {
      name: 'group2',
      type: 'group',
      fields: [
        {
          name: 'group2Field',
          type: 'text',
        },
      ],
      admin: {
        condition: ({ groupSelection }) => groupSelection === 'group2',
      },
    },
    {
      name: 'enableConditionalFields',
      type: 'checkbox',
    },
    {
      name: 'arrayWithConditionalField',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'textWithCondition',
          type: 'text',
          admin: {
            condition: (data) => data.enableConditionalFields,
          },
        },
      ],
    },
    {
      name: 'blocksWithConditionalField',
      type: 'blocks',
      blocks: [
        {
          slug: 'blockWithConditionalField',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'textWithCondition',
              type: 'text',
              admin: {
                condition: (data) => data.enableConditionalFields,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'arrayOne',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'arrayTwo',
          type: 'array',
          fields: [
            {
              name: 'selectOptions',
              type: 'select',
              defaultValue: 'optionOne',
              options: [
                {
                  label: 'Option One',
                  value: 'optionOne',
                },
                {
                  label: 'Option Two',
                  value: 'optionTwo',
                },
              ],
            },
            {
              name: 'arrayThree',
              type: 'array',
              fields: [
                {
                  name: 'numberField',
                  type: 'number',
                  admin: {
                    condition: (data, siblingData, { path, user }) => {
                      // Ensure path has enough depth
                      if (path.length < 5) {
                        return false
                      }

                      const arrayOneIndex = parseInt(String(path[1]), 10)
                      const arrayTwoIndex = parseInt(String(path[3]), 10)

                      const arrayOneItem = data.arrayOne?.[arrayOneIndex]
                      const arrayTwoItem = arrayOneItem?.arrayTwo?.[arrayTwoIndex]

                      return arrayTwoItem?.selectOptions === 'optionTwo'
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default ConditionalLogic
