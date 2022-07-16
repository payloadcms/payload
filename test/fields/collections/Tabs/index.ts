import type { CollectionConfig } from '../../../../src/collections/config/types';

const TabsFields: CollectionConfig = {
  slug: 'tabs-fields',
  versions: true,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab One',
          fields: [
            {
              name: 'array',
              type: 'array',
              required: true,
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Tab Two',
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          label: 'Tab Three',
          fields: [
            {
              name: 'number',
              type: 'number',
              required: true,
            },
          ],
        },
      ],
    },
  ],
};

export const tabsDoc = {
  array: [
    {
      text: 'Hello, I\'m the first row',
    },
    {
      text: 'Second row here',
    },
    {
      text: 'Here is some data for the third row',
    },
  ],
  text: 'This text will show up in the second tab input',
  number: 12,
};

export default TabsFields;
