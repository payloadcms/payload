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
      name: 'fieldToToggle',
      type: 'text',
      required: true,
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
  ],
}

export default ConditionalLogic
