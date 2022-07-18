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
    },
  },
};

export default GroupFields;
