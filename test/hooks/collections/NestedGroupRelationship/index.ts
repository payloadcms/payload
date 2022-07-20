import { CollectionConfig } from '../../../../src/collections/config/types';

export const nestedAfterReadHook = 'nested-after-read-hook';

const NestedGroupRelationship: CollectionConfig = {
  slug: nestedAfterReadHook,
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'group',
      name: 'group',
      fields: [
        {
          type: 'array',
          name: 'array',
          fields: [
            {
              type: 'text',
              name: 'input',
            },
            {
              type: 'text',
              name: 'afterRead',
              hooks: {
                afterRead: [(): string => {
                  return 'hello';
                }],
              },
            },
          ],
        },
        {
          type: 'group',
          name: 'subGroup',
          fields: [
            {
              name: 'afterRead',
              type: 'text',
              hooks: {
                afterRead: [(): string => {
                  return 'hello';
                }],
              },
            },
          ],
        },
      ],
    },
  ],
};

export default NestedGroupRelationship;
