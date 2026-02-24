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
      imageURL: '/api/uploads/file/payload480x320.jpg',
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
      slug: prefix ? `${prefix}WithIcon` : 'withIcon',
      images: {
        icon: { url: '/api/uploads/file/payload20x20.png', alt: 'Block icon' },
        thumbnail: { url: '/api/uploads/file/payload480x320.jpg', alt: 'Block thumbnail' },
      },
      interfaceName: prefix ? `${prefix}WithIconBlock` : 'WithIconBlock',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      slug: prefix ? `${prefix}NoBlockname` : 'noBlockname',
      interfaceName: prefix ? `${prefix}NoBlockname` : 'NoBlockname',
      admin: {
        disableBlockName: true,
      },
      fields: [
        {
          name: 'text',
          type: 'text',
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
                  slug: 'textRequired',
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
                  interfaceName: 'NumberBlock',
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

export const BlockFields: CollectionConfig = {
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
          slug: 'textInI18nBlock',
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
          slug: 'blockWithMinRows',
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
    {
      name: 'blockWithLabels',
      type: 'blocks',
      labels: {
        singular: ({ t }) => t('authentication:account'),
        plural: ({ t }) => t('authentication:generate'),
      },
      blocks: [
        {
          labels: {
            singular: ({ t }) => t('authentication:account'),
            plural: ({ t }) => t('authentication:generate'),
          },
          slug: 'text',
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
      name: 'deduplicatedBlocks',
      type: 'blocks',
      blockReferences: ['ConfigBlockTest'],
      blocks: [],
    },
    {
      name: 'deduplicatedBlocks2',
      type: 'blocks',
      blockReferences: ['ConfigBlockTest'],
      blocks: [],
    },
    {
      name: 'localizedReferencesLocalizedBlock',
      type: 'blocks',
      blockReferences: ['localizedTextReference'],
      blocks: [],
      localized: true,
    },
    {
      name: 'localizedReferences',
      type: 'blocks',
      // Needs to be a separate block - otherwise this will break in postgres. This is unrelated to block references
      // and an issue with all blocks.
      blockReferences: ['localizedTextReference2'],
      blocks: [],
    },
    {
      name: 'groupedBlocks',
      type: 'blocks',
      admin: {
        description: 'The purpose of this field is to test Block groups.',
      },
      blocks: [
        {
          slug: 'blockWithGroupOne',
          admin: {
            group: 'Group',
          },
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          slug: 'blockWithGroupTwo',
          admin: {
            group: 'Group',
          },
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          slug: 'blockWithLocalizedGroup',
          admin: {
            group: {
              en: 'Group in en',
              es: 'Group in es',
            },
          },
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          slug: 'blockWithoutGroup',
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
      name: 'readOnly',
      type: 'blocks',
      admin: {
        readOnly: true,
      },
      defaultValue: [
        {
          blockType: 'readOnlyBlock',
          title: 'readOnly',
        },
      ],
      blocks: [
        {
          slug: 'readOnlyBlock',
          fields: [
            {
              type: 'text',
              name: 'title',
              defaultValue: 'readOnly',
            },
          ],
        },
      ],
    },
    {
      name: 'enabledBlocks',
      type: 'text',
      admin: {
        description:
          "Change the value of this field to change the enabled blocks of the blocksWithDynamicFilterOptions field. If it's empty, all blocks are enabled.",
      },
    },
    {
      name: 'blocksWithDynamicFilterOptions',
      type: 'blocks',
      filterOptions: ({ siblingData: _siblingData, data }) => {
        const siblingData = _siblingData as { enabledBlocks: string }

        if (siblingData?.enabledBlocks !== data?.enabledBlocks) {
          // Just an extra assurance that the field is working as intended
          throw new Error('enabledBlocks and siblingData.enabledBlocks must be identical')
        }
        return siblingData?.enabledBlocks?.length ? [siblingData.enabledBlocks] : true
      },
      blocks: [
        {
          slug: 'blockOne',
          fields: [
            {
              type: 'text',
              name: 'block1Text',
              validate: (value: any) => {
                if (value === 'error') {
                  return 'error'
                }
                return true
              },
            },
          ],
        },
        {
          slug: 'blockTwo',
          fields: [
            {
              type: 'text',
              name: 'block2Text',
            },
          ],
        },
        {
          slug: 'blockThree',
          fields: [
            {
              type: 'text',
              name: 'block3Text',
            },
          ],
        },
      ],
    },
    {
      name: 'blocksWithFilterOptions',
      type: 'blocks',
      filterOptions: ['blockFour', 'blockFive'],
      blocks: [
        {
          slug: 'blockFour',
          fields: [
            {
              type: 'text',
              name: 'block1Text',
            },
          ],
        },
        {
          slug: 'blockFive',
          fields: [
            {
              type: 'text',
              name: 'block2Text',
            },
          ],
        },
        {
          slug: 'blockSix',
          fields: [
            {
              type: 'text',
              name: 'block3Text',
            },
          ],
        },
      ],
    },
  ],
}
