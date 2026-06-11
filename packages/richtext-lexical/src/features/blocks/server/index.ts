import type {
  Block,
  BlocksField,
  BlockSlug,
  Config,
  FieldSchemaMap,
  UIFieldClientProps,
  UIFieldServerProps,
} from 'payload'

import { sanitizeFields } from 'payload'

import { applyBaseFilterToFields } from '../../../utilities/applyBaseFilterToFields.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { blockPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { getBlockMarkdownTransformers } from './markdown/markdownTransformer.js'
import { ServerBlockNode } from './nodes/BlocksNode.js'
import { ServerInlineBlockNode } from './nodes/InlineBlocksNode.js'
import { createBlockNodeJSONSchema, createInlineBlockNodeJSONSchema } from './schema.js'
import { blockValidationHOC } from './validate.js'

export type {
  BlockFields,
  BlockFieldsOptionalID,
  InlineBlockFields,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from './schema.js'

export type BlocksFeatureProps = {
  blocks?: (Block | BlockSlug)[] | Block[]
  inlineBlocks?: (Block | BlockSlug)[] | Block[]
}

export const BlocksFeature = createServerFeature<BlocksFeatureProps, BlocksFeatureProps>({
  feature: async ({ config: _config, isRoot, parentIsLocalized, props: _props }) => {
    const validRelationships = _config.collections.map((c) => c.slug) || []

    const sanitized = await sanitizeFields({
      config: _config as unknown as Config,
      fields: [
        {
          name: 'lexical_blocks',
          type: 'blocks',
          blocks: _props.blocks ?? [],
        },
        {
          name: 'lexical_inline_blocks',
          type: 'blocks',
          blocks: _props.inlineBlocks ?? [],
        },
      ],
      parentIsLocalized,
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships,
    })

    const blockConfigs: Block[] = []
    for (const _block of (sanitized[0] as BlocksField).blocks) {
      const block =
        typeof _block === 'string' ? _config?.blocks?.find((b) => b.slug === _block) : _block
      if (!block) {
        throw new Error(
          `Block not found for slug: ${typeof _block === 'string' ? _block : _block?.slug}`,
        )
      }
      // Apply baseFilter to relationship fields in the block
      blockConfigs.push({
        ...block,
        fields: applyBaseFilterToFields(block.fields, _config),
      })
    }

    const inlineBlockConfigs: Block[] = []
    for (const _block of (sanitized[1] as BlocksField).blocks) {
      const block =
        typeof _block === 'string' ? _config?.blocks?.find((b) => b.slug === _block) : _block
      if (!block) {
        throw new Error(
          `Block not found for slug: ${typeof _block === 'string' ? _block : _block?.slug}`,
        )
      }
      // Apply baseFilter to relationship fields in the block
      inlineBlockConfigs.push({
        ...block,
        fields: applyBaseFilterToFields(block.fields, _config),
      })
    }

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#BlocksFeatureClient',
      generateSchemaMap: ({ config }) => {
        /**
         * Add sub-fields to the schemaMap. E.g. if you have an array field as part of the block, and it runs addRow, it will request these
         * sub-fields from the component map. Thus, we need to put them in the component map here.
         */
        const schemaMap: FieldSchemaMap = new Map()

        if (blockConfigs?.length) {
          for (const block of blockConfigs) {
            const blockFields = [...block.fields]

            if (block?.admin?.components) {
              blockFields.unshift({
                name: `_components`,
                type: 'ui',
                admin: {
                  components: {
                    Block: block.admin?.components?.Block,
                    BlockLabel: block.admin?.components?.Label,
                  },
                },
              })
            }
            schemaMap.set(`lexical_blocks.${block.slug}.fields`, {
              fields: blockFields,
            })
            schemaMap.set(`lexical_blocks.${block.slug}`, {
              name: `lexical_blocks_${block.slug}`,
              type: 'blocks',
              blocks: [block],
            })
          }
        }

        if (inlineBlockConfigs?.length) {
          // To generate block schemaMap which generates things like the componentMap for admin.Label
          for (const block of inlineBlockConfigs) {
            const blockFields = [...block.fields]

            if (block?.admin?.components) {
              blockFields.unshift({
                name: `_components`,
                type: 'ui',
                admin: {
                  components: {
                    Block: block.admin?.components?.Block,
                    BlockLabel: block.admin?.components?.Label,
                  },
                },
              })
            }

            schemaMap.set(`lexical_inline_blocks.${block.slug}.fields`, {
              fields: blockFields,
            })

            schemaMap.set(`lexical_inline_blocks.${block.slug}`, {
              name: `lexical_inline_blocks_${block.slug}`,
              type: 'blocks',
              blocks: [block],
            })
          }
        }

        return schemaMap
      },
      i18n,
      markdownTransformers: getBlockMarkdownTransformers({
        blocks: blockConfigs,
        inlineBlocks: inlineBlockConfigs,
      }),

      nodes: [
        createNode({
          jsonSchema: blockConfigs.length ? createBlockNodeJSONSchema(blockConfigs) : undefined,
          // @ts-expect-error - TODO: fix this
          getSubFields: ({ node }) => {
            if (!node) {
              if (!blockConfigs.length) {
                return []
              }
              return [
                {
                  name: 'lexical_blocks',
                  type: 'blocks',
                  blocks: blockConfigs,
                },
              ]
            }

            const blockType = node.fields.blockType
            const block = blockConfigs.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(blockConfigs)],
          node: ServerBlockNode,
          validations: [blockValidationHOC(blockConfigs)],
        }),
        createNode({
          jsonSchema: inlineBlockConfigs.length
            ? createInlineBlockNodeJSONSchema(inlineBlockConfigs)
            : undefined,
          // @ts-expect-error - TODO: fix this
          getSubFields: ({ node }) => {
            if (!node) {
              if (!inlineBlockConfigs.length) {
                return []
              }
              return [
                {
                  name: 'lexical_inline_blocks',
                  type: 'blocks',
                  blocks: inlineBlockConfigs,
                },
              ]
            }

            const blockType = node.fields.blockType
            const block = inlineBlockConfigs.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(inlineBlockConfigs)],
          node: ServerInlineBlockNode,
          validations: [blockValidationHOC(inlineBlockConfigs)],
        }),
      ],
      sanitizedServerFeatureProps: _props,
    }
  },
  key: 'blocks',
})

/**
 * Props for the client components provided to `admin.components.Block` of lexical blocks.
 */
export type LexicalBlockClientProps = UIFieldClientProps
/**
 * Props for the server components provided to `admin.components.Block` of lexical blocks.
 */
export type LexicalBlockServerProps = UIFieldServerProps

/**
 * Props for the client components provided to `admin.components.Label` of lexical blocks.
 */
export type LexicalBlockLabelClientProps = UIFieldClientProps
/**
 * Props for the server components provided to `admin.components.Label` of lexical blocks.
 */
export type LexicalBlockLabelServerProps = UIFieldServerProps

/**
 * Props for the client components provided to `admin.components.Block` of lexical inline blocks.
 */
export type LexicalInlineBlockClientProps = UIFieldClientProps
/**
 * Props for the server components provided to `admin.components.Block` of lexical inline blocks.
 */
export type LexicalInlineBlockServerProps = UIFieldServerProps

/**
 * Props for the client components provided to `admin.components.Label` of lexical inline blocks.
 */
export type LexicalInlineBlockLabelClientProps = UIFieldClientProps
/**
 * Props for the server components provided to `admin.components.Label` of lexical inline blocks.
 */
export type LexicalInlineBlockLabelServerProps = UIFieldServerProps
