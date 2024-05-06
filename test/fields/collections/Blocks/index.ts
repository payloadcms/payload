import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'
import type { BlockField } from '../../../../packages/payload/src/fields/config/types'

import { blockFieldsSlug, textFieldsSlug } from '../../slugs'
import { AddCustomBlocks } from './components/AddCustomBlocks'
import { getBlocksFieldSeedData } from './shared'

export const getBlocksField = (prefix?: string): BlockField => ({
  name: 'blocks',
  type: 'blocks',
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
    {
      name: 'ui',
      type: 'ui',
      admin: {
        components: {
          Field: AddCustomBlocks,
        },
      },
    },
  ],
}

export default BlockFields
