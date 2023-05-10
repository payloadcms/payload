import type { CollectionConfig } from '../../../../src/collections/config/types';

export const groupDefaultValue = 'set from parent';
export const groupDefaultChild = 'child takes priority';
export const groupFieldsSlug = 'group-fields';

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
  ],
};

export const groupDoc = {
  group: {
    text: 'some text within a group',
    subGroup: {
      textWithinGroup: 'please',
      arrayWithinGroup: [{
        textWithinArray: 'text in a group and array',
      }],
    },
  },
};

export default GroupFields;
