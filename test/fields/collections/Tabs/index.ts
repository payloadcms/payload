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
          description: 'Here is a description for tab one',
          fields: [
            {
              name: 'array',
              labels: {
                singular: 'Item',
                plural: 'Items',
              },
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
          description: 'Description for tab two',
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
          description: 'Description for tab three',
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
    {
      type: 'collapsible',
      label: 'Tabs within Collapsible',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Nested Tab One',
              description: 'Here is a description for a nested tab',
              fields: [
                {
                  name: 'textarea',
                  type: 'textarea',
                },
              ],
            },
            {
              label: 'Nested Tab Two',
              description: 'Description for tab two',
              fields: [
                {
                  name: 'anotherText',
                  type: 'text',
                  required: true,
                },
              ],
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
  textarea: 'Here is some text that goes in a textarea',
  anotherText: 'Super tired of writing this text',
};

export default TabsFields;
