/* eslint-disable no-param-reassign */
import type { CollectionConfig } from '../../../../src/collections/config/types';
import { blocksField, blocksFieldSeedData } from '../Blocks';
import { UIField } from './UIField';

export const tabsSlug = 'tabs-fields';

export const namedTabText = 'Some text in a named tab';
export const namedTabDefaultValue = 'default text inside of a named tab';
export const localizedTextValue = 'localized text';

const TabsFields: CollectionConfig = {
  slug: tabsSlug,
  access: {
    read: () => true,
  },
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
          description: 'This tab has a name, which should namespace the contained fields.',
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
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'defaultValue',
              type: 'text',
              defaultValue: namedTabDefaultValue,
            },
          ],
        },
        {
          name: 'namedTabWithDefaultValue',
          description: 'This tab has a name, which should namespace the contained fields.',
          fields: [
            {
              name: 'defaultValue',
              type: 'text',
              defaultValue: namedTabDefaultValue,
            },
          ],
        },
        {
          name: 'localizedTab',
          label: { en: 'Localized Tab en', es: 'Localized Tab es' },
          localized: true,
          description: 'This tab is localized and requires a name',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          name: 'accessControlTab',
          access: {
            read: () => false,
          },
          description: 'This tab is cannot be read',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          name: 'hooksTab',
          label: 'Hooks Tab',
          hooks: {
            beforeValidate: [
              ({ data = {} }) => {
                if (!data.hooksTab) data.hooksTab = {};
                data.hooksTab.beforeValidate = true;
                return data.hooksTab;
              },
            ],
            beforeChange: [
              ({ data = {} }) => {
                if (!data.hooksTab) data.hooksTab = {};
                data.hooksTab.beforeChange = true;
                return data.hooksTab;
              },
            ],
            afterChange: [
              ({ originalDoc }) => {
                originalDoc.hooksTab.afterChange = true;
                return originalDoc.hooksTab;
              },
            ],
            afterRead: [
              ({ data = {} }) => {
                if (!data.hooksTab) data.hooksTab = {};
                data.hooksTab.afterRead = true;
                return data.hooksTab;
              },
            ],
          },
          description: 'This tab has hooks',
          fields: [
            {
              name: 'beforeValidate',
              type: 'checkbox',
            },
            {
              name: 'beforeChange',
              type: 'checkbox',
            },
            {
              name: 'afterChange',
              type: 'checkbox',
            },
            {
              name: 'afterRead',
              type: 'checkbox',
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
            {
              name: 'nestedTab',
              label: 'Nested Tab with Name',
              description: 'This tab has a name, which should namespace the contained fields.',
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
  nestedTab: {
    text: 'Some text in a nested, named tab',
  },
  tab: {
    array: [
      {
        text: "Hello, I'm the first row, in a named tab",
      },
      {
        text: 'Second row here, in a named tab',
      },
      {
        text: 'Here is some data for the third row, in a named tab',
      },
    ],
    text: namedTabText,
  },
  text: 'localized',
  localizedTab: {
    text: localizedTextValue,
  },
  accessControlTab: {
    text: 'cannot be read',
  },
  hooksTab: {
    beforeValidate: false,
    beforeChange: false,
    afterChange: false,
    afterRead: false,
  },
  textarea: 'Here is some text that goes in a textarea',
  anotherText: 'Super tired of writing this text',
  textInRow: 'hello',
  numberInRow: 235,
};

export default TabsFields;
