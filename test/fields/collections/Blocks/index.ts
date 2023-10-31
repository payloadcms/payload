import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'
import type { BlockField } from '../../../../packages/payload/src/fields/config/types'

import { AddCustomBlocks } from './components/AddCustomBlocks'

export const getBlocksFieldSeedData = (prefix?: string): any => [
  {
    blockName: 'First block',
    blockType: prefix ? `${prefix}Content` : 'content',
    text: 'first block',
    richText: [
      {
        children: [{ text: '' }],
      },
    ],
  },
  {
    blockName: 'Second block',
    blockType: prefix ? `${prefix}Number` : 'number',
    number: 342,
  },
  {
    blockName: 'Sub-block demonstration',
    blockType: prefix ? `${prefix}SubBlocks` : 'subBlocks',
    subBlocks: [
      {
        blockName: 'First sub block',
        blockType: 'number',
        number: 123,
      },
      {
        blockName: 'Second sub block',
        blockType: 'text',
        text: 'second sub block',
      },
    ],
  },
  {
    blockName: 'I18n Block',
    blockType: 'i18n-text',
    text: 'first block',
  },
]

export const getBlocksField = (prefix?: string): BlockField => ({
  name: 'blocks',
  type: 'blocks',
  required: true,
  blocks: [
    {
      slug: prefix ? `${prefix}Content` : 'content',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
    },
    {
      slug: prefix ? `${prefix}Number` : 'number',
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
      fields: [
        {
          type: 'collapsible',
          label: 'Collapsible within Block',
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
        },
      ],
    },
    {
      slug: prefix ? `${prefix}Tabs` : 'tabs',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Tab with Collapsible',
              fields: [
                {
                  type: 'collapsible',
                  label: 'Collapsible within Block',
                  fields: [
                    {
                      // collapsible
                      name: 'textInCollapsible',
                      type: 'text',
                    },
                  ],
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
            },
          ],
        },
      ],
    },
  ],
  defaultValue: getBlocksFieldSeedData(prefix),
})

const BlockFields: CollectionConfig = {
  slug: 'block-fields',
  fields: [
    getBlocksField(),
    {
      ...getBlocksField('localized'),
      name: 'collapsedByDefaultBlocks',
      localized: true,
      admin: {
        initCollapsed: true,
      },
    },
    {
      ...getBlocksField('localized'),
      name: 'localizedBlocks',
      localized: true,
    },
    {
      type: 'blocks',
      name: 'i18nBlocks',
      label: {
        en: 'Block en',
        es: 'Block es',
      },
      labels: {
        singular: {
          en: 'Block en',
          es: 'Block es',
        },
        plural: {
          en: 'Blocks en',
          es: 'Blocks es',
        },
      },
      blocks: [
        {
          slug: 'text',
          graphQL: {
            singularName: 'I18nText',
          },
          labels: {
            singular: {
              en: 'Text en',
              es: 'Text es',
            },
            plural: {
              en: 'Texts en',
              es: 'Texts es',
            },
          },
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
      type: 'blocks',
      name: 'blocksWithSimilarConfigs',
      blocks: [
        {
          slug: 'block-1',
          fields: [
            {
              type: 'array',
              name: 'items',
              fields: [
                {
                  type: 'text',
                  name: 'title',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          slug: 'block-2',
          fields: [
            {
              type: 'array',
              name: 'items',
              fields: [
                {
                  type: 'text',
                  name: 'title2',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
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
      type: 'ui',
      name: 'ui',
      admin: {
        components: {
          Field: AddCustomBlocks,
        },
      },
    },
  ],
}

export const blocksDoc = {
  blocks: getBlocksFieldSeedData(),
  localizedBlocks: getBlocksFieldSeedData('localized'),
}

export default BlockFields
