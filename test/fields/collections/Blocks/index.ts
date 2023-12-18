import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'
import type { BlockField } from '../../../../packages/payload/src/fields/config/types'

import { blockFieldsSlug, textFieldsSlug } from '../../slugs'
import { AddCustomBlocks } from './components/AddCustomBlocks'
import { getBlocksFieldSeedData } from './shared'

export const getBlocksField = (prefix?: string): BlockField => ({
  name: 'blocks',
  blocks: [
    {
      fields: [
        {
          name: 'text',
          required: true,
          type: 'text',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
      slug: prefix ? `${prefix}Content` : 'content',
    },
    {
      fields: [
        {
          name: 'number',
          required: true,
          type: 'number',
        },
      ],
      slug: prefix ? `${prefix}Number` : 'number',
    },
    {
      fields: [
        {
          fields: [
            {
              name: 'subBlocks',
              blocks: [
                {
                  fields: [
                    {
                      name: 'text',
                      required: true,
                      type: 'text',
                    },
                  ],
                  slug: 'text',
                },
                {
                  fields: [
                    {
                      name: 'number',
                      required: true,
                      type: 'number',
                    },
                  ],
                  slug: 'number',
                },
              ],
              type: 'blocks',
            },
          ],
          label: 'Collapsible within Block',
          type: 'collapsible',
        },
      ],
      slug: prefix ? `${prefix}SubBlocks` : 'subBlocks',
    },
    {
      fields: [
        {
          tabs: [
            {
              fields: [
                {
                  fields: [
                    {
                      // collapsible
                      name: 'textInCollapsible',
                      type: 'text',
                    },
                  ],
                  label: 'Collapsible within Block',
                  type: 'collapsible',
                },
                {
                  fields: [
                    {
                      // collapsible
                      name: 'textInRow',
                      type: 'text',
                    },
                  ],
                  type: 'row',
                },
              ],
              label: 'Tab with Collapsible',
            },
          ],
          type: 'tabs',
        },
      ],
      slug: prefix ? `${prefix}Tabs` : 'tabs',
    },
  ],
  defaultValue: getBlocksFieldSeedData(prefix),
  required: true,
  type: 'blocks',
})

const BlockFields: CollectionConfig = {
  fields: [
    getBlocksField(),
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
      name: 'localizedBlocks',
      localized: true,
    },
    {
      name: 'i18nBlocks',
      blocks: [
        {
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
          slug: 'text',
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
      type: 'blocks',
    },
    {
      name: 'blocksWithSimilarConfigs',
      blocks: [
        {
          fields: [
            {
              name: 'items',
              fields: [
                {
                  name: 'title',
                  required: true,
                  type: 'text',
                },
              ],
              type: 'array',
            },
          ],
          slug: 'block-a',
        },
        {
          fields: [
            {
              name: 'items',
              fields: [
                {
                  name: 'title2',
                  required: true,
                  type: 'text',
                },
              ],
              type: 'array',
            },
          ],
          slug: 'block-b',
        },
      ],
      type: 'blocks',
    },
    {
      name: 'blocksWithMinRows',
      blocks: [
        {
          fields: [
            {
              name: 'blockTitle',
              type: 'text',
            },
          ],
          slug: 'block',
        },
      ],
      minRows: 2,
      type: 'blocks',
    },
    {
      name: 'customBlocks',
      blocks: [
        {
          fields: [
            {
              name: 'block1Title',
              type: 'text',
            },
          ],
          slug: 'block-1',
        },
        {
          fields: [
            {
              name: 'block2Title',
              type: 'text',
            },
          ],
          slug: 'block-2',
        },
      ],
      type: 'blocks',
    },
    {
      name: 'relationshipBlocks',
      blocks: [
        {
          fields: [
            {
              name: 'relationship',
              relationTo: textFieldsSlug,
              type: 'relationship',
            },
          ],
          slug: 'relationships',
        },
      ],
      type: 'blocks',
    },
    {
      name: 'ui',
      admin: {
        components: {
          Field: AddCustomBlocks,
        },
      },
      type: 'ui',
    },
  ],
  slug: blockFieldsSlug,
}

export default BlockFields
