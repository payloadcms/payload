import type { BlocksField, CollectionConfig } from 'payload'

import { slateEditor } from '@payloadcms/richtext-slate'

import { blockFieldsSlug, textFieldsSlug } from '../../slugs.js'
import { getBlocksFieldSeedData } from './shared.js'

export const getBlocksField = (prefix?: string): BlocksField => ({
  name: 'blocks',
  type: 'blocks',
  blocks: [
    {
      slug: prefix ? `${prefix}Content` : 'content',
      interfaceName: prefix ? `${prefix}ContentBlock` : 'ContentBlock',
      admin: {
        components: {
          Label: './collections/Blocks/components/CustomBlockLabel.tsx',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'richText',
          type: 'richText',
          editor: slateEditor({}),
        },
      ],
    },
    {
      slug: prefix ? `${prefix}Number` : 'number',
      interfaceName: prefix ? `${prefix}NumberBlock` : 'NumberBlock',
      fields: [
        {
          name: 'number',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      slug: prefix ? `${prefix}SubBlocks` : 'subBlocks',
      interfaceName: prefix ? `${prefix}SubBlocksBlock` : 'SubBlocksBlock',
      fields: [
        {
          type: 'collapsible',
          fields: [
            {
              name: 'subBlocks',
              type: 'blocks',
              blocks: [
                {
                  slug: 'text',
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                      required: true,
                    },
                  ],
                },
                {
                  slug: 'number',
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
          label: 'Collapsible within Block',
        },
      ],
    },
    {
      slug: prefix ? `${prefix}Tabs` : 'tabs',
      interfaceName: prefix ? `${prefix}TabsBlock` : 'TabsBlock',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              fields: [
                {
                  type: 'collapsible',
                  fields: [
                    {
                      // collapsible
                      name: 'textInCollapsible',
                      type: 'text',
                    },
                  ],
                  label: 'Collapsible within Block',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      // collapsible
                      name: 'textInRow',
                      type: 'text',
                    },
                  ],
                },
              ],
              label: 'Tab with Collapsible',
            },
          ],
        },
      ],
    },
  ],
  defaultValue: getBlocksFieldSeedData(prefix),
  required: true,
})

const BlockFields: CollectionConfig = {
  slug: blockFieldsSlug,
  fields: [
    getBlocksField(),
    {
      ...getBlocksField(),
      name: 'duplicate',
    },
    {
      ...getBlocksField('localized'),
      name: 'collapsedByDefaultBlocks',
      admin: {
        initCollapsed: true,
      },
      localized: true,
    },
    {
      ...getBlocksField('localized'),
      name: 'disableSort',
      admin: {
        isSortable: false,
      },
      localized: true,
    },
    {
      ...getBlocksField('localized'),
      name: 'localizedBlocks',
      localized: true,
    },
    {
      name: 'i18nBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'text',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
          graphQL: {
            singularName: 'I18nText',
          },
          labels: {
            plural: {
              en: 'Texts en',
              es: 'Texts es',
            },
            singular: {
              en: 'Text en',
              es: 'Text es',
            },
          },
        },
      ],
      label: {
        en: 'Block en',
        es: 'Block es',
      },
      labels: {
        plural: {
          en: 'Blocks en',
          es: 'Blocks es',
        },
        singular: {
          en: 'Block en',
          es: 'Block es',
        },
      },
    },
    {
      name: 'blocksWithLocalizedArray',
      type: 'blocks',
      blocks: [
        {
          slug: 'localizedArray',
          fields: [
            {
              name: 'array',
              type: 'array',
              localized: true,
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
    {
      name: 'blocksWithSimilarConfigs',
      type: 'blocks',
      blocks: [
        {
          slug: 'block-a',
          fields: [
            {
              name: 'items',
              type: 'array',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          slug: 'block-b',
          fields: [
            {
              name: 'items',
              type: 'array',
              fields: [
                {
                  name: 'title2',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          slug: 'group-block',
          fields: [
            {
              name: 'group',
              type: 'group',
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
    {
      name: 'blocksWithSimilarGroup',
      type: 'blocks',
      admin: {
        description:
          'The purpose of this field is to test validateExistingBlockIsIdentical works with similar blocks with group fields',
      },
      blocks: [
        {
          slug: 'group-block',
          fields: [
            {
              name: 'group',
              type: 'group',
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
          slug: 'block-b',
          fields: [
            {
              name: 'items',
              type: 'array',
              fields: [
                {
                  name: 'title2',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'blocksWithMinRows',
      type: 'blocks',
      blocks: [
        {
          slug: 'block',
          fields: [
            {
              name: 'blockTitle',
              type: 'text',
            },
          ],
        },
      ],
      minRows: 2,
    },
    {
      name: 'customBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'block-1',
          fields: [
            {
              name: 'block1Title',
              type: 'text',
            },
          ],
        },
        {
          slug: 'block-2',
          fields: [
            {
              name: 'block2Title',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'ui',
      type: 'ui',
      admin: {
        components: {
          Field: '/collections/Blocks/components/AddCustomBlocks/index.js#AddCustomBlocks',
        },
      },
    },
    {
      name: 'relationshipBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'relationships',
          fields: [
            {
              name: 'relationship',
              type: 'relationship',
              relationTo: textFieldsSlug,
            },
          ],
        },
      ],
    },
  ],
}

export default BlockFields
