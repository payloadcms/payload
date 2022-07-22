import type { CollectionConfig } from '../../../../src/collections/config/types';
import { blocksField, blocksFieldSeedData } from '../Blocks';
import { UIField } from './UIField';

const TabsFields: CollectionConfig = {
  slug: 'tabs-fields',
  versions: true,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab with Array',
          description: 'This tab has an array.',
          fields: [
            {
              type: 'ui',
              name: 'demoUIField',
              label: 'Demo UI Field',
              admin: {
                components: {
                  Field: UIField,
                },
              },
            },
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
          label: 'Tab with Blocks',
          description: 'Blocks are rendered here to ensure they populate and render correctly.',
          fields: [blocksField],
        },
        {
          label: 'Tab with Group',
          description: 'This tab has a group, which should not render its top border or margin.',
          fields: [
            {
              name: 'group',
              type: 'group',
              label: 'Group',
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
          label: 'Tab with Row',
          description: 'This tab has a row field.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'textInRow',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'numberInRow',
                  type: 'number',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'tab',
          label: 'Tab with Name',
          description: 'This tab has a name, which should namespace the contained field.',
          fields: [
            {
              name: 'text',
              type: 'text',
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
      text: "Hello, I'm the first row",
    },
    {
      text: 'Second row here',
    },
    {
      text: 'Here is some data for the third row',
    },
  ],
  blocks: blocksFieldSeedData,
  group: {
    number: 12,
  },
  tab: {
    text: 'Some brand new text',
  },
  textarea: 'Here is some text that goes in a textarea',
  anotherText: 'Super tired of writing this text',
  textInRow: 'hello',
  numberInRow: 235,
};

export default TabsFields;
