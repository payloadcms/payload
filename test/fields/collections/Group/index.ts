import type { CollectionConfig } from 'payload'

import { groupFieldsSlug } from '../../slugs.js'

export const groupDefaultValue = 'set from parent'
export const groupDefaultChild = 'child takes priority'

const GroupFields: CollectionConfig = {
  slug: groupFieldsSlug,
  versions: true,
  fields: [
    {
      label: 'Group Field',
      name: 'group',
      type: 'group',
      defaultValue: {
        defaultParent: groupDefaultValue,
      },
      admin: {
        description: 'This is a group.',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          defaultValue: groupDefaultValue,
        },
        {
          name: 'defaultParent',
          type: 'text',
          defaultValue: groupDefaultChild,
        },
        {
          name: 'defaultChild',
          type: 'text',
          defaultValue: groupDefaultChild,
        },
        {
          name: 'subGroup',
          type: 'group',
          fields: [
            {
              name: 'textWithinGroup',
              type: 'text',
            },
            {
              name: 'arrayWithinGroup',
              type: 'array',
              fields: [
                {
                  name: 'textWithinArray',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'arrayOfGroups',
      type: 'array',
      defaultValue: [
        {
          groupItem: {
            text: 'Hello world',
          },
        },
      ],
      fields: [
        {
          name: 'groupItem',
          type: 'group',
          fields: [{ name: 'text', type: 'text' }],
        },
      ],
    },
    {
      name: 'localizedGroup',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      localized: true,
    },
    {
      name: 'potentiallyEmptyGroup',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'groupInRow',
          type: 'group',
          fields: [
            {
              name: 'field',
              type: 'text',
            },
            {
              name: 'secondField',
              type: 'text',
            },
            {
              name: 'thirdField',
              type: 'text',
            },
          ],
        },
        {
          name: 'secondGroupInRow',
          type: 'group',
          fields: [
            {
              name: 'field',
              type: 'text',
            },
            {
              name: 'nestedGroup',
              type: 'group',
              fields: [
                {
                  name: 'nestedField',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'groups',
          label: 'Groups in tabs',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'groupInRow',
                  type: 'group',
                  fields: [
                    {
                      name: 'field',
                      type: 'text',
                    },
                    {
                      name: 'secondField',
                      type: 'text',
                    },
                    {
                      name: 'thirdField',
                      type: 'text',
                    },
                  ],
                },
                {
                  name: 'secondGroupInRow',
                  type: 'group',
                  fields: [
                    {
                      name: 'field',
                      type: 'text',
                    },
                    {
                      name: 'nestedGroup',
                      type: 'group',
                      fields: [
                        {
                          name: 'nestedField',
                          type: 'text',
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
    },
    {
      name: 'camelCaseGroup',
      type: 'group',
      fields: [
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              type: 'text',
              name: 'text',
              localized: true,
            },
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
          ],
        },
      ],
    },
    {
      name: 'localizedGroupArr',
      type: 'group',
      localized: true,
      fields: [
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              type: 'text',
              name: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'localizedGroupSelect',
      type: 'group',
      localized: true,
      fields: [
        {
          type: 'select',
          hasMany: true,
          options: ['one', 'two'],
          name: 'select',
        },
      ],
    },
    {
      name: 'localizedGroupRel',
      type: 'group',
      localized: true,
      fields: [
        {
          type: 'relationship',
          relationTo: 'email-fields',
          name: 'email',
        },
      ],
    },
    {
      name: 'localizedGroupManyRel',
      type: 'group',
      localized: true,
      fields: [
        {
          type: 'relationship',
          relationTo: 'email-fields',
          name: 'email',
          hasMany: true,
        },
      ],
    },
    {
      name: 'localizedGroupPolyRel',
      type: 'group',
      localized: true,
      fields: [
        {
          type: 'relationship',
          relationTo: ['email-fields'],
          name: 'email',
        },
      ],
    },
    {
      name: 'localizedGroupPolyHasManyRel',
      type: 'group',
      localized: true,
      fields: [
        {
          type: 'relationship',
          relationTo: ['email-fields'],
          name: 'email',
          hasMany: true,
        },
      ],
    },
  ],
}

export default GroupFields
