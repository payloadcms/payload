import type { Block, BlocksField, Config, FieldSchemaMap, FlattenedBlocksField } from 'payload'

import { fieldsToJSONSchema, flattenAllFields, sanitizeFields } from 'payload'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { blockPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { getBlockMarkdownTransformers } from './markdownTransformer.js'
import { ServerBlockNode } from './nodes/BlocksNode.js'
import { ServerInlineBlockNode } from './nodes/InlineBlocksNode.js'
import { blockValidationHOC } from './validate.js'

export type BlocksFeatureProps = {
  blocks?: Block[]
  inlineBlocks?: Block[]
}

export const BlocksFeature = createServerFeature<BlocksFeatureProps, BlocksFeatureProps>({
  feature: async ({ config: _config, isRoot, parentIsLocalized, props }) => {
    const validRelationships = _config.collections.map((c) => c.slug) || []

    const sanitized = await sanitizeFields({
      config: _config as unknown as Config,
      fields: [
        {
          name: 'lexical_blocks',
          type: 'blocks',
          blocks: props.blocks ?? [],
        },
        {
          name: 'lexical_inline_blocks',
          type: 'blocks',
          blocks: props.inlineBlocks ?? [],
        },
      ],
      parentIsLocalized,
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships,
    })

    props.blocks = (sanitized[0] as BlocksField).blocks
    props.inlineBlocks = (sanitized[1] as BlocksField).blocks

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#BlocksFeatureClient',
      generatedTypes: {
        modifyOutputSchema: ({
          collectionIDFieldTypes,
          config,
          currentSchema,
          field,
          i18n,
          interfaceNameDefinitions,
        }) => {
          if (!props?.blocks?.length && !props?.inlineBlocks?.length) {
            return currentSchema
          }

          const fields: FlattenedBlocksField[] = []

          if (props?.blocks?.length) {
            fields.push({
              name: field?.name + '_lexical_blocks',
              type: 'blocks',
              blocks: props.blocks.map((block) => ({
                ...block,
                flattenedFields: flattenAllFields({ fields: block.fields }),
              })),
            })
          }
          if (props?.inlineBlocks?.length) {
            fields.push({
              name: field?.name + '_lexical_inline_blocks',
              type: 'blocks',
              blocks: props.inlineBlocks.map((block) => ({
                ...block,
                flattenedFields: flattenAllFields({ fields: block.fields }),
              })),
            })
          }

          if (fields.length) {
            // This is only done so that interfaceNameDefinitions sets those block's interfaceNames.
            // we don't actually use the JSON Schema itself in the generated types yet.
            fieldsToJSONSchema(
              collectionIDFieldTypes,
              fields,
              interfaceNameDefinitions,
              config,
              i18n,
            )
          }

          return currentSchema
        },
      },
      generateSchemaMap: ({ props }) => {
        /**
         * Add sub-fields to the schemaMap. E.g. if you have an array field as part of the block, and it runs addRow, it will request these
         * sub-fields from the component map. Thus, we need to put them in the component map here.
         */
        const schemaMap: FieldSchemaMap = new Map()

        if (props?.blocks?.length) {
          for (const block of props.blocks) {
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

        if (props?.inlineBlocks?.length) {
          // To generate block schemaMap which generates things like the componentMap for admin.Label
          for (const block of props.inlineBlocks) {
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
        blocks: props.blocks,
        inlineBlocks: props.inlineBlocks,
      }),

      nodes: [
        createNode({
          // @ts-expect-error - TODO: fix this
          getSubFields: ({ node }) => {
            if (!node) {
              if (props?.blocks?.length) {
                return [
                  {
                    name: 'lexical_blocks',
                    type: 'blocks',
                    blocks: props.blocks,
                  },
                ]
              }
              return []
            }

            const blockType = node.fields.blockType

            const block = props.blocks?.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(props.blocks)],
          node: ServerBlockNode,
          validations: [blockValidationHOC(props.blocks)],
        }),
        createNode({
          // @ts-expect-error - TODO: fix this
          getSubFields: ({ node }) => {
            if (!node) {
              if (props?.inlineBlocks?.length) {
                return [
                  {
                    name: 'lexical_inline_blocks',
                    type: 'blocks',
                    blocks: props.inlineBlocks,
                  },
                ]
              }
              return []
            }

            const blockType = node.fields.blockType

            const block = props.inlineBlocks?.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(props.inlineBlocks)],
          node: ServerInlineBlockNode,
          validations: [blockValidationHOC(props.inlineBlocks)],
        }),
      ],
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'blocks',
})
