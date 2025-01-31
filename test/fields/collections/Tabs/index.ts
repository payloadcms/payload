import type { CollectionConfig } from 'payload'

import { tabsFieldsSlug } from '../../slugs.js'
import { getBlocksField } from '../Blocks/index.js'
import { namedTabDefaultValue } from './constants.js'

const TabsFields: CollectionConfig = {
  slug: tabsFieldsSlug,
  access: {
    read: () => true,
  },
  versions: true,
  fields: [
    {
      name: 'sidebarField',
      type: 'text',
      label: 'Sidebar Field',
      admin: {
        position: 'sidebar',
        description:
          'This should not collapse despite there being many tabs pushing the main fields open.',
      },
    },
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
                  Field: '/collections/Tabs/UIField.js#UIField',
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
                // path: 'array.n.text'
                // schemaPath: '_index-1-0.array.text'
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
          fields: [getBlocksField()],
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
            {
              name: 'json',
              type: 'json',
            },
          ],
        },
        {
          name: 'tab',
          label: 'Tab with Name',
          interfaceName: 'TabWithName',
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
            {
              type: 'row',
              fields: [
                {
                  name: 'arrayInRow',
                  type: 'array',
                  fields: [
                    {
                      name: 'textInArrayInRow',
                      type: 'text',
                    },
                  ],
                },
              ],
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
                if (!data.hooksTab) {
                  data.hooksTab = {}
                }
                data.hooksTab.beforeValidate = true
                return data.hooksTab
              },
            ],
            beforeChange: [
              ({ data = {} }) => {
                if (!data.hooksTab) {
                  data.hooksTab = {}
                }
                data.hooksTab.beforeChange = true
                return data.hooksTab
              },
            ],
            afterChange: [
              ({ originalDoc }) => {
                originalDoc.hooksTab.afterChange = true
                return originalDoc.hooksTab
              },
            ],
            afterRead: [
              ({ data = {} }) => {
                if (!data.hooksTab) {
                  data.hooksTab = {}
                }
                data.hooksTab.afterRead = true
                return data.hooksTab
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
        {
          name: 'camelCaseTab',
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
}

export default TabsFields
